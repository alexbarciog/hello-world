const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const {
      signalType,
      jobTitles,
      industries,
      companyTypes,
      locations,
      companyName,
      description,
      painPoints,
      campaignGoal,
      website,
    } = await req.json();
    if (!signalType) throw new Error('signalType is required');

    const signalDescriptions: Record<string, string> = {
      keyword_posts: 'LinkedIn post phrases that indicate buying intent specific to what this company sells.',
      hashtag_engagement: 'LinkedIn hashtags (without the # symbol) that are directly relevant to the company\'s services and industry.',
      profile_engagers: 'LinkedIn profile URLs of industry thought leaders, influencers, or competitors whose followers would be ideal prospects.',
      competitor_followers: 'LinkedIn company page URLs of competitors whose followers would be ideal prospects.',
      competitor_engagers: 'LinkedIn company page URLs of competitors whose post engagers would be ideal prospects.',
    };

    // Build business context block
    const businessContext = [
      companyName && `Company name: ${companyName}`,
      website && `Website: ${website}`,
      description && `What they do: ${description}`,
      painPoints && (Array.isArray(painPoints) ? `Problems they solve: ${painPoints.join(', ')}` : `Problems they solve: ${painPoints}`),
      campaignGoal && `Campaign goal: ${campaignGoal}`,
    ].filter(Boolean).join('\n');

    const extraInstructions: Record<string, string> = {
      keyword_posts: `You have two inputs: what the COMPANY SELLS and who their ICP is.

Your job is to generate 10 keyword phrases that a person in the ICP would write in a LinkedIn post when they need what this company sells.

THINKING PROCESS — do this before generating:
1. What specific problem does this company solve?
2. How would someone in the ICP describe that problem in their own words on LinkedIn?
3. What would they write right before they start looking for a solution?
4. What would they write when asking their network for a recommendation?

PHRASE STRUCTURE — use these templates as a starting point:
- "looking for [specific thing this company does]"
- "anyone recommend [type of service this company provides]"
- "struggling with [specific pain point this company solves]"
- "need help with [specific task this company handles]"
- "switching from [current approach] to [what this company offers]"
- "our [team/company] needs [specific service]"
- "evaluating [type of solution this company provides]"

CRITICAL RULES:
- Every phrase must be specific to THIS company's service — not generic buying intent
- A design agency gets "need a brand refresh" not "looking for a tool"
- A dev agency gets "need to outsource our MVP" not "evaluating solutions"
- A lead gen tool gets "struggling to fill our pipeline" not "need help with outbound"
- Phrases must be 3-8 words
- Must sound like real LinkedIn writing — casual, direct, human
- Must indicate the person NEEDS what this company sells RIGHT NOW

Generate 10 phrases. We will filter down to the best 5-7.`,

      hashtag_engagement: `Generate exactly 7 LinkedIn hashtags (WITHOUT the # symbol) that are NICHE and SPECIFIC to the services and industry described above.

CRITICAL RULES:
- Return CamelCase compound hashtags only (no spaces, no # symbol)
- NEVER return generic/broad hashtags that personal/lifestyle posts commonly use
- Prefer tool-specific, methodology-specific, or problem-specific hashtags
- The hashtag should be specific enough that personal/family/vacation posts would NEVER use it

BANNED hashtags (too generic, appear in personal posts): Sales, Marketing, Leadership, Motivation, Success, Growth, Entrepreneur, Business, Innovation, Networking, Mindset, Hustle, Inspiration

GOOD examples (niche, professional-only):
- "SalesAutomation", "ABMStrategy", "RevOps", "DemandGen"
- "MarTech", "SalesEnablement", "PipelineManagement"
- "ColdOutreach", "AccountBasedMarketing", "SalesOps"

BAD examples (too broad):
- "Sales", "Marketing", "Leadership", "Motivation", "Success"

Make them specific to what this company actually sells and who their buyers are.`,
    };

    const prompt = `BUSINESS SELLING THIS SERVICE:
${businessContext || 'Unknown — infer from the ICP below'}

ICP (who they are targeting):
- Job titles: ${(jobTitles || []).join(', ') || 'Unknown'}
- Industries: ${(industries || []).join(', ') || 'Unknown'}
- Company types: ${(companyTypes || []).join(', ') || 'Unknown'}
- Locations: ${(locations || []).join(', ') || 'Unknown'}

Signal type: ${signalType}
Goal: ${signalDescriptions[signalType] || 'Generate relevant keywords for this signal type.'}

${extraInstructions[signalType] || 'Generate exactly 5 short, specific keyword phrases (3-6 words each) relevant to this signal type and ICP.'}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        temperature: 0.3,
        messages: [
          {
            role: 'system',
            content: `You are a LinkedIn signal monitoring specialist. Your job is to generate keyword phrases that a potential buyer would write in a LinkedIn post when they need a specific service.

The phrases you generate will be used to search LinkedIn posts in real time. When a post matches one of these phrases, it triggers an outreach to that person.

This means every phrase must:
1. Be specific enough that it only matches posts from people who genuinely need the service
2. Sound exactly like how a real professional writes on LinkedIn — casual and direct
3. Indicate active need RIGHT NOW, not general interest or past experience

The biggest mistake is generating generic phrases. "Looking for a tool" matches everything. "Need to redesign our brand for a Series A pitch" matches exactly the right person at exactly the right moment.

Always tailor phrases completely to what the company actually sells.`,
          },
          { role: 'user', content: prompt },
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'return_keywords',
            description: 'Return signal monitoring keywords',
            parameters: {
              type: 'object',
              properties: {
                keywords: { type: 'array', items: { type: 'string' }, description: 'Keyword phrases tailored to the specific business described. For keyword_posts: 7-10 buying intent phrases. For hashtags: 5-7 niche hashtags.' },
              },
              required: ['keywords'],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: 'function', function: { name: 'return_keywords' } },
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) return new Response(JSON.stringify({ error: "Rate limited. Try again shortly." }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      if (status === 402) return new Response(JSON.stringify({ error: "Credits required." }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      const errText = await response.text();
      console.error('AI gateway error:', status, errText);
      throw new Error(`AI gateway error: ${status}`);
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error('No tool call returned from AI');

    const result = JSON.parse(toolCall.function.arguments);
    // Take top 7 for keyword_posts (was generating 10), top 5 for others
    const maxCount = signalType === 'keyword_posts' ? 7 : 5;
    const keywords = (result.keywords || []).slice(0, maxCount);

    console.log(`[generate-signal-keywords] type=${signalType} business="${companyName || 'unknown'}" generated=${keywords.length}:`, JSON.stringify(keywords));

    return new Response(JSON.stringify({ keywords }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('generate-signal-keywords error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
