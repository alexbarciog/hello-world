const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Blacklist of overly broad/generic terms that match personal posts
const GENERIC_BLACKLIST = new Set([
  'sales', 'marketing', 'leadership', 'motivation', 'success', 'growth',
  'entrepreneur', 'business', 'innovation', 'networking', 'mindset',
  'hustle', 'grateful', 'blessed', 'family', 'weekend', 'vacation',
  'holiday', 'inspiration', 'grind', 'lifestyle', 'love', 'happiness',
  'thankful', 'morning', 'coffee', 'fitness', 'health', 'travel',
]);

function isBlacklisted(keyword: string): boolean {
  const clean = keyword.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
  // Single-word exact match
  if (GENERIC_BLACKLIST.has(clean)) return true;
  // For CamelCase hashtags, split and check if ALL words are blacklisted
  const words = clean.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase().split(/\s+/).filter(w => w.length > 0);
  return words.length > 0 && words.every(w => GENERIC_BLACKLIST.has(w));
}

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
      keyword_posts: `Generate exactly 7 keyword phrases that demonstrate BUYING INTENT. Each phrase should sound like something a real person would type in a LinkedIn post when they are actively looking for a solution, asking for recommendations, or expressing a pain point.

CRITICAL RULES:
- Each phrase MUST be 3-6 words and action-oriented
- Phrases MUST indicate someone actively seeking a solution or experiencing a business problem
- NEVER generate single generic words like "sales", "marketing", "growth", "leadership", "business"
- NEVER generate motivational/lifestyle phrases that could appear in personal posts
- AVOID broad industry terms that people use in personal/weekend/family posts with a random business hashtag

GOOD examples (specific, action-oriented, buying intent):
- "looking for a tool to"
- "need help with outbound"
- "any recommendations for CRM"
- "struggling with lead generation"
- "switching from our current"
- "evaluating solutions for"
- "budget approved for new"

BAD examples (too generic, match personal posts):
- "sales" (matches "took a break from sales this weekend")
- "marketing tips" (matches lifestyle/motivational posts)
- "growth mindset" (matches personal development posts)
- "business success" (matches inspirational quotes)

Make them specific to the ICP above. We will filter out any generic single-word results.`,

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

Make them specific to the ICP above. We will automatically filter out any generic results.`,
    };

    const prompt = `Target Job Titles: ${(jobTitles || []).join(', ') || 'Unknown'}
Target Industries: ${(industries || []).join(', ') || 'Unknown'}
Target Company Types: ${(companyTypes || []).join(', ') || 'Unknown'}
Target Locations: ${(locations || []).join(', ') || 'Unknown'}

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
        messages: [
          { role: 'system', content: 'You are a B2B sales intelligence expert specializing in LinkedIn signal monitoring. Generate precise, actionable, NICHE keywords that will match professional buying-intent content — NOT personal or lifestyle posts. Every keyword must pass the test: "Would a person posting about their weekend or family EVER use this term?" If yes, do NOT include it.' },
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
                keywords: { type: 'array', items: { type: 'string' }, description: '5-7 keyword phrases' },
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
    let keywords = (result.keywords || []).slice(0, 7);
    
    // Post-filter: remove any blacklisted generic terms that slipped through
    const beforeCount = keywords.length;
    keywords = keywords.filter((kw: string) => !isBlacklisted(kw));
    if (keywords.length < beforeCount) {
      console.log(`[BLACKLIST] Filtered out ${beforeCount - keywords.length} generic keywords`);
    }
    
    // Take top 5 after filtering
    keywords = keywords.slice(0, 5);

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
