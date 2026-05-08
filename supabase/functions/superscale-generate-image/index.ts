import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function buildBrief(textPrompt: string, style: any, customBrief?: string) {
  if (customBrief && customBrief.trim()) return customBrief.trim();
  const styleSummary = JSON.stringify(style ?? {}, null, 0).slice(0, 4000);
  const briefResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [{
        role: "user",
        content: `You write image briefs for LinkedIn posts. The creator has this established visual style:

${styleSummary}

POST CONTENT:
"""${textPrompt.slice(0, 800)}"""

Write a tight visual brief (max 120 words, plain text, no markdown) describing:
- WHAT to depict (concrete subject — be visual, not abstract)
- A short headline overlay (≤6 words) ONLY if has_text_overlay is true; otherwise omit
- Which colors from the palette to use
- Layout (centered headline, two-column, etc — pull from layout_patterns)
- Mood

End with: "Match the visual style of the reference images exactly — same palette, typography, composition, energy. Do NOT invent unrelated styles."`
      }],
    }),
  });
  if (!briefResp.ok) return `LinkedIn-native square image about: ${textPrompt.slice(0, 300)}. Match the visual style of the reference images exactly.`;
  const j = await briefResp.json();
  return j?.choices?.[0]?.message?.content?.trim() || textPrompt.slice(0, 300);
}

async function generateOne(brief: string, refs: any[]): Promise<string | null> {
  const userContent: any[] = [
    { type: "text", text: `${brief}\n\nGenerate a single 1:1 square image. Native LinkedIn feed style. Clean, professional, scroll-stopping. No watermark, no Lovable/AI branding.` },
    ...refs.slice(0, 3).map((r: any) => ({ type: "image_url", image_url: { url: r.image_url } })),
  ];
  const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-3-pro-image-preview",
      messages: [{ role: "user", content: userContent }],
      modalities: ["image", "text"],
    }),
  });
  if (!aiResp.ok) {
    const t = await aiResp.text();
    console.error("image gen variant failed", aiResp.status, t);
    return null;
  }
  const data = await aiResp.json();
  return data?.choices?.[0]?.message?.images?.[0]?.image_url?.url ?? null;
}

async function uploadDataUrl(admin: any, userId: string, dataUrl: string): Promise<string | null> {
  const m = dataUrl.match(/^data:(.*?);base64,(.*)$/);
  if (!m) return null;
  const mime = m[1];
  const bin = atob(m[2]);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  const ext = mime.includes("jpeg") ? "jpg" : "png";
  const path = `${userId}/posts/${crypto.randomUUID()}.${ext}`;
  const { error } = await admin.storage.from("superscale").upload(path, buf, { contentType: mime, upsert: false });
  if (error) { console.error(error); return null; }
  const { data: pub } = admin.storage.from("superscale").getPublicUrl(path);
  return pub.publicUrl;
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

    const body = await req.json().catch(() => ({}));
    const { post_id, prompt, custom_brief, attach = false, image_url, n = 3 } = body;
    const variantCount = Math.max(1, Math.min(3, Number(n) || 3));

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Mode A: caller picked a variant — just attach to post
    if (attach && image_url && post_id) {
      await admin.from("linkedin_posts").update({ image_url }).eq("id", post_id).eq("user_id", userId);
      return json({ ok: true, image_url });
    }

    let textPrompt = String(prompt || "").trim();
    if (post_id && !textPrompt) {
      const { data } = await admin.from("linkedin_posts").select("content").eq("id", post_id).eq("user_id", userId).maybeSingle();
      textPrompt = data?.content ?? "";
    }
    if (!textPrompt) return json({ error: "prompt required" }, 400);

    const { data: refs } = await admin.from("superscale_design_refs")
      .select("image_url, position").eq("user_id", userId).order("position").limit(8);
    if (!refs || refs.length < 3) {
      return json({ error: "Add at least 3 design references first" }, 400);
    }

    let { data: profile } = await admin.from("superscale_style_profile")
      .select("style_json").eq("user_id", userId).maybeSingle();

    // Style fallback: if no profile yet, use a minimal stub so the brief still works
    const style = profile?.style_json ?? { has_text_overlay: false, palette: [], mood: "professional, modern" };

    const brief = await buildBrief(textPrompt, style, custom_brief);

    // Generate N variants in parallel
    const results = await Promise.allSettled(
      Array.from({ length: variantCount }, () => generateOne(brief, refs))
    );

    const dataUrls = results
      .map((r) => (r.status === "fulfilled" ? r.value : null))
      .filter((u): u is string => !!u);

    if (dataUrls.length === 0) return json({ error: "Image generation failed for all variants" }, 500);

    // Upload all in parallel
    const uploaded = await Promise.all(dataUrls.map((d) => uploadDataUrl(admin, userId, d)));
    const variants = uploaded.filter((u): u is string => !!u);

    if (variants.length === 0) return json({ error: "Upload failed" }, 500);

    return json({
      ok: true,
      variants,
      brief,
      image_url: variants[0], // backward compat
    });
  } catch (e) {
    console.error("superscale-generate-image error", e);
    return json({ error: e instanceof Error ? e.message : "Unknown" }, 500);
  }
});
