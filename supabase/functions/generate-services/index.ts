const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { companyName, industry, description, markdown } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

    const systemPrompt = `You are a B2B sales analyst. Extract the core services or products a company sells, based on its website content. Return short, scannable bullets (max 8 words each) — no marketing fluff, no leading verbs like "We offer". Phrase each as a noun phrase a buyer would recognize.`;

    const trimmedMarkdown = (markdown || '').slice(0, 6000);

    const userPrompt = `Company: ${companyName || 'Unknown'}
Industry: ${industry || 'Unknown'}
Description: ${description || 'No description'}

Website content (truncated):
${trimmedMarkdown}

Extract 3 to 5 services or products this company sells. Each item ≤ 8 words. No bullet markers, no numbering — just the phrase.`;

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
              name: 'extract_services',
              description: 'Return 3-5 services/products the company sells.',
              parameters: {
                type: 'object',
                properties: {
                  services: {
                    type: 'array',
                    items: { type: 'string' },
                    description: '3-5 short noun phrases, each ≤ 8 words',
                  },
                },
                required: ['services'],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: 'function', function: { name: 'extract_services' } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded, please try again shortly.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Add credits in Settings → Workspace → Usage.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const text = await response.text();
      console.error('AI gateway error:', response.status, text);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error('No tool call returned');

    const result = JSON.parse(toolCall.function.arguments);
    // Trim & cap to 5
    const services = Array.isArray(result.services)
      ? result.services.map((s: string) => String(s).trim()).filter(Boolean).slice(0, 5)
      : [];

    return new Response(JSON.stringify({ services }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('generate-services error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
