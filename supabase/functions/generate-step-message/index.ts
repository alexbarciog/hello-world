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
      stepNumber,
      previousStepMessage,
      previousMessages,
      companyName,
      valueProposition,
      painPoints,
      campaignGoal,
      messageTone,
      industry,
      language,
      customTraining,
    } = await req.json();

    if (!stepNumber || stepNumber < 2) {
      return new Response(JSON.stringify({ error: 'stepNumber must be >= 2' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

    const toneGuide: Record<string, string> = {
      professional: 'Use a professional but warm tone. Be polished and respectful, avoid slang.',
      conversational: 'Use a casual, friendly tone. Write like you\'re talking to a peer. Keep it light and approachable.',
      direct: 'Be bold and confident. Get to the point quickly. No fluff.',
    };

    const goalGuide: Record<string, string> = {
      conversations: 'The goal is to start a genuine conversation and build a relationship. Don\'t push for a meeting.',
      demos: 'The goal is to book a call or demo. Include a clear but non-pushy call-to-action.',
    };

    const isFirstMessage = stepNumber === 2;
    const isLastStep = stepNumber >= 4;

    const systemPrompt = `You are a world-class LinkedIn outreach copywriter. You write messages that feel genuinely human — no templates, no corporate jargon, no "I hope this message finds you well", no "I came across your profile".

Your messages MUST:
- Feel like they were written by a real person who did their homework
- Be concise (3-5 sentences max)
- NEVER feel salesy, automated, or AI-generated
- Sound natural and conversational like a real human networking on LinkedIn
- Use these placeholders naturally: {{first_name}}, {{company}}, {{title}}, {{signal}}
- {{signal}} represents the specific buying intent signal that triggered this lead (e.g. a LinkedIn post they wrote, a job change, funding round, etc.)
- ${toneGuide[messageTone] || toneGuide.professional}
- ${goalGuide[campaignGoal] || goalGuide.conversations}
${language && language !== 'English (US)' ? `- Write the message in ${language}` : ''}
${customTraining ? `\nADDITIONAL INSTRUCTIONS FROM USER:\n${customTraining}` : ''}

About the sender's business:
- Company: ${companyName || 'Our company'}
- Value Proposition: ${valueProposition || 'Not specified'}
- Pain Points we solve: ${(painPoints || []).join('; ') || 'Not specified'}
- Industry: ${industry || 'Not specified'}

CRITICAL RULES:
- DO NOT start with "Hi {{first_name}}" — vary your openings
- DO NOT use phrases like "I noticed", "I came across", "I hope this finds you well"
- DO NOT mention AI, automation, or that this is a sequence
- Each message must feel like a standalone human message, not a follow-up template
- Reference the lead's context ({{signal}}, {{company}}, {{title}}) naturally, not forcefully`;

    let userPrompt = '';
    
    // Build previous messages context
    const prevMsgsArray: string[] = Array.isArray(previousMessages) ? previousMessages : [];
    const historyBlock = prevMsgsArray.length > 0
      ? `\nPREVIOUS MESSAGES SENT IN THIS CAMPAIGN (do NOT repeat or paraphrase these):\n${prevMsgsArray.map((m: string, i: number) => `Step ${i + 2}: "${m}"`).join('\n')}\n\nBuild naturally on the conversation above.`
      : '';

    if (isFirstMessage) {
      userPrompt = `Write the FIRST message to send after a LinkedIn connection was accepted (Step 2).

This is the icebreaker. Reference {{signal}} — the buying intent signal that made us reach out to this lead. Make it feel personal, curious, and genuine. Ask a thoughtful question related to their signal or role.

${previousStepMessage ? `The previous step was a connection request (no message was sent with it).` : ''}

Return ONLY the message text, nothing else.`;
    } else if (isLastStep) {
      userPrompt = `Write a FINAL follow-up message (Step ${stepNumber}).${historyBlock}

${previousStepMessage ? `The most recent message sent was:\n"${previousStepMessage}"\n\nThis follow-up should feel like a natural continuation.` : ''}

This is a short, low-pressure nudge. Acknowledge they're busy. ${campaignGoal === 'demos' ? 'Offer a specific low-commitment CTA (quick 10-min call).' : 'Keep the door open for future conversation without being pushy.'}

Return ONLY the message text, nothing else.`;
    } else {
      userPrompt = `Write a follow-up message (Step ${stepNumber}).${historyBlock}

${previousStepMessage ? `The most recent message sent was:\n"${previousStepMessage}"\n\nThis follow-up should feel like a natural continuation of that conversation.` : ''}

Build on the relationship. Reference a pain point relevant to {{title}} at {{company}}. Show you understand their world and challenges. Don't repeat what was said before.

Return ONLY the message text, nothing else.`;
    }

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
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add credits.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiData = await response.json();
    const message = aiData.choices?.[0]?.message?.content?.trim();

    if (!message) throw new Error('No message generated');

    return new Response(JSON.stringify({ message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('generate-step-message error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
