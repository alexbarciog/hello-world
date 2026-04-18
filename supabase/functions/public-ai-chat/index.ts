// Public AI Chat — no auth required. Used by the marketing /try-ai page.
// Simple turn-based JSON conversation. Decides when to "trigger" a search
// (the frontend then shows mocked, locked leads behind a signup paywall).
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are Intentsly's AI lead-finding copilot, embedded on a public marketing page where a visitor is trying the product before signing up.

Your job: in AT MOST 5 short user turns, capture WHAT they sell + WHO their buyer is, then trigger a (simulated) LinkedIn buyer-intent search.

Style:
- Conversational, warm, peer-to-peer, like a sharp founder helping out.
- 2-3 sentences max per reply. NEVER lecture.
- Ask AT MOST 1 question at a time.
- Plain English. Light markdown OK (bold, dashes).

Flow (BE EFFICIENT — visitor only has 5 turns):
1. First reply: confirm what they sell in one line, then ask the single most useful follow-up (usually role + region in ONE question).
2. Second reply: confirm the WHO and trigger the search.
3. Trigger the search as soon as you have a rough picture of (a) what they sell + (b) at least one of: target role, industry, or location. DON'T over-qualify.

Tool-call rules:
- Call \`ready_to_search\` whenever your reply implies you're about to run/are running the search ("let me find them", "searching now", "let's go", etc.).
- Don't call \`ready_to_search\` if you end with a clarifying question.
- If this is the user's 4th or 5th turn, ALWAYS trigger the search — don't keep asking questions.

Other:
- Never invent specific people or companies.
- Never promise specific lead counts.
- If user asks unrelated things, redirect briefly.`;

const TOOLS = [
  {
    type: "function",
    function: {
      name: "ready_to_search",
      description: "Call when ready to trigger the simulated LinkedIn buyer-intent search. You need at minimum a rough sense of what the user sells and who their buyer is.",
      parameters: { type: "object", properties: {} },
    },
  },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const body = await req.json();
    const messages = Array.isArray(body.messages) ? body.messages : [];
    const userTurnCount = Number(body.user_message_count ?? 0);
    const maxMessages = Number(body.max_messages ?? 5);

    // Sanity: cap conversation length sent to model
    const trimmed = messages.slice(-12);

    const aiMessages = [
      {
        role: "system",
        content:
          SYSTEM_PROMPT +
          `\n\nThis is user turn ${userTurnCount} of ${maxMessages}. ${
            userTurnCount >= maxMessages - 1
              ? "Final turn — TRIGGER THE SEARCH NOW. Don't ask another question."
              : ""
          }`,
      },
      ...trimmed,
    ];

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: aiMessages,
        tools: TOOLS,
        tool_choice: "auto",
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error("AI error", aiRes.status, errText);
      if (aiRes.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiRes.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway: ${aiRes.status}`);
    }

    const data = await aiRes.json();
    const choice = data.choices?.[0]?.message ?? {};
    let readyToSearch = false;
    for (const call of choice.tool_calls ?? []) {
      if (call.function?.name === "ready_to_search") readyToSearch = true;
    }

    let reply = (choice.content ?? "").trim();
    if (!reply) reply = "Got it — let me find them.";

    // Force trigger on final turn
    if (userTurnCount >= maxMessages) readyToSearch = true;

    return new Response(
      JSON.stringify({ reply, ready_to_search: readyToSearch }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    console.error("public-ai-chat error", e);
    return new Response(JSON.stringify({ error: e.message ?? "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
