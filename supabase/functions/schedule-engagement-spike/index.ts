import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
    const userClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: auth } } });
    const { data: ud, error: uerr } = await userClient.auth.getUser();
    if (uerr || !ud?.user) return json({ error: "Unauthorized" }, 401);
    const userId = ud.user.id;

    const body = await req.json().catch(() => ({}));
    const {
      scheduled_for, target_count, drop_window_minutes, spacing_min_seconds, spacing_max_seconds,
      keywords, filters, tone, custom_angle, require_approval,
    } = body;

    if (!scheduled_for) return json({ error: "scheduled_for required" }, 400);
    const when = new Date(scheduled_for);
    if (isNaN(when.getTime())) return json({ error: "Invalid scheduled_for" }, 400);
    if (when.getTime() - Date.now() < 5 * 60 * 1000) {
      return json({ error: "Spike must be at least 5 minutes in the future" }, 400);
    }
    const kws: string[] = Array.isArray(keywords) ? keywords.map((k: string) => String(k).trim()).filter(Boolean) : [];
    if (kws.length === 0) return json({ error: "At least one keyword required" }, 400);

    const tc = Math.max(3, Math.min(20, Number(target_count) || 10));
    const win = Math.max(5, Math.min(60, Number(drop_window_minutes) || 25));
    const smin = Math.max(30, Math.min(600, Number(spacing_min_seconds) || 120));
    const smax = Math.max(smin, Math.min(900, Number(spacing_max_seconds) || 180));

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Look up profile / org / unipile
    const { data: profile } = await admin.from("profiles")
      .select("current_organization_id, unipile_account_id")
      .eq("user_id", userId).maybeSingle();
    if (!profile?.unipile_account_id) return json({ error: "LinkedIn account not connected" }, 400);

    // Enforce: max 2 active spikes per org
    const orgId = profile.current_organization_id;
    if (orgId) {
      const { count } = await admin.from("engagement_spikes")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", orgId)
        .in("status", ["draft", "discovering", "ready", "running"]);
      if ((count ?? 0) >= 2) return json({ error: "You already have 2 active spikes. Cancel one before scheduling another." }, 400);
    }

    const { data: spike, error: insErr } = await admin.from("engagement_spikes").insert({
      user_id: userId,
      organization_id: orgId,
      scheduled_for: when.toISOString(),
      drop_window_minutes: win,
      spacing_min_seconds: smin,
      spacing_max_seconds: smax,
      target_count: tc,
      keywords: kws,
      filters: filters || {},
      tone: tone || "curious_peer",
      custom_angle: custom_angle || null,
      require_approval: require_approval !== false,
      status: "discovering",
    }).select("id").single();
    if (insErr) return json({ error: insErr.message }, 500);

    // Fire-and-forget discovery
    fetch(`${SUPABASE_URL}/functions/v1/discover-spike-posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${SERVICE_ROLE_KEY}` },
      body: JSON.stringify({ spike_id: spike.id }),
    }).catch((e) => console.error("kick discovery failed", e));

    return json({ spike_id: spike.id, status: "discovering" });
  } catch (e) {
    console.error("schedule-engagement-spike error", e);
    return json({ error: e instanceof Error ? e.message : "Unknown" }, 500);
  }
});
