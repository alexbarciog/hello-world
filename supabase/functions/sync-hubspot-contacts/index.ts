import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const INTERESTED_TIERS = ["hot", "warm"];
const INTERESTED_STATUSES = ["replied", "positive_reply", "meeting_booked", "interested"];

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

    // Build contacts query
    let query = supabase
      .from("contacts")
      .select("id, first_name, last_name, title, company, linkedin_url, industry, relevance_tier, lead_status, signal")
      .eq("user_id", user.id)
      .limit(500);

    if (integ.sync_mode === "interested") {
      query = query.or(
        `relevance_tier.in.(${INTERESTED_TIERS.join(",")}),lead_status.in.(${INTERESTED_STATUSES.join(",")})`
      );
    }

    const { data: contacts, error: cErr } = await query;
    if (cErr) throw cErr;

    let synced = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const c of contacts || []) {
      const props: Record<string, any> = {
        firstname: c.first_name || "",
        lastname: c.last_name || "",
        jobtitle: c.title || "",
        company: c.company || "",
        industry: c.industry || "",
        website: c.linkedin_url || "",
        hs_lead_status: c.lead_status || "NEW",
        intentsly_signal: c.signal || "",
        intentsly_tier: c.relevance_tier || "",
      };

      // Skip if no identifying info
      if (!props.firstname && !props.lastname && !props.company) {
        failed++; continue;
      }

      try {
        const res = await fetch("https://api.hubapi.com/crm/v3/objects/contacts", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${integ.api_key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ properties: props }),
        });

        if (res.ok) {
          synced++;
        } else if (res.status === 409) {
          // Contact exists — HubSpot returns 409 with existing id, treat as success
          synced++;
        } else {
          failed++;
          const body = await res.text();
          if (errors.length < 3) errors.push(`${res.status}: ${body.slice(0, 200)}`);
        }
      } catch (e: any) {
        failed++;
        if (errors.length < 3) errors.push(e.message);
      }
    }

    await supabase.from("crm_integrations")
      .update({ last_sync_at: new Date().toISOString(), last_sync_count: synced })
      .eq("id", integ.id);

    return new Response(JSON.stringify({
      success: true, synced, failed, total: contacts?.length || 0, errors,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err: any) {
    console.error("sync-hubspot-contacts error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
