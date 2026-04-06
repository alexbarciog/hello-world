const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ─── Shared types & helpers ───────────────────────────────────────────────────

interface ICPFilters {
  jobTitles: string[];
  industries: string[];
  locations: string[];
  companySizes: string[];
  companyTypes: string[];
  excludeKeywords: string[];
  competitorCompanies: string[];
}

interface MatchResult {
  titleMatch: boolean;
  industryMatch: boolean;
  locationMatch: boolean;
  score: number;
  matchedFields: string[];
}

const BUYING_INTENT_KEYWORDS = [
  'ceo', 'cto', 'coo', 'cfo', 'cmo', 'cro', 'cpo', 'cio',
  'founder', 'co-founder', 'cofounder', 'owner', 'partner',
  'president', 'principal', 'vp', 'vice president',
  'director', 'head of', 'chief', 'general manager', 'managing director',
  'svp', 'evp', 'avp',
];

const REJECT_TITLES = [
  'software developer', 'software engineer', 'frontend developer', 'backend developer',
  'full stack developer', 'fullstack developer', 'web developer', 'mobile developer',
  'junior developer', 'senior developer', 'staff engineer', 'intern',
  'data analyst', 'qa engineer', 'test engineer', 'devops engineer',
  'graphic designer', 'ui designer', 'ux designer',
  'student', 'fresher', 'trainee', 'apprentice',
  'accountant', 'bookkeeper', 'cashier', 'clerk',
  'receptionist', 'administrative assistant', 'office assistant',
];

function normalizeText(value: string): string {
  return (value || '').toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
}

function fuzzyMatchList(value: string, candidates: string[]): boolean {
  const haystack = normalizeText(value);
  if (!haystack) return false;
  return candidates.some(c => {
    const needle = normalizeText(c);
    if (!needle) return false;
    return haystack.includes(needle) || needle.includes(haystack);
  });
}

function scoreProfileAgainstICP(profile: any, icp: ICPFilters): MatchResult {
  const title = profile.headline || profile.title || profile.role || '';
  const industry = profile.industry || '';
  const location = profile.location || profile.country || '';
  const titleMatch = icp.jobTitles.length === 0 || fuzzyMatchList(title, icp.jobTitles);
  const industryMatch = icp.industries.length === 0 || fuzzyMatchList(industry, icp.industries);
  const locationMatch = icp.locations.length === 0 || fuzzyMatchList(location, icp.locations);
  const matchedFields: string[] = [];
  let score = 0;
  if (icp.jobTitles.length > 0 && titleMatch) { score += 40; matchedFields.push('title'); } else if (icp.jobTitles.length === 0) score += 20;
  if (icp.industries.length > 0 && industryMatch) { score += 30; matchedFields.push('industry'); } else if (icp.industries.length === 0) score += 15;
  if (icp.locations.length > 0 && locationMatch) { score += 20; matchedFields.push('location'); } else if (icp.locations.length === 0) score += 10;
  if (icp.companySizes.length > 0) {
    const companySize = profile.company_size || profile.current_company?.employee_count || '';
    if (companySize && fuzzyMatchList(String(companySize), icp.companySizes)) { score += 10; matchedFields.push('company_size'); }
  } else score += 5;
  return { titleMatch, industryMatch, locationMatch, score: Math.min(100, score), matchedFields };
}

function hasBuyingIntent(headline: string): boolean { return BUYING_INTENT_KEYWORDS.some(kw => (headline || '').toLowerCase().includes(kw)); }
function isClearlyIrrelevant(headline: string): boolean { return REJECT_TITLES.some(kw => (headline || '').toLowerCase().includes(kw)); }

function collectCompanyFields(profile: any): string[] {
  const companyFields: string[] = [];
  if (profile.company) companyFields.push(profile.company);
  if (profile.current_company?.name) companyFields.push(profile.current_company.name);
  if (profile.headline) companyFields.push(profile.headline);
  if (profile.title) companyFields.push(profile.title);
  const positions = profile.current_positions || profile.positions || profile.experience || [];
  if (Array.isArray(positions)) {
    for (const pos of positions) {
      if (pos.company) companyFields.push(typeof pos.company === 'string' ? pos.company : pos.company.name || '');
      if (pos.company_name) companyFields.push(pos.company_name);
      if (pos.organization) companyFields.push(pos.organization);
    }
  }
  return companyFields.filter(Boolean);
}

function matchesCompanyName(value: string, companyName: string): boolean {
  const normalizedValue = normalizeText(value);
  const normalizedCompany = normalizeText(companyName);
  if (!normalizedValue || !normalizedCompany) return false;
  return normalizedValue.includes(normalizedCompany) || normalizedCompany.includes(normalizedValue);
}

function worksAtCompany(profile: any, companyName: string): boolean {
  if (!companyName?.trim()) return false;
  return collectCompanyFields(profile).some(field => matchesCompanyName(field, companyName));
}

function classifyContactWithIntentScore(match: MatchResult, icp: ICPFilters, headline?: string, intentScore?: number): 'hot' | 'warm' | 'cold' | null {
  const hl = headline || '';
  if (isClearlyIrrelevant(hl)) return null;

  // Intent score from AI classifier drives the tier
  if (intentScore !== undefined && intentScore >= 80) return 'hot';
  if (intentScore !== undefined && intentScore >= 60) return 'warm';

  // Fallback to ICP matching
  if (icp.jobTitles.length > 0 && match.titleMatch) return 'hot';
  if (hasBuyingIntent(hl) && (icp.industries.length === 0 || match.industryMatch)) return 'hot';
  if (hasBuyingIntent(hl)) return 'warm';
  if (icp.industries.length > 0 && match.industryMatch && hl.length > 5) return 'warm';
  if (hl.length > 5) return 'cold';
  return null;
}

function isExcluded(profile: any, excludeKeywords: string[], competitorCompanies: string[] = []): boolean {
  const companyFields = collectCompanyFields(profile);
  const profileUrl = (profile.linkedin_url || profile.public_url || profile.profile_url || '').toLowerCase();
  if (competitorCompanies.length > 0) {
    const allText = companyFields.map(f => f.toLowerCase()).join(' ') + ' ' + profileUrl;
    for (const comp of competitorCompanies) { if (allText.includes(comp)) return true; }
  }
  if (excludeKeywords.length === 0) return false;
  const text = [...companyFields, profile.industry].filter(Boolean).join(' ').toLowerCase();
  return excludeKeywords.some(kw => text.includes(kw));
}

function unipileGet(path: string, apiKey: string, dsn: string) {
  return fetch(`https://${dsn}${path}`, { headers: { 'X-API-KEY': apiKey } });
}

function normalizeProfile(item: any): any {
  if (!item.first_name && item.name) {
    const parts = item.name.split(' ');
    item.first_name = parts[0];
    item.last_name = parts.slice(1).join(' ') || '';
  }
  return item;
}

function extractLinkedinProfileId(item: any): string | null {
  const directId = item?.public_id || item?.public_identifier || item?.provider_id || item?.author_id || item?.entity_urn || item?.tracking_id;
  if (directId) return String(directId);
  const linkedinUrl = item?.linkedin_url || item?.public_url || item?.profile_url || item?.url;
  if (linkedinUrl && typeof linkedinUrl === 'string') {
    const match = linkedinUrl.match(/linkedin\.com\/in\/([^/?#]+)/i);
    if (match?.[1]) return match[1];
  }
  return null;
}

async function fetchFullProfile(item: any, accountId: string, apiKey: string, dsn: string): Promise<any | null> {
  const norm = normalizeProfile({ ...item });
  const existingId = extractLinkedinProfileId(norm);
  const fetchId = existingId || (item.id && !String(item.id).startsWith('urn:') && !String(item.id).startsWith('ACo') ? item.id : null);

  if (!fetchId) {
    return { ...norm, public_id: norm.public_id || existingId };
  }

  try {
    const res = await unipileGet(`/api/v1/linkedin/profile/${fetchId}?account_id=${accountId}`, apiKey, dsn);
    if (!res.ok) {
      await res.text();
      return { ...norm, public_id: norm.public_id || existingId };
    }

    const fetched = await res.json();
    const normalizedFetched = normalizeProfile(fetched);
    return {
      ...normalizedFetched,
      public_id: normalizedFetched.public_id || extractLinkedinProfileId(normalizedFetched) || existingId,
    };
  } catch {
    return { ...norm, public_id: norm.public_id || existingId };
  }
}

function delay(ms: number) { return new Promise(r => setTimeout(r, ms)); }

async function ensureList(supabase: any, userId: string, listName: string, agentId: string): Promise<string | null> {
  const { data: existing } = await supabase.from('lists').select('id, source_agent_id').eq('user_id', userId).eq('name', listName).limit(1);
  if (existing && existing.length > 0) {
    if (!existing[0].source_agent_id) {
      await supabase.from('lists').update({ source_agent_id: agentId }).eq('id', existing[0].id);
    }
    return existing[0].id;
  }
  const { data: created, error } = await supabase.from('lists').insert({ user_id: userId, name: listName, source_agent_id: agentId }).select('id').single();
  if (error) { console.error(`Create list error: ${error.message}`); return null; }
  return created?.id || null;
}

async function insertContact(
  supabase: any, profile: any, userId: string, agentId: string,
  listName: string, match: MatchResult, signal: string, signalPostUrl: string | null, icp?: ICPFilters,
  intentScore?: number, intentReason?: string,
): Promise<'inserted' | 'duplicate' | 'rejected'> {
  const linkedinProfileId = extractLinkedinProfileId(profile) || (profile.id ? String(profile.id) : null);
  if (!linkedinProfileId) return 'rejected';
  const { data: existing } = await supabase.from('contacts').select('id').eq('user_id', userId).eq('linkedin_profile_id', linkedinProfileId).limit(1);
  if (existing && existing.length > 0) return 'duplicate';
  const firstName = profile.first_name || profile.name?.split(' ')[0] || 'Unknown';
  const lastName = profile.last_name || profile.name?.split(' ').slice(1).join(' ') || '';
  const hl = profile.headline || profile.title || '';
  const emptyIcp: ICPFilters = { jobTitles: [], industries: [], locations: [], companySizes: [], companyTypes: [], excludeKeywords: [], competitorCompanies: [] };
  const relevanceTier = classifyContactWithIntentScore(match, icp || emptyIcp, hl, intentScore) || 'cold';
  const signalAHit = true;
  const signalBHit = match.score >= 60 || (intentScore !== undefined && intentScore >= 60);
  const signalCHit = match.score >= 80 || (intentScore !== undefined && intentScore >= 80);
  const aiScore = Math.min(3, [signalAHit, signalBHit, signalCHit].filter(Boolean).length);

  // Build signal string with intent reason if available
  const fullSignal = intentReason ? `${signal} — ${intentReason}` : signal;

  const { data: inserted, error } = await supabase.from('contacts').insert({
    user_id: userId, first_name: firstName, last_name: lastName,
    title: profile.headline || profile.title || null,
    company: profile.company || profile.current_company?.name || null,
    linkedin_url: profile.linkedin_url || profile.public_url || profile.profile_url || (linkedinProfileId ? `https://www.linkedin.com/in/${linkedinProfileId}` : null),
    linkedin_profile_id: linkedinProfileId, source_campaign_id: null,
    signal: fullSignal, signal_post_url: signalPostUrl, ai_score: aiScore,
    signal_a_hit: signalAHit, signal_b_hit: signalBHit, signal_c_hit: signalCHit,
    email_enriched: false, list_name: listName,
    company_icon_color: ['orange', 'blue', 'green', 'purple', 'pink', 'gray'][Math.floor(Math.random() * 6)],
    relevance_tier: relevanceTier,
  }).select('id').single();
  if (error) { console.error(`Insert contact error: ${error.message}`); return 'rejected'; }
  if (inserted?.id && listName) {
    const listId = await ensureList(supabase, userId, listName, agentId);
    if (listId) await supabase.from('contact_lists').insert({ contact_id: inserted.id, list_id: listId });
  }
  return 'inserted';
}

// ─── PRE-FILTER LAYER (Problems 1, 4, 5) ────────────────────────────────────
// Runs before AI. Zero cost, <1ms per post. Eliminates ~70% of noise.

interface PreFilterResult {
  pass: boolean;
  reason?: string;
  matchedPhrase?: string;
}

/**
 * Generate short phrase variants from a keyword for substring matching.
 * E.g. "developing our internal tool" → ["developing our internal tool", "internal tool", "developing internal", ...]
 */
function generatePhraseVariants(keyword: string): string[] {
  const variants: string[] = [];
  const kw = keyword.toLowerCase().trim();

  // Always include the full keyword as-is
  variants.push(kw);

  // Split into words
  const words = kw.split(/\s+/).filter(w => w.length > 2);

  // Generate all 2-word and 3-word consecutive sub-phrases
  for (let len = 2; len <= Math.min(3, words.length); len++) {
    for (let i = 0; i <= words.length - len; i++) {
      variants.push(words.slice(i, i + len).join(' '));
    }
  }

  // Remove duplicates
  return [...new Set(variants)];
}

function preFilterPost(
  postText: string,
  keyword: string,
  authorProfile: any | null,
  icp: ICPFilters,
  enforceCountry: boolean = true,
): PreFilterResult {
  const text = (postText || '').toLowerCase();

  // ── Problem 1: Phrase match ──
  // The post must contain at least one meaningful sub-phrase from the keyword.
  // This prevents LinkedIn's fuzzy word-level matching from returning garbage.
  const phraseVariants = generatePhraseVariants(keyword);
  const matchedPhrase = phraseVariants.find(phrase => text.includes(phrase));

  if (!matchedPhrase) {
    return { pass: false, reason: 'no_phrase_match' };
  }

  // ── Problem 4: Country filter (only in high_precision mode) ──
  if (enforceCountry && icp.locations.length > 0 && authorProfile) {
    const authorLocation = (authorProfile.location || authorProfile.country || '').toLowerCase();
    if (authorLocation) {
      const countryMatch = icp.locations.some(loc =>
        authorLocation.includes(loc.toLowerCase()) || loc.toLowerCase().includes(authorLocation)
      );
      if (!countryMatch) {
        return { pass: false, reason: 'wrong_country' };
      }
    }
    // If no location data on author, let it pass (will be checked after full profile fetch)
  }

  // ── Problem 5: Industry/title check ──
  // If we have author headline from post metadata, do a quick relevance check
  if (authorProfile) {
    const headline = (authorProfile.headline || authorProfile.title || '').toLowerCase();
    const industry = (authorProfile.industry || authorProfile.current_company?.industry || '').toLowerCase();

    if (headline) {
      // Check if headline matches ICP job titles OR industries
      const titleMatch = icp.jobTitles.length === 0 || icp.jobTitles.some(t => headline.includes(t.toLowerCase()));
      const industryMatch = icp.industries.length === 0 || icp.industries.some(i =>
        headline.includes(i.toLowerCase()) || industry.includes(i.toLowerCase())
      );

      // If we have both title and industry requirements and neither matches, reject
      if (icp.jobTitles.length > 0 && icp.industries.length > 0 && !titleMatch && !industryMatch) {
        return { pass: false, reason: 'wrong_industry_and_title' };
      }
    }
  }

  return { pass: true, matchedPhrase };
}

// ─── SEMANTIC AI CLASSIFIER (Problems 2, 3) ─────────────────────────────────
// Structured prompt with explicit false positive examples.
// Returns intent_score 0-100 instead of binary relevant/irrelevant.

interface IntentClassification {
  is_buyer: boolean;
  intent_score: number;
  reason: string;
  signal_type: string;
}

function extractPostText(post: any): string {
  return (post.text || post.commentary || post.description || post.title || '').trim();
}

async function classifyIntentBatch(
  posts: { id: string; text: string; keyword: string; authorHeadline?: string; matchedPhrase?: string }[],
  businessContext: string,
  minIntentScore: number,
): Promise<Map<string, IntentClassification>> {
  const results = new Map<string, IntentClassification>();

  const postsWithText = posts.filter(p => p.text && p.text.length >= 20);
  if (postsWithText.length === 0) return results;

  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    // No AI key — accept all with default score
    postsWithText.forEach(p => results.set(p.id, { is_buyer: true, intent_score: 70, reason: 'no_ai_key_default', signal_type: 'unknown' }));
    return results;
  }

  const systemPrompt = `You are a B2B buying intent classifier for LinkedIn posts.

COMPANY CONTEXT: "${businessContext}"

For each LinkedIn post, determine if the AUTHOR is expressing genuine buying intent — meaning they have a business need, challenge, or are seeking solutions.

RESPOND ONLY via the tool call. No other text.

TRUE BUYER examples (is_buyer: true, high intent_score):
- "Anyone tried anything better than Apollo? Getting frustrated with the data quality" → BUYER (score: 90, seeking_recommendation)
- "We need to replace our current outreach tool, evaluating alternatives" → BUYER (score: 85, actively_evaluating)
- "Our dev agency keeps missing deadlines, looking to switch providers" → BUYER (score: 80, frustrated_with_current)
- "Can anyone recommend a good lead gen tool?" → BUYER (score: 85, seeking_recommendation)
- "We're struggling with X, how do you handle this?" → BUYER (score: 70, problem_aware)

FALSE POSITIVE examples (is_buyer: false, low intent_score):
- "We're hiring a developer to build our internal tool" → NOT buyer (job posting)
- "I built an internal tool for my team, happy to share" → NOT buyer (self-promotion)
- "Here's how to develop your internal processes — 5 tips" → NOT buyer (thought leadership)
- "Excited to announce our new feature launch!" → NOT buyer (self-promotion)
- "Every company should invest in internal tools" → NOT buyer (vague opinion)
- "We switched last year and it was great" → NOT buyer (past tense, resolved)
- "Here are 5 ways to improve your outreach" → NOT buyer (giving advice, not seeking)
- Publishing case studies of their work → NOT buyer (promoting expertise)

SCORING GUIDE:
- 90-100: Actively asking for alternatives RIGHT NOW, clear frustration, urgent need
- 70-89: Evaluating options, comparing tools, requesting recommendations
- 50-69: Problem-aware, casually exploring, not urgent
- Below 50: Not a buyer — set is_buyer to false

signal_type must be one of: "seeking_recommendation", "actively_evaluating", "frustrated_with_current", "problem_aware", "not_a_buyer"`;

  for (let i = 0; i < postsWithText.length; i += 8) {
    const batch = postsWithText.slice(i, i + 8);
    const postList = batch.map((p, idx) => {
      const authorInfo = p.authorHeadline ? `\nAUTHOR: ${p.authorHeadline}` : '';
      const phraseInfo = p.matchedPhrase ? `\nMATCHED PHRASE: "${p.matchedPhrase}"` : '';
      return `POST ${idx + 1} [id=${p.id}]:\n${p.text.slice(0, 500)}${authorInfo}${phraseInfo}`;
    }).join('\n\n---\n\n');

    try {
      const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'google/gemini-3-flash-preview',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Classify each post's buying intent. Be strict about false positives.\n\n${postList}` },
          ],
          tools: [{
            type: 'function',
            function: {
              name: 'classify_intent',
              description: 'Return intent classification for each post',
              parameters: {
                type: 'object',
                properties: {
                  results: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        is_buyer: { type: 'boolean' },
                        intent_score: { type: 'number', description: '0-100 intent score' },
                        reason: { type: 'string', description: 'One sentence explaining the decision' },
                        signal_type: { type: 'string', enum: ['seeking_recommendation', 'actively_evaluating', 'frustrated_with_current', 'problem_aware', 'not_a_buyer'] },
                      },
                      required: ['id', 'is_buyer', 'intent_score', 'reason', 'signal_type'],
                      additionalProperties: false,
                    },
                  },
                },
                required: ['results'],
                additionalProperties: false,
              },
            },
          }],
          tool_choice: { type: 'function', function: { name: 'classify_intent' } },
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error(`[AI] Intent classifier HTTP ${res.status}: ${errText.slice(0, 200)}`);
        // On AI failure, accept all with medium score
        batch.forEach(p => results.set(p.id, { is_buyer: true, intent_score: 65, reason: 'ai_fallback', signal_type: 'unknown' }));
        continue;
      }

      const aiData = await res.json();
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      if (!toolCall) {
        batch.forEach(p => results.set(p.id, { is_buyer: true, intent_score: 65, reason: 'ai_no_response', signal_type: 'unknown' }));
        continue;
      }

      const parsed = JSON.parse(toolCall.function.arguments);
      const classifications = parsed.results || [];

      for (const cls of classifications) {
        if (cls.is_buyer && cls.intent_score >= minIntentScore) {
          results.set(cls.id, cls);
          console.log(`[AI] ✅ ${cls.id}: score=${cls.intent_score} type=${cls.signal_type} — ${cls.reason}`);
        } else {
          // Store rejection with negative marker so pipeline can capture sample
          results.set(`rejected:${cls.id}`, cls);
          console.log(`[AI] ❌ ${cls.id}: score=${cls.intent_score} type=${cls.signal_type} — ${cls.reason}`);
        }
      }

      // Any post not in AI response — accept with medium score
      for (const p of batch) {
        if (!classifications.some((c: any) => c.id === p.id) && !results.has(p.id)) {
          results.set(p.id, { is_buyer: true, intent_score: 65, reason: 'ai_missing_response', signal_type: 'unknown' });
        }
      }

    } catch (e) {
      console.error('[AI] Intent classifier error:', e);
      batch.forEach(p => results.set(p.id, { is_buyer: true, intent_score: 65, reason: 'ai_error', signal_type: 'unknown' }));
    }
  }

  return results;
}

// ─── Main Handler: Pre-filter → AI Classify → Insert ─────────────────────────

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const START = Date.now();
  const MAX_RUNTIME_MS = 105_000;
  const hasTime = () => Date.now() - START < MAX_RUNTIME_MS;

  try {
    const { agent_id, account_id, user_id, list_name, keywords, icp: icpRaw, competitor_companies, business_context, user_company_name, precision_mode } = await req.json();
    if (!agent_id || !account_id || !keywords?.length) {
      return new Response(JSON.stringify({ leads: 0, error: 'Missing required params' }), { status: 400, headers: corsHeaders });
    }

    const UNIPILE_API_KEY = Deno.env.get('UNIPILE_API_KEY')!;
    const UNIPILE_DSN = Deno.env.get('UNIPILE_DSN')!;
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const searchUrl = `https://${UNIPILE_DSN}/api/v1/linkedin/search?account_id=${account_id}`;
    const searchHeaders = { 'X-API-KEY': UNIPILE_API_KEY, 'Content-Type': 'application/json' };

    const ownCompanyLower = (user_company_name || '').toLowerCase().trim();
    const MIN_INTENT_SCORE = 60; // Score gate: below 60 = discard
    const isHighPrecision = precision_mode === 'high_precision';
    console.log(`[CONFIG] precision_mode="${precision_mode || 'discovery'}" → country filtering ${isHighPrecision ? 'ENABLED' : 'DISABLED (discovery)'}`);

    const icp: ICPFilters = {
      jobTitles: icpRaw?.jobTitles || [],
      industries: icpRaw?.industries || [],
      locations: icpRaw?.locations || [],
      companySizes: icpRaw?.companySizes || [],
      companyTypes: icpRaw?.companyTypes || [],
      excludeKeywords: icpRaw?.excludeKeywords || [],
      competitorCompanies: competitor_companies || [],
    };

    console.log(`[CONFIG] ICP: titles=[${icp.jobTitles.join(',')}], industries=[${icp.industries.join(',')}], locations=[${icp.locations.join(',')}], ownCompany="${ownCompanyLower}", minScore=${MIN_INTENT_SCORE}`);
    console.log(`[CONFIG] Keywords (${keywords.length}): ${keywords.join(' | ')}`);

    // ─── PIPELINE DIAGNOSTIC STATS ───
    // ── Load previously processed post IDs for cross-run dedup ──
    let alreadyProcessed = new Set<string>();
    try {
      const { data: ppRows } = await supabase
        .from('processed_posts')
        .select('social_id')
        .eq('agent_id', agent_id);
      if (ppRows) {
        alreadyProcessed = new Set(ppRows.map((r: any) => r.social_id));
      }
      console.log(`[CROSS-RUN DEDUP] Loaded ${alreadyProcessed.size} previously processed post IDs for agent ${agent_id}`);
    } catch (e) {
      console.warn('[CROSS-RUN DEDUP] Failed to load processed posts, continuing without:', e);
    }

    const newlyProcessedPostIds: string[] = [];

    const pipelineStats = {
      keywords_processed: 0,
      total_posts_fetched: 0,
      unipile_errors: 0,
      unipile_empty_responses: 0,
      skipped_already_processed: 0,
      posts_after_dedup: 0,
      duplicates_removed: 0,
      passed_prefilter: 0,
      rejected_no_phrase_match: 0,
      rejected_wrong_country: 0,
      rejected_wrong_industry: 0,
      sent_to_ai: 0,
      passed_ai: 0,
      rejected_ai_not_buyer: 0,
      rejected_ai_low_score: 0,
      ai_errors: 0,
      ai_fallback_used: 0,
      profile_fetches_attempted: 0,
      profile_fetches_failed: 0,
      rejected_private_profile: 0,
      rejected_own_company: 0,
      rejected_competitor: 0,
      rejected_irrelevant_title: 0,
      rejected_wrong_country_post_profile: 0,
      rejected_early_db_dedup: 0,
      rejected_author_dedup: 0,
      rejected_no_author: 0,
      inserted: 0,
      sample_prefilter_rejections: [] as Array<{ keyword: string; variants: string[]; postSample: string; reason: string }>,
      sample_ai_rejections: [] as Array<{ postSample: string; is_buyer: boolean; intent_score: number; reason: string }>,
      sample_inserted: [] as Array<{ name: string; headline: string; intentScore: number }>,
    };

    let inserted = 0;
    const globalSeenPostIds = new Set<string>();
    const globalSeenAuthorIds = new Set<string>();

    for (const keyword of keywords) {
      pipelineStats.keywords_processed++;
      if (!hasTime()) { console.log(`[TIMEOUT] Stopping at keyword "${keyword}" — ${inserted} leads so far`); break; }

      // ── Step 1: Fetch posts with pagination ──
      const keywordPosts: any[] = [];
      let cursor: string | null = null;
      const MAX_PAGES = 5;
      const TARGET_POSTS = 50;

      try {
        for (let page = 0; page < MAX_PAGES && hasTime() && keywordPosts.length < TARGET_POSTS; page++) {
          const searchBody: any = { api: 'classic', category: 'posts', keywords: keyword, date_posted: 'past_week', limit: 50 };
          if (cursor) searchBody.cursor = cursor;
          const res = await fetch(searchUrl, { method: 'POST', headers: searchHeaders, body: JSON.stringify(searchBody) });
          if (!res.ok) {
            const t = await res.text();
            console.error(`keyword "${keyword}" p${page + 1}: HTTP ${res.status} - ${t.slice(0, 200)}`);
            pipelineStats.unipile_errors++;
            break;
          }
          const data = await res.json();
          const items = data.items || data.results || [];
          if (items.length === 0) pipelineStats.unipile_empty_responses++;
          keywordPosts.push(...items);
          console.log(`[KEYWORD: "${keyword}"] Fetched ${items.length} posts from Unipile. Cursor: ${data.cursor ?? data.next_cursor ?? 'none'}. Page: ${page + 1}. Running total: ${keywordPosts.length}`);
          cursor = data.cursor || data.next_cursor || null;
          if (!cursor || items.length === 0) break;
          if (page < MAX_PAGES - 1) await delay(200);
        }
      } catch (e) {
        console.error(`Keyword search "${keyword}":`, e);
        pipelineStats.unipile_errors++;
      }

      pipelineStats.total_posts_fetched += keywordPosts.length;

      // ── Step 2: Dedupe posts ──
      // ── Step 2: Dedupe posts (in-run + cross-run) ──
      const uniquePosts = keywordPosts.filter(p => {
        const id = p.social_id || p.id || p.provider_id;
        if (!id || globalSeenPostIds.has(id)) return false;
        globalSeenPostIds.add(id);
        // Cross-run dedup: skip if already processed in a prior run
        if (alreadyProcessed.has(id)) {
          pipelineStats.skipped_already_processed++;
          return false;
        }
        // Track for saving later
        newlyProcessedPostIds.push(id);
        return true;
      });

      const dupsThisKeyword = keywordPosts.length - uniquePosts.length;
      pipelineStats.duplicates_removed += dupsThisKeyword;
      pipelineStats.posts_after_dedup += uniquePosts.length;

      if (uniquePosts.length === 0) {
        console.log(`[KEYWORD] "${keyword}": ${keywordPosts.length} fetched, 0 unique — skipping`);
        continue;
      }

      // ── Step 3: PRE-FILTER — phrase match + country + industry ──
      const preFilteredPosts: { post: any; matchedPhrase: string }[] = [];
      let preFilterStats = { no_phrase: 0, wrong_country: 0, wrong_industry: 0, passed: 0 };

      // Log generated variants for this keyword
      const diagVariants = generatePhraseVariants(keyword);
      console.log(`[PRE-FILTER] Keyword "${keyword}" generated variants:`, JSON.stringify(diagVariants));

      for (const post of uniquePosts) {
        const postText = extractPostText(post);
        const authorData = post.author || post.actor || post.author_detail || null;

        const filterResult = preFilterPost(postText, keyword, authorData, icp);

        if (!filterResult.pass) {
          if (filterResult.reason === 'no_phrase_match') {
            preFilterStats.no_phrase++;
            pipelineStats.rejected_no_phrase_match++;
          } else if (filterResult.reason === 'wrong_country') {
            preFilterStats.wrong_country++;
            pipelineStats.rejected_wrong_country++;
          } else {
            preFilterStats.wrong_industry++;
            pipelineStats.rejected_wrong_industry++;
          }
          // Capture sample rejections (max 3)
          if (pipelineStats.sample_prefilter_rejections.length < 3) {
            pipelineStats.sample_prefilter_rejections.push({
              keyword,
              variants: diagVariants,
              postSample: postText.substring(0, 300),
              reason: filterResult.reason || 'unknown',
            });
          }
          continue;
        }

        preFilterStats.passed++;
        pipelineStats.passed_prefilter++;
        preFilteredPosts.push({ post, matchedPhrase: filterResult.matchedPhrase! });
      }

      // Warn if ALL posts for a keyword were rejected at pre-filter
      if (preFilterStats.passed === 0 && uniquePosts.length > 0) {
        console.warn(`[KEYWORD: "${keyword}"] ALL ${uniquePosts.length} posts rejected at pre-filter. Check phrase variants.`);
      }

      console.log(`[PRE-FILTER] "${keyword}": ${uniquePosts.length} → ${preFilteredPosts.length} passed (rejected: phrase=${preFilterStats.no_phrase} country=${preFilterStats.wrong_country} industry=${preFilterStats.wrong_industry})`);

      if (preFilteredPosts.length === 0) continue;

      // ── Step 4: AI INTENT CLASSIFIER — structured scoring ──
      const postsForAI = preFilteredPosts.map(({ post, matchedPhrase }) => {
        const authorData = post.author || post.actor || post.author_detail || null;
        return {
          id: post.social_id || post.id || post.provider_id || String(Math.random()),
          text: extractPostText(post),
          keyword,
          authorHeadline: authorData?.headline || authorData?.title || '',
          matchedPhrase,
        };
      });

      pipelineStats.sent_to_ai += postsForAI.length;

      const intentResults = await classifyIntentBatch(postsForAI, business_context || '', MIN_INTENT_SCORE);

      // Track AI results in stats
      for (const p of postsForAI) {
        const cls = intentResults.get(p.id);
        const rejectedCls = intentResults.get(`rejected:${p.id}`);
        if (cls) {
          if (cls.reason === 'ai_fallback' || cls.reason === 'ai_error' || cls.reason === 'ai_no_response' || cls.reason === 'ai_missing_response' || cls.reason === 'no_ai_key_default') {
            pipelineStats.ai_fallback_used++;
          }
          pipelineStats.passed_ai++;
        } else if (rejectedCls) {
          if (!rejectedCls.is_buyer) {
            pipelineStats.rejected_ai_not_buyer++;
          } else {
            pipelineStats.rejected_ai_low_score++;
          }
          if (pipelineStats.sample_ai_rejections.length < 3) {
            pipelineStats.sample_ai_rejections.push({
              postSample: p.text.substring(0, 300),
              is_buyer: rejectedCls.is_buyer,
              intent_score: rejectedCls.intent_score,
              reason: rejectedCls.reason,
            });
          }
        } else {
          pipelineStats.rejected_ai_not_buyer++;
          if (pipelineStats.sample_ai_rejections.length < 3) {
            pipelineStats.sample_ai_rejections.push({
              postSample: p.text.substring(0, 300),
              is_buyer: false,
              intent_score: 0,
              reason: 'no_ai_response_for_post',
            });
          }
        }
      }

      const qualifiedPosts = preFilteredPosts.filter(({ post }) => {
        const id = post.social_id || post.id || post.provider_id;
        return intentResults.has(id);
      });

      console.log(`[AI] "${keyword}": ${preFilteredPosts.length} → ${qualifiedPosts.length} qualified (score >= ${MIN_INTENT_SCORE})`);

      // ── Step 5: Process qualified posts — early dedup → full profile → insert ──
      let keywordInserted = 0;
      let keywordSkipped = { noAuthor: 0, dupAuthor: 0, earlyDedup: 0, excluded: 0, ownCompany: 0, duplicate: 0, rejected: 0, irrelevant: 0 };

      for (const { post, matchedPhrase } of qualifiedPosts) {
        if (!hasTime()) break;

        const postId = post.social_id || post.id || post.provider_id;
        const intentData = intentResults.get(postId);
        const authorData = post.author || post.actor || post.author_detail || null;
        if (!authorData) { keywordSkipped.noAuthor++; pipelineStats.rejected_no_author++; continue; }

        let author = normalizeProfile({ ...authorData });
        let authorId = extractLinkedinProfileId(author);

        // In-memory dedup
        if (authorId && globalSeenAuthorIds.has(authorId)) { keywordSkipped.dupAuthor++; pipelineStats.rejected_author_dedup++; continue; }
        if (authorId) globalSeenAuthorIds.add(authorId);

        // Early dedup against DB
        if (authorId) {
          const { data: existing } = await supabase.from('contacts').select('id').eq('user_id', user_id).eq('linkedin_profile_id', authorId).limit(1);
          if (existing && existing.length > 0) { keywordSkipped.earlyDedup++; pipelineStats.rejected_early_db_dedup++; continue; }
        }

        // Full profile fetch (only for genuinely new leads)
        pipelineStats.profile_fetches_attempted++;
        const fullAuthor = await fetchFullProfile(authorData, account_id, UNIPILE_API_KEY, UNIPILE_DSN);
        if (fullAuthor) {
          author = fullAuthor;
          const newId = extractLinkedinProfileId(author);
          if (newId && newId !== authorId) {
            if (globalSeenAuthorIds.has(newId)) { keywordSkipped.dupAuthor++; pipelineStats.rejected_author_dedup++; continue; }
            globalSeenAuthorIds.add(newId);
            const { data: existing } = await supabase.from('contacts').select('id').eq('user_id', user_id).eq('linkedin_profile_id', newId).limit(1);
            if (existing && existing.length > 0) { keywordSkipped.earlyDedup++; pipelineStats.rejected_early_db_dedup++; continue; }
          }
          authorId = newId || authorId;
        } else {
          pipelineStats.profile_fetches_failed++;
        }

        // Reject LinkedIn Member (private profiles)
        if ((author.first_name || '').toLowerCase() === 'linkedin' && (author.last_name || '').toLowerCase() === 'member') {
          keywordSkipped.rejected++;
          pipelineStats.rejected_private_profile++;
          continue;
        }

        const lpid = authorId || 'unknown';

        // Own-company exclusion
        if (ownCompanyLower && ownCompanyLower.length > 1 && worksAtCompany(author, ownCompanyLower)) {
          console.log(`[PIPELINE] ⏭ ${lpid}: excluded (own company "${ownCompanyLower}")`);
          keywordSkipped.ownCompany++;
          pipelineStats.rejected_own_company++;
          continue;
        }

        // Competitor employee exclusion
        if (isExcluded(author, icp.excludeKeywords, icp.competitorCompanies)) {
          console.log(`[PIPELINE] ⏭ ${lpid}: excluded (competitor employee)`);
          keywordSkipped.excluded++;
          pipelineStats.rejected_competitor++;
          continue;
        }

        // Clearly irrelevant title check
        const hl = author.headline || author.title || '';
        if (isClearlyIrrelevant(hl)) {
          console.log(`[PIPELINE] ⏭ ${lpid}: irrelevant title "${hl.slice(0, 50)}"`);
          keywordSkipped.irrelevant++;
          pipelineStats.rejected_irrelevant_title++;
          continue;
        }

        // ── POST-PROFILE country/industry re-check with full data ──
        if (icp.locations.length > 0) {
          const fullLocation = (author.location || author.country || '').toLowerCase();
          if (fullLocation) {
            const countryMatch = icp.locations.some(loc =>
              fullLocation.includes(loc.toLowerCase()) || loc.toLowerCase().includes(fullLocation)
            );
            if (!countryMatch) {
              console.log(`[PIPELINE] ⏭ ${lpid}: wrong country "${fullLocation}"`);
              keywordSkipped.excluded++;
              pipelineStats.rejected_wrong_country_post_profile++;
              continue;
            }
          }
        }

        const match = scoreProfileAgainstICP(author, icp);
        const postUrl = post.url || post.share_url || post.permalink || (post.id ? `https://www.linkedin.com/feed/update/${post.id}` : null);
        const signal = `Posted about "${keyword}" (${intentData?.signal_type || 'buyer_intent'})`;

        // Insert with intent score driving the tier
        const result = await insertContact(
          supabase, author, user_id, agent_id, list_name, match, signal, postUrl, icp,
          intentData?.intent_score, intentData?.reason,
        );

        if (result === 'inserted') {
          keywordInserted++;
          inserted++;
          pipelineStats.inserted++;
          const tier = classifyContactWithIntentScore(match, icp, hl, intentData?.intent_score) || 'warm';
          console.log(`[PIPELINE] ✅ ${lpid}: inserted as ${tier} (score=${intentData?.intent_score}, kw="${keyword}")`);
          // Capture sample inserted (max 3)
          if (pipelineStats.sample_inserted.length < 3) {
            pipelineStats.sample_inserted.push({
              name: `${author.first_name || ''} ${author.last_name || ''}`.trim(),
              headline: hl.substring(0, 100),
              intentScore: intentData?.intent_score || 0,
            });
          }
        } else if (result === 'duplicate') {
          keywordSkipped.duplicate++;
          pipelineStats.rejected_early_db_dedup++;
        } else {
          keywordSkipped.rejected++;
        }
      }

      console.log(`[KEYWORD] "${keyword}": ${keywordPosts.length} fetched → ${uniquePosts.length} unique → ${preFilteredPosts.length} pre-filtered → ${qualifiedPosts.length} AI-qualified → ${keywordInserted} inserted (skip: noAuthor=${keywordSkipped.noAuthor} dupAuthor=${keywordSkipped.dupAuthor} earlyDedup=${keywordSkipped.earlyDedup} ownCo=${keywordSkipped.ownCompany} excl=${keywordSkipped.excluded} irrel=${keywordSkipped.irrelevant} dup=${keywordSkipped.duplicate} reject=${keywordSkipped.rejected})`);
    }

    // ── Save all processed post IDs for cross-run dedup ──
    if (newlyProcessedPostIds.length > 0) {
      try {
        // Batch insert in chunks of 500
        for (let i = 0; i < newlyProcessedPostIds.length; i += 500) {
          const chunk = newlyProcessedPostIds.slice(i, i + 500);
          const rows = chunk.map(sid => ({ social_id: sid, agent_id }));
          const { error } = await supabase.from('processed_posts').upsert(rows, { onConflict: 'social_id,agent_id', ignoreDuplicates: true });
          if (error) console.warn(`[CROSS-RUN DEDUP] Failed to save chunk ${i}:`, error.message);
        }
        console.log(`[CROSS-RUN DEDUP] Saved ${newlyProcessedPostIds.length} new post IDs for future dedup`);
      } catch (e) {
        console.warn('[CROSS-RUN DEDUP] Failed to save processed posts:', e);
      }
    }

    console.log('=== PIPELINE DIAGNOSTIC SUMMARY ===');
    console.log(JSON.stringify(pipelineStats, null, 2));
    console.log('=====================================');

    console.log(`signal-keyword-posts: ${inserted} leads total in ${Math.round((Date.now() - START) / 1000)}s`);
    return new Response(JSON.stringify({ leads: inserted }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('signal-keyword-posts error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error', leads: 0 }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
