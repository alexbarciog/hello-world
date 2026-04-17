const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');

// ─────────────────────────────────────────────────────────────────────────────
// STAGE 1 — Website scraping
// ─────────────────────────────────────────────────────────────────────────────
async function scrapeWebsite(websiteUrl: string): Promise<string> {
  let formattedUrl = websiteUrl.trim();
  if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
    formattedUrl = `https://${formattedUrl}`;
  }

  // Prefer Firecrawl when available (handles JS-rendered pages)
  if (FIRECRAWL_API_KEY) {
    try {
      const fc = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: formattedUrl,
          formats: ['markdown'],
          onlyMainContent: true,
        }),
      });
      if (fc.ok) {
        const json = await fc.json();
        const md = json?.data?.markdown || json?.markdown || '';
        if (md && md.length > 100) {
          return md.substring(0, 4000);
        }
      } else {
        console.warn('[KW_GEN] Firecrawl failed, falling back to fetch:', fc.status);
      }
    } catch (e) {
      console.warn('[KW_GEN] Firecrawl error, falling back to fetch:', e);
    }
  }

  // Fallback: raw fetch + HTML strip
  const res = await fetch(formattedUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Intentsly/1.0)' },
  });
  const html = await res.text();
  const cleaned = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned.substring(0, 3000);
}

// ─────────────────────────────────────────────────────────────────────────────
// AI helpers (tool-calling for reliable structured output)
// ─────────────────────────────────────────────────────────────────────────────
async function callAITool(args: {
  systemPrompt?: string;
  userPrompt: string;
  toolName: string;
  toolDescription: string;
  parameters: any;
  temperature?: number;
}): Promise<any> {
  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-3-flash-preview',
      temperature: args.temperature ?? 0.2,
      messages: [
        ...(args.systemPrompt ? [{ role: 'system', content: args.systemPrompt }] : []),
        { role: 'user', content: args.userPrompt },
      ],
      tools: [{
        type: 'function',
        function: {
          name: args.toolName,
          description: args.toolDescription,
          parameters: args.parameters,
        },
      }],
      tool_choice: { type: 'function', function: { name: args.toolName } },
    }),
  });

  if (!response.ok) {
    const status = response.status;
    const text = await response.text();
    console.error('[KW_GEN] AI gateway error:', status, text);
    if (status === 429) throw new Error('RATE_LIMITED');
    if (status === 402) throw new Error('CREDITS_REQUIRED');
    throw new Error(`AI gateway error: ${status}`);
  }

  const data = await response.json();
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall) throw new Error('No tool call returned from AI');
  return JSON.parse(toolCall.function.arguments);
}

// ─────────────────────────────────────────────────────────────────────────────
// STAGE 2 — Business analysis
// ─────────────────────────────────────────────────────────────────────────────
interface BusinessAnalysis {
  what_they_sell: string;
  primary_buyer: string;
  core_problem_solved: string;
  before_state: string;
  after_state: string;
  competitors_or_alternatives: string[];
  buyer_vocabulary: string[];
  category: string;
}

async function analyseBusinessFromWebsite(
  websiteContent: string,
  websiteUrl: string,
  fallbackHints: { companyName?: string; description?: string; painPoints?: string | string[] },
): Promise<BusinessAnalysis> {
  const hintsBlock = [
    fallbackHints.companyName && `Company name (user-provided): ${fallbackHints.companyName}`,
    fallbackHints.description && `Description (user-provided): ${fallbackHints.description}`,
    fallbackHints.painPoints && `Pain points (user-provided): ${Array.isArray(fallbackHints.painPoints) ? fallbackHints.painPoints.join(', ') : fallbackHints.painPoints}`,
  ].filter(Boolean).join('\n');

  const userPrompt = `Analyse this company's website to deeply understand their business.

WEBSITE URL: ${websiteUrl}

${hintsBlock ? `USER-PROVIDED CONTEXT:\n${hintsBlock}\n` : ''}
WEBSITE CONTENT:
${websiteContent}

Be specific and concrete. No vague generalisations. Extract who really buys this and what pain they had RIGHT BEFORE deciding to buy.`;

  return await callAITool({
    userPrompt,
    temperature: 0.1,
    toolName: 'return_business_analysis',
    toolDescription: 'Return a structured analysis of the business',
    parameters: {
      type: 'object',
      properties: {
        what_they_sell: { type: 'string', description: 'One sentence describing the exact product or service' },
        primary_buyer: { type: 'string', description: 'Who is the main person who buys this — their role and company type' },
        core_problem_solved: { type: 'string', description: 'The specific pain this eliminates — in plain English' },
        before_state: { type: 'string', description: 'What does the buyer\'s life look like before they buy this? what are they struggling with?' },
        after_state: { type: 'string', description: 'What does their life look like after buying this?' },
        competitors_or_alternatives: { type: 'array', items: { type: 'string' }, description: 'List of tools or methods buyers use before finding this' },
        buyer_vocabulary: { type: 'array', items: { type: 'string' }, description: '5-8 words or phrases the buyer themselves would use to describe their problem — not marketing language' },
        category: { type: 'string', description: 'What type of product is this: SaaS tool / agency / consulting / platform / marketplace / other' },
      },
      required: ['what_they_sell', 'primary_buyer', 'core_problem_solved', 'before_state', 'after_state', 'competitors_or_alternatives', 'buyer_vocabulary', 'category'],
      additionalProperties: false,
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// STAGE 3 — Keyword generation from analysis
// ─────────────────────────────────────────────────────────────────────────────
interface GeneratedKeywords {
  frustration_current_tool: string[];
  seeking_alternatives: string[];
  describing_pain: string[];
  asking_network: string[];
  budget_decision: string[];
  competitor_frustration: string[];
  problem_confession: string[];
}

async function generateKeywordsFromAnalysis(analysis: BusinessAnalysis): Promise<GeneratedKeywords> {
  const systemPrompt = `You are a signal monitoring specialist for a B2B lead generation platform.

Your job is to generate LinkedIn keyword phrases that ONLY a frustrated buyer would write — never a vendor, never a job poster, never a thought leader.

GOLDEN RULE: Before including any phrase, ask yourself:
"Would a company that SELLS this service ever post this phrase to attract clients?"
If YES → reject it immediately.
If NO → it is a genuine buyer signal.

Examples of what PASSES the test:
- "our reply rates have dropped to nothing" — a vendor never admits this
- "anyone switched from Apollo" — a vendor never asks competitors for help
- "client got hacked last week" — a vendor never confesses client failures

Examples of what FAILS the test:
- "lead generation tips" — vendors post this constantly
- "best practices for outreach" — this is vendor content
- "improve your pipeline" — every sales tool uses this phrase

The phrases you generate will be searched on LinkedIn in real time.
When someone posts one of these phrases it triggers an outreach.
Getting it wrong wastes real money. Getting it right books real meetings.

ALL phrases MUST be lowercase, conversational, and STRICTLY 2-3 words long. Never more than 3 words. Never fewer than 2 words.`;

  const userPrompt = `Generate buying intent keywords for this business:

WHAT THEY SELL: ${analysis.what_they_sell}
PRIMARY BUYER: ${analysis.primary_buyer}
CORE PROBLEM SOLVED: ${analysis.core_problem_solved}
BEFORE STATE (buyer's pain): ${analysis.before_state}
ALTERNATIVES BUYERS USE NOW: ${analysis.competitors_or_alternatives.join(', ') || 'unknown'}
BUYER'S OWN VOCABULARY: ${analysis.buyer_vocabulary.join(', ') || 'unknown'}

Generate keywords across 7 intent categories. Each phrase MUST be 2-3 words ONLY (never 1 word, never 4+ words), lowercase, conversational. Examples of correct length: "reply rates dropped", "tired of apollo", "anyone tried lemlist", "switching from outreach". Examples of WRONG length (do NOT generate): "our outreach reply rates have dropped to nothing" (too long), "outreach" (too short).

CATEGORIES:
- frustration_current_tool (5): buyer is unhappy with what they use now. Reference competitors_or_alternatives.
- seeking_alternatives (5): "anyone switched from [tool]" / "alternatives to [tool]"
- describing_pain (5): buyer describes problem in plain English using before_state and buyer_vocabulary
- asking_network (5): "anyone recommend" / "what are you using for"
- budget_decision (4): "evaluating" / "pricing for" / "we approved budget for"
- competitor_frustration (3): buyer mentions competitor by name negatively
- problem_confession (3): buyer publicly admits a failure ("we got breached", "client churned because")`;

  return await callAITool({
    systemPrompt,
    userPrompt,
    temperature: 0.3,
    toolName: 'return_keyword_categories',
    toolDescription: 'Return buying-intent keyword phrases organised by intent category',
    parameters: {
      type: 'object',
      properties: {
        frustration_current_tool: { type: 'array', items: { type: 'string' }, description: '5 phrases — buyer unhappy with current tool' },
        seeking_alternatives: { type: 'array', items: { type: 'string' }, description: '5 phrases — actively seeking alternatives' },
        describing_pain: { type: 'array', items: { type: 'string' }, description: '5 phrases — describing the pain in plain English' },
        asking_network: { type: 'array', items: { type: 'string' }, description: '5 phrases — asking network for recommendations' },
        budget_decision: { type: 'array', items: { type: 'string' }, description: '4 phrases — signals they are ready to spend' },
        competitor_frustration: { type: 'array', items: { type: 'string' }, description: '3 phrases — mentions a competitor negatively' },
        problem_confession: { type: 'array', items: { type: 'string' }, description: '3 phrases — public confession of failure' },
      },
      required: ['frustration_current_tool', 'seeking_alternatives', 'describing_pain', 'asking_network', 'budget_decision', 'competitor_frustration', 'problem_confession'],
      additionalProperties: false,
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// STAGE 4 — Validation and scoring
// ─────────────────────────────────────────────────────────────────────────────
interface KeywordScore {
  keyword: string;
  score: number;
  passes: boolean;
  rejectionReason?: string;
  category?: string;
}

function validateAndScoreKeywords(
  keywords: { phrase: string; category: string }[],
  analysis: BusinessAnalysis,
): KeywordScore[] {
  const VENDOR_PHRASES = [
    'tips', 'best practices', 'guide', 'how to', 'strategy',
    'we help', 'our service', 'our agency', 'book a call',
    'free consultation', 'check out', 'learn more', 'case study',
    'thought leadership', 'growth hacking', 'scale your',
    'boost your', 'improve your', 'optimize your', 'optimise your',
  ];

  const BUYER_SIGNALS: { pattern: RegExp; weight: number }[] = [
    { pattern: /anyone (switched|tried|recommend)/i, weight: 20 },
    { pattern: /alternatives? to/i, weight: 20 },
    { pattern: /tired of|fed up with/i, weight: 25 },
    { pattern: /not working|stopped working/i, weight: 20 },
    { pattern: /\b(our|we|my)\b.*(dropped|tanked|broken|failing|crashed|died)/i, weight: 30 },
    { pattern: /looking for.*(better|alternative|replacement)/i, weight: 20 },
    { pattern: /switched from|switching from/i, weight: 25 },
    { pattern: /cant find|can't find|struggle to find/i, weight: 20 },
    { pattern: /any recommendations/i, weight: 15 },
    { pattern: /evaluating|considering switching/i, weight: 18 },
    { pattern: /need (a )?(better|new)/i, weight: 15 },
  ];

  return keywords.map(({ phrase, category }) => {
    const lower = phrase.toLowerCase();

    // Hard rejection: vendor phrases
    const vendorHit = VENDOR_PHRASES.find(p => lower.includes(p));
    if (vendorHit) {
      return { keyword: phrase, score: 0, passes: false, category, rejectionReason: `Contains vendor phrase: "${vendorHit}"` };
    }

    const wordCount = phrase.trim().split(/\s+/).length;
    if (wordCount < 2) {
      return { keyword: phrase, score: 0, passes: false, category, rejectionReason: 'Too short — single words match too broadly' };
    }
    if (wordCount > 3) {
      return { keyword: phrase, score: 0, passes: false, category, rejectionReason: 'Too long — must be 2-3 words max' };
    }

    let score = 50;
    for (const signal of BUYER_SIGNALS) {
      if (signal.pattern.test(phrase)) score += signal.weight;
    }

    const referencesCompetitor = analysis.competitors_or_alternatives.some(c => c && lower.includes(c.toLowerCase()));
    if (referencesCompetitor) score += 15;

    const usesBuyerVocab = analysis.buyer_vocabulary.some(w => w && lower.includes(w.toLowerCase()));
    if (usesBuyerVocab) score += 10;

    score = Math.min(score, 100);
    return { keyword: phrase, score, passes: score >= 50, category };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// LEGACY hashtag generator (kept for hashtag_engagement signal type)
// ─────────────────────────────────────────────────────────────────────────────
async function generateHashtags(args: {
  companyName?: string;
  description?: string;
  jobTitles?: string[];
  industries?: string[];
}): Promise<string[]> {
  const businessContext = [
    args.companyName && `Company: ${args.companyName}`,
    args.description && `What they do: ${args.description}`,
    args.industries?.length && `Industries: ${args.industries.join(', ')}`,
    args.jobTitles?.length && `Target buyers: ${args.jobTitles.join(', ')}`,
  ].filter(Boolean).join('\n');

  const result = await callAITool({
    systemPrompt: `You generate niche, professional-only LinkedIn hashtags. NEVER return generic hashtags like Sales, Marketing, Leadership, Motivation, Success, Growth, Entrepreneur, Business, Innovation. Return CamelCase compound hashtags WITHOUT the # symbol.`,
    userPrompt: `Generate exactly 7 niche LinkedIn hashtags for this business:\n\n${businessContext}\n\nThey must be specific enough that personal/lifestyle posts would NEVER use them. Examples: SalesAutomation, ABMStrategy, RevOps, DemandGen, ColdOutreach.`,
    temperature: 0.3,
    toolName: 'return_hashtags',
    toolDescription: 'Return niche LinkedIn hashtags',
    parameters: {
      type: 'object',
      properties: {
        hashtags: { type: 'array', items: { type: 'string' } },
      },
      required: ['hashtags'],
      additionalProperties: false,
    },
  });

  return (result.hashtags || []).slice(0, 7);
}

// ─────────────────────────────────────────────────────────────────────────────
// Main handler
// ─────────────────────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const body = await req.json();
    const {
      signalType,
      jobTitles,
      industries,
      companyTypes,
      locations,
      companyName,
      description,
      painPoints,
      campaignGoal,
      website,
    } = body;
    if (!signalType) throw new Error('signalType is required');

    console.log(`[KW_GEN] start type=${signalType} website=${website || 'none'} company="${companyName || 'unknown'}"`);

    // ── Hashtags: keep simple legacy path ────────────────────────────────────
    if (signalType === 'hashtag_engagement') {
      const hashtags = await generateHashtags({ companyName, description, jobTitles, industries });
      console.log(`[KW_GEN] hashtags generated=${hashtags.length}:`, JSON.stringify(hashtags));
      return new Response(JSON.stringify({ keywords: hashtags }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── For non-keyword_posts signals (profile_engagers, competitor_*) ───────
    // These are URLs, not buying-intent phrases. Skip the 4-stage pipeline.
    if (signalType !== 'keyword_posts') {
      console.log(`[KW_GEN] signal type ${signalType} not supported by buyer-intent pipeline; returning empty`);
      return new Response(JSON.stringify({ keywords: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── 4-stage buyer-intent pipeline for keyword_posts ──────────────────────

    // STAGE 1 — Scrape website
    let websiteContent = '';
    if (website) {
      try {
        console.log('[KW_GEN] Stage 1: scraping', website);
        websiteContent = await scrapeWebsite(website);
        console.log(`[KW_GEN] Stage 1 done: ${websiteContent.length} chars extracted`);
      } catch (e) {
        console.warn('[KW_GEN] Stage 1 failed:', e instanceof Error ? e.message : e);
      }
    }

    // Build a synthetic context if no website / scrape failed
    if (!websiteContent || websiteContent.length < 100) {
      const fallback = [
        companyName && `Company: ${companyName}`,
        description && `What they do: ${description}`,
        painPoints && `Problems they solve: ${Array.isArray(painPoints) ? painPoints.join(', ') : painPoints}`,
        campaignGoal && `Campaign goal: ${campaignGoal}`,
        jobTitles?.length && `Target job titles: ${jobTitles.join(', ')}`,
        industries?.length && `Target industries: ${industries.join(', ')}`,
        companyTypes?.length && `Target company types: ${companyTypes.join(', ')}`,
        locations?.length && `Target locations: ${locations.join(', ')}`,
      ].filter(Boolean).join('\n');
      websiteContent = fallback || 'No business context provided';
      console.log('[KW_GEN] Using fallback context (no website content)');
    }

    // STAGE 2 — Analyse business
    console.log('[KW_GEN] Stage 2: analysing business');
    const analysis = await analyseBusinessFromWebsite(websiteContent, website || 'unknown', {
      companyName, description, painPoints,
    });
    console.log('[KW_GEN] Stage 2 done. analysis:', JSON.stringify(analysis));

    // STAGE 3 — Generate keywords
    console.log('[KW_GEN] Stage 3: generating keywords');
    const generated = await generateKeywordsFromAnalysis(analysis);

    // Flatten with category tracking
    const flat: { phrase: string; category: string }[] = [];
    for (const [category, phrases] of Object.entries(generated)) {
      for (const p of (phrases as string[]) || []) {
        if (typeof p === 'string' && p.trim()) flat.push({ phrase: p.trim(), category });
      }
    }
    console.log(`[KW_GEN] Stage 3 done: ${flat.length} raw keywords`);

    // STAGE 4 — Validate and score
    const scored = validateAndScoreKeywords(flat, analysis);
    const passing = scored.filter(k => k.passes).sort((a, b) => b.score - a.score);
    const rejected = scored.filter(k => !k.passes);

    // Top 15 keywords (backward-compatible flat string array for callers)
    const topKeywords = passing.slice(0, 15).map(k => k.keyword);

    console.log(`[KW_GEN] Stage 4 done: generated=${flat.length} passing=${passing.length} rejected=${rejected.length}`);
    console.log('[KW_GEN] FINAL keywords:', JSON.stringify(topKeywords));
    if (rejected.length > 0) {
      console.log('[KW_GEN] rejected sample:', JSON.stringify(rejected.slice(0, 5).map(r => ({ p: r.keyword, why: r.rejectionReason }))));
    }

    return new Response(JSON.stringify({
      keywords: topKeywords,
      // Extra transparency fields (non-breaking; ignored by current callers)
      analysis: {
        what_they_sell: analysis.what_they_sell,
        primary_buyer: analysis.primary_buyer,
        core_problem: analysis.core_problem_solved,
        competitors_detected: analysis.competitors_or_alternatives,
        buyer_vocabulary: analysis.buyer_vocabulary,
      },
      detailed: passing.slice(0, 15).map(k => ({ phrase: k.keyword, score: k.score, category: k.category })),
      rejected: rejected.map(k => ({ phrase: k.keyword, reason: k.rejectionReason })),
      total_generated: flat.length,
      total_passing: passing.length,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[KW_GEN] error:', msg);
    if (msg === 'RATE_LIMITED') {
      return new Response(JSON.stringify({ error: 'Rate limited. Try again shortly.' }), {
        status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (msg === 'CREDITS_REQUIRED') {
      return new Response(JSON.stringify({ error: 'Credits required.' }), {
        status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
