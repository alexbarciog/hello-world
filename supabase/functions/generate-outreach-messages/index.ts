const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      companyName,
      valueProposition,
      painPoints,
      campaignGoal,
      messageTone,
      industry,
      language,
    } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

    const toneGuide: Record<string, string> = {
      professional: 'Use a professional but warm tone. Be polished and respectful, avoid slang.',
      conversational: 'Use a casual, friendly tone. Write like you\'re talking to a peer. Keep it light and approachable.',
      direct: 'Be bold and confident. Get to the point quickly. No fluff.',
    };

    const goalGuide: Record<string, string> = {
      conversations: 'The goal is to start a genuine conversation and build a relationship. Don\'t push for a meeting immediately.',
      demos: 'The goal is to book a call or demo. Include a clear but non-pushy call-to-action.',
    };

    const systemPrompt = `You are a world-class LinkedIn outreach copywriter. You write messages that feel genuinely human — no templates, no corporate jargon, no "I hope this message finds you well."

Your messages should:
- Feel like they were written by a real person who did their homework
- Be concise (2-4 sentences for connection requests, 3-5 for follow-ups)
- Reference specific details about the prospect naturally
- Never feel salesy or automated
- Use placeholders like {{first_name}}, {{company}}, {{title}}, {{signal}} that will be personalized per lead
- ${toneGuide[messageTone] || toneGuide.professional}
- ${goalGuide[campaignGoal] || goalGuide.conversations}
${language && language !== 'English (US)' ? `- Write all messages in ${language}` : ''}

The company sending these messages:
- Company: ${companyName || 'Our company'}
- Value Proposition: ${valueProposition || 'Not specified'}
- Pain Points addressed: ${(painPoints || []).join('; ') || 'Not specified'}
- Industry: ${industry || 'Not specified'}`;

    const userPrompt = `Generate a 4-step LinkedIn outreach sequence:

Step 1 - Connection Request (no message needed, leave empty — LinkedIn shows your profile as the message)
Step 2 - First Message (sent +1 day after connection accepted): An icebreaker that references {{signal}} — the reason this lead was found. Make it feel personal and curious, not pitchy.
Step 3 - Follow-up Message (sent +2 days): Build on the first message. Reference a pain point relevant to {{title}} at {{company}}. Show you understand their world.
Step 4 - Final Follow-up (sent +3 days): A short, low-pressure nudge. Acknowledge they're busy. ${campaignGoal === 'demos' ? 'Offer a specific CTA (quick call/demo).' : 'Keep the door open for future conversation.'}

Important: Each follow-up should feel like a natural continuation of the previous message, not a separate template.`;

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
              name: 'generate_outreach_sequence',
              description: 'Return a 4-step outreach sequence with messages and delays.',
              parameters: {
                type: 'object',
                properties: {
                  steps: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        type: {
                          type: 'string',
                          enum: ['invitation', 'message'],
                          description: 'Step type: invitation for connection request, message for follow-ups',
                        },
                        message: {
                          type: 'string',
                          description: 'The message content. Empty string for invitation step. Use {{first_name}}, {{company}}, {{title}}, {{signal}} as placeholders.',
                        },
                        delay_days: {
                          type: 'number',
                          description: 'Days to wait after previous step before sending this one',
                        },
                        ai_icebreaker: {
                          type: 'boolean',
                          description: 'Whether this step uses AI-personalized icebreaker per lead',
                        },
                      },
                      required: ['type', 'message', 'delay_days'],
                      additionalProperties: false,
                    },
                  },
                },
                required: ['steps'],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: 'function', function: { name: 'generate_outreach_sequence' } },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('AI gateway error:', response.status, text);

      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add credits in workspace settings.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error('No tool call returned');

    const result = JSON.parse(toolCall.function.arguments);

    // Ensure we always have exactly 4 steps with correct structure
    const steps = result.steps || [];
    const normalizedSteps = [
      {
        type: 'invitation',
        message: steps[0]?.message || '',
        delay_days: 0,
      },
      {
        type: 'message',
        message: steps[1]?.message || '',
        delay_days: steps[1]?.delay_days || 1,
        ai_icebreaker: true,
      },
      {
        type: 'message',
        message: steps[2]?.message || '',
        delay_days: steps[2]?.delay_days || 2,
      },
      {
        type: 'message',
        message: steps[3]?.message || '',
        delay_days: steps[3]?.delay_days || 3,
      },
    ];

    return new Response(JSON.stringify({ steps: normalizedSteps }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('generate-outreach-messages error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
