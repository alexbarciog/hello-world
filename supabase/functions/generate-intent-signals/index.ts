const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { companyName, industry, description, jobTitles, targetIndustries } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

    const systemPrompt = `You are a B2B sales intelligence expert. Given a company profile and ICP, generate highly relevant LinkedIn search keywords for detecting buying intent signals. Keywords should be specific industry terms, product categories, pain points, or business activities that potential buyers would engage with on LinkedIn.`;

    const userPrompt = `Company: ${companyName || 'Unknown'}
Industry: ${industry || 'Unknown'}
Description: ${description || 'No description'}
Target Job Titles: ${(jobTitles || []).join(', ') || 'Unknown'}
Target Industries: ${(targetIndustries || []).join(', ') || 'Unknown'}

Generate 5-7 highly specific LinkedIn tracking keywords for this business's intent signals. These should be terms that potential buyers would search for or engage with.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'suggest_keywords',
              description: 'Return relevant LinkedIn tracking keywords for intent detection.',
              parameters: {
                type: 'object',
                properties: {
                  keywords: {
                    type: 'array',
                    items: { type: 'string' },
                    description: '5-7 specific, short keyword phrases (2-4 words each) relevant to the business and its buyers',
                  },
                },
                required: ['keywords'],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: 'function', function: { name: 'suggest_keywords' } },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('AI gateway error:', response.status, text);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) throw new Error('No tool call returned from AI');

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('generate-intent-signals error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
