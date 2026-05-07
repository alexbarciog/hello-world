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
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

function extractSlug(url: string): string | null {
  const m = url.match(/linkedin\.com\/in\/([^\/\?#]+)/i);
  return m ? m[1] : null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
    const userClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: auth } } });
    const { data: ud } = await userClient.auth.getUser();
    if (!ud?.user) return json({ error: "Unauthorized" }, 401);
    const userId = ud.user.id;

    const { profile_url } = await req.json().catch(() => ({}));
    if (!profile_url || typeof profile_url !== "string") return json({ error: "profile_url required" }, 400);
    const slug = extractSlug(profile_url);
    if (!slug) return json({ error: "Invalid LinkedIn /in/ URL" }, 400);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const { data: profile } = await admin.from("profiles")
      .select("current_organization_id, unipile_account_id")
      .eq("user_id", userId).maybeSingle();
    if (!profile?.unipile_account_id) return json({ error: "LinkedIn not connected" }, 400);

    // Fetch up to ~30 posts
    const postsUrl = `https://${UNIPILE_DSN}/api/v1/users/${encodeURIComponent(slug)}/posts?account_id=${encodeURIComponent(profile.unipile_account_id)}&limit=30`;
    const r = await fetch(postsUrl, { headers: { "X-API-KEY": UNIPILE_API_KEY, accept: "application/json" } });
    if (!r.ok) {
      const t = await r.text();
      return json({ error: `Unipile ${r.status}`, detail: t.slice(0, 300) }, 400);
    }
    const data = await r.json();
    const items: any[] = data?.items || data?.posts || [];
    if (items.length === 0) return json({ error: "No public posts found for this profile" }, 404);

    // Build minimal post summaries for AI
    const samples = items.slice(0, 30).map((it) => {
      const ts = it?.posted_at || it?.published_at || it?.created_at;
      const text = (it?.text || it?.commentary || "").toString();
      const hasImage = !!(it?.images?.length || it?.image_url || it?.media);
      return {
        posted_at: ts,
        chars: text.length,
        has_image: hasImage,
        snippet: text.slice(0, 220),
        likes: Number(it?.reaction_counter ?? it?.reactions ?? 0),
        comments: Number(it?.comment_counter ?? it?.comments ?? 0),
      };
    });

    // Save posts as inspirations
    const inspirationRows = items.slice(0, 30).map((it) => {
      const author = it?.author || it?.actor || {};
      return {
        user_id: userId,
        organization_id: profile.current_organization_id,
        source_post_url: it?.share_url || it?.url || null,
        source_post_id: it?.social_id || it?.id || null,
        author_name: author?.name || author?.full_name || slug,
        author_headline: author?.headline || author?.subtitle || null,
        author_avatar_url: author?.profile_picture_url || author?.avatar_url || null,
        content: (it?.text || it?.commentary || "").toString().slice(0, 4000),
        likes: Number(it?.reaction_counter ?? it?.reactions ?? it?.likes ?? 0),
        comments: Number(it?.comment_counter ?? it?.comments ?? 0),
        reposts: Number(it?.repost_counter ?? it?.reposts ?? 0),
        posted_at: it?.posted_at || it?.published_at || null,
        industry: `Cloned from ${slug}`,
        format_tag: null,
      };
    });
    if (inspirationRows.length) {
      await admin.from("superscale_inspirations").insert(inspirationRows);
    }

    // Ask AI to deduce cadence
    const prompt = `Analyze this LinkedIn creator's last ${samples.length} posts and infer their posting strategy. Return ONLY a JSON object with this exact shape:
{
  "summary": "<1 sentence describing their style + cadence>",
  "dominant_post_types": ["text"|"image"|"carousel"|"story"|"case_study"|"hot_take", ...],
  "weekly_cadence": [
    { "day_of_week": 0, "enabled": true, "post_count": 1, "post_types": ["text"], "first_slot": "09:00", "delay_minutes": 240 },
    ... one entry per day_of_week 0..6 (0 = Monday)
  ]
}
Pick post_count = average per that weekday (0 if they don't post), first_slot = average local-ish time of posting that day in HH:MM 24h, delay_minutes between posts (>=60), post_types = best-fit subset.
POSTS:
${JSON.stringify(samples)}`;

    let cadence: any[] | null = null;
    let summary = "";
    let dominantTypes: string[] = ["text"];
    try {
      const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
        }),
      });
      if (aiRes.ok) {
        const aj = await aiRes.json();
        const txt = aj?.choices?.[0]?.message?.content || "{}";
        const parsed = JSON.parse(txt);
        cadence = Array.isArray(parsed?.weekly_cadence) ? parsed.weekly_cadence : null;
        summary = parsed?.summary || "";
        dominantTypes = Array.isArray(parsed?.dominant_post_types) ? parsed.dominant_post_types : ["text"];
      }
    } catch (e) {
      console.error("AI cadence fail", e);
    }

    if (!cadence) {
      // Fallback: simple stats per weekday
      const buckets: Record<number, { count: number; hours: number[]; img: number }> = {};
      for (const s of samples) {
        if (!s.posted_at) continue;
        const d = new Date(s.posted_at);
        const dow = (d.getUTCDay() + 6) % 7;
        if (!buckets[dow]) buckets[dow] = { count: 0, hours: [], img: 0 };
        buckets[dow].count++;
        buckets[dow].hours.push(d.getUTCHours());
        if (s.has_image) buckets[dow].img++;
      }
      const weeks = Math.max(1, Math.round(samples.length / 7));
      cadence = Array.from({ length: 7 }, (_, dow) => {
        const b = buckets[dow];
        const perDay = b ? Math.max(1, Math.round(b.count / weeks)) : 0;
        const avgH = b && b.hours.length ? Math.round(b.hours.reduce((a, c) => a + c, 0) / b.hours.length) : 9;
        return {
          day_of_week: dow,
          enabled: perDay > 0,
          post_count: Math.max(1, perDay),
          post_types: b && b.img / (b.count || 1) > 0.5 ? ["image", "text"] : ["text"],
          first_slot: `${String(avgH).padStart(2, "0")}:00`,
          delay_minutes: 240,
        };
      });
    }

    // Upsert cadence rows
    const { data: member } = await admin.from("organization_members")
      .select("organization_id").eq("user_id", userId).maybeSingle();
    const upsertRows = cadence.map((c: any) => ({
      user_id: userId,
      organization_id: member?.organization_id ?? null,
      day_of_week: Math.max(0, Math.min(6, Number(c.day_of_week))),
      enabled: !!c.enabled,
      post_count: Math.max(1, Math.min(5, Number(c.post_count) || 1)),
      post_types: Array.isArray(c.post_types) && c.post_types.length ? c.post_types : ["text"],
      first_slot: typeof c.first_slot === "string" ? c.first_slot : "09:00",
      delay_minutes: Math.max(30, Number(c.delay_minutes) || 240),
      comments_spike_enabled: false,
    }));
    const { error: upErr } = await admin.from("superscale_cadence")
      .upsert(upsertRows, { onConflict: "user_id,day_of_week" });
    if (upErr) console.error("cadence upsert", upErr);

    return json({
      ok: true,
      summary,
      dominant_post_types: dominantTypes,
      posts_analyzed: samples.length,
      inspirations_saved: inspirationRows.length,
      cadence: upsertRows,
    });
  } catch (e) {
    console.error("clone-creator error", e);
    return json({ error: e instanceof Error ? e.message : "Unknown" }, 500);
  }
});
