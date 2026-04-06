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

function isGreeting(text: string): boolean {
  if (!text) return false;
  const cleaned = text.replace(/[^a-zA-Z\s]/g, '').trim().toLowerCase();
  const greetings = ['hi', 'hello', 'hey', 'hola', 'howdy', 'greetings', 'good morning', 'good afternoon', 'good evening', 'whats up', 'sup', 'yo'];
  return greetings.some(g => cleaned === g || cleaned.startsWith(g + ' '));
}

function sanitizeMessage(raw: string, lead: LeadContext, isConversational = false): string {
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

  const maxLen = isConversational ? 150 : 300;

  if (msg.length > maxLen) {
    const trimmed = msg.slice(0, maxLen);
    const lastPeriod = trimmed.lastIndexOf('.');
    const lastQuestion = trimmed.lastIndexOf('?');
    const lastEnd = Math.max(lastPeriod, lastQuestion);
    if (lastEnd > maxLen * 0.3) {
      msg = trimmed.slice(0, lastEnd + 1);
    } else {
      msg = trimmed;
    }
  }

  // Only auto-append CTA for cold outreach, never for conversational
  if (!isConversational && !/[?]\s*$/.test(msg)) {
    msg = `${msg}\n\nOpen to a quick chat?`;
  }

  return msg.trim();
}

// ── Conversational reply handler ──
async function handleConversationalReply(
  req: {
    conversationHistory?: string;
    leadMessage?: string;
    repliesCount?: number;
    maxReplies?: number;
    isFollowUp?: boolean;
    companyName?: string;
    valueProposition?: string;
    campaignGoal?: string;
    messageTone?: string;
    industry?: string;
    language?: string;
    customTraining?: string;
    firstName?: string;
    lastName?: string;
    leadCompany?: string;
    leadTitle?: string;
    buyingSignal?: string;
    meetingContext?: string;
  },
  LOVABLE_API_KEY: string,
): Promise<Response> {
  const lead: LeadContext = {
    firstName: (req.firstName || '').trim(),
    lastName: (req.lastName || '').trim(),
    company: (req.leadCompany || '').trim(),
    title: (req.leadTitle || '').trim(),
    signal: (req.buyingSignal || '').trim(),
  };

  const repliesCount = req.repliesCount || 0;
  const maxReplies = req.maxReplies || 5;
  const isFollowUp = req.isFollowUp || false;
  const leadMessage = (req.leadMessage || '').trim();
  const leadIsGreeting = isGreeting(leadMessage);
  const meetingContext = (req.meetingContext || '').trim();

  let replyPhase: string;
  if (meetingContext) {
    // Override phase when meeting is in play
    replyPhase = 'PHASE: Meeting coordination. Be warm, confirm logistics, keep it brief.';
  } else if (repliesCount <= 1) {
    replyPhase = 'PHASE: Relationship building. Do NOT mention your product, company, or what you do. Just be friendly and curious about them.';
  } else if (repliesCount <= 3) {
    replyPhase = 'PHASE: Light discovery. You may briefly mention what you do ONLY if the lead asks. Otherwise, keep asking about their work.';
  } else {
    replyPhase = 'PHASE: Soft close. You can gently suggest a quick call, but keep it casual. One short sentence.';
  }

  const systemPrompt = `You are replying in an ongoing LinkedIn DM conversation. This is NOT cold outreach.

HARD STOP RULES — if any of these apply, reply with EXACTLY "[STOP]" and nothing else:
- The lead said they're not interested, don't need/want the service, or declined in any polite way
- The lead is asking for something off-topic (job advice, CV review, career help, personal favors, mentoring)
- The lead is looking for a job or asking if you're hiring
- The lead says they already have a solution or are covered
- The lead asked you to stop messaging or expressed annoyance
- The lead's message has NOTHING to do with potentially buying your service
- The conversation has gone 3+ exchanges without any buying signal

CONVERSATION RULES:
- Mirror the lead's energy and length. If they wrote 3 words, you write 8-15 words.
- Maximum 25 words. Shorter is ALWAYS better.
- ONE paragraph only. Never two paragraphs.
- Never pitch, sell, or mention your product unless the lead explicitly asks what you do.
- No buzzwords (leverage, utilize, synergy, delighted, thrilled, excited).
- No em-dashes (—) or semicolons.
- No "I noticed", "I saw", "I came across" openers.
- NEVER ask for a CV, resume, or portfolio. NEVER offer career advice. You are a SELLER, not a recruiter or mentor.
- Sound like a real human texting a colleague, not a salesperson.
${leadIsGreeting ? '- The lead sent a GREETING. Just greet them back warmly and ask ONE simple personal question (how their week is going, etc). Nothing else.' : ''}
${isFollowUp && !meetingContext ? '- The lead has NOT responded in 24h+. Send a very short, casual nudge. Max 15 words. Do NOT repeat your previous message. Try a new angle or a simple question.' : ''}
${isFollowUp && meetingContext ? '- This is a scheduled follow-up related to a meeting. Gently confirm the meeting or ask if the time still works. Max 15 words.' : ''}
${meetingContext ? `- ${meetingContext}` : ''}
- ${replyPhase}
- Language: ${req.language || 'English'}
${req.customTraining ? `- Additional context: ${req.customTraining}` : ''}`;

  const userPrompt = `Lead: ${lead.firstName} ${lead.lastName || ''}, ${lead.title || ''} at ${lead.company || ''}
Your company: ${req.companyName || 'our company'}
Reply #${repliesCount + 1} of ${maxReplies}

Conversation so far:
${req.conversationHistory || '(no history)'}

${isFollowUp ? 'Write a short follow-up nudge (max 15 words):' : `Lead just said: "${leadMessage}"\n\nWrite your reply (max 25 words):`}`;

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
    console.error('AI gateway error (conversational):', response.status, text);
    if (response.status === 429) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded.' }), {
        status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (response.status === 402) {
      return new Response(JSON.stringify({ error: 'AI credits exhausted.' }), {
        status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    throw new Error(`AI gateway error: ${response.status}`);
  }

  const aiData = await response.json();
  const rawMessage = aiData.choices?.[0]?.message?.content?.trim();
  if (!rawMessage) throw new Error('No message generated');

  const message = sanitizeMessage(rawMessage, lead, true);

  return new Response(JSON.stringify({ message }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// ── Cold outreach handler ──
function buildOutreachPrompts(req: any, lead: LeadContext) {
  const toneGuide: Record<string, string> = {
    professional: 'Warm but professional. Keep it simple and human.',
    conversational: 'Casual and friendly. Write like a real peer.',
    direct: 'Straight to the point. No fluff.',
  };

  const goalGuide: Record<string, string> = {
    conversations: 'Goal: start a real conversation, not a hard pitch.',
    demos: 'Goal: get a quick call, but keep it low-pressure.',
  };

  const isFirstMessage = req.stepNumber === 2;
  const isLastStep = req.stepNumber >= 4;
  const signalIsJobChange = isJobChangeSignal(lead.signal);

  const systemPrompt = `You write one LinkedIn outreach message to a specific person. It must feel human and trigger a need.

LEAD CONTEXT (use real values, never placeholders):
- First name: ${lead.firstName || 'Not provided'}
- Last name: ${lead.lastName || 'Not provided'}
- Company: ${lead.company || 'Not provided'}
- Title: ${lead.title || 'Not provided'}
- Buying signal (what they posted/engaged with): ${lead.signal || 'Not provided'}
- Signal type: ${signalIsJobChange ? 'job_change' : 'non_job_change'}

SENDER CONTEXT:
- Company: ${req.companyName || 'Our company'}
- Value proposition: ${req.valueProposition || 'Not specified'}
- Pain points we solve: ${(req.painPoints || []).join(', ') || 'Not specified'}
- Industry: ${req.industry || 'Not specified'}

CRITICAL — SPECIFICITY RULES:
1. Read the buying signal carefully. Identify the EXACT problem or topic the lead cares about.
2. Name that problem in your opening line using the lead's own language from the signal. Example: if the signal says "looking for new lead generation channels", say "finding new lead gen channels" — not "the problems you solve".
3. Then connect it to ONE specific result we deliver. Pick the most relevant pain point from "Pain points we solve" above.
4. NEVER use vague phrases like "the problems you solve", "challenges you face", "what you're working on", "your needs", "people like you". These are lazy and generic. Always be concrete.
5. The lead should read the message and think "this person actually understands what I need."

STYLE RULES:
- Use simple everyday English. 2-4 short sentences. Under 55 words.
- Split into 2 short paragraphs.
- End with ONE clear question.
- NEVER output placeholders like {{first_name}}, {{company}}, {{title}}, {{signal}}.
- Use real values when available. If missing, write naturally without blanks.
- If signal type is non_job_change, DO NOT mention new role, promotion, or joining.
- NEVER use em-dash (—) or semicolons.
- Avoid AI-sounding phrases, buzzwords, and generic intros.
- ${toneGuide[req.messageTone] || toneGuide.professional}
- ${goalGuide[req.campaignGoal] || goalGuide.conversations}
${req.language && req.language !== 'English (US)' ? `- Write in ${req.language}` : ''}
${req.customTraining ? `\nEXTRA USER INSTRUCTIONS:\n${req.customTraining}` : ''}`;

  const prevMsgsArray: string[] = Array.isArray(req.previousMessages) ? req.previousMessages : [];
  const historyBlock = prevMsgsArray.length > 0
    ? `\nPrevious messages already sent (do not repeat):\n${prevMsgsArray.map((m: string, i: number) => `Step ${i + 2}: "${m}"`).join('\n')}`
    : '';

  let userPrompt = '';
  if (isFirstMessage) {
    userPrompt = `Write Step 2 (first message after connection acceptance).${historyBlock}\n\nIMPORTANT: Reference the lead's specific buying signal in concrete terms. Name the exact problem or topic they care about. Then connect it to one specific outcome we deliver. No vague language.\n\nReturn ONLY the message text.`;
  } else if (isLastStep) {
    userPrompt = `Write Step ${req.stepNumber} (final follow-up).${historyBlock}\n\n${req.previousStepMessage ? `Last message sent:\n"${req.previousStepMessage}"` : ''}\n\nShort nudge, low pressure, clear question. Still reference their specific need.\n\nReturn ONLY the message text.`;
  } else {
    userPrompt = `Write Step ${req.stepNumber} follow-up.${historyBlock}\n\n${req.previousStepMessage ? `Last message sent:\n"${req.previousStepMessage}"` : ''}\n\nBuild naturally, add one specific pain point relevant to their signal, and end with a clear question.\n\nReturn ONLY the message text.`;
  }

  return { systemPrompt, userPrompt };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const {
      stepNumber,
      isConversationalReply,
    } = body;

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

    // ── Conversational reply: completely separate path ──
    if (isConversationalReply) {
      return await handleConversationalReply(body, LOVABLE_API_KEY);
    }

    // ── Cold outreach path ──
    if (!stepNumber || stepNumber < 2) {
      return new Response(JSON.stringify({ error: 'stepNumber must be >= 2' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const lead: LeadContext = {
      firstName: (body.firstName || '').trim(),
      lastName: (body.lastName || '').trim(),
      company: (body.leadCompany || '').trim(),
      title: (body.leadTitle || '').trim(),
      signal: (body.buyingSignal || '').trim(),
    };

    const { systemPrompt, userPrompt } = buildOutreachPrompts(body, lead);

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
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add credits.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiData = await response.json();
    const rawMessage = aiData.choices?.[0]?.message?.content?.trim();
    if (!rawMessage) throw new Error('No message generated');

    const message = sanitizeMessage(rawMessage, lead, false);

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
