import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const UNIPILE_DSN = Deno.env.get("UNIPILE_DSN")!;
const UNIPILE_API_KEY = Deno.env.get("UNIPILE_API_KEY")!;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
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

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { data: profile } = await admin.from("profiles")
      .select("current_organization_id, unipile_account_id")
      .eq("user_id", userId).maybeSingle();
    if (!profile?.unipile_account_id) return json({ error: "LinkedIn not connected" }, 400);

    let body: any = {};
    try { body = await req.json(); } catch { /* noop */ }
    const customKeyword: string | undefined = typeof body?.keyword === "string" ? body.keyword.trim() : undefined;
    const minLikes: number = Number.isFinite(body?.min_likes) ? Math.max(0, Number(body.min_likes)) : 80;
    const datePosted: string = ["past_24h", "past_week", "past_month"].includes(body?.date_posted) ? body.date_posted : "past_week";

    let seeds: string[] = [];
    if (customKeyword) {
      seeds = [customKeyword];
    } else {
      const { data: campaign } = await admin.from("campaigns")
        .select("industry, icp_industries, discovery_keywords")
        .eq("user_id", userId).order("created_at", { ascending: false }).limit(1).maybeSingle();

      const keywordPool = [
        ...(campaign?.discovery_keywords || []),
        campaign?.industry,
        ...(campaign?.icp_industries || []),
      ].filter(Boolean) as string[];
      seeds = Array.from(new Set(keywordPool)).slice(0, 4);
      if (seeds.length === 0) seeds.push("startup growth");
    }

    const collected = new Map<string, any>();
    for (const kw of seeds) {
      try {
        const url = `https://${UNIPILE_DSN}/api/v1/linkedin/search?account_id=${encodeURIComponent(profile.unipile_account_id)}`;
        const r = await fetch(url, {
          method: "POST",
          headers: { "X-API-KEY": UNIPILE_API_KEY, "Content-Type": "application/json", accept: "application/json" },
          body: JSON.stringify({ api: "classic", category: "posts", keywords: kw, date_posted: "past_week", limit: 25 }),
        });
        if (!r.ok) { console.error("search fail", r.status, await r.text().catch(() => "")); continue; }
        const d = await r.json();
        const items: any[] = d?.items || [];
        for (const it of items) {
          const pid = it?.social_id || it?.id || it?.share_url;
          if (!pid || collected.has(pid)) continue;
          const reactions = Number(it?.reaction_counter ?? it?.reactions ?? it?.likes ?? 0);
          if (reactions < 80) continue;
          collected.set(pid, { it, kw, reactions });
        }
      } catch (e) { console.error("kw err", e); }
    }

    const sorted = Array.from(collected.values()).sort((a, b) => b.reactions - a.reactions).slice(0, 30);

    const rows = sorted.map(({ it, kw, reactions }) => {
      const author = it?.author || it?.actor || {};
      return {
        user_id: userId,
        organization_id: profile.current_organization_id,
        source_post_url: it?.share_url || it?.url || null,
        source_post_id: it?.social_id || it?.id || null,
        author_name: author?.name || author?.full_name || null,
        author_headline: author?.headline || author?.subtitle || null,
        author_avatar_url: author?.profile_picture_url || author?.avatar_url || null,
        content: (it?.text || it?.commentary || "").toString().slice(0, 4000),
        likes: reactions,
        comments: Number(it?.comment_counter ?? it?.comments ?? 0),
        reposts: Number(it?.repost_counter ?? it?.reposts ?? 0),
        posted_at: it?.posted_at || it?.published_at || null,
        industry: kw,
        format_tag: null,
      };
    });

    if (rows.length > 0) {
      // Insert, skipping ones we've already discovered for this user
      const existingIds = await admin.from("superscale_inspirations")
        .select("source_post_id").eq("user_id", userId).limit(1000);
      const seen = new Set((existingIds.data || []).map((r: any) => r.source_post_id).filter(Boolean));
      const fresh = rows.filter((r) => !r.source_post_id || !seen.has(r.source_post_id));
      if (fresh.length > 0) {
        await admin.from("superscale_inspirations").insert(fresh);
      }
      return json({ ok: true, found: rows.length, inserted: fresh.length });
    }
    return json({ ok: true, found: 0, inserted: 0 });
  } catch (e) {
    console.error("superscale-discover-inspiration error", e);
    return json({ error: e instanceof Error ? e.message : "Unknown" }, 500);
  }
});
