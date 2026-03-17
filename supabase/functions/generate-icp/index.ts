const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { companyName, industry, description, language } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are a B2B sales intelligence expert specializing in Ideal Customer Profile (ICP) creation.
Given a company's name, industry, and description, generate a detailed ICP with realistic, specific values.
Always respond using the suggest_icp tool with concrete, actionable data. Be specific — use real job titles, not generic ones.`;

    const userPrompt = `Company: ${companyName || 'Unknown'}
Industry: ${industry || 'Unknown'}
Description: ${description || 'No description provided'}
Language: ${language || 'English (US)'}

Generate a B2B Ideal Customer Profile for this company. Suggest who they should be targeting as leads.`;

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
              name: 'suggest_icp',
              description: 'Return a structured Ideal Customer Profile.',
              parameters: {
                type: 'object',
                properties: {
                  jobTitles: {
                    type: 'array',
                    items: { type: 'string' },
                    description: '3-5 specific target job titles (e.g., Head of Procurement)',
                  },
                  targetLocations: {
                    type: 'array',
                    items: { type: 'string' },
                    description: '1-3 target regions or countries (e.g., Europe, United States)',
                  },
                  targetIndustries: {
                    type: 'array',
                    items: { type: 'string' },
                    description: '2-4 target industries the company sells to',
                  },
                  companyTypes: {
                    type: 'array',
                    items: { type: 'string' },
                    description: '1-2 company types (e.g., Private Company, Enterprise)',
                  },
                  companySizes: {
                    type: 'array',
                    items: { type: 'string' },
                    description: '2-3 company size ranges from: 1-10, 11-50, 51-200, 201-500, 501-1000, 1001-5000, 5000+',
                  },
                },
                required: ['jobTitles', 'targetLocations', 'targetIndustries', 'companyTypes', 'companySizes'],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: 'function', function: { name: 'suggest_icp' } },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('AI gateway error:', response.status, text);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      throw new Error('No tool call returned from AI');
    }

    let icp: Record<string, string[]>;
    try {
      icp = JSON.parse(toolCall.function.arguments);
    } catch {
      throw new Error('Failed to parse ICP from AI response');
    }

    return new Response(JSON.stringify(icp), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('generate-icp error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
