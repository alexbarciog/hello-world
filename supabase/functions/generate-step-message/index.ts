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

type LinkedInProfileCtx = {
  headline?: string;
  about?: string;
  location?: string;
  experience?: Array<{ title?: string; company?: string; start?: string; end?: string; description?: string }>;
  education?: Array<{ school?: string; degree?: string; field?: string; start?: string; end?: string }>;
};

function formatProfileBlock(p?: LinkedInProfileCtx | null): string {
  if (!p) return '';
  const parts: string[] = [];
  if (p.headline) parts.push(`Headline: ${String(p.headline).slice(0, 220)}`);
  if (p.location) parts.push(`Location: ${String(p.location).slice(0, 120)}`);
  if (p.about) parts.push(`About: ${String(p.about).replace(/\s+/g, ' ').slice(0, 600)}`);
  if (Array.isArray(p.experience) && p.experience.length) {
    const roles = p.experience.slice(0, 3).map((e, i) => {
      const range = [e.start, e.end || 'present'].filter(Boolean).join(' – ');
      const desc = e.description ? ` — ${String(e.description).replace(/\s+/g, ' ').slice(0, 180)}` : '';
      return `  ${i + 1}. ${e.title || '(role)'} @ ${e.company || '(company)'}${range ? ` (${range})` : ''}${desc}`;
    }).join('\n');
    parts.push(`Experience:\n${roles}`);
  }
  if (Array.isArray(p.education) && p.education.length) {
    const ed = p.education.slice(0, 2).map(e => `  • ${[e.degree, e.field].filter(Boolean).join(' ')} at ${e.school || '(school)'}`).join('\n');
    parts.push(`Education:\n${ed}`);
  }
  if (parts.length === 0) return '';
  return `\n===== LEAD LINKEDIN PROFILE (use concrete details, never paste verbatim) =====\n${parts.join('\n')}\n`;
}

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

function ensureGreeting(msg: string, firstName: string): string {
  let trimmed = msg.trimStart();
  // Strip the old "Thanks for connecting" greeting if the model still produces it.
  trimmed = trimmed.replace(/^(hey|hi|hello)\s+[^,!.?]*!?\s*thanks for connecting[.!?]?\s*/i, '').trimStart();

  const head = trimmed.slice(0, 20).toLowerCase();
  if (/^(hey|hi|hello)\b/.test(head)) return trimmed;

  const name = firstName || 'there';
  return `Hey ${name},\n${trimmed}`;
}

const SIGNAL_ANCHOR_RE = /\b(saw|caught|noticed|your post|you engaged|you shared|you commented|your take|your comment)\b/i;

function sanitizeMessage(raw: string, lead: LeadContext, isConversational = false, isStep2 = false): string {
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

  const maxLen = isConversational ? 150 : isStep2 ? 500 : 300;

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

  // Post author (present when the lead engaged with — liked/commented on — someone else's post)
  const signalPostAuthorFull: string = (req.signalPostAuthor || '').toString().trim();
  const signalPostAuthorFirst: string = signalPostAuthorFull.split(/\s+/)[0] || '';
  const signalLower = (lead.signal || '').toLowerCase();
  const isEngagementSignal = /liked|reacted|commented|engaged/.test(signalLower);
  const isLikeSignal = /liked|reacted/.test(signalLower) && !/commented/.test(signalLower);

  // ── Message 1 (Step 2): cold opener ──
  if (stepNumber <= 2) {
    const hasRealPost = signalPostText.length > 40; // heuristic: real excerpts are >40 chars, summaries like "Posted about X" are shorter
    const postBlock = hasRealPost
      ? `POST_EXCERPT (their actual words — reference something concrete from this):\n"""\n${signalPostText.slice(0, 600)}\n"""`
      : `POST_SUMMARY (short signal, no full text available — reference the specific topic, not the hashtag):\n"${signalPostText || lead.signal || '(none)'}"`;

    const authorBlock = (isEngagementSignal && signalPostAuthorFirst)
      ? `\nPOST_AUTHOR_FIRST_NAME: ${signalPostAuthorFirst}\nENGAGEMENT_TYPE: ${isLikeSignal ? 'liked' : 'commented on'} ${signalPostAuthorFirst}'s post\nIMPORTANT: The lead did NOT publish this post — they ${isLikeSignal ? 'liked' : 'commented on'} ${signalPostAuthorFirst}'s post. In the trigger sentence you MUST attribute the post to ${signalPostAuthorFirst} by first name and mention the topic (e.g. "saw you ${isLikeSignal ? 'liked' : 'commented on'} ${signalPostAuthorFirst}'s post on {topic}"). Never say "your post" or "your take" when the lead is only an engager — that breaks trust.`
      : '';

    const profileBlock = formatProfileBlock(req.leadProfile);

    const systemPrompt = `You are ${lead.firstName ? `messaging ${lead.firstName}` : 'writing a LinkedIn DM'} — founder to founder, peer to peer. This is the FIRST message right after they accepted your connection request. It has to feel like a real human wrote it in 30 seconds after glancing at their activity.

===== WHAT YOU KNOW =====
FIRST_NAME: ${lead.firstName || '(unknown)'}
HEADLINE: ${headline || '(unknown)'}
COMPANY: ${lead.company || '(unknown)'}
WHAT_WE_DO (background context — use to position the "different approach", but do NOT pitch features): ${productDescription || '(unspecified)'}
${painPoints.length ? `PAIN_POINTS they might have:\n${painPoints.slice(0, 3).map(p => `- ${p}`).join('\n')}` : ''}
${suggestedAngle ? `ANGLE_HINT (optional): ${suggestedAngle}` : ''}
${profileBlock}
${postBlock}${authorBlock}


===== HOW TO WRITE IT =====
Length: 35 to 60 words. Never over 70. Shorter is better — cut every word that does not earn its place.
Reading level: 6th grade. Simple words a non-native English speaker gets on the first read.
Voice: peer to peer. Warm, direct human — not a vendor. Use "I" and "you". Write like a real founder typing on their phone between meetings, not a polished sales rep.
Format: 2-4 short paragraphs. The greeting can stand alone or flow into the next sentence. Single line breaks between paragraphs are allowed.

===== SOUND HUMAN =====
- Use contractions everywhere: "you're", "we're", "don't", "it's", "that's".
- Vary sentence length. Mix a very short sentence (3-5 words) with a longer one. Fragments are ok.
- Occasional lowercase starts after a line break are ok ("sounds like...", "curious if..."). Not required.
- Use plain, spoken phrasing: "kinda", "usually", "most of the time", "honestly", "tbh" — sparingly, max one per message, only if it fits.
- No corporate rhythm. No parallel structures like "we do X, we do Y, we do Z".
- Slight imperfection > polish. A tiny casual aside beats a perfectly balanced sentence.
- Do NOT sound like a template. If two sentences in a row start the same way, rewrite one.

STRUCTURE (follow this shape exactly, do not label the lines):
1) GREETING — Start with exactly: "Hey ${lead.firstName || 'there'},". Comma, no exclamation, NO "Thanks for connecting".
2) PERSONALIZATION / TRIGGER + RELEVANCE — One sentence referencing the SPECIFIC action they took on LinkedIn. If POST_AUTHOR_FIRST_NAME is provided, they engaged with someone else's post — attribute the post to that author by first name and mention the topic (e.g. "saw you liked ${signalPostAuthorFirst || '{author}'}'s post on {topic}." / "caught your comment on ${signalPostAuthorFirst || '{author}'}'s post about {topic}."). If no author is provided, treat the post as the lead's own ("Noticed your post about {topic}." / "Caught your take on {topic}."). This must prove you actually saw their activity and never falsely claim they wrote a post they only liked.
3) ASSUMPTION OF PAIN — One sentence stating the real outcome they likely care about. Format: "Seems like you're looking for {better outcome}." / "Sounds like you're trying to {desired result}." Make it THEIR goal, not your pitch.
4) COMPETITOR ATTACK (RISK) — One sentence highlighting the danger or downside of the typical / competitor way to get that outcome. Keep it factual and specific. Creates fear of loss.
5) DIFFERENT APPROACH — One short clause or sentence positioning what you do as safer or different. "We use a completely different approach," or similar. Use WHAT_WE_DO context; do not name the product or list features.
6) LOW-FRICTION CTA — End with ONE easy "yes" question that drives curiosity and reply rate. "would you be interested to know more about it?" / "curious if you'd want to hear how we do it?" / "worth a quick look?" MUST end with "?". NEVER ask for a call, meeting, or "quick chat".

===== PSYCHOLOGY (use, never name) =====
- Specificity beats flattery. The trigger must prove you actually saw their engagement.
- Assumption of pain shows you understand what they want, not what you sell.
- Fear of loss (risk) makes the status quo feel expensive.
- Different approach creates curiosity without a full pitch.
- Low-friction CTA makes replying feel easy and safe.
- Status match. Peer, not prospect.

===== HARD BANS (do not use, ever) =====
Words: leverage, utilize, synergy, streamline, ecosystem, delighted, thrilled, empower, spearhead, bandwidth, robust, seamless, holistic, actionable, cutting-edge, game-changer, pipeline, landscape.
Phrases: "hope this finds you well", "engaging with #", "as someone in the {industry} space", "quick chat", "quick call", "hop on a call", "worth a chat", "book a time", "grab 15 minutes", "just wanted to reach out", "reaching out because", "we help companies like yours", "thanks for connecting".
Formatting: no emojis, no em-dashes (—), no semicolons, no bullet points, no signature, no product name, no statistic or percentage, no hashtag.

The message MUST end with a question mark.

===== EXAMPLES =====
GOOD (follows all 6 parts, multi-paragraph):
"Hey Aryan,

I saw your comment on the Gojiberry solution.

Seems like you're looking for better leads to book more meetings.

These tools put your own personal account at risk since LinkedIn's new rules. We use a completely different approach, would you be interested to know more about it?"

GOOD (shorter, single paragraph):
"Hey Mark, caught your take on ACH reconciliations eating up founder mornings. Sounds like you're trying to automate the manual matching without creating compliance risk. Most tools in this space create more audit headaches than they solve. We take a different route — curious if you'd want to see how?"

BAD (old format, no risk/different approach/CTA):
"Hey Sarah! Thanks for connecting. I noticed you've been engaging with #lending. We built a platform that leverages AI to streamline merchant payments. Would you be open to a quick call this week?"

Write ONLY the message body. No signature. No labels. Start with EXACTLY "Hey ${lead.firstName || 'there'},"${langLine}${customLine}
${personalityBlock}`;

    const userPrompt = `Write the first message now.

MANDATORY: Start with exactly "Hey ${lead.firstName || 'there'}," — comma, no exclamation, NO "Thanks for connecting".
Then follow the 6-part structure in order:
1) Personalization / trigger + relevance (reference their specific LinkedIn action)
2) Assumption of pain (state the outcome they want)
3) Competitor attack / risk (danger of the typical way)
4) Different approach (position what we do as safer/different)
5) Low-friction CTA (one easy "yes" question ending in "?")

Total: 35-60 words. Never over 70. Keep every sentence short and tight.
Return ONLY the message text, nothing else.`;
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

// ── Custom-mode prompt: step-level custom instructions take priority ──
function buildCustomPrompts(req: any, lead: LeadContext) {
  const stepCustomPrompt: string = String(req.stepCustomPrompt || '').trim();
  const campaignCustom: string = String(req.customTraining || '').trim();
  const productDescription: string = (req.valueProposition || req.productDescription || '').toString().trim();
  const companyName: string = (req.companyName || '').toString().trim();
  const langLine = req.language && req.language !== 'English (US)' ? `\n- Language: write the entire message in ${req.language}.` : '';
  const profileBlock = formatProfileBlock(req.leadProfile);
  const signalPostText: string = (req.signalPostText || lead.signal || '').toString().trim();
  const signalPostAuthorFull: string = (req.signalPostAuthor || '').toString().trim();
  const signalPostAuthorFirst: string = signalPostAuthorFull.split(/\s+/)[0] || '';
  const personalityBlock = formatPersonalityBlock(req.personality);

  const isFirstMessage = req.stepNumber === 2;

  const systemPrompt = `You are writing a LinkedIn outreach message. The sender has given you SPECIFIC INSTRUCTIONS for this step — those instructions are your PRIMARY directive. Follow them exactly.

===== LEAD =====
Name: ${lead.firstName} ${lead.lastName || ''}
Title: ${lead.title || '(unknown)'}
Company: ${lead.company || '(unknown)'}
Industry: ${lead.industry || '(unknown)'}
Buying signal: ${lead.signal || '(none)'}
${signalPostText ? `Signal post excerpt: "${signalPostText.slice(0, 600)}"` : ''}
${signalPostAuthorFirst ? `Post author (lead engaged with this person's post, they did NOT write it): ${signalPostAuthorFirst}` : ''}
${profileBlock}
===== CAMPAIGN CONTEXT =====
Our company: ${companyName || '(unspecified)'}
What we offer: ${productDescription || '(unspecified)'}
${campaignCustom ? `Campaign-wide notes: ${campaignCustom}` : ''}
${personalityBlock}
===== PRIMARY INSTRUCTIONS FROM THE SENDER (follow these first, above everything else) =====
${stepCustomPrompt}

===== UNIVERSAL SAFETY RAILS (never violate, even if custom instructions don't mention them) =====
- Start with exactly: "Hey ${lead.firstName || 'there'}," (comma, no exclamation, no "Thanks for connecting").
- Maximum 70 words. Shorter is fine if the instructions allow.
- End with a question mark (a real question the lead can answer).
- No emojis. No em-dashes (—). No semicolons. No bullet points. No signature. No hashtags. No product name. No made-up statistics.
- Never claim the lead wrote a post they only liked or commented on — if a post author is listed above, attribute the post to them.
- Banned words: leverage, utilize, synergy, streamline, ecosystem, delighted, thrilled, empower, spearhead, bandwidth, robust, seamless, holistic, actionable, cutting-edge, game-changer, pipeline, landscape.
- Banned phrases: "hope this finds you well", "just wanted to reach out", "reaching out because", "we help companies like yours", "thanks for connecting", "quick chat", "quick call", "hop on a call", "book a time".${langLine}

Return ONLY the message body. No labels, no preface, no signature.`;

  const userPrompt = isFirstMessage
    ? `Write the message now, following the sender's PRIMARY INSTRUCTIONS above. Start with "Hey ${lead.firstName || 'there'},". End with a question. Return ONLY the message.`
    : `Write the follow-up message now, following the sender's PRIMARY INSTRUCTIONS above. Return ONLY the message text.`;

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

    const hasStepCustomPrompt = typeof body.stepCustomPrompt === 'string' && body.stepCustomPrompt.trim().length > 0;
    const { systemPrompt, userPrompt } = hasStepCustomPrompt
      ? buildCustomPrompts(body, lead)
      : buildOutreachPrompts(body, lead);
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

      // Step 2 quality guard: greeting, banned phrases, missing question, over 100 words, missing signal ref → one rewrite.
      if (isStep2) {
        // Prepend greeting if missing BEFORE evaluating other guards.
        rawMessage = ensureGreeting(rawMessage, lead.firstName);
        const initialClean = sanitizeMessage(rawMessage, lead, false, true);
        const bans = findBannedHits(initialClean);
        const wc = wordCount(initialClean);
        const missingQ = !/\?/.test(initialClean);
        // Check signal anchor in the body AFTER the greeting sentence.
        const bodyAfterGreeting = initialClean.replace(/^hey\s+[^\n]*\n?/i, '');
        const missingSignal = hasStepCustomPrompt ? false : !SIGNAL_ANCHOR_RE.test(bodyAfterGreeting);
        if (bans.length || wc > 70 || missingQ || missingSignal) {
          const issues: string[] = [];
          if (bans.length) issues.push(`You used banned phrases: ${bans.map(b => `"${b}"`).join(', ')}. Rewrite without any of them.`);
          if (wc > 70) issues.push(`Too long (${wc} words). Rewrite in 35 to 60 words.`);
          if (missingQ) issues.push(`You must end with ONE low-friction CTA question ending in "?".`);
          if (missingSignal) issues.push(`You did not reference what they engaged with. Add a specific reference to the post (use "saw", "caught", "noticed", "your take", or "your comment").`);
          const rewritePrompt = `Your previous draft was:\n"""\n${rawMessage}\n"""\n\nProblems:\n- ${issues.join('\n- ')}\n\nRewrite the message following ALL the original rules. It MUST start with "Hey ${lead.firstName || 'there'}," and follow the 6-part structure: personalization/trigger → assumption of pain → competitor risk → different approach → low-friction CTA. Keep it tight: 35-60 words. Return ONLY the new message.`;
          console.log('[step2] rewriting due to:', issues.join(' | '));
          try {
            rawMessage = ensureGreeting(await callModel(systemPrompt, rewritePrompt), lead.firstName);
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

    const message = sanitizeMessage(rawMessage, lead, false, isStep2);


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
