import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const UNIPILE_DSN = Deno.env.get("UNIPILE_DSN")!;
const UNIPILE_API_KEY = Deno.env.get("UNIPILE_API_KEY")!;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function unipilePost(path: string, accountId: string, body: Record<string, unknown>) {
  const url = `https://${UNIPILE_DSN}${path}${path.includes("?") ? "&" : "?"}account_id=${encodeURIComponent(accountId)}`;
  const resp = await fetch(url, {
    method: "POST",
    headers: { "X-API-KEY": UNIPILE_API_KEY, "Content-Type": "application/json", accept: "application/json" },
    body: JSON.stringify(body),
  });
  const text = await resp.text();
  let payload: any = {};
  try { payload = JSON.parse(text); } catch {}
  return { ok: resp.ok, status: resp.status, payload, text };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { spike_id } = await req.json();
    if (!spike_id) return json({ error: "spike_id required" }, 400);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const { data: spike } = await admin.from("engagement_spikes").select("*").eq("id", spike_id).single();
    if (!spike) return json({ error: "Spike not found" }, 404);

    const { data: profile } = await admin.from("profiles")
      .select("unipile_account_id").eq("user_id", spike.user_id).maybeSingle();
    const accountId = profile?.unipile_account_id;
    if (!accountId) {
      await admin.from("engagement_spikes").update({ status: "failed", error: "LinkedIn not connected" }).eq("id", spike_id);
      return json({ error: "no account" }, 400);
    }

    const filters = spike.filters || {};
    // Unipile post date_posted enum: past_day | past_week | past_month
    const recencyMap: Record<string, string> = {
      "past-24h": "past_day",
      "past_day": "past_day",
      "past-week": "past_week",
      "past_week": "past_week",
      "past-month": "past_month",
      "past_month": "past_month",
    };
    const recency = recencyMap[filters.recency] || "past_day";

    // Aggregate posts across keywords
    const collected = new Map<string, any>();
    for (const kw of (spike.keywords as string[])) {
      if (collected.size >= spike.target_count * 3) break;
      const body: Record<string, unknown> = {
        api: "classic",
        category: "posts",
        keywords: kw,
        date_posted: recency,
        limit: 25,
      };
      const { ok, payload } = await unipilePost("/api/v1/linkedin/search", accountId, body);
      if (!ok) { console.error("post search failed", payload); continue; }
      const items: any[] = payload?.items || [];
      for (const it of items) {
        const pid = it?.social_id || it?.id || it?.share_url;
        if (!pid) continue;
        if (collected.has(pid)) continue;
        collected.set(pid, { it, kw });
      }
    }

    // Deduplicate: exclude posts this user has already targeted in any prior spike
    const candidateIds = Array.from(collected.keys());
    if (candidateIds.length > 0) {
      const { data: prior } = await admin
        .from("engagement_spike_comments")
        .select("post_id")
        .eq("user_id", spike.user_id)
        .neq("spike_id", spike_id)
        .in("post_id", candidateIds);
      const seen = new Set((prior || []).map((r: any) => r.post_id).filter(Boolean));
      for (const pid of candidateIds) {
        if (seen.has(pid)) collected.delete(pid);
      }
    }

    const posts = Array.from(collected.values()).slice(0, spike.target_count);
    if (posts.length === 0) {
      await admin.from("engagement_spikes").update({
        status: "failed", error: "No new posts found (all candidates already commented in previous spikes)",
      }).eq("id", spike_id);
      return json({ error: "no posts" });
    }

    // Compute drop times: spread between T - window and T - 2min, with random spacing
    const target = new Date(spike.scheduled_for).getTime();
    const windowMs = spike.drop_window_minutes * 60 * 1000;
    const start = target - windowMs;
    const end = target - 2 * 60 * 1000;
    const total = end - start;
    const slot = total / posts.length;
    // Shuffle posts
    posts.sort(() => Math.random() - 0.5);

    const rows = posts.map((p, i) => {
      const it = p.it;
      const author = it?.author || it?.actor || {};
      const drop = new Date(start + slot * i + Math.random() * Math.min(slot, (spike.spacing_max_seconds - spike.spacing_min_seconds) * 1000));
      // text snippet
      const txt = (it?.text || it?.commentary || it?.share_url || "").toString().slice(0, 600);
      return {
        spike_id,
        user_id: spike.user_id,
        post_id: it?.social_id || it?.id || null,
        post_url: it?.share_url || it?.url || null,
        post_author_name: author?.name || author?.full_name || null,
        post_author_provider: author?.public_identifier || author?.provider_id || null,
        post_snippet: txt,
        post_published_at: it?.posted_at || it?.published_at || null,
        scheduled_drop_at: drop.toISOString(),
        status: "drafted",
      };
    });

    await admin.from("engagement_spike_comments").insert(rows);
    await admin.from("engagement_spikes").update({ status: "ready" }).eq("id", spike_id);

    // Kick comment generation
    fetch(`${SUPABASE_URL}/functions/v1/generate-spike-comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${SERVICE_ROLE_KEY}` },
      body: JSON.stringify({ spike_id }),
    }).catch(() => {});

    return json({ ok: true, count: rows.length });
  } catch (e) {
    console.error("discover-spike-posts error", e);
    return json({ error: e instanceof Error ? e.message : "Unknown" }, 500);
  }
});
