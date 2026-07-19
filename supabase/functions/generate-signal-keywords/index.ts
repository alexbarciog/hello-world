import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');
const UNIPILE_API_KEY = Deno.env.get('UNIPILE_API_KEY');
const UNIPILE_DSN = Deno.env.get('UNIPILE_DSN');

// ─────────────────────────────────────────────────────────────────────────────
// STAGE 1 — Website scraping
// ─────────────────────────────────────────────────────────────────────────────
async function scrapeWebsite(websiteUrl: string): Promise<string> {
  let formattedUrl = websiteUrl.trim();
  if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
    formattedUrl = `https://${formattedUrl}`;
  }

  // Hard cap any scrape attempt at 8s — we'd rather fall back to AI-only than block the user.
  const SCRAPE_TIMEOUT_MS = 8000;
  const withTimeout = <T,>(p: Promise<T>): Promise<T> => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), SCRAPE_TIMEOUT_MS);
    return p.finally(() => clearTimeout(t));
  };

  // Prefer Firecrawl when available (handles JS-rendered pages)
  if (FIRECRAWL_API_KEY) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), SCRAPE_TIMEOUT_MS);
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
        signal: ctrl.signal,
      }).finally(() => clearTimeout(t));
      if (fc.ok) {
        const json = await fc.json();
        const md = json?.data?.markdown || json?.markdown || '';
        if (md && md.length > 100) {
          return md.substring(0, 4500);
        }
      } else {
        console.warn('[KW_GEN] Firecrawl failed, falling back to fetch:', fc.status);
      }
    } catch (e) {
      console.warn('[KW_GEN] Firecrawl error/timeout, falling back to fetch:', e instanceof Error ? e.message : e);
    }
  }

  // Fallback: raw fetch + HTML strip (also timed out)
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), SCRAPE_TIMEOUT_MS);
    const res = await fetch(formattedUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Intentsly/1.0)' },
      signal: ctrl.signal,
    }).finally(() => clearTimeout(t));
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
    return cleaned.substring(0, 4000);
  } catch (e) {
    console.warn('[KW_GEN] Raw fetch timeout/error:', e instanceof Error ? e.message : e);
    return '';
  }
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
// STAGE 2 — Business analysis (types; the AI call is combined with Stage 3 below)
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
  // Template slots — buyer-vocabulary nouns used for deterministic keyword
  // expansion (the guaranteed "looking for a X" / "need someone to build Y" set).
  service_category_buyer_words: string[]; // what buyers CALL this ("dev agency", "seo agency")
  things_buyers_want_built: string[];     // deliverables with article ("an mvp", "a mobile app") — service businesses
  outsourced_functions: string[];         // functions buyers outsource ("app development", "lead generation")
  famous_alternatives: string[];          // ONLY globally famous alternatives (upwork, fiverr, in-house team)
}

// ─────────────────────────────────────────────────────────────────────────────
// STAGE 3 — Keyword categories
//
// Keywords are LinkedIn post SEARCH QUERIES, not exact-match triggers: each one
// is sent to Unipile post search and the downstream AI classifier judges every
// returned post (`PHRASE_MATCH_REQUIRED = false` in signal-keyword-posts).
// So the objective is RETRIEVAL: queries whose result pools are dense in real
// buyers — not poetic phrases nobody ever posts.
// ─────────────────────────────────────────────────────────────────────────────
interface GeneratedKeywords {
  direct_ask: string[];
  project_need: string[];
  vendor_evaluation: string[];
  seeking_alternatives: string[];
  pain_point: string[];
}

/**
 * Sanitize a model-produced phrase: strip non-ASCII garbage tokens (e.g. stray
 * CJK characters), quotes/hashtags/punctuation, collapse whitespace, lowercase.
 * Returns '' when nothing usable remains.
 */
function sanitizePhrase(raw: string): string {
  if (typeof raw !== 'string') return '';
  return raw
    .normalize('NFKD')
    .replace(/[^\x20-\x7E]/g, '')      // drop all non-printable-ASCII (CJK, emoji, combining marks)
    .replace(/[#"'’`.,;:!?()\[\]{}]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE EXPANSION — the structural guarantee.
//
// The ask-frame ("looking for a X", "recommend a X", "need someone to build Y")
// is built by CODE from fixed templates; the AI only supplies the buyer-vocab
// nouns. This guarantees the final list is dominated by literal ask fragments
// no matter how the model behaves on a given day.
// ─────────────────────────────────────────────────────────────────────────────
function expandKeywordTemplates(analysis: BusinessAnalysis): { phrase: string; category: string }[] {
  const out: { phrase: string; category: string }[] = [];
  const seen = new Set<string>();
  const push = (raw: string, category: string) => {
    const phrase = sanitizePhrase(raw);
    const wc = phrase ? phrase.split(' ').length : 0;
    if (wc < 2 || wc > 5 || seen.has(phrase)) return;
    seen.add(phrase);
    out.push({ phrase, category });
  };
  const clean = (arr: string[] | undefined, max: number) =>
    (arr || []).map(sanitizePhrase).filter(s => s && s.split(' ').length <= 3).slice(0, max);

  for (const cat of clean(analysis.service_category_buyer_words, 4)) {
    push(`looking for a ${cat}`, 'direct_ask');
    push(`recommend a ${cat}`, 'direct_ask');
    push(`anyone recommend a ${cat}`, 'direct_ask');
    push(`recommendations for a ${cat}`, 'direct_ask');
    push(`need a ${cat}`, 'project_need');
  }
  for (const thing of clean(analysis.things_buyers_want_built, 3)) {
    push(`need someone to build ${thing}`, 'project_need');
    push(`who can build ${thing}`, 'project_need');
    push(`looking to build ${thing}`, 'project_need');
  }
  for (const fn of clean(analysis.outsourced_functions, 3)) {
    push(`looking to outsource ${fn}`, 'project_need');
    push(`getting quotes for ${fn}`, 'vendor_evaluation');
    push(`recommendations for ${fn}`, 'direct_ask');
  }
  for (const alt of clean(analysis.famous_alternatives, 4)) {
    push(`alternative to ${alt}`, 'seeking_alternatives');
    push(`moving away from ${alt}`, 'seeking_alternatives');
  }
  return out;
}


// ─────────────────────────────────────────────────────────────────────────────
// COMBINED Stage 2+3 — Single AI call for analysis + keywords (≈2× faster)
// ─────────────────────────────────────────────────────────────────────────────
async function analyseAndGenerateInOneCall(
  websiteContent: string,
  websiteUrl: string,
  fallbackHints: { companyName?: string; description?: string; painPoints?: string | string[] },
  keywordHistoryBlock: string = '',
): Promise<{ analysis: BusinessAnalysis; generated: GeneratedKeywords }> {
  const hintsBlock = [
    fallbackHints.companyName && `Company name: ${fallbackHints.companyName}`,
    fallbackHints.description && `Description: ${fallbackHints.description}`,
    fallbackHints.painPoints && `Pain points: ${Array.isArray(fallbackHints.painPoints) ? fallbackHints.painPoints.join(', ') : fallbackHints.painPoints}`,
  ].filter(Boolean).join('\n');

  const systemPrompt = `You are a LinkedIn lead-discovery specialist for a B2B platform. In a SINGLE step you (1) analyse a business and (2) produce LinkedIn keyword phrases used to find its buyers.

HOW YOUR OUTPUT IS USED — this determines everything:
Each phrase is sent verbatim to LinkedIn's post search, which returns the ~25 most recent posts containing those words. A downstream AI then reads each post and decides whether the author is a genuine buyer. You are writing SEARCH QUERIES, not slogans. Two things matter, in this order:
1. VOLUME — real people must actually publish posts containing these exact words.
2. BUYER DENSITY — among posts containing these words, a high share must be authors who need this product/service right now.

THE FREQUENCY TEST (apply to every phrase): "Will at least 20 different people worldwide publish a LinkedIn post containing these exact words this month?" If not → REJECT. Invented micro-drama always fails this test: "devs ghosted me", "api costs spiking", "gigster too slow", "toptal is expensive" sound like buyer pain, but virtually nobody ever writes those exact words in a post, so they retrieve zero or random results. Never output phrases like these.

THE GOLD STANDARD is the direct ask post. The richest buying-intent genre on LinkedIn is people publicly asking their network for help:
- "can anyone recommend a development agency"
- "looking for an agency to build our mvp"
- "any recommendations for a shopify developer"
- "who do you use for payroll"
These posts are frequent, unambiguous, and almost never written by vendors. Most of your phrases must be fragments of ask posts, in natural word order — the exact words that would appear inside such a post: "recommend a development agency", "looking for an agency", "need someone to build".

THE VENDOR TEST still applies: if a company selling this service would post the phrase to attract clients ("app development tips", "how to scale your team"), reject it. Ask-fragments naturally pass this test — vendors answer asks, they don't post them.

COMPETITOR NAMES: only use a competitor/alternative name if it is famous enough that many people post about it every week (upwork, fiverr, toptal, salesforce — yes; an obscure startup — no).

FORMAT RULES for every phrase: lowercase, 2-5 words (prefer 3-4), natural word order, no hashtags, no quotes, no punctuation. It must read as a literal fragment of a real post.`;

  const userPrompt = `Analyse this business DEEPLY and produce buyer-intent search keywords in ONE response.

WEBSITE URL: ${websiteUrl}
${hintsBlock ? `\nUSER-PROVIDED CONTEXT:\n${hintsBlock}\n` : ''}
WEBSITE CONTENT:
${websiteContent}
${keywordHistoryBlock}
PART 1 — BUSINESS ANALYSIS. Be specific and concrete. Identify who really buys this and what they would post RIGHT BEFORE buying. The most important fields are the TEMPLATE SLOTS — short buyer-vocabulary nouns that will be inserted into fixed ask-templates by code:
- service_category_buyer_words (3-4): what a buyer literally CALLS this kind of provider when asking their network, 1-3 words each, generic buyer language NOT the seller's marketing label. Examples for a software agency: "dev agency", "development agency", "app developer", "dev shop". Examples for an SEO agency: "seo agency", "seo expert".
- things_buyers_want_built (2-3, service businesses only, else []): the deliverable with its article, 1-3 words: "an mvp", "a mobile app", "an internal tool".
- outsourced_functions (2-3): the function a buyer outsources, 1-3 words: "app development", "mvp development".
- famous_alternatives (0-4): ONLY globally famous alternatives many people post about weekly (upwork, fiverr, toptal, in-house team). Empty if none truly famous.

PART 2 — FREE-FORM KEYWORDS across 5 retrieval categories. Every phrase must pass the FREQUENCY TEST and the VENDOR TEST, and must contain an explicit ask/need/evaluation frame ("looking for", "recommend", "need a", "who can", "alternative to", "getting quotes") — phrases WITHOUT such a frame are discarded by a hard filter, so do not waste slots on mood/opinion statements ("x is too expensive", "tired of x").

CATEGORIES (counts):
- direct_ask (8): fragments of "asking my network" posts — "recommend a [category]", "can anyone recommend", "looking for a [category]", "any suggestions for [category]".
- project_need (7): first-person need statements — "need an mvp built", "looking to build an app", "need a technical partner", "want to outsource development".
- vendor_evaluation (5): actively comparing or budgeting — "getting quotes for", "comparing dev agencies", "budget for app development".
- seeking_alternatives (5): moving off a FAMOUS tool/platform/marketplace — "alternative to upwork", "moving away from fiverr", "switching from [famous tool]".
- pain_point (3): first-person breakdown statements with real posting volume — "our developer quit", "my app is broken".`;

  const combined = await callAITool({
    systemPrompt,
    userPrompt,
    temperature: 0.25,
    toolName: 'return_analysis_and_keywords',
    toolDescription: 'Return both the business analysis and buyer-intent keyword categories',
    parameters: {
      type: 'object',
      properties: {
        what_they_sell: { type: 'string' },
        primary_buyer: { type: 'string' },
        core_problem_solved: { type: 'string' },
        before_state: { type: 'string' },
        after_state: { type: 'string' },
        competitors_or_alternatives: { type: 'array', items: { type: 'string' } },
        buyer_vocabulary: { type: 'array', items: { type: 'string' } },
        category: { type: 'string' },
        service_category_buyer_words: { type: 'array', items: { type: 'string' }, description: '3-4 buyer names for this provider type, 1-3 words each ("dev agency", "app developer")' },
        things_buyers_want_built: { type: 'array', items: { type: 'string' }, description: '2-3 deliverables with article ("an mvp", "a mobile app"); [] for non-service businesses' },
        outsourced_functions: { type: 'array', items: { type: 'string' }, description: '2-3 outsourceable functions ("app development")' },
        famous_alternatives: { type: 'array', items: { type: 'string' }, description: '0-4 ONLY globally famous alternatives (upwork, fiverr, in-house team)' },
        direct_ask: { type: 'array', items: { type: 'string' }, description: '8 fragments of ask-my-network posts' },
        project_need: { type: 'array', items: { type: 'string' }, description: '7 first-person need statements' },
        vendor_evaluation: { type: 'array', items: { type: 'string' }, description: '5 comparing/budgeting phrases' },
        seeking_alternatives: { type: 'array', items: { type: 'string' }, description: '5 moving-off-a-famous-tool phrases' },
        pain_point: { type: 'array', items: { type: 'string' }, description: '3 first-person breakdown statements' },
      },
      required: [
        'what_they_sell', 'primary_buyer', 'core_problem_solved', 'before_state', 'after_state',
        'competitors_or_alternatives', 'buyer_vocabulary', 'category',
        'service_category_buyer_words', 'things_buyers_want_built', 'outsourced_functions', 'famous_alternatives',
        'direct_ask', 'project_need', 'vendor_evaluation', 'seeking_alternatives', 'pain_point',
      ],
      additionalProperties: false,
    },
  });

  const analysis: BusinessAnalysis = {
    what_they_sell: combined.what_they_sell,
    primary_buyer: combined.primary_buyer,
    core_problem_solved: combined.core_problem_solved,
    before_state: combined.before_state,
    after_state: combined.after_state,
    competitors_or_alternatives: combined.competitors_or_alternatives || [],
    buyer_vocabulary: combined.buyer_vocabulary || [],
    category: combined.category,
    service_category_buyer_words: combined.service_category_buyer_words || [],
    things_buyers_want_built: combined.things_buyers_want_built || [],
    outsourced_functions: combined.outsourced_functions || [],
    famous_alternatives: combined.famous_alternatives || [],
  };
  const generated: GeneratedKeywords = {
    direct_ask: combined.direct_ask || [],
    project_need: combined.project_need || [],
    vendor_evaluation: combined.vendor_evaluation || [],
    seeking_alternatives: combined.seeking_alternatives || [],
    pain_point: combined.pain_point || [],
  };
  return { analysis, generated };
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
    'hire us', 'dm me', 'we build', 'we offer',
  ];

  // Retrieval-oriented scoring: these patterns mark phrases that appear in real
  // ask/need/evaluation posts — the high-volume, high-buyer-density genres.
  // (Drama phrases like "tired of X" / "X tanked" are no longer rewarded: they
  // rarely appear verbatim in posts, so as search queries they retrieve noise.)
  const BUYER_SIGNALS: { pattern: RegExp; weight: number }[] = [
    { pattern: /\b(can )?anyone recommend\b/i, weight: 30 },
    { pattern: /\brecommendations? for\b/i, weight: 28 },
    { pattern: /\blooking for\b/i, weight: 25 },
    { pattern: /\blooking to (build|hire|find|outsource|rebuild|replace)\b/i, weight: 25 },
    { pattern: /\bany suggestions?\b/i, weight: 25 },
    { pattern: /\bwho (do you use|can build|would you recommend)\b/i, weight: 25 },
    { pattern: /\bneed (a|an|some(one|body)|help)\b/i, weight: 22 },
    { pattern: /\bwant to (build|outsource|rebuild|replace)\b/i, weight: 18 },
    { pattern: /\balternatives? to\b/i, weight: 20 },
    { pattern: /\b(switching|switched|moving away|migrating) from\b/i, weight: 20 },
    { pattern: /\b(evaluating|comparing|getting quotes|quotes for|rfp)\b/i, weight: 20 },
    { pattern: /\bbudget for\b/i, weight: 15 },
    { pattern: /\boutsourc/i, weight: 15 },
    { pattern: /\brecommend\b/i, weight: 12 },
    { pattern: /\bhiring (a|an)\b/i, weight: 10 },
    { pattern: /\b(our|my) \w+ (quit|left|failed|is broken|is down)\b/i, weight: 15 },
  ];

  return keywords.map(({ phrase: rawPhrase, category }) => {
    // Sanitize first: strips garbage tokens (stray CJK/emoji), punctuation, casing.
    const phrase = sanitizePhrase(rawPhrase);
    if (!phrase) {
      return { keyword: rawPhrase, score: 0, passes: false, category, rejectionReason: 'Unusable after sanitization (non-ASCII/garbage tokens)' };
    }
    const lower = phrase;

    // Hard rejection: vendor phrases
    const vendorHit = VENDOR_PHRASES.find(p => lower.includes(p));
    if (vendorHit) {
      return { keyword: phrase, score: 0, passes: false, category, rejectionReason: `Contains vendor phrase: "${vendorHit}"` };
    }

    const wordCount = phrase.split(' ').length;
    if (wordCount < 2) {
      return { keyword: phrase, score: 0, passes: false, category, rejectionReason: 'Too short — single words match too broadly' };
    }
    if (wordCount > 5) {
      return { keyword: phrase, score: 0, passes: false, category, rejectionReason: 'Too long — must be 5 words max' };
    }

    let score = 45;
    let hasAskFrame = false;
    for (const signal of BUYER_SIGNALS) {
      if (signal.pattern.test(phrase)) {
        score += signal.weight;
        hasAskFrame = true;
      }
    }

    // HARD GATE: without an explicit ask/need/evaluation frame, a phrase is a
    // mood/opinion statement ("toptal is too expensive", "tired of slow devs").
    // As a search query it retrieves noise — no competitor mention or buyer
    // vocabulary can rescue it.
    if (!hasAskFrame) {
      return { keyword: phrase, score: 0, passes: false, category, rejectionReason: 'No ask/need/evaluation frame — mood/opinion phrases retrieve noise' };
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
// STAGE 5 — Reality feedback A: historical per-keyword performance
//
// signal-keyword-posts stores `Posted about "<keyword>" (...)` in contacts.signal,
// and users approve/reject leads. Mining that gives per-keyword outcomes we feed
// back into generation as few-shot guidance. Fail-open: any error returns ''.
// ─────────────────────────────────────────────────────────────────────────────
async function loadKeywordPerformance(sb: any, userId: string): Promise<string> {
  try {
    const { data } = await sb
      .from('contacts')
      .select('signal, approval_status')
      .eq('user_id', userId)
      .like('signal', 'Posted about "%')
      .order('imported_at', { ascending: false })
      .limit(500);
    if (!data || data.length === 0) return '';

    const stats = new Map<string, { total: number; approved: number; rejected: number }>();
    for (const row of data) {
      const m = /^Posted about "(.+?)"/.exec(row.signal || '');
      if (!m) continue;
      const kw = m[1].toLowerCase();
      const s = stats.get(kw) || { total: 0, approved: 0, rejected: 0 };
      s.total++;
      if (row.approval_status === 'approved') s.approved++;
      if (row.approval_status === 'rejected') s.rejected++;
      stats.set(kw, s);
    }

    const winners: string[] = [];
    const losers: string[] = [];
    for (const [kw, s] of stats) {
      if (s.approved >= 1 && s.approved >= s.rejected) winners.push(`"${kw}" (${s.total} leads, ${s.approved} approved)`);
      else if (s.rejected >= 2 && s.rejected > s.approved) losers.push(`"${kw}" (${s.total} leads, ${s.rejected} rejected)`);
    }
    if (winners.length === 0 && losers.length === 0) return '';

    return `
KEYWORD TRACK RECORD FOR THIS USER (from real past runs — weigh heavily):
${winners.length ? `Keywords that produced leads the user APPROVED — generate more phrases in this style/topic:\n${winners.slice(0, 8).map(w => `  ✓ ${w}`).join('\n')}` : ''}
${losers.length ? `Keywords that produced leads the user REJECTED — avoid this style/topic:\n${losers.slice(0, 8).map(l => `  ✗ ${l}`).join('\n')}` : ''}
`;
  } catch (e) {
    console.warn('[KW_GEN] keyword performance load failed:', e instanceof Error ? e.message : e);
    return '';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// STAGE 6 — Reality feedback B: live search backtest
//
// Run each candidate through the same Unipile LinkedIn post search the agent
// will use, and count results from the past month. Keywords retrieving zero
// posts are dead weight (25 posts/page budget wasted); high-volume keywords get
// a boost. Gentle on rate limits (low concurrency, bail-out on failures) and
// fully fail-open: returns null → selection falls back to score-only.
// ─────────────────────────────────────────────────────────────────────────────
async function backtestKeywords(
  keywords: string[],
  accountId: string,
  deadlineMs: number,
): Promise<Map<string, number> | null> {
  if (!UNIPILE_API_KEY || !UNIPILE_DSN || !accountId || keywords.length === 0) return null;
  const url = `https://${UNIPILE_DSN}/api/v1/linkedin/search?account_id=${accountId}`;
  const results = new Map<string, number>();
  const deadline = Date.now() + deadlineMs;
  let idx = 0;
  let failures = 0;

  const worker = async () => {
    while (idx < keywords.length && Date.now() < deadline && failures < 4) {
      const kw = keywords[idx++];
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 7000);
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'X-API-KEY': UNIPILE_API_KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify({ api: 'classic', category: 'posts', keywords: kw, date_posted: 'past_month', limit: 10 }),
          signal: ctrl.signal,
        }).finally(() => clearTimeout(t));
        if (!res.ok) { failures++; continue; }
        const data = await res.json();
        results.set(kw, Array.isArray(data.items) ? data.items.length : 0);
      } catch {
        failures++;
      }
    }
  };

  await Promise.all([worker(), worker(), worker()]);
  console.log(`[KW_GEN] backtest: ${results.size}/${keywords.length} keywords tested, ${failures} failures`);
  return results.size > 0 ? results : null;
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

    // ── Buyer-intent pipeline for keyword_posts ──────────────────────────────

    // STAGE 0 — Resolve caller (for history + backtest). Fail-open: keyword
    // generation must keep working even if auth/profile lookup fails.
    let callerUserId: string | null = null;
    let unipileAccountId: string | null = null;
    let sb: any = null;
    try {
      const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
      const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      const jwt = (req.headers.get('Authorization') || '').replace('Bearer ', '');
      if (SUPABASE_URL && SERVICE_KEY && jwt) {
        sb = createClient(SUPABASE_URL, SERVICE_KEY);
        const { data } = await sb.auth.getUser(jwt);
        callerUserId = data?.user?.id ?? null;
        if (callerUserId) {
          const { data: prof } = await sb.from('profiles').select('unipile_account_id').eq('user_id', callerUserId).maybeSingle();
          unipileAccountId = prof?.unipile_account_id ?? null;
        }
      }
    } catch (e) {
      console.warn('[KW_GEN] Stage 0 caller resolution failed (continuing):', e instanceof Error ? e.message : e);
    }
    console.log(`[KW_GEN] Stage 0: user=${callerUserId ? 'resolved' : 'none'} unipile=${unipileAccountId ? 'available' : 'none'}`);

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

    // STAGE 2+3 (combined) — Analyse + generate in a SINGLE AI call (≈2× faster)
    // Reality feedback A: per-keyword approve/reject history from past runs.
    const keywordHistoryBlock = (sb && callerUserId) ? await loadKeywordPerformance(sb, callerUserId) : '';
    if (keywordHistoryBlock) console.log('[KW_GEN] keyword history feedback loaded');

    console.log('[KW_GEN] Stage 2+3: combined analysis + keyword generation');
    const { analysis, generated } = await analyseAndGenerateInOneCall(
      websiteContent,
      website || 'unknown',
      { companyName, description, painPoints },
      keywordHistoryBlock,
    );
    console.log('[KW_GEN] Stage 2+3 done. analysis:', JSON.stringify(analysis));

    // STAGE 3.5 — Template expansion: code-built ask-frames from the analysis
    // slots. These are the structural guarantee that the final list contains
    // literal "looking for a X" / "recommend a X" / "need someone to build Y"
    // queries regardless of how the free-form generation behaves.
    const templated = expandKeywordTemplates(analysis);
    console.log(`[KW_GEN] Stage 3.5: ${templated.length} template keywords:`, JSON.stringify(templated.map(t => t.phrase)));

    // Flatten free-form AI keywords with category tracking; templates first so
    // they win dedupe collisions.
    const flat: { phrase: string; category: string }[] = [...templated];
    const seenPhrases = new Set(templated.map(t => t.phrase));
    for (const [category, phrases] of Object.entries(generated)) {
      for (const p of (phrases as string[]) || []) {
        const phrase = sanitizePhrase(p);
        if (!phrase || seenPhrases.has(phrase)) continue;
        seenPhrases.add(phrase);
        flat.push({ phrase, category });
      }
    }
    console.log(`[KW_GEN] Stage 3 done: ${flat.length} candidates (${templated.length} templated + ${flat.length - templated.length} free-form)`);

    // STAGE 4 — Validate and score
    const scored = validateAndScoreKeywords(flat, analysis);
    const passing = scored.filter(k => k.passes).sort((a, b) => b.score - a.score);
    const rejected = scored.filter(k => !k.passes);
    console.log(`[KW_GEN] Stage 4 done: generated=${flat.length} passing=${passing.length} rejected=${rejected.length}`);
    if (rejected.length > 0) {
      console.log('[KW_GEN] rejected sample:', JSON.stringify(rejected.slice(0, 5).map(r => ({ p: r.keyword, why: r.rejectionReason }))));
    }

    // STAGE 6 — Reality feedback B: live backtest against real LinkedIn search.
    // A keyword that retrieves 0 posts in the past month is dead weight for the
    // agent; high-volume keywords get a boost. Skipped when no Unipile account.
    let backtest: Map<string, number> | null = null;
    if (unipileAccountId && passing.length > 0) {
      console.log(`[KW_GEN] Stage 6: backtesting ${Math.min(passing.length, 24)} candidates`);
      backtest = await backtestKeywords(passing.slice(0, 24).map(k => k.keyword), unipileAccountId, 25_000);
    }

    type RankedKeyword = KeywordScore & { volume: number | null; finalScore: number };
    let ranked: RankedKeyword[] = passing.map(k => {
      const volume = backtest?.has(k.keyword) ? backtest.get(k.keyword)! : null;
      // Volume boost: up to +30 for keywords proven to retrieve real posts.
      const finalScore = k.score + (volume == null ? 0 : Math.min(volume, 10) * 3);
      return { ...k, volume, finalScore };
    });
    if (backtest) {
      const nonZero = ranked.filter(k => k.volume !== 0);
      // Only drop zero-volume keywords when enough survivors remain.
      if (nonZero.length >= 8) {
        const dropped = ranked.filter(k => k.volume === 0);
        if (dropped.length) console.log('[KW_GEN] dropped zero-volume keywords:', JSON.stringify(dropped.map(k => k.keyword)));
        ranked = nonZero;
      }
    }
    ranked.sort((a, b) => b.finalScore - a.finalScore);

    // Diversity guard: never let one category monopolise the final list.
    const MAX_PER_CATEGORY = 6;
    const perCategory = new Map<string, number>();
    const finalList: RankedKeyword[] = [];
    for (const k of ranked) {
      if (finalList.length >= 15) break;
      const count = perCategory.get(k.category || '') || 0;
      if (count >= MAX_PER_CATEGORY) continue;
      perCategory.set(k.category || '', count + 1);
      finalList.push(k);
    }

    // Backward-compatible flat string array for callers
    const topKeywords = finalList.map(k => k.keyword);
    console.log('[KW_GEN] FINAL keywords:', JSON.stringify(topKeywords));

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
      detailed: finalList.map(k => ({ phrase: k.keyword, score: k.score, category: k.category, live_posts_past_month: k.volume })),
      rejected: rejected.map(k => ({ phrase: k.keyword, reason: k.rejectionReason })),
      total_generated: flat.length,
      total_passing: passing.length,
      backtest_ran: !!backtest,
      history_feedback_used: !!keywordHistoryBlock,
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
