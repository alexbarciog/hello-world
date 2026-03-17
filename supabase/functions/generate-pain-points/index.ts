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

    const systemPrompt = `You are a B2B sales copywriting expert. Given a company profile and its ICP (Ideal Customer Profile), generate concise, specific pain points that the company's target customers experience. These pain points will be used to craft personalized outreach messages. Be specific and industry-relevant.`;

    const userPrompt = `Company: ${companyName || 'Unknown'}
Industry: ${industry || 'Unknown'}
Description: ${description || 'No description'}
Target Job Titles: ${(jobTitles || []).join(', ') || 'Unknown'}
Target Industries: ${(targetIndustries || []).join(', ') || 'Unknown'}

Generate exactly 3 specific pain points that this company's target audience experiences. Keep each under 15 words.`;

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
              name: 'suggest_pain_points',
              description: 'Return 3 specific pain points the target audience experiences.',
              parameters: {
                type: 'object',
                properties: {
                  painPoints: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Exactly 3 concise pain points, each under 15 words, no leading dash',
                  },
                },
                required: ['painPoints'],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: 'function', function: { name: 'suggest_pain_points' } },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('AI gateway error:', response.status, text);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error('No tool call returned');

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('generate-pain-points error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
