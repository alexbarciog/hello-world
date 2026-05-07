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

async function fetchAsDataUrl(url: string): Promise<string | null> {
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    const buf = new Uint8Array(await r.arrayBuffer());
    const mime = r.headers.get("content-type") || "image/png";
    let bin = "";
    for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]);
    return `data:${mime};base64,${btoa(bin)}`;
  } catch { return null; }
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

    const { post_id, prompt } = await req.json().catch(() => ({}));
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    let post: any = null;
    let textPrompt = String(prompt || "").trim();
    if (post_id) {
      const { data } = await admin.from("linkedin_posts").select("*").eq("id", post_id).eq("user_id", userId).maybeSingle();
      if (!data) return json({ error: "Post not found" }, 404);
      post = data;
      if (!textPrompt) textPrompt = post.content;
    }
    if (!textPrompt) return json({ error: "prompt required" }, 400);

    const { data: refs } = await admin.from("superscale_design_refs")
      .select("image_url").eq("user_id", userId).order("position").limit(8);
    if (!refs || refs.length < 5) {
      return json({ error: "Add at least 5 design references first" }, 400);
    }

    const refDataUrls: string[] = [];
    for (const r of refs.slice(0, 6)) {
      const u = await fetchAsDataUrl(r.image_url);
      if (u) refDataUrls.push(u);
    }

    const userContent: any[] = [
      { type: "text", text: `Generate a single LinkedIn-style image (square 1:1) inspired by the visual style, color palette, typography and layout of the reference images. Topic of the post:\n\n"${textPrompt.slice(0, 500)}"\n\nMake it feel native to LinkedIn — clean, professional, scroll-stopping. No watermark.` },
      ...refDataUrls.map((url) => ({ type: "image_url", image_url: { url } })),
    ];

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [{ role: "user", content: userContent }],
        modalities: ["image", "text"],
      }),
    });
    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error("AI image gen failed", aiResp.status, t);
      if (aiResp.status === 429) return json({ error: "Rate limit, try again in a minute" }, 429);
      if (aiResp.status === 402) return json({ error: "Out of AI credits — top up in Settings" }, 402);
      return json({ error: "Image generation failed" }, 500);
    }
    const data = await aiResp.json();
    const dataUrl: string | undefined = data?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!dataUrl) return json({ error: "No image returned" }, 500);

    // upload to storage
    const m = dataUrl.match(/^data:(.*?);base64,(.*)$/);
    if (!m) return json({ error: "Bad image data" }, 500);
    const mime = m[1];
    const bin = atob(m[2]);
    const buf = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
    const ext = mime.includes("jpeg") ? "jpg" : "png";
    const path = `${userId}/posts/${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await admin.storage.from("superscale").upload(path, buf, { contentType: mime, upsert: false });
    if (upErr) return json({ error: upErr.message }, 500);
    const { data: pub } = admin.storage.from("superscale").getPublicUrl(path);
    const imageUrl = pub.publicUrl;

    if (post_id) {
      await admin.from("linkedin_posts").update({
        image_url: imageUrl, generated_image_prompt: textPrompt,
      }).eq("id", post_id);
    }

    return json({ ok: true, image_url: imageUrl });
  } catch (e) {
    console.error("superscale-generate-image error", e);
    return json({ error: e instanceof Error ? e.message : "Unknown" }, 500);
  }
});
