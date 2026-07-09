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

// ── Banned patterns for Step 2 (case-insensitive). Any match triggers a rewrite.
const STEP2_BANNED_PATTERNS: RegExp[] = [
  /\bleverag(e|ing|ed)\b/i, /\butiliz(e|ing|ed)\b/i, /\bsynerg(y|ies)\b/i,
  /\bstreamlin(e|ing|ed)\b/i, /\becosystem\b/i, /\bdelighted\b/i, /\bthrilled\b/i,
  /\bempower(s|ing|ed)?\b/i, /\bspearhead(s|ing|ed)?\b/i,
  /\bbandwidth\b/i, /\brobust\b/i, /\bseamless(ly)?\b/i, /\bholistic\b/i,
  /\bactionable\b/i, /\bcutting[- ]edge\b/i, /\bgame[- ]changer\b/i,
  /hope this (email |message |)finds you well/i,
  /engaging with #/i, /as someone in the .{1,30} space/i,
  /\bquick (chat|call)\b/i, /\bhop on a call\b/i, /\bworth a chat\b/i,
  /\bbook (a time|a call|15|30)\b/i, /\bgrab 15 minutes\b/i,
  /just wanted to reach out/i, /reaching out because/i,
  /we help companies like yours/i,
];

function findBannedHits(text: string): string[] {
  const hits: string[] = [];
  for (const re of STEP2_BANNED_PATTERNS) {
    const m = text.match(re);
    if (m) hits.push(m[0]);
  }
  return hits;
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
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
${req.customTraining ? `- Additional context: ${req.customTraining}` : ''}
${formatPersonalityBlock(req.personality)}`;

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
  const stepNumber: number = req.stepNumber;
  const signalPostText: string = (req.signalPostText || lead.signal || '').toString().trim();
  const headline: string = (req.leadHeadline || lead.title || '').toString().trim();
  const productDescription: string = (req.valueProposition || req.productDescription || '').toString().trim();
  const painPoints: string[] = Array.isArray(req.painPoints) ? req.painPoints : [];
  const suggestedAngle: string =
    (req.suggestedAngle || '').toString().trim() ||
    (painPoints.length ? `connect to: ${painPoints.slice(0, 2).join('; ')}` : '');
  const langLine = req.language && req.language !== 'English (US)' ? `\nWrite in ${req.language}.` : '';
  const customLine = req.customTraining ? `\nExtra sender instructions: ${req.customTraining}` : '';
  const personalityBlock = formatPersonalityBlock(req.personality);

  const prevMsgsArray: string[] = Array.isArray(req.previousMessages) ? req.previousMessages : [];
  const message1Text: string =
    (req.previousStepMessage || prevMsgsArray[0] || '').toString().trim();

  // ── Message 1 (Step 2): cold opener ──
  if (stepNumber <= 2) {
    const hasRealPost = signalPostText.length > 40; // heuristic: real excerpts are >40 chars, summaries like "Posted about X" are shorter
    const postBlock = hasRealPost
      ? `POST_EXCERPT (their actual words — reference something concrete from this):\n"""\n${signalPostText.slice(0, 600)}\n"""`
      : `POST_SUMMARY (short signal, no full text available — reference the specific topic, not the hashtag):\n"${signalPostText || lead.signal || '(none)'}"`;

    const systemPrompt = `You are ${lead.firstName ? `messaging ${lead.firstName}` : 'writing a LinkedIn DM'} — founder to founder, peer to peer. This is the FIRST message after they accepted your connection request. It has to feel like a real human took two minutes to read their post and reply.

===== WHAT YOU KNOW =====
FIRST_NAME: ${lead.firstName || '(unknown)'}
HEADLINE: ${headline || '(unknown)'}
COMPANY: ${lead.company || '(unknown)'}
WHAT_WE_DO (background context — do NOT pitch this): ${productDescription || '(unspecified)'}
${painPoints.length ? `PAIN_POINTS they might have:\n${painPoints.slice(0, 3).map(p => `- ${p}`).join('\n')}` : ''}
${suggestedAngle ? `ANGLE_HINT (optional): ${suggestedAngle}` : ''}

${postBlock}

===== HOW TO WRITE IT (the whole game) =====
Length: 35 to 55 words. Never over 60. Two or three short sentences.
Reading level: 6th grade. Simple words a non-native English speaker gets on the first read.
Voice: peer to peer. Curious human, not a vendor. Use "I" and "you".

STRUCTURE (follow this shape, do not label the lines):
1) HOOK — quote or paraphrase ONE concrete detail from ${hasRealPost ? 'the POST_EXCERPT' : 'the POST_SUMMARY'}. Never the hashtag, never the industry, never "your post". Something a real reader would remember.
2) REACTION — one honest human reaction: quick agreement, a small counter-take, or "we hear this from other {peers}". Uses "I / we". Never "our platform / our solution".
3) QUESTION — ONE curious, open, low-stakes question they can answer in one sentence. Never a CTA, never "open to a chat", never "worth a quick call".

===== PSYCHOLOGY (use, never name) =====
- Specificity beats flattery. The hook must prove you actually read it.
- Curiosity gap. The question should imply you might know something useful without saying so.
- Reciprocity. Give a small observation before you ask anything.
- Status match. Talk to them as a peer, not a prospect.
- Low commitment. The question costs them 10 seconds to answer.

===== HARD BANS (do not use, ever) =====
Words: leverage, utilize, synergy, streamline, ecosystem, delighted, thrilled, empower, resonate, spearhead, bandwidth, robust, seamless, holistic, actionable, cutting-edge, game-changer, pipeline, landscape.
Phrases: "hope this finds you well", "saw your post", "came across your profile", "noticed you", "I noticed", "I saw", "I came across", "engaging with #", "as someone in the {industry} space", "would love to", "would you be open to", "quick chat", "quick call", "hop on a call", "worth a chat", "book a time", "grab 15 minutes", "just wanted to reach out", "reaching out because", "we help companies like yours".
Formatting: no emojis, no em-dashes (—), no semicolons, no bullet points, no line breaks, no greeting ("Hi ${lead.firstName}", "Hey there"), no signature, no product name, no statistic or percentage, no hashtag.

The message must end with a question mark.

===== EXAMPLES =====
GOOD (post-grounded, human, one question):
"your line about spending mornings chasing ACH reconciliations really stuck. two other founders told me the same thing last week and it always seems to be the compliance side that kills them. is that where most of your time actually goes, or is it more the manual matching?"

BAD (generic, pitchy, AI-slop):
"Hi Sarah, I noticed you've been engaging with #lending. We built a platform that leverages AI to streamline merchant payments and we're seeing 40% reduction in admin work. Would you be open to a quick call this week?"

Write ONLY the message body. No greeting. No signature. No labels. Start directly with the hook.${langLine}${customLine}
${personalityBlock}`;

    const userPrompt = `Write the first message now. Remember: 35-55 words, one concrete hook from ${hasRealPost ? 'the post excerpt' : 'the signal'}, one honest reaction, one curious question ending in "?". Return ONLY the message text.`;
    return { systemPrompt, userPrompt };
  }

  // ── Message 2 (Step 3): soft follow-up, max 10 words ──
  if (stepNumber === 3) {
    const systemPrompt = `You are writing a short follow up LinkedIn message.
${lead.firstName || 'They'} did not reply to the first message.

The first message was: ${message1Text || '(unknown)'}

Write a follow up that is maximum 10 words.
It should be a soft check-in that gives them an easy out.
Do not repeat the pitch. Do not add new information.
Do not ask for a call.

Examples of the right tone:
"still relevant or not the right time?"
"worth a quick chat or not your priority right now?"
"any of this relevant to what you're working on?"

Write only the message. Nothing else.${langLine}`;
    const userPrompt = `Write the follow-up now. Return ONLY the message text.`;
    return { systemPrompt, userPrompt };
  }

  // ── Message 3+ (Step 4+): final polite exit, max 8 words ──
  const systemPrompt = `Write a final closing message for a LinkedIn conversation
where ${lead.firstName || 'they'} has not replied to two previous messages.

Maximum 8 words.
Polite exit. No ask. No pitch. No guilt.

Examples:
"no worries — happy to leave it here."
"totally understand — feel free to reach out anytime."
"no pressure at all — good luck with everything."

Write only the message. Nothing else.${langLine}`;
  const userPrompt = `Write the final message now. Return ONLY the message text.`;
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
    const isStep2 = stepNumber === 2;

    async function callModel(sys: string, usr: string): Promise<string> {
      const r = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-3-flash-preview',
          messages: [
            { role: 'system', content: sys },
            { role: 'user', content: usr },
          ],
        }),
      });
      if (!r.ok) {
        const text = await r.text();
        console.error('AI gateway error:', r.status, text);
        if (r.status === 429) throw Object.assign(new Error('Rate limit exceeded.'), { status: 429 });
        if (r.status === 402) throw Object.assign(new Error('AI credits exhausted. Please add credits.'), { status: 402 });
        throw new Error(`AI gateway error: ${r.status}`);
      }
      const j = await r.json();
      const out = j.choices?.[0]?.message?.content?.trim();
      if (!out) throw new Error('No message generated');
      return out;
    }

    let rawMessage: string;
    try {
      rawMessage = await callModel(systemPrompt, userPrompt);

      // Step 2 quality guard: banned phrases, missing question, over 60 words → one rewrite.
      if (isStep2) {
        const initialClean = sanitizeMessage(rawMessage, lead, false);
        const bans = findBannedHits(initialClean);
        const wc = wordCount(initialClean);
        const missingQ = !/\?/.test(initialClean);
        if (bans.length || wc > 60 || missingQ) {
          const issues: string[] = [];
          if (bans.length) issues.push(`You used banned phrases: ${bans.map(b => `"${b}"`).join(', ')}. Rewrite without any of them.`);
          if (wc > 60) issues.push(`Too long (${wc} words). Rewrite in 35 to 55 words.`);
          if (missingQ) issues.push(`You must end with ONE curious question ending in "?".`);
          const rewritePrompt = `Your previous draft was:\n"""\n${rawMessage}\n"""\n\nProblems:\n- ${issues.join('\n- ')}\n\nRewrite the message following ALL the original rules. Return ONLY the new message.`;
          console.log('[step2] rewriting due to:', issues.join(' | '));
          try {
            rawMessage = await callModel(systemPrompt, rewritePrompt);
          } catch (e) {
            console.warn('[step2] rewrite failed, keeping first draft:', e);
          }
        }
      }
    } catch (e: any) {
      if (e?.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (e?.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add credits.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw e;
    }

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
