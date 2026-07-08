import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const INTERESTED_TIERS = ["hot", "warm"];
const INTERESTED_STATUSES = ["replied", "positive_reply", "meeting_booked", "interested"];

// HubSpot batch create limit is 100
const BATCH_SIZE = 100;
// Cap total contacts synced per invocation to fit inside edge function CPU budget
const MAX_CONTACTS = 500;

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

    let query = supabase
      .from("contacts")
      .select("id, first_name, last_name, title, company, linkedin_url, industry, relevance_tier, lead_status, signal")
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

    // Build HubSpot inputs — only use standard properties HubSpot always accepts.
    // Custom props like `intentsly_signal` require a schema definition and cause
    // 400s if they don't exist, so we skip them and put context into `hs_content_membership_notes`... no — safer to just omit.
    const inputs = (contacts || [])
      .map((c) => {
        const properties: Record<string, string> = {};
        if (c.first_name) properties.firstname = String(c.first_name);
        if (c.last_name) properties.lastname = String(c.last_name);
        if (c.title) properties.jobtitle = String(c.title);
        if (c.company) properties.company = String(c.company);
        if (c.industry) properties.industry = String(c.industry);
        if (c.linkedin_url) properties.website = String(c.linkedin_url);
        return { properties };
      })
      // HubSpot rejects rows with zero properties
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
          // 200/201 — everything created
          try {
            const parsed = JSON.parse(bodyText);
            synced += Array.isArray(parsed?.results) ? parsed.results.length : batch.length;
          } catch {
            synced += batch.length;
          }
        } else if (res.status === 207 || res.status === 409) {
          // Multi-status / conflicts: some created, some already existed.
          // HubSpot returns { results: [...], numErrors, errors: [...] }
          try {
            const parsed = JSON.parse(bodyText);
            const created = Array.isArray(parsed?.results) ? parsed.results.length : 0;
            const dupes = Array.isArray(parsed?.errors)
              ? parsed.errors.filter((e: any) => e?.category === "CONFLICT").length
              : 0;
            synced += created + dupes;
            const other = (batch.length - created - dupes);
            if (other > 0) {
              failed += other;
              if (errors.length < 3 && parsed?.errors?.[0]) {
                errors.push(JSON.stringify(parsed.errors[0]).slice(0, 300));
              }
            }
          } catch {
            synced += batch.length; // best-effort
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
