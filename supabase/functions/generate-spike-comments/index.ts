import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const TONE_HINT: Record<string, string> = {
  curious_peer: "thoughtful, curious peer who's genuinely engaging with the idea",
  hot_take: "playful contrarian with a sharp but friendly hot take",
  supportive: "warm and supportive, agreeing with a small specific reason",
  playful: "playful, witty, light, can use one emoji at most",
};

const SYSTEM = `You write LinkedIn comments that sound human as fuck.

Hard rules:
- 1-2 sentences. Max 180 characters.
- React to ONE specific idea in the post. Reference it concretely.
- Conversational. Lowercase ok. Contractions ok. Mild imperfection ok.
- No greetings. No sign-off. No @mentions. No links. No pitching.
- Never use these words/phrases: "great post", "love this", "100%", "leverage", "synergy", "tech stack", "crushing it", "this!", "couldn't agree more", "well said", "amazing", "🔥".
- No emoji unless tone says playful (then max 1).
- Don't restate the post. Add one tiny new angle.

Return ONLY the comment text. No quotes, no labels, no explanations.`;

async function callAI(messages: any[]): Promise<string> {
  const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "google/gemini-2.5-flash", messages }),
  });
  if (!r.ok) {
    console.error("AI gateway error", r.status, await r.text());
    return "";
  }
  const d = await r.json();
  return (d?.choices?.[0]?.message?.content || "").trim().replace(/^["']|["']$/g, "");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { spike_id, comment_id } = await req.json().catch(() => ({}));
    if (!spike_id && !comment_id) return json({ error: "spike_id or comment_id required" }, 400);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    let spike: any;
    let comments: any[] = [];
    if (comment_id) {
      const { data: c } = await admin.from("engagement_spike_comments").select("*").eq("id", comment_id).single();
      if (!c) return json({ error: "not found" }, 404);
      comments = [c];
      const { data: s } = await admin.from("engagement_spikes").select("*").eq("id", c.spike_id).single();
      spike = s;
    } else {
      const { data: s } = await admin.from("engagement_spikes").select("*").eq("id", spike_id).single();
      spike = s;
      const { data: cs } = await admin.from("engagement_spike_comments")
        .select("*").eq("spike_id", spike_id).is("comment_text", null);
      comments = cs || [];
    }
    if (!spike) return json({ error: "spike not found" }, 404);

    const toneHint = TONE_HINT[spike.tone] || TONE_HINT.curious_peer;
    const angle = spike.custom_angle ? `\nIf it fits naturally, weave in this angle: ${spike.custom_angle}` : "";

    let done = 0;
    for (const c of comments) {
      const userMsg = `Tone: ${toneHint}.${angle}

Post by ${c.post_author_name || "someone"}:
"""
${(c.post_snippet || "").slice(0, 500)}
"""

Write the comment now.`;
      const text = await callAI([
        { role: "system", content: SYSTEM },
        { role: "user", content: userMsg },
      ]);
      if (text) {
        await admin.from("engagement_spike_comments").update({
          comment_text: text.slice(0, 280),
          status: spike.require_approval ? "drafted" : "approved",
        }).eq("id", c.id);
        done++;
      }
    }

    return json({ ok: true, generated: done });
  } catch (e) {
    console.error("generate-spike-comments error", e);
    return json({ error: e instanceof Error ? e.message : "Unknown" }, 500);
  }
});
