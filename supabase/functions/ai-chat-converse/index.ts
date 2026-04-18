// AI Chat — conversational lead finder (no streaming, JSON response)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are Intentsly's AI lead-finding copilot. You find people on LinkedIn who are POSTING with strong BUYING INTENT for the user's offering.

Your job: extract WHAT the user sells + WHO the ideal buyer is, then trigger a buyer-intent post search.

Style:
- Conversational, warm, peer-to-peer (like a fellow founder).
- Short messages (2-4 sentences max).
- Ask AT MOST 1 clarifying question at a time.
- Use plain English. Markdown lists OK for summarizing.

CRITICAL — capturing 'selling':
- 'selling' is the most important field. It must describe the OFFERING from a buyer's perspective: what category, what problem it solves, what the buyer would search for.
- BAD selling: "my platform", "our service", "lead gen tool"
- GOOD selling: "a B2B lead-generation platform that surfaces high-intent buyers from LinkedIn posts", "a sales call recorder that auto-summarises Zoom meetings", "an AI cold-email writer for SDRs"
- If the user is vague ("my platform"), ask ONE question to clarify what it is/does.

Flow:
1. Capture/refine 'selling' first (most important).
2. Then capture WHO: role, industries, locations.
3. Once you have 'selling' + at least one of (role / industry / location), call ready_to_search.
4. After a search, the user may refine. Merge new criteria.

CRITICAL TOOL-CALLING RULE:
- On EVERY user turn, you MUST call \`update_search_criteria\` with whatever you learned, even if it's just a refined \`selling\` description. Never reply with text only — always emit a tool call alongside the text.
- If the user has already mentioned what they sell (even vaguely, like "auto job posting tool"), set \`selling\` immediately to your best one-sentence buyer-perspective rewrite (e.g. "an automated job-posting tool that lets HR agencies push openings to multiple boards in one click"). You can refine it later as they clarify.

Important:
- Never invent data. Never list specific people.
- Never promise specific numbers of leads.
- The actual search will: AI-generate buyer-intent queries → search LinkedIn posts → AI-score each post 0-100 for buying intent → return only authors of posts with score ≥80. So the better 'selling' is, the better the leads.
- If user asks unrelated things, politely redirect.`;

const TOOLS = [
  {
    type: "function",
    function: {
      name: "update_search_criteria",
      description: "Update the accumulated lead search criteria. Only include fields the user mentioned or implied. Existing values are kept unless overwritten.",
      parameters: {
        type: "object",
        properties: {
          role: { type: "string", description: "Target job title/role, e.g. 'Founder', 'Head of Sales', 'CTO'" },
          industries: { type: "array", items: { type: "string" }, description: "Industries, e.g. ['SaaS','Fintech']" },
          locations: { type: "array", items: { type: "string" }, description: "Locations/countries, e.g. ['United States','Germany']" },
          company_sizes: { type: "array", items: { type: "string" }, description: "Sizes, e.g. ['1-10','11-50','51-200','201-500','501-1000','1001+']" },
          exclude_keywords: { type: "array", items: { type: "string" }, description: "Things to exclude in titles/companies" },
          intent_keywords: { type: "array", items: { type: "string" }, description: "Buyer-intent signals, e.g. ['hiring SDR','recently funded','launching','migrating']" },
          selling: { type: "string", description: "ONE-SENTENCE description of what the user is selling/offering, written as a buyer would describe what they need (e.g. 'a B2B lead-generation platform that finds high-intent buyers from LinkedIn'). Update this whenever the user clarifies their offering." },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "ready_to_search",
      description: "Call when criteria are sufficient to run a LinkedIn POST search for buyer-intent signals. You need at minimum: a clear `selling` description AND (a role OR industries OR locations).",
      parameters: { type: "object", properties: {} },
    },
  },
];

function mergeCriteria(prev: any, patch: any) {
  const out = { ...(prev ?? {}) };
  for (const [k, v] of Object.entries(patch ?? {})) {
    if (v === undefined || v === null) continue;
    if (Array.isArray(v)) {
      const existing = Array.isArray(out[k]) ? out[k] : [];
      out[k] = Array.from(new Set([...existing, ...v.map(String)]));
    } else {
      out[k] = v;
    }
  }
  return out;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Auth — validate JWT in code (verify_jwt is false in config)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { Authorization: authHeader, apikey: anonKey },
    });
    if (!userRes.ok) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const { messages = [], criteria = {} } = await req.json();

    const aiMessages = [
      { role: "system", content: SYSTEM_PROMPT + `\n\nCurrent accumulated criteria: ${JSON.stringify(criteria)}` },
      ...messages,
    ];

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: aiMessages,
        tools: TOOLS,
        tool_choice: "auto",
        // Encourage tool use; Gemini occasionally drops tool calls without this hint.
        parallel_tool_calls: true,
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error("AI error", aiRes.status, errText);
      if (aiRes.status === 429) return new Response(JSON.stringify({ error: "Rate limit" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (aiRes.status === 402) return new Response(JSON.stringify({ error: "Add credits to your Lovable workspace." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI gateway: ${aiRes.status}`);
    }

    const data = await aiRes.json();
    const choice = data.choices?.[0]?.message ?? {};
    let updatedCriteria = criteria;
    let readyToSearch = false;

    for (const call of choice.tool_calls ?? []) {
      const name = call.function?.name;
      let args: any = {};
      try { args = JSON.parse(call.function?.arguments ?? "{}"); } catch { /* */ }
      if (name === "update_search_criteria") {
        updatedCriteria = mergeCriteria(updatedCriteria, args);
      } else if (name === "ready_to_search") {
        readyToSearch = true;
      }
    }

    let reply = (choice.content ?? "").trim();

    // If the model only called tools without text, follow up with a synthesis request
    if (!reply && (choice.tool_calls?.length ?? 0) > 0) {
      const followup = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            ...aiMessages,
            choice,
            ...(choice.tool_calls ?? []).map((tc: any) => ({
              role: "tool",
              tool_call_id: tc.id,
              content: JSON.stringify({ ok: true, criteria: updatedCriteria }),
            })),
          ],
        }),
      });
      if (followup.ok) {
        const f = await followup.json();
        reply = (f.choices?.[0]?.message?.content ?? "").trim();
      }
    }

    if (!reply) reply = "Got it. What else should I know?";

    const quickReplies: string[] = [];
    if (readyToSearch) quickReplies.push("Start search", "Add a filter");

    return new Response(
      JSON.stringify({ reply, criteria: updatedCriteria, quick_replies: quickReplies, ready_to_search: readyToSearch }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    console.error("ai-chat-converse error", e);
    return new Response(JSON.stringify({ error: e.message ?? "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
