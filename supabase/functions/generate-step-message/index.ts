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
  industry: string;
};

// ── Personality context formatter ──
// Converts the cached personality_prediction JSON into a compact, prompt-ready block.
// Returns empty string if data is missing or malformed.
function formatPersonalityBlock(personality: any): string {
  if (!personality || typeof personality !== 'object') return '';
  const traits = Array.isArray(personality.primary_traits) ? personality.primary_traits.slice(0, 3).join(', ') : '';
  const approach = Array.isArray(personality.how_to_approach) ? personality.how_to_approach.slice(0, 3).map((s: string) => `• ${s}`).join('\n') : '';
  const avoid = Array.isArray(personality.what_to_avoid) ? personality.what_to_avoid.slice(0, 3).map((s: string) => `• ${s}`).join('\n') : '';
  const energizes = Array.isArray(personality.what_energizes) ? personality.what_energizes.slice(0, 2).map((s: string) => `• ${s}`).join('\n') : '';
  const style = typeof personality.communication_style === 'string' ? personality.communication_style.trim() : '';
  const hook = typeof personality.best_hook === 'string' ? personality.best_hook.trim() : '';

  if (!traits && !approach && !style) return '';

  return `
===== LEAD PERSONALITY (use to shape tone & angle — never reveal you analyzed them) =====
${personality.disc_label ? `Profile: ${personality.disc_label}` : ''}
${traits ? `Traits: ${traits}` : ''}
${style ? `Communication style: ${style}` : ''}
${approach ? `How to approach:\n${approach}` : ''}
${avoid ? `Avoid:\n${avoid}` : ''}
${energizes ? `What energizes them:\n${energizes}` : ''}
${hook ? `Suggested hook angle (paraphrase, do NOT copy verbatim): "${hook}"` : ''}

PERSONALITY RULES:
- Match the lead's natural style (analytical → data/specifics; driver → direct/results; supporter → warm/relational; initiator → energetic/big-picture).
- NEVER mention DISC, "personality", "I analyzed you", or any meta-language.
- Personality shapes HOW you write, not WHAT you say. The signal is still the backbone of the message.`;
}

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

  // No auto-append CTA — let the AI choose its own closing naturally

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
function classifySignal(signal: string): 'rich' | 'medium' | 'thin' {
  if (!signal || signal.trim().length === 0) return 'thin';
  // Rich: contains topic details like "about X" or "on X" or quoted words
  if (/\babout\b/i.test(signal) || /\bon\b.*\b(post|article|take|thread)\b/i.test(signal) || /"[^"]+"/.test(signal)) {
    return 'rich';
  }
  // Medium: mentions a company/person but no topic detail
  if (/liked|reacted|commented|engaged|followed/i.test(signal)) {
    return 'medium';
  }
  return 'thin';
}

function inferRoleCategory(title: string): string {
  const t = (title || '').toLowerCase();
  if (/\b(ceo|founder|co-founder|cofounder|owner|president|managing director|general manager)\b/.test(t))
    return 'executive';
  if (/\b(vp|vice president|director|head of|svp|evp)\b.*\b(sales|revenue|business dev|partnerships)\b/.test(t) || /\b(sales|revenue|business dev)\b.*\b(vp|vice president|director|head of)\b/.test(t))
    return 'sales_leader';
  if (/\b(cto|vp|vice president|director|head of)\b.*\b(engineer|tech|development|product)\b/.test(t) || /\b(engineer|tech|development|product)\b.*\b(cto|vp|vice president|director|head of)\b/.test(t))
    return 'tech_leader';
  if (/\b(cmo|vp|director|head of)\b.*\b(marketing|growth|demand|brand)\b/.test(t) || /\b(marketing|growth|demand|brand)\b.*\b(cmo|vp|director|head of)\b/.test(t))
    return 'marketing_leader';
  if (/\b(coo|operations|supply chain|logistics)\b/.test(t))
    return 'ops_leader';
  return 'general';
}

function getRoleFraming(roleCategory: string): string {
  switch (roleCategory) {
    case 'executive':
      return 'This person thinks about growth, scaling, and staying ahead of competitors. Frame your value around saving time, accelerating revenue, or gaining a competitive edge.';
    case 'sales_leader':
      return 'This person cares about pipeline, conversion rates, and quota attainment. Frame your value around filling pipeline with warmer leads, shortening sales cycles, or boosting reply rates.';
    case 'tech_leader':
      return 'This person cares about efficiency, reducing technical debt, and shipping faster. Frame your value around automation, better tooling, or reducing manual work.';
    case 'marketing_leader':
      return 'This person cares about lead quality, CAC, and ROI on campaigns. Frame your value around better targeting, higher-quality leads, or improved conversion from marketing spend.';
    case 'ops_leader':
      return 'This person cares about process efficiency, cost reduction, and smooth operations. Frame your value around streamlining workflows or eliminating bottlenecks.';
    default:
      return 'Infer what this person likely cares about based on their title and industry, and connect your value to that.';
  }
}

function buildOutreachPrompts(req: any, lead: LeadContext) {
  const isFirstMessage = req.stepNumber === 2;
  const isLastStep = req.stepNumber >= 4;
  const signalIsJobChange = isJobChangeSignal(lead.signal);
  const signalRichness = classifySignal(lead.signal);
  const roleCategory = inferRoleCategory(lead.title);
  const roleFraming = getRoleFraming(roleCategory);

  const toneLabel = req.messageTone === 'direct' ? 'Direct and brief.' :
    req.messageTone === 'conversational' ? 'Casual, like texting a friend.' : 'Warm but professional.';

  const systemPrompt = `You write LinkedIn DMs for a founder. Every message must feel like a busy person typed it on their phone.

===== THE LEAD'S SIGNAL (this is the backbone of your message) =====
Signal: "${lead.signal || 'none'}"
Signal richness: ${signalRichness}
Signal type: ${signalIsJobChange ? 'job_change' : 'engagement'}

===== LEAD INTELLIGENCE =====
Name: ${lead.firstName}${lead.lastName ? ' ' + lead.lastName : ''}
Title: ${lead.title || 'unknown'}
Company: ${lead.company || 'unknown'}
Industry: ${lead.industry || 'unknown'}
Role category: ${roleCategory}

BEFORE WRITING, think about what keeps this person up at night given their role at a ${lead.industry || ''} company. Your message must show you understand THEIR world, not just the signal.

${roleFraming}

===== SENDER =====
Company: ${req.companyName || 'our company'}
What we do: ${req.valueProposition || 'not specified'}
Pain points we solve: ${(req.painPoints || []).join(', ') || 'not specified'}
Industry: ${req.industry || 'not specified'}

===== STRUCTURE (exactly 3 sentences, 2 short paragraphs) =====
${signalRichness === 'rich' ? `S1: Reference their SPECIFIC engagement. Remind them what they liked/commented on, using the exact topic. Example: "you liked Pangea's post about tech staffing"` :
  signalRichness === 'medium' ? `S1: Reference the company/person they engaged with and what that company is known for. Example: "you liked Pangea's stuff, they're big on tech staffing"` :
  `S1: Reference something specific about their role or company. No fake scenarios.`}
S2: Connect the signal to a pain point SPECIFIC to their role and industry. A VP Sales at a logistics company has different problems than a CTO at a SaaS startup. Show you get it.
S3: End with one simple question (yes/no or "curious?").

===== GOOD vs BAD EXAMPLES =====
GOOD (rich signal, sales leader): "You liked Pangea's post about tech staffing. Running sales at a logistics company means your team probably wastes hours chasing cold lists instead of people already looking. Worth a quick look?"

GOOD (rich signal, CTO): "You liked that post about dev team scaling. When you're shipping fast at a fintech, the last thing you need is your team burning time on manual prospecting instead of building. We automate that part. Curious?"

GOOD (medium signal, CEO): "You liked Pangea's stuff, they're big on tech staffing. Growing a SaaS company means every hour your team spends cold-calling is an hour not closing warm leads. We flip that. Worth a look?"

GOOD (thin signal, marketing): "Running demand gen at a growing company means you're always balancing lead volume vs quality. We surface people already showing buying intent so your budget goes further. Sound useful?"

BAD: "Most founders I talk to get stuck when their MVP hits 1,000 users and starts lagging. We usually get custom AI tools live in about 30 days. Ever feel like your tech stack is holding back growth?"
Why bad: fabricated scenario, ignores signal, generic marketing language, ignores the lead's actual role and industry.

BAD: "I noticed you're doing great work at Cubo. I'd love to connect and explore synergies."
Why bad: "noticed", "great work" (vague), "explore synergies" (buzzword), no role awareness.

BAD: "You liked Pangea's post about tech staffing. We help companies find warm leads through intent signals. Curious?"
Why bad: S2 is generic, doesn't connect to what THIS person cares about given their role/industry.

===== RULES =====
- Under 50 words. 2 short paragraphs.
- Mirror the lead's OWN words from the signal when possible.
- S2 MUST reference a challenge specific to the lead's role + industry combo. Generic value props are banned.
- NEVER fabricate scenarios the lead didn't mention.
- NEVER use: leverage, utilize, synergy, pipeline, seamless, cutting-edge, game-changer, robust, ecosystem, bandwidth, scouting, grind, holistic, actionable, spearhead, deep-dive, circle back, delighted, thrilled.
- Use simple words: "find" not "scout", "help" not "empower", "fast" not "seamless".
- Use contractions (we're, you're, didn't).
- NEVER start with "Hi [Name], I noticed/saw/came across".
- No em-dashes, no semicolons.
- No placeholders like {{first_name}}.
${signalIsJobChange ? '- This is a job change signal. Reference the new role naturally.' : '- NOT a job change. Do NOT mention new role, promotion, or joining.'}
- Tone: ${toneLabel}
${req.language && req.language !== 'English (US)' ? `- Write in ${req.language}` : ''}
${req.customTraining ? `- Extra instructions: ${req.customTraining}` : ''}

===== SELF-CHECK =====
Before outputting, verify:
1. Does S1 reference the lead's actual signal or role?
2. Does S2 mention a challenge specific to their role (${lead.title || 'unknown'}) in their industry (${lead.industry || 'unknown'})? If S2 could apply to anyone, rewrite it.
3. If you wrote a generic scenario, rewrite.`;

  const prevMsgsArray: string[] = Array.isArray(req.previousMessages) ? req.previousMessages : [];
  const historyBlock = prevMsgsArray.length > 0
    ? `\nPrevious messages already sent (do not repeat):\n${prevMsgsArray.map((m: string, i: number) => `Step ${i + 2}: "${m}"`).join('\n')}`
    : '';

  let userPrompt = '';
  if (isFirstMessage) {
    userPrompt = `Write the first message (Step 2, after connection accepted).${historyBlock}

Follow the 3-sentence structure exactly. Return ONLY the message text.`;
  } else if (isLastStep) {
    userPrompt = `Write Step ${req.stepNumber} (FINAL follow-up).${historyBlock}

${req.previousStepMessage ? `Last message you sent:\n"${req.previousStepMessage}"` : ''}

CRITICAL: The lead has NOT replied to ANY previous messages. Do NOT assume engagement.

Last shot. 2 sentences max. Use loss aversion or curiosity gap. No guilt-tripping.

Return ONLY the message text.`;
  } else {
    userPrompt = `Write Step ${req.stepNumber} follow-up.${historyBlock}

${req.previousStepMessage ? `Last message you sent:\n"${req.previousStepMessage}"` : ''}

CRITICAL: The lead has NOT replied. Do NOT assume engagement or say things like "appreciate the positive vibes".

Deepen the same angle from your last message. Add one layer: a stat, competitor reference, or social proof. 2 sentences. Different question than before.

Return ONLY the message text.`;
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
      industry: (body.leadIndustry || '').trim(),
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
