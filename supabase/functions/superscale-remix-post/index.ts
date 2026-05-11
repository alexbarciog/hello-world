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

const SYSTEM = `You rewrite viral LinkedIn posts in the user's voice while preserving the high-performing format.

Hard rules:
- Keep the same structure (listicle, story, hot-take, question, etc.)
- Lower the polish slightly: lowercase ok, contractions ok, sound like a real founder.
- 6th-grade reading level.
- Banned words: "leverage", "synergy", "tech stack", "I hope this finds you well", "crushing it".
- 800-1300 characters total.
- No hashtags unless original had them.
- Return ONLY the rewritten post. No quotes, no preamble.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
    const userClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: auth } } });
    const { data: ud, error: uerr } = await userClient.auth.getUser();
    if (uerr || !ud?.user) return json({ error: "Unauthorized" }, 401);
    const userId = ud.user.id;

    const { inspiration_id } = await req.json().catch(() => ({}));
    if (!inspiration_id) return json({ error: "inspiration_id required" }, 400);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const { data: insp } = await admin.from("superscale_inspirations").select("*").eq("id", inspiration_id).maybeSingle();
    if (!insp) return json({ error: "Not found" }, 404);

    const { data: profile } = await admin.from("profiles").select("current_organization_id, superscale_about_me").eq("user_id", userId).maybeSingle();
    const { data: campaign } = await admin.from("campaigns")
      .select("company_name, industry, value_proposition, services")
      .eq("user_id", userId).order("created_at", { ascending: false }).limit(1).maybeSingle();

    const aboutMe = (profile?.superscale_about_me || "").trim();
    const campaignCtx = campaign
      ? `\nCompany: ${campaign.company_name || ""}. Industry: ${campaign.industry || ""}. What they do: ${(campaign.services || []).join(", ")}. Value prop: ${campaign.value_proposition || ""}.`
      : "";
    const userCtx = (aboutMe || campaignCtx)
      ? `\n\n=== WRITER CONTEXT (write AS this person, in their voice) ===${aboutMe ? `\n${aboutMe}` : ""}${campaignCtx}`
      : "";

    const userMsg = `Original viral post by ${insp.author_name || "someone"} (${insp.likes} likes, ${insp.comments} comments):
"""
${(insp.content || "").slice(0, 2500)}
"""
${userCtx}

Rewrite it now in the user's voice, same format.`;

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: userMsg },
        ],
      }),
    });
    if (!r.ok) {
      if (r.status === 429) return json({ error: "Rate limit, try again in a minute" }, 429);
      if (r.status === 402) return json({ error: "Out of AI credits" }, 402);
      const t = await r.text();
      console.error("AI failed", r.status, t);
      return json({ error: "Remix failed" }, 500);
    }
    const d = await r.json();
    const text = (d?.choices?.[0]?.message?.content || "").trim().replace(/^["']|["']$/g, "");

    // create draft post
    const { data: post, error: insErr } = await admin.from("linkedin_posts").insert({
      user_id: userId,
      organization_id: profile?.current_organization_id,
      content: text,
      status: "draft",
      source_inspiration_id: inspiration_id,
    }).select("id").single();
    if (insErr) return json({ error: insErr.message }, 500);

    return json({ ok: true, post_id: post.id, content: text });
  } catch (e) {
    console.error("superscale-remix-post error", e);
    return json({ error: e instanceof Error ? e.message : "Unknown" }, 500);
  }
});
