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

    const { signalType, jobTitles, industries, companyTypes, locations } = await req.json();
    if (!signalType) throw new Error('signalType is required');

    const signalDescriptions: Record<string, string> = {
      keyword_posts: 'LinkedIn post phrases that indicate buying intent. Examples: "looking for a CRM", "need help with lead gen", "recommendations for sales tools", "struggling with outbound". Focus on action-oriented phrases people write when they have a problem to solve or are actively searching for a solution.',
      hashtag_engagement: 'LinkedIn hashtags (without the # symbol) that are directly relevant to the company\'s services and industry. These should be hashtags that the company\'s ideal buyers follow or use. Examples: "SalesAutomation", "LeadGeneration", "B2BSales", "GrowthHacking". Focus on hashtags related to the business services, not buying intent phrases.',
      profile_engagers: 'LinkedIn profile URLs of industry thought leaders, influencers, or competitors whose followers would be ideal prospects.',
      competitor_followers: 'LinkedIn company page URLs of competitors whose followers would be ideal prospects.',
      competitor_engagers: 'LinkedIn company page URLs of competitors whose post engagers would be ideal prospects.',
    };

    const extraInstructions: Record<string, string> = {
      keyword_posts: `Generate exactly 5 keyword phrases that demonstrate BUYING INTENT. Each phrase should sound like something a real person would type in a LinkedIn post when they are actively looking for a solution, asking for recommendations, or expressing a pain point.

Good examples: "looking for a tool to", "need help with", "any recommendations for", "struggling with", "searching for a solution"
Bad examples: "sales automation", "B2B marketing", "lead generation" (these are too broad/generic)

Make them specific to the ICP above. Each phrase should be 3-6 words.`,
      hashtag_engagement: `Generate exactly 5 LinkedIn hashtags (WITHOUT the # symbol) that are directly related to the services and industry described above. These should be hashtags that professionals in this space actively use and follow.

Good examples: "SalesAutomation", "LeadGeneration", "B2BSales", "OutboundSales", "RevOps"
Bad examples: "looking for tools", "need help with sales" (these are phrases, not hashtags)

Return single-word or CamelCase compound hashtags only. No spaces, no # symbol.`,
    };

    const prompt = \`Target Job Titles: \${(jobTitles || []).join(', ') || 'Unknown'}
Target Industries: \${(industries || []).join(', ') || 'Unknown'}
Target Company Types: \${(companyTypes || []).join(', ') || 'Unknown'}
Target Locations: \${(locations || []).join(', ') || 'Unknown'}

Signal type: \${signalType}
Goal: \${signalDescriptions[signalType] || 'Generate relevant keywords for this signal type.'}

\${extraInstructions[signalType] || 'Generate exactly 5 short, specific keyword phrases (3-6 words each) relevant to this signal type and ICP.'}\`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: 'You are a B2B sales intelligence expert. Generate precise, actionable keywords for LinkedIn signal monitoring.' },
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
                keywords: { type: 'array', items: { type: 'string' }, description: '5 keyword phrases' },
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
      const errText = await response.text();
      console.error('AI gateway error:', response.status, errText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error('No tool call returned from AI');

    const result = JSON.parse(toolCall.function.arguments);
    const keywords = (result.keywords || []).slice(0, 5);

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
