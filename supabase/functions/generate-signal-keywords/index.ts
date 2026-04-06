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
      keyword_posts: `Generate 10 keyword phrases for this specific company based on the business context above.

THINKING PROCESS:
1. What is the #1 pain that makes someone search for this product?
2. How does a frustrated user describe that pain on LinkedIn in plain English?
3. What would someone write when asking their network for a recommendation?
4. What would someone write when they have just decided their current solution is not working?

RULES:
- Write exactly how a human types on LinkedIn — lowercase, casual, real
- 4-10 words per phrase
- Must describe a PAIN or a REQUEST FOR HELP — not a research task
- Must be specific to what this company sells
- No jargon, no corporate language, no analyst terminology
- If the phrase could appear in a Gartner report — delete it
- If a frustrated founder would never type it — delete it

GOOD examples (real human language):
- "our cold email reply rate has tanked"
- "anyone using something better than apollo"
- "need to find leads who are actually buying"
- "outbound is not working what are you using"
- "our website looks outdated need a redesign"
- "anyone recommend a good design agency"

BAD examples (corporate jargon nobody types):
- "evaluating revenue orchestration platforms"
- "standardizing our sales tech stack"
- "benchmarks for pipeline conversion rates"
- "looking to integrate our CRM with"

Generate 10 phrases this way. Raw, real, human.`,

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
            content: `You are monitoring LinkedIn posts in real time to find people who need a specific service RIGHT NOW.

Your job is to generate phrases that match how a REAL PERSON writes on LinkedIn when they are frustrated with a problem or actively looking for a solution.

The most important rule: write phrases the way a human types them at 2pm on a Tuesday when they are annoyed at their current tool or asking their network for help.

REAL LinkedIn buying intent posts sound like:
- "our cold email reply rates have tanked, anyone switched from apollo?"
- "need to find a better way to prospect on linkedin, what are you guys using"
- "we're getting 1% reply rates on outbound, something has to change"
- "anyone know a good tool to find leads who are actually in market"
- "thinking of switching from zoominfo, getting too expensive for bad data"
- "our SDR team is struggling to fill pipeline, what's working for you"

NEVER generate phrases that sound like:
- Analyst reports: "evaluating revenue orchestration platforms"
- Job descriptions: "standardizing our sales tech stack"
- Conference talks: "benchmarks for pipeline conversion rates"
- Press releases: "looking to integrate our CRM with"

The test for every phrase: would a real founder or sales manager type this exact sentence into a LinkedIn post when they are having a bad week? If it sounds like something from a Gartner report — reject it.`,
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
