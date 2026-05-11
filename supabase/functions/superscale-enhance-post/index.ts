import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ACTIONS: Record<string, string> = {
  hook: "Rewrite this LinkedIn post with a SUPER engaging opening hook (first 1-2 lines). The hook must stop the scroll: bold claim, surprising stat, contrarian opinion, or curiosity gap. Keep the rest of the post mostly intact. Don't use cringe phrases like 'Let me tell you' or 'Here's the truth'.",
  funny: "Rewrite this LinkedIn post to be a bit funny — dry wit, light self-deprecation, or a clever observation. Don't force jokes, don't use emojis as crutches, and keep the core message intact. One subtle laugh is better than five forced ones.",
  undetectable: "Rewrite this post so it reads as 100% human-written and bypasses AI detectors. Use varied sentence lengths, occasional sentence fragments, casual phrasing, mild imperfections, and a personal voice. NEVER use: 'leverage', 'tech stack', 'synergy', 'delve', 'in today's fast-paced world', 'game-changer', em-dashes everywhere. Keep it natural like a real founder typed it on their phone.",
  grammar: "Fix grammar, spelling, and punctuation in this LinkedIn post. Do NOT change voice, tone, structure, length, or word choice. Only correct mistakes. Return the corrected post.",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { content, action, aboutMe } = await req.json();
    if (!content || !action || !ACTIONS[action]) {
      return new Response(JSON.stringify({ error: "Missing content or invalid action" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Pull about_me for writer context if not provided
    let writerContext = aboutMe || "";
    if (!writerContext) {
      const auth = req.headers.get("Authorization");
      if (auth) {
        const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
          global: { headers: { Authorization: auth } },
        });
        const { data: u } = await sb.auth.getUser();
        if (u?.user) {
          const { data: p } = await sb.from("profiles").select("superscale_about_me").eq("user_id", u.user.id).maybeSingle();
          writerContext = p?.superscale_about_me || "";
        }
      }
    }

    const system = `You are a world-class LinkedIn ghostwriter. Return ONLY the rewritten post text — no preamble, no quotes, no explanations, no markdown.${writerContext ? `\n\n=== WRITER CONTEXT (write AS this person, in their voice) ===\n${writerContext}` : ""}`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: system },
          { role: "user", content: `${ACTIONS[action]}\n\n=== ORIGINAL POST ===\n${content}` },
        ],
      }),
    });

    if (!resp.ok) {
      if (resp.status === 429) return new Response(JSON.stringify({ error: "Rate limit. Try again in a moment." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (resp.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted. Add funds in Settings → Workspace → Usage." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await resp.text();
      return new Response(JSON.stringify({ error: "AI gateway error", detail: t }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await resp.json();
    let out = (data.choices?.[0]?.message?.content || "").trim();
    // Strip surrounding quotes if model added them
    if ((out.startsWith('"') && out.endsWith('"')) || (out.startsWith("'") && out.endsWith("'"))) {
      out = out.slice(1, -1).trim();
    }

    return new Response(JSON.stringify({ content: out }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
