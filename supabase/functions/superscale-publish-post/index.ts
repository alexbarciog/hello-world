import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const UNIPILE_DSN = Deno.env.get("UNIPILE_DSN")!;
const UNIPILE_API_KEY = Deno.env.get("UNIPILE_API_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function publishToLinkedIn(accountId: string, text: string, imageUrl: string | null) {
  // Unipile post creation. If image, fetch and send as multipart; else JSON.
  const url = `https://${UNIPILE_DSN}/api/v1/posts`;
  if (imageUrl) {
    try {
      const imgResp = await fetch(imageUrl);
      if (!imgResp.ok) {
        return { ok: false, status: imgResp.status, payload: {}, text: `Image fetch failed: ${imgResp.status}` };
      }
      const buf = new Uint8Array(await imgResp.arrayBuffer());

      // Detect mime + extension from response headers, fallback to URL ext
      let mime = (imgResp.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
      const urlExtMatch = imageUrl.toLowerCase().match(/\.(png|jpe?g|gif|webp)(\?|$)/);
      const urlExt = urlExtMatch?.[1] || "";
      if (!mime || !mime.startsWith("image/")) {
        if (urlExt === "png") mime = "image/png";
        else if (urlExt === "gif") mime = "image/gif";
        else if (urlExt === "webp") mime = "image/webp";
        else mime = "image/jpeg";
      }
      // LinkedIn (via Unipile) doesn't accept webp in feed posts — convert mime to jpeg label;
      // safer: only allow png/jpeg/gif. If webp, treat as jpeg-ish by relabeling.
      if (mime === "image/webp") mime = "image/jpeg";

      const ext = mime === "image/png" ? "png" : mime === "image/gif" ? "gif" : "jpg";
      const filename = `image.${ext}`;

      const fd = new FormData();
      fd.append("account_id", accountId);
      fd.append("text", text);
      fd.append("attachments", new Blob([buf], { type: mime }), filename);

      const r = await fetch(url, {
        method: "POST",
        headers: { "X-API-KEY": UNIPILE_API_KEY, accept: "application/json" },
        body: fd,
      });
      const txt = await r.text();
      let payload: any = {};
      try { payload = JSON.parse(txt); } catch {}
      if (!r.ok) console.error("Unipile post error", r.status, txt, "mime=", mime, "size=", buf.length);
      return { ok: r.ok, status: r.status, payload, text: txt };
    } catch (e) {
      return { ok: false, status: 0, payload: {}, text: String(e) };
    }
  }
  const r = await fetch(url, {
    method: "POST",
    headers: {
      "X-API-KEY": UNIPILE_API_KEY,
      "Content-Type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({ account_id: accountId, text }),
  });
  const txt = await r.text();
  let payload: any = {};
  try { payload = JSON.parse(txt); } catch {}
  return { ok: r.ok, status: r.status, payload, text: txt };
}

async function extractKeywords(text: string): Promise<string[]> {
  try {
    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: "Extract 2-3 short search keywords from a LinkedIn post. Return ONLY a JSON array of strings." },
          { role: "user", content: text.slice(0, 600) },
        ],
      }),
    });
    const d = await r.json();
    const raw = d?.choices?.[0]?.message?.content || "[]";
    const m = raw.match(/\[[\s\S]*\]/);
    return JSON.parse(m ? m[0] : raw);
  } catch {
    return [];
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { data: due } = await admin
      .from("linkedin_posts")
      .select("*")
      .eq("status", "scheduled")
      .lte("scheduled_for", new Date().toISOString())
      .limit(20);

    const results: any[] = [];
    for (const post of due || []) {
      // mark posting
      await admin.from("linkedin_posts").update({ status: "posting" }).eq("id", post.id);

      const { data: profile } = await admin.from("profiles")
        .select("unipile_account_id").eq("user_id", post.user_id).maybeSingle();
      const accountId = profile?.unipile_account_id;
      if (!accountId) {
        await admin.from("linkedin_posts").update({ status: "failed", error: "LinkedIn not connected" }).eq("id", post.id);
        results.push({ id: post.id, ok: false, error: "no_account" });
        continue;
      }

      const result = await publishToLinkedIn(accountId, post.content, post.image_url);
      if (!result.ok) {
        await admin.from("linkedin_posts").update({
          status: "failed", error: `Unipile ${result.status}: ${result.text.slice(0, 500)}`,
        }).eq("id", post.id);
        results.push({ id: post.id, ok: false, error: result.text.slice(0, 200) });
        continue;
      }

      const postId = result.payload?.id || result.payload?.post_id || result.payload?.social_id;
      const postUrl = result.payload?.share_url || result.payload?.url || null;
      await admin.from("linkedin_posts").update({
        status: "posted",
        posted_at: new Date().toISOString(),
        unipile_post_id: postId,
        post_url: postUrl,
        error: null,
      }).eq("id", post.id);

      // Auto-spike
      if (post.comments_spike_enabled) {
        try {
          const kws = await extractKeywords(post.content);
          if (kws.length > 0) {
            const when = new Date(Date.now() + 35 * 60 * 1000).toISOString();
            const { data: spike } = await admin.from("engagement_spikes").insert({
              user_id: post.user_id,
              organization_id: post.organization_id,
              scheduled_for: when,
              drop_window_minutes: 25,
              spacing_min_seconds: 120,
              spacing_max_seconds: 240,
              target_count: 8,
              keywords: kws,
              filters: { recency: "past_day" },
              tone: "curious_peer",
              custom_angle: null,
              require_approval: false,
              status: "discovering",
            }).select("id").single();
            if (spike?.id) {
              await admin.from("linkedin_posts").update({ spike_id: spike.id }).eq("id", post.id);
              fetch(`${SUPABASE_URL}/functions/v1/discover-spike-posts`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${SERVICE_ROLE_KEY}` },
                body: JSON.stringify({ spike_id: spike.id }),
              }).catch(() => {});
            }
          }
        } catch (e) {
          console.error("auto spike failed", e);
        }
      }

      results.push({ id: post.id, ok: true });
    }

    return json({ ok: true, processed: results.length, results });
  } catch (e) {
    console.error("superscale-publish-post error", e);
    return json({ error: e instanceof Error ? e.message : "Unknown" }, 500);
  }
});
