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
  restrictedCountries: string[];
  restrictedRoles: string[];
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

// Fix 5: Seller detection — reject posts where the AUTHOR is offering the same service
// the user sells (lead-gen agencies posting "we help companies with outbound" attract
// buyers but ARE NOT BUYERS THEMSELVES). Runs BEFORE AI to save classification budget.
const SELLER_PHRASES = [
  'we help', 'our agency', 'our services', 'book a call',
  'check out our', 'dm me for', 'link in bio', 'we offer',
  'our clients', 'free consultation', 'i help companies',
  'we specialize in', 'we work with', 'our team helps',
  'reach out if you', 'message me to', 'visit our website',
];
function isSeller(postText: string, authorHeadline: string): boolean {
  const text = ((postText || '') + ' ' + (authorHeadline || '')).toLowerCase();
  return SELLER_PHRASES.some(p => text.includes(p));
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
  intentScore?: number, intentReason?: string, manualApproval?: boolean,
): Promise<'inserted' | 'duplicate' | 'rejected'> {
  const linkedinProfileId = extractLinkedinProfileId(profile) || (profile.id ? String(profile.id) : null);
  if (!linkedinProfileId) return 'rejected';
  const { data: existing } = await supabase.from('contacts').select('id').eq('user_id', userId).eq('linkedin_profile_id', linkedinProfileId).limit(1);
  if (existing && existing.length > 0) return 'duplicate';
  const firstName = profile.first_name || profile.name?.split(' ')[0] || 'Unknown';
  const lastName = profile.last_name || profile.name?.split(' ').slice(1).join(' ') || '';
  const hl = profile.headline || profile.title || '';
  const emptyIcp: ICPFilters = { jobTitles: [], industries: [], locations: [], companySizes: [], companyTypes: [], excludeKeywords: [], competitorCompanies: [], restrictedCountries: [], restrictedRoles: [] };
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
    industry: profile.industry || profile.current_company?.industry || null,
    linkedin_url: profile.linkedin_url || profile.public_url || profile.profile_url || (linkedinProfileId ? `https://www.linkedin.com/in/${linkedinProfileId}` : null),
    linkedin_profile_id: linkedinProfileId, source_campaign_id: null,
    signal: fullSignal, signal_post_url: signalPostUrl, ai_score: aiScore,
    signal_a_hit: signalAHit, signal_b_hit: signalBHit, signal_c_hit: signalCHit,
    email_enriched: false, list_name: listName,
    company_icon_color: ['orange', 'blue', 'green', 'purple', 'pink', 'gray'][Math.floor(Math.random() * 6)],
    relevance_tier: relevanceTier,
    approval_status: manualApproval ? 'pending' : 'auto_approved',
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
  isHighPrecision: boolean = true,
): PreFilterResult {
  const text = (postText || '').toLowerCase();

  // ── Phrase match (best-effort, non-blocking in discovery mode) ──
  // We still try to detect a sub-phrase match to give the AI a useful hint
  // ("MATCHED PHRASE: ..."), but in DISCOVERY mode we no longer reject posts
  // that lack the literal keyword. The AI semantic classifier will judge whether
  // the author is genuinely expressing buying intent — even when they describe
  // their need in different words than the configured keyword.
  //
  // In HIGH_PRECISION mode we keep the strict phrase guard to avoid garbage,
  // but require a minimum post length so the AI has something to work with.
  const phraseVariants = generatePhraseVariants(keyword);
  const matchedPhrase = phraseVariants.find(phrase => text.includes(phrase));

  if (!matchedPhrase) {
    if (isHighPrecision) {
      return { pass: false, reason: 'no_phrase_match' };
    }
    // Discovery mode: require some substance before sending to AI
    if (text.length < 40) {
      return { pass: false, reason: 'no_phrase_match' };
    }
    // Fall through — let the AI decide if it's a buyer
  }

  // ── Problem 4: Country filter (only in high_precision mode) ──
  if (isHighPrecision && icp.locations.length > 0 && authorProfile) {
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

  // ── Problem 5: Industry/title check (only in high_precision mode) ──
  // In discovery mode, skip industry filtering to maximize volume — let the AI do the filtering
  if (isHighPrecision && authorProfile) {
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
  is_competitor?: boolean;
  competitor_reason?: string;
}

function extractPostText(post: any): string {
  return (post.text || post.commentary || post.description || post.title || '').trim();
}

async function classifyIntentBatch(
  posts: { id: string; text: string; keyword: string; authorHeadline?: string; matchedPhrase?: string }[],
  businessContext: string,
  minIntentScore: number,
  idealLeadDescription: string = '',
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

  const systemPrompt = `You are an EXTREMELY STRICT B2B buying intent classifier for LinkedIn posts.

COMPANY CONTEXT: "${businessContext}"

Your job is to REJECT posts unless the AUTHOR is EXPLICITLY and ACTIVELY looking RIGHT NOW for a solution related to the company context above.

DEFAULT TO is_buyer=false. Only set is_buyer=true if the post passes ALL of these tests:
  1. Present tense — the need exists NOW (not "we did", "we used to", "last year")
  2. The AUTHOR (not their company in third person) is the one expressing the need / asking
  3. There is an EXPLICIT signal: a question seeking recommendations, a stated frustration with a current vendor, a stated evaluation of alternatives, or an explicit "we need X / looking for X / anyone use X"
  4. The need is RELEVANT to the company context above. Vague pain ("we have growth challenges") is NOT enough.
  5. It is NOT thought leadership, advice-giving, hiring, self-promotion, case study, hot take, or congratulations

RESPOND ONLY via the tool call. No other text.

TRUE BUYER examples (is_buyer: true):
- "Anyone tried anything better than Apollo? Data quality is killing us" → BUYER (score: 95, seeking_recommendation)
- "We need to replace our outreach tool this quarter — evaluating alternatives" → BUYER (score: 90, actively_evaluating)
- "Our SEO agency keeps missing deadlines, actively looking to switch" → BUYER (score: 85, frustrated_with_current)
- "Can anyone recommend a good lead-gen tool for B2B SaaS?" → BUYER (score: 85, seeking_recommendation)
- "What's everyone using instead of HubSpot for outbound? Ours is broken" → BUYER (score: 90, seeking_recommendation)

REJECT — these are NOT buyers (is_buyer: false, score < 50):
- "We're hiring a developer to build our internal tool" → job posting
- "I built an internal tool for my team, happy to share" → self-promotion
- "Here's how to develop your internal processes — 5 tips" → thought leadership
- "Excited to announce our new feature launch!" → self-promotion
- "Every company should invest in internal tools" → vague opinion
- "We switched last year and it was great" → past tense, resolved
- "Here are 5 ways to improve your outreach" → giving advice, not seeking
- "Outbound is broken in 2026, here's why" → hot take / opinion
- "We're struggling with growth, how do you handle this?" → vague problem, no specific solution being sought
- "Sales is hard right now" → vague commiseration
- "Proud of our team for hitting 200% this quarter" → celebration
- Posts that are mostly hashtags, emojis, or motivational quotes
- Case studies, testimonials, or "how we did X" stories
- General industry commentary, predictions, or trends
- "What's your biggest challenge?" — engagement bait, not buying intent

STRICT SCORING:
- 90-100: Author is asking RIGHT NOW for a specific alternative/recommendation, with named pain or named current vendor → BUYER
- 75-89: Author is explicitly evaluating / replacing / switching a specific category of tool/vendor → BUYER
- 60-74: Author has a specific stated problem AND mentions wanting to fix it / find a solution, but no explicit "looking for" → BUYER (borderline)
- Below 60: NOT a buyer. Set is_buyer=false. This includes vague problem awareness, advice posts, opinions, anything past tense.

CRITICAL: When in doubt, REJECT. False negatives are FAR better than false positives. The user is paying for high-intent leads only.

signal_type must be one of: "seeking_recommendation", "actively_evaluating", "frustrated_with_current", "problem_aware", "not_a_buyer".
"problem_aware" alone is NOT enough to be a buyer — only use it if score >= 60 AND there is an explicit solution-seeking phrase.

═══════════════════════════════════════════════════════════════════════════════
COMPETITOR CHECK (CRITICAL — runs IN ADDITION to the buyer check above)
═══════════════════════════════════════════════════════════════════════════════
Given the COMPANY CONTEXT above (what the user sells), you must ALSO determine
whether the AUTHOR is themselves a COMPETITOR / service provider in the same or
substantially similar space. Set is_competitor=true if so, with a 1-sentence
competitor_reason. Default is_competitor=false when in doubt.

A competitor is anyone who appears to SELL the same/similar service the user
sells, based on their headline + post content. Examples (assume user sells AI
lead-gen / outbound automation):
- AUTHOR headline: "Founder @ OutreachAgency" → is_competitor=true
- AUTHOR headline: "We help B2B companies book more meetings via cold outbound" → is_competitor=true
- AUTHOR headline: "Lead-gen consultant | DM for a free audit" → is_competitor=true
- POST: "Anyone need help scaling outbound? DM me 👇" + agency-style headline → is_competitor=true (soft-promotional fishing post from a service provider — NOT a buyer)
- POST: "Here's how we book 30 meetings/month for clients..." → is_competitor=true (case study from competitor)

If the user sells SEO services, an SEO agency posting "Our SEO clients are
seeing 3x growth — anyone want to know how?" is a competitor, NOT a buyer.

CRITICAL: Many "soft promotional" posts disguise themselves as questions
("anyone need help with X? DM me"). When the author is clearly a service
provider in the same category, ALWAYS flag as is_competitor=true even if the
intent_score looks high. Buyer status and competitor status are independent
fields — set both honestly. The pipeline will reject any is_competitor=true
result regardless of intent score.

When unsure / not enough author signal → is_competitor=false.${idealLeadDescription ? `

═══════════════════════════════════════════════════════════════════════════════
PERFECT LEAD MATCH (ICP fit check — independent of buyer & competitor checks)
═══════════════════════════════════════════════════════════════════════════════
The user has explicitly described their PERFECT LEAD as follows:

"""
${idealLeadDescription}
"""

For each post, you must ALSO decide whether the AUTHOR (based on their headline + post content) plausibly fits this description. Set matches_perfect_lead=true if the author's profile signals a reasonable fit, false if they clearly do NOT fit.

Rules:
- This is a SOFT fit check on free-text criteria, NOT a strict keyword match. Use judgment.
- DEFAULT TO matches_perfect_lead=true when the author's role/seniority/industry is ambiguous or unknown — structured ICP filters already enforce hard requirements elsewhere.
- Only set matches_perfect_lead=false when the author's headline CLEARLY contradicts the description (e.g. description says "VP of Marketing at e-commerce brands" and the author is a "Software Engineer at a bank").
- Provide a 1-sentence match_reason explaining the decision.

The pipeline will REJECT any post where matches_perfect_lead=false, regardless of intent score.` : ''}`;

  for (let i = 0; i < postsWithText.length; i += 8) {
    const batch = postsWithText.slice(i, i + 8);
    const postList = batch.map((p, idx) => {
      const authorInfo = p.authorHeadline ? `\nAUTHOR: ${p.authorHeadline}` : '';
      const phraseInfo = p.matchedPhrase ? `\nMATCHED PHRASE: "${p.matchedPhrase}"` : '';
      return `POST ${idx + 1} [id=${p.id}]:\n${p.text.slice(0, 500)}${authorInfo}${phraseInfo}`;
    }).join('\n\n---\n\n');

    // BRUTAL LOG: Step 4 — log every AI input
    for (const p of batch) {
      console.log('[AI_INPUT]', JSON.stringify({
        id: p.id,
        postText: (p.text || '').substring(0, 200),
        keyword: p.keyword,
        authorHeadline: p.authorHeadline,
        matchedPhrase: p.matchedPhrase,
      }));
    }

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
                        reason: { type: 'string', description: 'One sentence explaining the buyer/intent decision' },
                        signal_type: { type: 'string', enum: ['seeking_recommendation', 'actively_evaluating', 'frustrated_with_current', 'problem_aware', 'not_a_buyer'] },
                        is_competitor: { type: 'boolean', description: 'True if the AUTHOR is a service provider in the same/similar space as the user (competitor). Independent of buyer status.' },
                        competitor_reason: { type: 'string', description: 'One sentence explaining why the author is or is not a competitor.' },
                        matches_perfect_lead: { type: 'boolean', description: 'True if the AUTHOR plausibly fits the user\'s free-text "Perfect Lead" description. Default true when unsure.' },
                        match_reason: { type: 'string', description: 'One sentence explaining the perfect-lead match decision.' },
                      },
                      required: ['id', 'is_buyer', 'intent_score', 'reason', 'signal_type', 'is_competitor', 'competitor_reason', 'matches_perfect_lead', 'match_reason'],
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
        // Normalize new fields (backward-compatible default)
        if (typeof cls.is_competitor !== 'boolean') cls.is_competitor = false;
        if (typeof cls.competitor_reason !== 'string') cls.competitor_reason = '';
        // Default ACCEPT when AI omits the perfect-lead fields (back-compat / when description is empty).
        if (typeof cls.matches_perfect_lead !== 'boolean') cls.matches_perfect_lead = true;
        if (typeof cls.match_reason !== 'string') cls.match_reason = '';

        // BRUTAL LOG: Step 4 — log every AI output
        const matchingPost = batch.find((p: any) => p.id === cls.id);
        console.log('[AI_OUTPUT]', JSON.stringify({
          id: cls.id,
          postText: (matchingPost?.text || '').substring(0, 100),
          is_buyer: cls.is_buyer,
          intent_score: cls.intent_score,
          reason: cls.reason,
          signal_type: cls.signal_type,
          is_competitor: cls.is_competitor,
          competitor_reason: cls.competitor_reason,
          matches_perfect_lead: cls.matches_perfect_lead,
          match_reason: cls.match_reason,
          passedThreshold: cls.intent_score >= minIntentScore,
          threshold: minIntentScore,
        }));

        // Competitor short-circuit: reject regardless of intent score.
        if (cls.is_competitor === true) {
          const rejected = { ...cls, is_buyer: false, reason: `competitor: ${cls.competitor_reason || 'author appears to sell similar services'}` };
          results.set(`rejected:${cls.id}`, rejected);
          console.log(`[AI] 🚫 competitor ${cls.id}: ${cls.competitor_reason}`);
          continue;
        }

        // Perfect-lead mismatch short-circuit: only enforced if the user provided a description.
        if (idealLeadDescription && cls.matches_perfect_lead === false) {
          const rejected = { ...cls, is_buyer: false, reason: `perfect_lead_mismatch: ${cls.match_reason || "author does not fit the user's perfect-lead description"}` };
          results.set(`rejected:${cls.id}`, rejected);
          console.log(`[AI] 🚫 perfect-lead-mismatch ${cls.id}: ${cls.match_reason}`);
          continue;
        }

        // Fix 8: belt-and-suspenders — even if AI returns is_buyer=true with a
        // borderline score, reject "problem_aware" unless it's a strong signal.
        // problem_aware = vague pain, not active solution-seeking.
        const isWeakSignal = cls.signal_type === 'problem_aware' && cls.intent_score < 80;
        const isStrongSignalType = ['seeking_recommendation', 'actively_evaluating', 'frustrated_with_current'].includes(cls.signal_type);
        const passesIntent = cls.is_buyer
          && cls.intent_score >= minIntentScore
          && !isWeakSignal
          && (isStrongSignalType || cls.intent_score >= 85);

        if (passesIntent) {
          results.set(cls.id, cls);
          console.log(`[AI] ✅ ${cls.id}: score=${cls.intent_score} type=${cls.signal_type} — ${cls.reason}`);
        } else {
          // Store rejection with negative marker so pipeline can capture sample
          results.set(`rejected:${cls.id}`, cls);
          console.log(`[AI] ❌ ${cls.id}: score=${cls.intent_score} type=${cls.signal_type} weak=${isWeakSignal} — ${cls.reason}`);
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
  // With the new queue model, each invocation processes a SMALL batch (≤ 4 keywords)
  // so we can give it a generous runtime budget. Edge Function hard limit is ~400s.
  const MAX_RUNTIME_MS = 330_000; // 5.5 min
  const hasTime = () => Date.now() - START < MAX_RUNTIME_MS;
  // Heartbeat the task every ~20s so the reaper knows we're alive.
  let lastHeartbeat = 0;
  const heartbeat = async (sb: any, rid?: string, tkey?: string) => {
    if (!rid || !tkey) return;
    const now = Date.now();
    if (now - lastHeartbeat < 20_000) return;
    lastHeartbeat = now;
    try {
      await sb.from('signal_agent_tasks')
        .update({ last_heartbeat_at: new Date().toISOString() })
        .eq('run_id', rid).eq('task_key', tkey);
    } catch { /* non-fatal */ }
  };

  try {
    const reqBody = await req.json();
    const { agent_id, account_id, user_id, list_name, keywords, icp: icpRaw, competitor_companies, business_context, user_company_name, precision_mode, run_id: _run_id, task_key: _task_key, manual_approval, ideal_lead_description } = reqBody;
    const idealLeadDescription = String(ideal_lead_description || '').trim().slice(0, 800);
    if (!agent_id || !account_id || !keywords?.length) {
      return new Response(JSON.stringify({ leads: 0, error: 'Missing required params' }), { status: 400, headers: corsHeaders });
    }

    const UNIPILE_API_KEY = Deno.env.get('UNIPILE_API_KEY')!;
    const UNIPILE_DSN = Deno.env.get('UNIPILE_DSN')!;
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const searchUrl = `https://${UNIPILE_DSN}/api/v1/linkedin/search?account_id=${account_id}`;
    const searchHeaders = { 'X-API-KEY': UNIPILE_API_KEY, 'Content-Type': 'application/json' };

    const ownCompanyLower = (user_company_name || '').toLowerCase().trim();
    const isHighPrecision = precision_mode === 'high_precision';
    // Fix 8 (HARD intent gate): The pre-filter was relaxed in discovery mode, so the AI
    // gate must be much stricter to compensate. Reject anything that isn't an explicit,
    // present-tense, solution-seeking post.
    //   - high_precision: 80 (only the clearest "looking for X right now" posts)
    //   - discovery:      70 (explicit evaluation / frustration / recommendation requests)
    const MIN_INTENT_SCORE = isHighPrecision ? 80 : 70;
    console.log(`[CONFIG] precision_mode="${precision_mode || 'discovery'}" → country+industry filtering ${isHighPrecision ? 'ENABLED' : 'DISABLED (discovery)'}`);

    const icp: ICPFilters = {
      jobTitles: icpRaw?.jobTitles || [],
      industries: icpRaw?.industries || [],
      locations: icpRaw?.locations || [],
      companySizes: icpRaw?.companySizes || [],
      companyTypes: icpRaw?.companyTypes || [],
      excludeKeywords: icpRaw?.excludeKeywords || [],
      competitorCompanies: competitor_companies || [],
      restrictedCountries: (icpRaw?.restrictedCountries || []).map((s: string) => s.toLowerCase()),
      restrictedRoles: (icpRaw?.restrictedRoles || []).map((s: string) => s.toLowerCase()),
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
      // Fix 5: seller-detection layer (sellers using buyer phrases as bait)
      rejected_seller: 0,
      // Fix 7: track new threshold + already_in_contacts (Rule 3 — never update existing)
      min_intent_score: MIN_INTENT_SCORE,
      already_in_contacts: 0,
      inserted: 0,
      // Sample arrays kept tiny — diagnostics jsonb is read by every UI poll.
      sample_prefilter_rejections: [] as Array<{ keyword: string; variants: string[]; postSample: string; reason: string }>,
      sample_ai_rejections: [] as Array<{ postSample: string; is_buyer: boolean; intent_score: number; reason: string }>,
      sample_inserted: [] as Array<{ name: string; headline: string; intentScore: number }>,
    };
    // Cap diagnostic sample arrays to keep the row small (was 50 each → ~50KB rows).
    const SAMPLE_CAP = 5;

    let inserted = 0;
    const globalSeenPostIds = new Set<string>();
    const globalSeenAuthorIds = new Set<string>();

    // ── Per-RUN bandwidth caps ──
    // Profile fetches are the single biggest egress driver (30–80 KB each).
    // Cap them at the RUN level (across all keyword tasks for this run) so
    // a 30-keyword agent can't accidentally pull thousands of profile JSONs.
    const RUN_PROFILE_FETCH_CAP = 50;
    const RUN_INSERT_CAP = 60; // sane ceiling per run; quality > volume
    let runProfileFetchesSoFar = 0;
    let runInsertsSoFar = 0;
    if (_run_id) {
      try {
        // Aggregate profile fetches already done by sibling tasks of this run.
        const { data: doneRows } = await supabase
          .from('signal_agent_tasks')
          .select('diagnostics, leads_found')
          .eq('run_id', _run_id)
          .neq('task_key', _task_key || '');
        for (const r of (doneRows || [])) {
          const d: any = r.diagnostics || {};
          runProfileFetchesSoFar += (d.profile_fetches_attempted || 0);
          runInsertsSoFar += (r.leads_found || 0);
        }
      } catch { /* best effort */ }
    }
    const runHasBudget = () =>
      runProfileFetchesSoFar < RUN_PROFILE_FETCH_CAP &&
      runInsertsSoFar + inserted < RUN_INSERT_CAP;

    // Track consecutive 429s to trigger an extra cool-off if Unipile is unhappy.
    let consecutive429s = 0;

    for (const keyword of keywords) {
      pipelineStats.keywords_processed++;
      if (!hasTime()) { console.log(`[TIMEOUT] Stopping at keyword "${keyword}" (${pipelineStats.keywords_processed}/${keywords.length}) — ${inserted} leads so far, ${keywords.length - pipelineStats.keywords_processed} keywords remaining`); break; }
      if (!runHasBudget()) {
        console.log(`[BUDGET] Run-level cap reached (profiles=${runProfileFetchesSoFar}/${RUN_PROFILE_FETCH_CAP}, inserts=${runInsertsSoFar + inserted}/${RUN_INSERT_CAP}) — stopping early`);
        break;
      }

      // Heartbeat so the reaper doesn't think we're stuck.
      await heartbeat(supabase, _run_id, _task_key);

      // ── Step 1: Fetch ONE page (~25 posts). Bandwidth-first: stop paginating. ──
      // Real intent phrases rarely have more than ~25 high-quality matches per week,
      // and going past page 1 mostly returns noise — at the cost of ~50 KB per page.
      const keywordPosts: any[] = [];
      let cursor: string | null = null;
      const MAX_PAGES = 1;
      const TARGET_POSTS = 25;

      try {
        for (let page = 0; page < MAX_PAGES && hasTime() && keywordPosts.length < TARGET_POSTS; page++) {
          const searchBody: any = { api: 'classic', category: 'posts', keywords: keyword, date_posted: 'past_week', limit: 25 };
          if (cursor) searchBody.cursor = cursor;

          // Retry-with-backoff on Unipile 429 (rate-limit). Up to 5 attempts: 5s, 10s, 20s, 30s, 30s.
          let res: Response | null = null;
          let attempt = 0;
          const MAX_ATTEMPTS = 5;
          const BACKOFFS_MS = [5_000, 10_000, 20_000, 30_000, 30_000];
          while (attempt < MAX_ATTEMPTS) {
            res = await fetch(searchUrl, { method: 'POST', headers: searchHeaders, body: JSON.stringify(searchBody) });
            if (res.status !== 429) break;
            attempt++;
            const backoffMs = BACKOFFS_MS[attempt - 1] + Math.floor(Math.random() * 1500);
            console.warn(`[RATE-LIMIT] keyword "${keyword}" p${page + 1} got 429 — retry ${attempt}/${MAX_ATTEMPTS} in ${backoffMs}ms`);
            if (!hasTime()) break;
            await delay(backoffMs);
          }
          if (!res || !res.ok) {
            const t = res ? await res.text() : 'no response';
            console.error(`keyword "${keyword}" p${page + 1}: HTTP ${res?.status ?? 'n/a'} - ${t.slice(0, 200)}`);
            pipelineStats.unipile_errors++;
            if (res?.status === 429) {
              consecutive429s++;
              // Circuit breaker: 3 consecutive 429s → 30s cool-off
              if (consecutive429s >= 3 && hasTime()) {
                console.warn(`[CIRCUIT-BREAKER] ${consecutive429s} consecutive 429s — sleeping 30s`);
                await delay(30_000);
                consecutive429s = 0;
              }
            }
            break;
          }
          consecutive429s = 0; // success — reset circuit breaker
          const data = await res.json();
          const items = data.items || data.results || [];
          if (items.length === 0) pipelineStats.unipile_empty_responses++;
          // BRUTAL LOG: Step 2 — zero response audit
          if (items.length === 0) {
            console.error('[UNIPILE_ZERO]', JSON.stringify({
              endpoint: searchUrl,
              status: res.status,
              rawResponse: JSON.stringify(data).substring(0, 1000),
              params: JSON.stringify({ ...searchBody, signal: 'keyword_posts' }),
            }));
          }
          keywordPosts.push(...items);
          console.log(`[KEYWORD: "${keyword}"] Fetched ${items.length} posts from Unipile. Cursor: ${data.cursor ?? data.next_cursor ?? 'none'}. Page: ${page + 1}. Running total: ${keywordPosts.length}`);
          cursor = data.cursor || data.next_cursor || null;
          if (!cursor || items.length === 0) break;
          // Inter-page spacing
          if (page < MAX_PAGES - 1 && hasTime()) await delay(1200 + Math.floor(Math.random() * 600));
        }
      } catch (e) {
        console.error(`Keyword search "${keyword}":`, e);
        pipelineStats.unipile_errors++;
      }

      // Inter-keyword spacing — generous to stay well under Unipile's per-account search budget.
      // Target: ~12 keywords/min ceiling per account.
      if (hasTime()) await delay(4000 + Math.floor(Math.random() * 2000));

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

        // Fix 5: SELLER DETECTION — reject before AI to save classification budget.
        // A lead-gen agency posting "we help companies with outbound" attracts buyers
        // but is NOT a buyer themselves. Add to contacts table = poisoned pipeline.
        const authorHl = authorData?.headline || authorData?.title || '';
        if (isSeller(postText, authorHl)) {
          pipelineStats.rejected_seller++;
          if (pipelineStats.sample_prefilter_rejections.length < SAMPLE_CAP) {
            pipelineStats.sample_prefilter_rejections.push({
              keyword,
              variants: diagVariants.slice(0, 5),
              postSample: postText.substring(0, 160),
              reason: 'seller_detected',
            });
          }
          console.log(`[SELLER] ❌ "${(authorHl || 'unknown').slice(0, 60)}" — sample: "${postText.substring(0, 100)}"`);
          continue;
        }

        const filterResult = preFilterPost(postText, keyword, authorData, icp, isHighPrecision);

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
          // Capture sample rejections (small cap to keep diagnostics tiny)
          if (pipelineStats.sample_prefilter_rejections.length < SAMPLE_CAP) {
            pipelineStats.sample_prefilter_rejections.push({
              keyword,
              variants: diagVariants.slice(0, 5),
              postSample: postText.substring(0, 160),
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
          if (pipelineStats.sample_ai_rejections.length < SAMPLE_CAP) {
            pipelineStats.sample_ai_rejections.push({
              postSample: p.text.substring(0, 160),
              is_buyer: rejectedCls.is_buyer,
              intent_score: rejectedCls.intent_score,
              reason: rejectedCls.reason,
            });
          }
        } else {
          pipelineStats.rejected_ai_not_buyer++;
          if (pipelineStats.sample_ai_rejections.length < SAMPLE_CAP) {
            pipelineStats.sample_ai_rejections.push({
              postSample: p.text.substring(0, 160),
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
        if (!runHasBudget()) {
          console.log(`[BUDGET] mid-keyword stop: profiles=${runProfileFetchesSoFar}/${RUN_PROFILE_FETCH_CAP}, inserts=${runInsertsSoFar + inserted}/${RUN_INSERT_CAP}`);
          break;
        }

        const postId = post.social_id || post.id || post.provider_id;
        const intentData = intentResults.get(postId);
        const authorData = post.author || post.actor || post.author_detail || null;
        if (!authorData) { keywordSkipped.noAuthor++; pipelineStats.rejected_no_author++; continue; }

        let author = normalizeProfile({ ...authorData });
        let authorId = extractLinkedinProfileId(author);

        // In-memory dedup
        if (authorId && globalSeenAuthorIds.has(authorId)) { keywordSkipped.dupAuthor++; pipelineStats.rejected_author_dedup++; continue; }
        if (authorId) globalSeenAuthorIds.add(authorId);

        // Early dedup against DB — Rule 3: HARD SKIP (no update, no re-insert)
        if (authorId) {
          const { data: existing } = await supabase.from('contacts').select('id').eq('user_id', user_id).eq('linkedin_profile_id', authorId).limit(1);
          if (existing && existing.length > 0) {
            keywordSkipped.earlyDedup++;
            pipelineStats.rejected_early_db_dedup++;
            pipelineStats.already_in_contacts++;
            continue;
          }
        }

        // ── BANDWIDTH-FIRST: pre-screen on the lightweight author payload included
        // in the search response BEFORE doing the expensive full profile fetch.
        // This drops ~70% of profile fetches without losing real leads, because
        // posts that already passed the AI intent classifier with a real-looking
        // author headline almost always represent a genuine person.
        const previewHeadline = (authorData.headline || authorData.title || '').trim();
        if (previewHeadline) {
          if (isClearlyIrrelevant(previewHeadline)) {
            keywordSkipped.irrelevant++;
            pipelineStats.rejected_irrelevant_title++;
            continue;
          }
          // Own-company exclusion using preview text only
          if (ownCompanyLower && ownCompanyLower.length > 1 && previewHeadline.toLowerCase().includes(ownCompanyLower)) {
            keywordSkipped.ownCompany++;
            pipelineStats.rejected_own_company++;
            continue;
          }
        }

        // Full profile fetch (only for genuinely new leads that survived pre-screen)
        pipelineStats.profile_fetches_attempted++;
        runProfileFetchesSoFar++;
        const fullAuthor = await fetchFullProfile(authorData, account_id, UNIPILE_API_KEY, UNIPILE_DSN);
        if (fullAuthor) {
          author = fullAuthor;
          const newId = extractLinkedinProfileId(author);
          if (newId && newId !== authorId) {
            if (globalSeenAuthorIds.has(newId)) { keywordSkipped.dupAuthor++; pipelineStats.rejected_author_dedup++; continue; }
            globalSeenAuthorIds.add(newId);
            const { data: existing } = await supabase.from('contacts').select('id').eq('user_id', user_id).eq('linkedin_profile_id', newId).limit(1);
            if (existing && existing.length > 0) { keywordSkipped.earlyDedup++; pipelineStats.rejected_early_db_dedup++; pipelineStats.already_in_contacts++; continue; }
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

        // Restricted countries / roles (hard ban — applies in both modes)
        if (isRestricted(author, icp.restrictedCountries, icp.restrictedRoles)) {
          console.log(`[PIPELINE] ⏭ ${lpid}: restricted (country or role)`);
          keywordSkipped.excluded++;
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

        // ── POST-PROFILE country/industry re-check with full data (high_precision only) ──
        if (isHighPrecision && icp.locations.length > 0) {
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
          intentData?.intent_score, intentData?.reason, manual_approval,
        );

        if (result === 'inserted') {
          keywordInserted++;
          inserted++;
          pipelineStats.inserted++;
          runInsertsSoFar++;
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

    // BRUTAL LOG: Step 6 — single-line task summary
    console.log('[TASK_FINAL_SUMMARY]', JSON.stringify({
      signal: 'keyword_posts',
      rawFetched: pipelineStats.total_posts_fetched,
      afterDedup: pipelineStats.posts_after_dedup,
      passedPrefilter: pipelineStats.passed_prefilter,
      passedAI: pipelineStats.passed_ai,
      profilesFetched: pipelineStats.profile_fetches_attempted,
      passedICP: pipelineStats.inserted + pipelineStats.rejected_early_db_dedup,
      inserted: pipelineStats.inserted,
      rejections: {
        urlBroken: pipelineStats.unipile_empty_responses,
        noIcpMatch: pipelineStats.rejected_irrelevant_title,
        ownCompany: pipelineStats.rejected_own_company,
        irrelevantTitle: pipelineStats.rejected_irrelevant_title,
        dbDedup: pipelineStats.rejected_early_db_dedup,
        aiRejected: pipelineStats.rejected_ai_not_buyer + pipelineStats.rejected_ai_low_score,
        prefilterPhrase: pipelineStats.rejected_no_phrase_match,
        wrongCountry: pipelineStats.rejected_wrong_country,
        wrongIndustry: pipelineStats.rejected_wrong_industry,
      },
    }));

    console.log(`signal-keyword-posts: ${inserted} leads total in ${Math.round((Date.now() - START) / 1000)}s`);

    // Self-report task completion if run_id and task_key were provided
    const run_id = _run_id;
    const task_key = _task_key;
    if (run_id && task_key) {
      try {
        await supabase.from('signal_agent_tasks')
          .update({ status: 'done', leads_found: inserted, completed_at: new Date().toISOString(), diagnostics: pipelineStats } as any)
          .eq('run_id', run_id).eq('task_key', task_key);

        // Check if all tasks for this run are now complete
        const { data: pendingTasks } = await supabase.from('signal_agent_tasks')
          .select('id')
          .eq('run_id', run_id)
          .in('status', ['pending', 'running'])
          .limit(1);

        if (!pendingTasks || pendingTasks.length === 0) {
          // All tasks done — finalize the run
          const { data: allTasks } = await supabase.from('signal_agent_tasks')
            .select('leads_found, status, rejected_profiles_sample, signal_type')
            .eq('run_id', run_id);
          const totalLeads = (allTasks || []).reduce((sum: number, t: any) => sum + (t.leads_found || 0), 0);
          const completedCount = (allTasks || []).length;

          // Aggregate rejected profile samples (cap 200)
          const aggregatedRejected: any[] = [];
          for (const t of allTasks || []) {
            const sample = (t.rejected_profiles_sample || []) as any[];
            for (const p of sample) {
              aggregatedRejected.push({ ...p, signalType: p.signalType ?? t.signal_type });
              if (aggregatedRejected.length >= 200) break;
            }
            if (aggregatedRejected.length >= 200) break;
          }

          await supabase.from('signal_agent_runs').update({
            status: 'done', total_leads: totalLeads, completed_tasks: completedCount,
            completed_at: new Date().toISOString(),
            rejected_profiles_sample: aggregatedRejected,
          }).eq('id', run_id);
          console.log(`[SELF-REPORT] Run ${run_id} finalized: ${totalLeads} total leads, ${aggregatedRejected.length} rejected sampled`);

          // Update agent results_count and send notification
          if (agent_id) {
            const { data: agentData } = await supabase.from('signal_agents').select('user_id, leads_list_name, name, results_count').eq('id', agent_id).single();
            if (agentData) {
              const lName = agentData.leads_list_name || agentData.name || 'Signal Leads';
              const { data: agentList } = await supabase.from('lists').select('id').eq('user_id', agentData.user_id).eq('name', lName).maybeSingle();
              let newCount: number | null = null;
              if (agentList) {
                const { count } = await supabase.from('contact_lists').select('id', { count: 'exact', head: true }).eq('list_id', agentList.id);
                if (typeof count === 'number' && count > 0) {
                  newCount = count;
                }
              }
              // Fallback: never reset to 0 — keep existing count + new leads
              if (newCount === null) {
                newCount = (agentData.results_count || 0) + totalLeads;
              }
              await supabase.from('signal_agents').update({ results_count: newCount, last_launched_at: new Date().toISOString() }).eq('id', agent_id);
              if (totalLeads > 0) {
                await supabase.from('notifications').insert({
                  user_id: agentData.user_id,
                  title: `${agentData.name || 'Signal Agent'}: ${totalLeads} new leads`,
                  body: `Your signal agent discovered ${totalLeads} new leads matching your ICP.`,
                  type: 'signal', link: '/contacts',
                });
              }
            }
          }

          // Trigger AI suggestions if run was thin or had many ICP rejections
          if (totalLeads < 20 || aggregatedRejected.length > 50) {
            try {
              // @ts-ignore EdgeRuntime
              EdgeRuntime.waitUntil(
                fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/generate-agent-suggestions`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` },
                  body: JSON.stringify({ runId: run_id, agentId: agent_id }),
                }).catch((e) => console.warn('[SUGGESTIONS] trigger failed:', e))
              );
              console.log(`[SUGGESTIONS] Triggered for run ${run_id} (leads=${totalLeads}, rejected=${aggregatedRejected.length})`);
            } catch (e) {
              console.warn('[SUGGESTIONS] waitUntil unavailable:', e);
            }
          }
        }
      } catch (e) {
        console.warn(`[SELF-REPORT] Failed to update task status:`, e);
      }
    }

    return new Response(JSON.stringify({ leads: inserted }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('signal-keyword-posts error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error', leads: 0 }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
