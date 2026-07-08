import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const INTERESTED_TIERS = ["hot", "warm"];
const INTERESTED_STATUSES = ["replied", "positive_reply", "meeting_booked", "interested"];

const BATCH_SIZE = 100;
const MAX_CONTACTS = 500;

// Custom Intentsly properties we create in the user's HubSpot portal so we have
// real, dedicated fields for LinkedIn URL, signal, and post text (instead of
// abusing "website", which triggers HubSpot's domain->company autofill and
// makes every contact appear to work at LinkedIn).
const CUSTOM_PROPS = [
  {
    name: "intentsly_linkedin_url",
    label: "LinkedIn URL (Intentsly)",
    type: "string",
    fieldType: "text",
    description: "LinkedIn profile URL captured by Intentsly.",
  },
  {
    name: "intentsly_signal",
    label: "Buying Signal (Intentsly)",
    type: "string",
    fieldType: "text",
    description: "Why Intentsly surfaced this lead.",
  },
  {
    name: "intentsly_signal_post",
    label: "Signal Post (Intentsly)",
    type: "string",
    fieldType: "textarea",
    description: "Excerpt of the post that triggered the signal.",
  },
  {
    name: "intentsly_signal_post_url",
    label: "Signal Post URL (Intentsly)",
    type: "string",
    fieldType: "text",
    description: "Link to the post that triggered the signal.",
  },
  {
    name: "intentsly_tier",
    label: "Relevance Tier (Intentsly)",
    type: "string",
    fieldType: "text",
    description: "Hot / warm / cold relevance from Intentsly.",
  },
];

async function ensureCustomProperties(apiKey: string) {
  // Group under a single custom group so it looks tidy in HubSpot's UI.
  const groupName = "intentsly";
  try {
    await fetch("https://api.hubapi.com/crm/v3/properties/contacts/groups", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: groupName,
        label: "Intentsly",
        displayOrder: -1,
      }),
    }).then((r) => r.text()); // ignore result — 409 if already exists
  } catch (_) { /* ignore */ }

  for (const p of CUSTOM_PROPS) {
    try {
      const res = await fetch("https://api.hubapi.com/crm/v3/properties/contacts", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: p.name,
          label: p.label,
          type: p.type,
          fieldType: p.fieldType,
          groupName,
          description: p.description,
        }),
      });
      // 409 = already exists, that's fine
      if (!res.ok && res.status !== 409) {
        const body = await res.text();
        console.error(`ensureCustomProperties ${p.name} failed`, res.status, body.slice(0, 200));
      } else {
        await res.text();
      }
    } catch (e) {
      console.error(`ensureCustomProperties ${p.name} threw`, e);
    }
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: integ, error: integErr } = await supabase
      .from("crm_integrations")
      .select("*")
      .eq("user_id", user.id)
      .eq("provider", "hubspot")
      .eq("is_active", true)
      .maybeSingle();

    if (integErr) throw integErr;
    if (!integ) {
      return new Response(JSON.stringify({ error: "HubSpot not connected" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Make sure Intentsly custom properties exist in the portal
    await ensureCustomProperties(integ.api_key);

    let query = supabase
      .from("contacts")
      .select("id, first_name, last_name, title, company, linkedin_url, industry, relevance_tier, lead_status, signal, signal_post_excerpt, signal_post_url")
      .eq("user_id", user.id)
      .order("imported_at", { ascending: false })
      .limit(MAX_CONTACTS);

    if (integ.sync_mode === "interested") {
      query = query.or(
        `relevance_tier.in.(${INTERESTED_TIERS.join(",")}),lead_status.in.(${INTERESTED_STATUSES.join(",")})`
      );
    }

    const { data: contacts, error: cErr } = await query;
    if (cErr) throw cErr;

    const inputs = (contacts || [])
      .map((c: any) => {
        const properties: Record<string, string> = {};
        if (c.first_name) properties.firstname = String(c.first_name);
        if (c.last_name) properties.lastname = String(c.last_name);
        if (c.title) properties.jobtitle = String(c.title);
        if (c.company) properties.company = String(c.company);
        if (c.industry) properties.industry = String(c.industry);
        // Intentsly custom props
        if (c.linkedin_url) properties.intentsly_linkedin_url = String(c.linkedin_url);
        if (c.signal) properties.intentsly_signal = String(c.signal).slice(0, 65000);
        if (c.signal_post_excerpt) properties.intentsly_signal_post = String(c.signal_post_excerpt).slice(0, 65000);
        if (c.signal_post_url) properties.intentsly_signal_post_url = String(c.signal_post_url);
        if (c.relevance_tier) properties.intentsly_tier = String(c.relevance_tier);
        return { properties };
      })
      .filter((row) => Object.keys(row.properties).length > 0);

    let synced = 0;
    let failed = 0;
    const errors: string[] = [];

    for (let i = 0; i < inputs.length; i += BATCH_SIZE) {
      const batch = inputs.slice(i, i + BATCH_SIZE);
      try {
        const res = await fetch("https://api.hubapi.com/crm/v3/objects/contacts/batch/create", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${integ.api_key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ inputs: batch }),
        });

        const bodyText = await res.text();

        if (res.ok) {
          try {
            const parsed = JSON.parse(bodyText);
            synced += Array.isArray(parsed?.results) ? parsed.results.length : batch.length;
          } catch {
            synced += batch.length;
          }
        } else if (res.status === 207 || res.status === 409) {
          try {
            const parsed = JSON.parse(bodyText);
            const created = Array.isArray(parsed?.results) ? parsed.results.length : 0;
            const dupes = Array.isArray(parsed?.errors)
              ? parsed.errors.filter((e: any) => e?.category === "CONFLICT").length
              : 0;
            synced += created + dupes;
            const other = batch.length - created - dupes;
            if (other > 0) {
              failed += other;
              if (errors.length < 3 && parsed?.errors?.[0]) {
                errors.push(JSON.stringify(parsed.errors[0]).slice(0, 300));
              }
            }
          } catch {
            synced += batch.length;
          }
        } else {
          failed += batch.length;
          if (errors.length < 3) errors.push(`${res.status}: ${bodyText.slice(0, 300)}`);
          console.error("HubSpot batch failed", res.status, bodyText.slice(0, 500));
        }
      } catch (e: any) {
        failed += batch.length;
        if (errors.length < 3) errors.push(e.message);
        console.error("HubSpot batch exception", e);
      }
    }

    await supabase.from("crm_integrations")
      .update({ last_sync_at: new Date().toISOString(), last_sync_count: synced })
      .eq("id", integ.id);

    return new Response(JSON.stringify({
      success: true, synced, failed, total: inputs.length, errors,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err: any) {
    console.error("sync-hubspot-contacts error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
