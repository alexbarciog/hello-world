import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    const { action, api_key, sync_mode } = await req.json();

    if (action === "disconnect") {
      await supabase.from("crm_integrations").delete()
        .eq("user_id", user.id).eq("provider", "hubspot");
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "update_mode") {
      if (!["all", "interested"].includes(sync_mode)) {
        return new Response(JSON.stringify({ error: "Invalid sync_mode" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { error } = await supabase.from("crm_integrations")
        .update({ sync_mode })
        .eq("user_id", user.id).eq("provider", "hubspot");
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Connect: verify API key
    if (!api_key || typeof api_key !== "string" || api_key.trim().length < 10) {
      return new Response(JSON.stringify({ error: "Invalid API key" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const key = api_key.trim();
    const verifyRes = await fetch("https://api.hubapi.com/crm/v3/objects/contacts?limit=1", {
      headers: { Authorization: `Bearer ${key}` },
    });

    if (!verifyRes.ok) {
      const body = await verifyRes.text();
      console.error("HubSpot verify failed:", verifyRes.status, body);
      return new Response(JSON.stringify({
        error: "Invalid HubSpot key. Ensure it has crm.objects.contacts.read and crm.objects.contacts.write scopes.",
      }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const schemaRes = await fetch("https://api.hubapi.com/crm/v3/properties/contacts?archived=false", {
      headers: { Authorization: `Bearer ${key}` },
    });

    if (!schemaRes.ok) {
      const body = await schemaRes.text();
      console.error("HubSpot schema verify failed:", schemaRes.status, body);
      return new Response(JSON.stringify({
        error: "HubSpot key needs contact property permissions too. Add crm.schemas.contacts.read and crm.schemas.contacts.write to the Private App token.",
      }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Get portal id (optional)
    let portalId: string | null = null;
    try {
      const infoRes = await fetch("https://api.hubapi.com/account-info/v3/details", {
        headers: { Authorization: `Bearer ${key}` },
      });
      if (infoRes.ok) {
        const info = await infoRes.json();
        portalId = info?.portalId ? String(info.portalId) : null;
      }
    } catch (_) { /* ignore */ }

    const mode = ["all", "interested"].includes(sync_mode) ? sync_mode : "interested";

    const { error } = await supabase.from("crm_integrations").upsert({
      user_id: user.id,
      provider: "hubspot",
      api_key: key,
      sync_mode: mode,
      hubspot_portal_id: portalId,
      is_active: true,
    }, { onConflict: "user_id,provider" });

    if (error) throw error;

    return new Response(JSON.stringify({ success: true, portal_id: portalId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("connect-hubspot error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
