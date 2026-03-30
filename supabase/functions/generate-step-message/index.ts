const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function sanitizeMessage(raw: string): string {
  // Replace em-dashes with comma-space
  let msg = raw.replace(/—/g, ', ').replace(/–/g, ', ');
  // Replace semicolons with periods
  msg = msg.replace(/;/g, '.');
  // Trim to 300 chars at last complete sentence
  if (msg.length > 300) {
    const trimmed = msg.slice(0, 300);
    const lastPeriod = trimmed.lastIndexOf('.');
    const lastQuestion = trimmed.lastIndexOf('?');
    const lastEnd = Math.max(lastPeriod, lastQuestion);
    if (lastEnd > 100) {
      msg = trimmed.slice(0, lastEnd + 1);
    }
  }
  return msg.trim();
}

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
      professional: 'Warm but professional. No slang, but keep it simple and human.',
      conversational: 'Casual and friendly. Write like texting a work friend. Short and light.',
      direct: 'Bold and to the point. No fluff. Say it in as few words as possible.',
    };

    const goalGuide: Record<string, string> = {
      conversations: 'Goal: start a real conversation. Do NOT push for a meeting. Just be curious.',
      demos: 'Goal: book a quick call. Include a soft, low-pressure ask at the end.',
    };

    const isFirstMessage = stepNumber === 2;
    const isLastStep = stepNumber >= 4;

    const systemPrompt = `You are a human sales rep who writes short LinkedIn messages. You are NOT an AI. You write like a real person networking on LinkedIn.

WRITING RULES (MUST FOLLOW ALL):
- Use simple, everyday English. 6th-grade reading level. Short words only.
- BANNED WORDS: leverage, utilize, initiate, delighted, thrilled, fascinating, intriguing, remarkable, noteworthy, streamline, optimize, synergy, cutting-edge, game-changer, excited, opportunity, innovative, transformative, aligned, resonate
- BANNED PUNCTUATION: NEVER use em-dashes (—), en-dashes (–), or semicolons (;). Use periods and commas only.
- NEVER start with "I hope this message finds you well", "I noticed", "I came across", "I was impressed"
- DO NOT start with "Hi {{first_name}}" every time. Vary your openings.
- 2-4 sentences MAXIMUM. Under 50 words total. If you can say it shorter, do it.
- Split into 2 short paragraphs with a blank line between them.
- Every message MUST end with ONE clear, simple question. Easy to answer yes/no or with a short reply.
- Sound like a real person, not a template. No corporate jargon. No marketing speak.
- Use these placeholders naturally: {{first_name}}, {{company}}, {{title}}, {{signal}}
- {{signal}} = the specific buying intent signal (LinkedIn post, job change, funding, etc.)
- ${toneGuide[messageTone] || toneGuide.professional}
- ${goalGuide[campaignGoal] || goalGuide.conversations}
${language && language !== 'English (US)' ? `- Write the message in ${language}` : ''}
${customTraining ? `\nADDITIONAL INSTRUCTIONS FROM USER:\n${customTraining}` : ''}

About the sender:
- Company: ${companyName || 'Our company'}
- What we do: ${valueProposition || 'Not specified'}
- Problems we solve: ${(painPoints || []).join(', ') || 'Not specified'}
- Industry: ${industry || 'Not specified'}

STYLE EXAMPLES:

GOOD:
"{{first_name}}, saw your post about scaling the sales team at {{company}}. We've been helping similar teams cut ramp time in half.

Worth a quick chat?"

GOOD:
"Hey {{first_name}}, noticed {{company}} just raised a round. Congrats! We work with a few teams at that stage on outbound.

Dealing with any hiring challenges right now?"

BAD (too long, too fancy, uses em-dash):
"I was truly fascinated to come across your remarkable insights regarding the intricacies of scaling — it's clear that you possess a deep understanding of the challenges that organizations face when navigating growth trajectories in today's competitive landscape."

BAD (no question, wall of text):
"Hi {{first_name}}, I wanted to reach out because I noticed your company is growing rapidly and I think our solution could really help streamline your operations and optimize your workflow to achieve better results across the board."`;

    let userPrompt = '';
    
    const prevMsgsArray: string[] = Array.isArray(previousMessages) ? previousMessages : [];
    const historyBlock = prevMsgsArray.length > 0
      ? `\nPREVIOUS MESSAGES (do NOT repeat these):\n${prevMsgsArray.map((m: string, i: number) => `Step ${i + 2}: "${m}"`).join('\n')}\n\nBuild on the conversation naturally.`
      : '';

    if (isFirstMessage) {
      userPrompt = `Write the FIRST message after a LinkedIn connection was accepted (Step 2).

This is the icebreaker. Reference {{signal}}. Be curious. Ask one question about their work or signal.

Keep it under 40 words. Two short paragraphs.

Return ONLY the message text.`;
    } else if (isLastStep) {
      userPrompt = `Write a FINAL follow-up (Step ${stepNumber}).${historyBlock}

${previousStepMessage ? `Last message sent:\n"${previousStepMessage}"` : ''}

Short, low-pressure nudge. Acknowledge they're busy. ${campaignGoal === 'demos' ? 'Offer a 10-min call.' : 'Keep the door open.'} Under 35 words.

Return ONLY the message text.`;
    } else {
      userPrompt = `Write a follow-up (Step ${stepNumber}).${historyBlock}

${previousStepMessage ? `Last message sent:\n"${previousStepMessage}"` : ''}

Reference a pain point relevant to {{title}} at {{company}}. Don't repeat previous messages. Under 45 words.

Return ONLY the message text.`;
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
    const rawMessage = aiData.choices?.[0]?.message?.content?.trim();

    if (!rawMessage) throw new Error('No message generated');

    const message = sanitizeMessage(rawMessage);

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
