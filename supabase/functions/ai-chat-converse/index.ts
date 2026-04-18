// AI Chat — conversational lead finder (no streaming, JSON response)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are Intentsly's friendly AI lead-finding copilot for B2B founders and sales teams.

Your job: help the user describe who they want to reach on LinkedIn, then trigger a search.

Style:
- Conversational, warm, peer-to-peer (like talking to a fellow founder).
- Short messages (2-4 sentences max).
- Ask AT MOST 1 clarifying question at a time, only if criteria are too vague.
- Use plain English. Markdown lists OK for summarizing criteria.

Flow:
1. User describes target. Extract structured criteria and call update_search_criteria.
2. If you have enough to search (a clear role + at least one of: industry/location/company size), call ready_to_search and tell them you're ready. Suggest quick replies like "Start search" or "Add a filter".
3. If too vague (e.g. "find me leads"), ask ONE specific clarifying question.
4. After a search, the user may refine. Merge new criteria into existing.

Important:
- Never invent data. Never list specific people.
- Never promise specific numbers of leads.
- If user asks unrelated things, politely redirect to lead finding.`;

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
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "ready_to_search",
      description: "Call when criteria are sufficient to run a LinkedIn search.",
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
