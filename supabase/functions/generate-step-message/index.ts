const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

type LeadContext = {
  firstName: string;
  lastName: string;
  company: string;
  title: string;
  signal: string;
};

function isJobChangeSignal(signal: string): boolean {
  if (!signal) return false;
  return /(new role|joined|promot|started|hired|appointed|moved to|transitioned)/i.test(signal);
}

function sanitizeMessage(raw: string, lead: LeadContext): string {
  let msg = raw
    .replace(/[—–]/g, ', ')
    .replace(/;/g, '.')
    .replace(/\{\{first_name\}\}/gi, lead.firstName || '')
    .replace(/\{\{last_name\}\}/gi, lead.lastName || '')
    .replace(/\{\{company\}\}/gi, lead.company || '')
    .replace(/\{\{title\}\}/gi, lead.title || '')
    .replace(/\{\{signal\}\}/gi, lead.signal || '')
    .replace(/\{\{[^}]+\}\}/g, '');

  msg = msg
    .split('\n')
    .map((line) => line.trim())
    .filter((line, idx, arr) => line.length > 0 || (idx > 0 && arr[idx - 1].length > 0))
    .join('\n');

  if (msg.length > 300) {
    const trimmed = msg.slice(0, 300);
    const lastPeriod = trimmed.lastIndexOf('.');
    const lastQuestion = trimmed.lastIndexOf('?');
    const lastEnd = Math.max(lastPeriod, lastQuestion);
    if (lastEnd > 100) {
      msg = trimmed.slice(0, lastEnd + 1);
    } else {
      msg = trimmed;
    }
  }

  if (!/[?]\s*$/.test(msg)) {
    msg = `${msg}\n\nOpen to a quick chat?`;
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
      firstName,
      lastName,
      leadCompany,
      leadTitle,
      buyingSignal,
      isConversationalReply,
    } = await req.json();

    // Allow stepNumber=0 for conversational AI replies
    if (!isConversationalReply && (!stepNumber || stepNumber < 2)) {
      return new Response(JSON.stringify({ error: 'stepNumber must be >= 2' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

    const lead: LeadContext = {
      firstName: (firstName || '').trim(),
      lastName: (lastName || '').trim(),
      company: (leadCompany || '').trim(),
      title: (leadTitle || '').trim(),
      signal: (buyingSignal || '').trim(),
    };

    const toneGuide: Record<string, string> = {
      professional: 'Warm but professional. Keep it simple and human.',
      conversational: 'Casual and friendly. Write like a real peer.',
      direct: 'Straight to the point. No fluff.',
    };

    const goalGuide: Record<string, string> = {
      conversations: 'Goal: start a real conversation, not a hard pitch.',
      demos: 'Goal: get a quick call, but keep it low-pressure.',
    };

    const isFirstMessage = stepNumber === 2;
    const isLastStep = stepNumber >= 4;
    const signalIsJobChange = isJobChangeSignal(lead.signal);

    const systemPrompt = `You write one LinkedIn outreach message to a specific person. It must feel human.

LEAD CONTEXT (use real values, never placeholders):
- First name: ${lead.firstName || 'Not provided'}
- Last name: ${lead.lastName || 'Not provided'}
- Company: ${lead.company || 'Not provided'}
- Title: ${lead.title || 'Not provided'}
- Buying signal: ${lead.signal || 'Not provided'}
- Signal type: ${signalIsJobChange ? 'job_change' : 'non_job_change'}

SENDER CONTEXT:
- Company: ${companyName || 'Our company'}
- Value proposition: ${valueProposition || 'Not specified'}
- Pain points solved: ${(painPoints || []).join(', ') || 'Not specified'}
- Industry: ${industry || 'Not specified'}

RULES (MUST FOLLOW):
- Use simple everyday English. 2-4 short sentences. Under 55 words.
- Split into 2 short paragraphs.
- End with ONE clear question.
- NEVER output placeholders like {{first_name}}, {{company}}, {{title}}, {{signal}}.
- Use real values when available. If missing, write naturally without blanks.
- Anchor message in buying signal first.
- If signal type is non_job_change, DO NOT mention new role, promotion, or joining.
- NEVER use em-dash (—) or semicolons.
- Avoid AI-sounding phrases, buzzwords, and generic intros.
- ${toneGuide[messageTone] || toneGuide.professional}
- ${goalGuide[campaignGoal] || goalGuide.conversations}
${language && language !== 'English (US)' ? `- Write in ${language}` : ''}
${customTraining ? `\nEXTRA USER INSTRUCTIONS:\n${customTraining}` : ''}`;

    const prevMsgsArray: string[] = Array.isArray(previousMessages) ? previousMessages : [];
    const historyBlock = prevMsgsArray.length > 0
      ? `\nPrevious messages already sent (do not repeat):\n${prevMsgsArray.map((m: string, i: number) => `Step ${i + 2}: "${m}"`).join('\n')}`
      : '';

    let userPrompt = '';

    if (isFirstMessage) {
      userPrompt = `Write Step 2 (first message after connection acceptance).${historyBlock}

Make it personal to this lead's buying signal and role. Keep it concise and natural.

Return ONLY the message text.`;
    } else if (isLastStep) {
      userPrompt = `Write Step ${stepNumber} (final follow-up).${historyBlock}

${previousStepMessage ? `Last message sent:\n"${previousStepMessage}"` : ''}

Short nudge, low pressure, clear question.

Return ONLY the message text.`;
    } else {
      userPrompt = `Write Step ${stepNumber} follow-up.${historyBlock}

${previousStepMessage ? `Last message sent:\n"${previousStepMessage}"` : ''}

Build naturally, add one relevant pain point, and end with a clear question.

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

    const message = sanitizeMessage(rawMessage, lead);

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
