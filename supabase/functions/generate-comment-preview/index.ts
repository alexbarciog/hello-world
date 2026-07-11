const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

const SAMPLE_POST = `Just wrapped up 6 months of trying to scale our outbound team from 3 to 8 SDRs.

Honest reflection: hiring was the easy part. Getting them to actually book qualified meetings within 60 days? Brutal.

The playbook that worked in 2022 isn't landing anymore. Reply rates on cold email are down ~40% for us. LinkedIn is louder than ever. And every prospect has already been pitched the same "quick 15 min?" opener five times this week.

We're rethinking the whole motion — leading with signals, not lists.

Curious what's actually working for other B2B teams right now.`;

const SYSTEM = `You write LinkedIn comments that sound like a real human peer, not a marketer.

Hard rules:
- 1 to 3 sentences. Never more.
- React to ONE specific idea in the post. Quote or reference it concretely.
- Conversational, casual, slightly imperfect. Contractions ok. Lowercase after a break ok.
- NO greetings ("hey", "hi"), NO sign-offs, NO @mentions, NO links, NO pitching your own product.
- Banned phrases: "great post", "love this", "100%", "leverage", "synergy", "tech stack",
  "crushing it", "this!", "couldn't agree more", "well said", "amazing", "🔥".
- No emoji unless the instructions explicitly ask for one.
- Add ONE tiny new angle or a genuine question. Don't restate the post.

Output: ONLY the comment text. No quotes, no labels, no explanation.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { ai_instructions, sample_post, first_name, company } = await req.json().catch(() => ({}));
    const instr = (ai_instructions || "").toString().trim();
    if (!instr) {
      return new Response(JSON.stringify({ error: "ai_instructions required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const post = (sample_post || SAMPLE_POST).toString().slice(0, 1200);
    const fn = (first_name || "Alex").toString();
    const co = (company || "Acme").toString();

    const userMsg = `The lead is ${fn} from ${co}. Their post:
"""
${post}
"""

Follow these instructions from the campaign owner when writing the comment:
${instr}

Write the comment now.`;

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: userMsg },
        ],
      }),
    });

    if (!r.ok) {
      const text = await r.text();
      console.error("AI gateway error", r.status, text);
      return new Response(
        JSON.stringify({ error: "AI generation failed", status: r.status, details: text }),
        { status: r.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const d = await r.json();
    const comment = (d?.choices?.[0]?.message?.content || "")
      .trim()
      .replace(/^["']|["']$/g, "");

    return new Response(JSON.stringify({ comment }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-comment-preview error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
