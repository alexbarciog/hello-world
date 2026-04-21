const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ─── Shared types & helpers (same as signal-keyword-posts) ────────────────────

interface ICPFilters { jobTitles: string[]; industries: string[]; locations: string[]; companySizes: string[]; companyTypes: string[]; excludeKeywords: string[]; competitorCompanies: string[]; restrictedCountries: string[]; restrictedRoles: string[]; }
interface MatchResult { titleMatch: boolean; industryMatch: boolean; locationMatch: boolean; score: number; matchedFields: string[]; }

// Timer moved inside request handler (fixes warm isolate bug)

const BUYING_INTENT_KEYWORDS = ['ceo','cto','coo','cfo','cmo','cro','cpo','cio','founder','co-founder','cofounder','owner','partner','president','principal','vp','vice president','director','head of','chief','general manager','managing director','svp','evp','avp'];
const REJECT_TITLES = ['software developer','software engineer','frontend developer','backend developer','full stack developer','fullstack developer','web developer','mobile developer','junior developer','senior developer','staff engineer','intern','data analyst','qa engineer','test engineer','devops engineer','graphic designer','ui designer','ux designer','student','fresher','trainee','apprentice','accountant','bookkeeper','cashier','clerk','receptionist','administrative assistant','office assistant'];

// ─── Blacklist of generic/lifestyle hashtags that produce false positives ─────
const GENERIC_BLACKLIST = new Set([
  'sales', 'marketing', 'leadership', 'motivation', 'success', 'growth',
  'entrepreneur', 'business', 'innovation', 'networking', 'mindset',
  'hustle', 'grateful', 'blessed', 'family', 'weekend', 'vacation',
  'holiday', 'inspiration', 'grind', 'lifestyle', 'love', 'happiness',
  'thankful', 'morning', 'coffee', 'fitness', 'health', 'travel',
]);

function normalizeText(value: string): string { return (value || '').toLowerCase().replace(/[^a-z0-9\s]/g, '').trim(); }
function fuzzyMatchList(value: string, candidates: string[]): boolean { const h = normalizeText(value); if (!h) return false; return candidates.some(c => { const n = normalizeText(c); return n ? (h.includes(n) || n.includes(h)) : false; }); }

function scoreProfileAgainstICP(profile: any, icp: ICPFilters): MatchResult {
  const title = profile.headline || profile.title || profile.role || '';
  const industry = profile.industry || '';
  const location = profile.location || profile.country || '';
  const titleMatch = icp.jobTitles.length === 0 || fuzzyMatchList(title, icp.jobTitles);
  const industryMatch = icp.industries.length === 0 || fuzzyMatchList(industry, icp.industries);
  const locationMatch = icp.locations.length === 0 || fuzzyMatchList(location, icp.locations);
  const matchedFields: string[] = []; let score = 0;
  if (icp.jobTitles.length > 0 && titleMatch) { score += 40; matchedFields.push('title'); } else if (icp.jobTitles.length === 0) score += 20;
  if (icp.industries.length > 0 && industryMatch) { score += 30; matchedFields.push('industry'); } else if (icp.industries.length === 0) score += 15;
  if (icp.locations.length > 0 && locationMatch) { score += 20; matchedFields.push('location'); } else if (icp.locations.length === 0) score += 10;
  if (icp.companySizes.length > 0) { const cs = profile.company_size || profile.current_company?.employee_count || ''; if (cs && fuzzyMatchList(String(cs), icp.companySizes)) { score += 10; matchedFields.push('company_size'); } } else score += 5;
  return { titleMatch, industryMatch, locationMatch, score: Math.min(100, score), matchedFields };
}

function hasBuyingIntent(hl: string): boolean { return BUYING_INTENT_KEYWORDS.some(kw => (hl||'').toLowerCase().includes(kw)); }
function isClearlyIrrelevant(hl: string): boolean { return REJECT_TITLES.some(kw => (hl||'').toLowerCase().includes(kw)); }
function classifyContact(match: MatchResult, icp: ICPFilters, headline?: string): 'hot'|'warm'|'cold'|null {
  const hl = headline || '';
  if (isClearlyIrrelevant(hl)) return null;
  if (icp.jobTitles.length > 0 && match.titleMatch) return 'hot';
  if (hasBuyingIntent(hl) && (icp.industries.length === 0 || match.industryMatch)) return 'hot';
  if (hasBuyingIntent(hl)) return 'warm';
  if (icp.industries.length > 0 && match.industryMatch && hl.length > 5) return 'warm';
  if (hl.length > 5) return 'cold';
  if (icp.jobTitles.length === 0 && icp.industries.length === 0) return 'cold';
  return null;
}
function matchesTitleOrIndustry(m: MatchResult, icp: ICPFilters, hl?: string): boolean { return classifyContact(m, icp, hl) !== null; }

function relaxedIndustryMatch(profile: any, industries: string[]): boolean {
  if (industries.length === 0) return true;
  const text = [profile.industry||'', profile.headline||profile.title||'', profile.company||profile.current_company?.name||''].join(' ').toLowerCase();
  return industries.some(ind => { const words = normalizeText(ind).split(/\s+/).filter(w => w.length > 3); return words.some(word => text.includes(word)); });
}
function matchesIndustry(profile: any, match: MatchResult, icp: ICPFilters): boolean {
  if (icp.industries.length === 0) return true;
  if (match.industryMatch) return true;
  // If profile has NO industry data at all, don't penalize
  const industryData = (profile.industry || '').trim();
  if (!industryData) return true;
  return relaxedIndustryMatch(profile, icp.industries);
}

function isExcluded(profile: any, excludeKeywords: string[], competitorCompanies: string[] = []): boolean {
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
  const profileUrl = (profile.linkedin_url || profile.public_url || profile.profile_url || '').toLowerCase();
  if (competitorCompanies.length > 0) {
    const allText = companyFields.map(f => f.toLowerCase()).join(' ') + ' ' + profileUrl;
    for (const c of competitorCompanies) { if (allText.includes(c)) return true; }
  }
  if (excludeKeywords.length === 0) return false;
  const text = [...companyFields, profile.industry].filter(Boolean).join(' ').toLowerCase();
  return excludeKeywords.some(kw => text.includes(kw));
}

function isRestricted(profile: any, restrictedCountries: string[], restrictedRoles: string[]): boolean {
  if (restrictedCountries.length > 0) {
    const loc = [profile.location, profile.country, profile.city, profile.region].filter(Boolean).join(' ').toLowerCase();
    if (restrictedCountries.some((c) => loc.includes(c))) return true;
  }
  if (restrictedRoles.length > 0) {
    const role = [profile.headline, profile.title, profile.role].filter(Boolean).join(' ').toLowerCase();
    if (restrictedRoles.some((r) => role.includes(r))) return true;
  }
  return false;
}

function unipileGet(path: string, apiKey: string, dsn: string) { return fetch(`https://${dsn}${path}`, { headers: { 'X-API-KEY': apiKey } }); }
function normalizeProfile(item: any): any {
  if (!item.first_name && item.name) { const parts = item.name.split(' '); item.first_name = parts[0]; item.last_name = parts.slice(1).join(' ') || ''; }
  return item;
}
async function fetchProfileIfNeeded(item: any, accountId: string, apiKey: string, dsn: string): Promise<any|null> {
  const norm = normalizeProfile({ ...item });
  if (norm.first_name && (norm.headline || norm.title)) return norm;
  const id = item.public_identifier||item.provider_id||item.public_id||item.author_id;
  const numericOrUrn = item.id;
  const fetchId = id || (numericOrUrn && !String(numericOrUrn).startsWith('urn:') && !String(numericOrUrn).startsWith('ACo') ? numericOrUrn : null);
  if (!fetchId) return norm.first_name ? norm : null;
  try { const res = await unipileGet(`/api/v1/linkedin/profile/${fetchId}?account_id=${accountId}`, apiKey, dsn); if (!res.ok) { await res.text(); return norm.first_name ? norm : null; } return normalizeProfile(await res.json()); } catch { return norm.first_name ? norm : null; }
}
function delay(ms: number) { return new Promise(r => setTimeout(r, ms)); }

async function ensureList(supabase: any, userId: string, listName: string, agentId: string): Promise<string|null> {
  const { data: existing } = await supabase.from('lists').select('id, source_agent_id').eq('user_id', userId).eq('name', listName).limit(1);
  if (existing?.length > 0) {
    if (!existing[0].source_agent_id) await supabase.from('lists').update({ source_agent_id: agentId }).eq('id', existing[0].id);
    return existing[0].id;
  }
  const { data: created, error } = await supabase.from('lists').insert({ user_id: userId, name: listName, source_agent_id: agentId }).select('id').single();
  if (error) { console.error(`Create list error: ${error.message}`); return null; } return created?.id || null;
}

// Fix 5: Seller detection — reject engagers whose post/headline screams "I sell this"
const SELLER_PHRASES = [
  'we help', 'our agency', 'our services', 'book a call',
  'check out our', 'dm me for', 'link in bio', 'we offer',
  'our clients', 'free consultation', 'i help companies',
  'we specialize in', 'we work with', 'helping companies',
];
function isSeller(postText: string, authorHeadline: string): boolean {
  const text = ((postText || '') + ' ' + (authorHeadline || '')).toLowerCase();
  return SELLER_PHRASES.some(p => text.includes(p));
}

// Rule 3 (Hard Skip): returns 'exists' if profile already in contacts
async function insertContact(supabase: any, profile: any, userId: string, agentId: string, listName: string, match: MatchResult, signal: string, signalPostUrl: string|null, icp?: ICPFilters, manualApproval?: boolean): Promise<'inserted'|'exists'|'failed'> {
  const linkedinProfileId = profile.public_id||profile.public_identifier||profile.provider_id||profile.id;
  if (!linkedinProfileId) return 'failed';
  const { data: existing } = await supabase.from('contacts').select('id').eq('user_id', userId).eq('linkedin_profile_id', linkedinProfileId).limit(1);
  if (existing?.length > 0) return 'exists';
  const firstName = profile.first_name||profile.name?.split(' ')[0]||'Unknown';
  const lastName = profile.last_name||profile.name?.split(' ').slice(1).join(' ')||'';
  const hl = profile.headline||profile.title||'';
  const emptyIcp: ICPFilters = { jobTitles:[],industries:[],locations:[],companySizes:[],companyTypes:[],excludeKeywords:[],competitorCompanies:[],restrictedCountries:[],restrictedRoles:[] };
  const relevanceTier = classifyContact(match, icp||emptyIcp, hl)||'cold';
  const signalAHit = true; const signalBHit = match.score >= 60; const signalCHit = match.score >= 80;
  const aiScore = Math.min(3, [signalAHit,signalBHit,signalCHit].filter(Boolean).length);
  const { data: inserted, error } = await supabase.from('contacts').insert({
    user_id: userId, first_name: firstName, last_name: lastName, title: profile.headline||profile.title||null,
    company: profile.company||profile.current_company?.name||null,
    linkedin_url: profile.linkedin_url||profile.public_url||profile.profile_url||(linkedinProfileId ? `https://www.linkedin.com/in/${linkedinProfileId}` : null),
    linkedin_profile_id: linkedinProfileId, source_campaign_id: null, signal, signal_post_url: signalPostUrl,
    ai_score: aiScore, signal_a_hit: signalAHit, signal_b_hit: signalBHit, signal_c_hit: signalCHit,
    email_enriched: false, list_name: listName,
    company_icon_color: ['orange','blue','green','purple','pink','gray'][Math.floor(Math.random()*6)],
    relevance_tier: relevanceTier,
    approval_status: manualApproval ? 'pending' : 'auto_approved',
  }).select('id').single();
  if (error) { console.error(`Insert contact error: ${error.message}`); return 'failed'; }
  if (inserted?.id && listName) { const listId = await ensureList(supabase, userId, listName, agentId); if (listId) await supabase.from('contact_lists').insert({ contact_id: inserted.id, list_id: listId }); }
  return 'inserted';
}

// ─── AI Post Relevance Filter ─────────────────────────────────────────────────

function extractPostText(post: any): string {
  return (post.text || post.commentary || post.description || post.title || '').trim();
}

function isBlacklistOnlyMatch(hashtag: string): boolean {
  const clean = normalizeText(hashtag.replace(/^#/, ''));
  // Check if the hashtag itself is a blacklisted generic term
  // For CamelCase hashtags, split and check each word
  const words = clean.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase().split(/\s+/).filter(w => w.length > 0);
  return words.length > 0 && words.every(w => GENERIC_BLACKLIST.has(w));
}

async function filterIrrelevantPosts(
  posts: { id: string; text: string; hashtag: string; authorHeadline?: string; authorCompany?: string }[],
  businessContext: string,
  idealLeadDescription: string = '',
): Promise<{ validIds: Set<string>; perfectLeadMismatchIds: Set<string> }> {
  const validIds = new Set<string>();
  const perfectLeadMismatchIds = new Set<string>();

  const postsWithText = posts.filter(p => {
    if (!p.text || p.text.length < 20) {
      console.log(`[RELEVANCE] Skipped post ${p.id}: no/short text (${p.text?.length || 0} chars)`);
      return false;
    }
    return true;
  });

  if (postsWithText.length === 0) return { validIds, perfectLeadMismatchIds };

  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    console.warn('[RELEVANCE] No LOVABLE_API_KEY — skipping AI filter');
    postsWithText.forEach(p => validIds.add(p.id));
    return { validIds, perfectLeadMismatchIds };
  }

  const baseSystemPrompt = businessContext
    ? `You are a LinkedIn buying-intent classifier for B2B sales prospecting.

The user's company sells: "${businessContext}"

For each LinkedIn post, classify the post author into one of three categories:

1. BUYER_INTENT (relevant=true) — The post author has a genuine problem, need, challenge, or interest that the user's company could solve. They are a POTENTIAL CUSTOMER.

2. SELF_PROMOTER (relevant=false) — The post author is promoting, advertising, or selling their OWN similar service, product, or tool. They are a competitor or fellow seller — NOT a buyer.

3. IRRELEVANT (relevant=false) — Personal content, motivational fluff, lifestyle posts, metaphorical stories, or content completely unrelated to what the user sells.

CRITICAL: Only mark relevant=true if the author would realistically BUY "${businessContext}". Self-promoters and irrelevant = relevant=false.`
    : `You are a LinkedIn post relevance classifier for B2B sales prospecting. Determine if posts contain genuine BUSINESS/PROFESSIONAL content with potential buying intent.

RELEVANT: business challenges, product needs, pain points, buying decisions.
IRRELEVANT: personal, lifestyle, self-promotion, metaphorical stories.

Be strict.`;

  const systemPrompt = idealLeadDescription
    ? `${baseSystemPrompt}

═══════════════════════════════════════════════════════════════════════════════
PERFECT LEAD MATCH (ICP fit check on AUTHOR)
═══════════════════════════════════════════════════════════════════════════════
The user has explicitly described their PERFECT LEAD as follows:

"""
${idealLeadDescription}
"""

For each post, ALSO decide whether the AUTHOR (based on their headline + company) plausibly fits this description.
- DEFAULT TO matches_perfect_lead=true when the role/seniority/industry is ambiguous or unknown.
- Only set matches_perfect_lead=false when the author headline/company CLEARLY contradicts the description.
- The pipeline will SKIP any post where matches_perfect_lead=false.`
    : baseSystemPrompt;

  const schemaProps: Record<string, any> = {
    id: { type: 'string' },
    relevant: { type: 'boolean' },
    reason: { type: 'string', description: 'Brief: buyer_intent, self_promoter, or irrelevant' },
  };
  const required = ['id', 'relevant', 'reason'];
  if (idealLeadDescription) {
    schemaProps.matches_perfect_lead = { type: 'boolean', description: 'True if author plausibly fits user\'s "Perfect Lead" description. Default true when unsure.' };
    schemaProps.match_reason = { type: 'string' };
    required.push('matches_perfect_lead', 'match_reason');
  }

  for (let i = 0; i < postsWithText.length; i += 10) {
    const batch = postsWithText.slice(i, i + 10);
    const postList = batch.map((p, idx) => {
      const authorLine = (p.authorHeadline || p.authorCompany)
        ? `\nAUTHOR: ${p.authorHeadline || ''}${p.authorCompany ? ` @ ${p.authorCompany}` : ''}`
        : '';
      return `POST ${idx + 1} [id=${p.id}]:${authorLine}\n${p.text.slice(0, 400)}`;
    }).join('\n\n');

    try {
      const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'google/gemini-3-flash-preview',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Classify each post. Only BUYER_INTENT = relevant=true.\n\n${postList}` },
          ],
          tools: [{
            type: 'function',
            function: {
              name: 'classify_posts',
              description: 'Return relevance classification for each post',
              parameters: {
                type: 'object',
                properties: {
                  results: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: schemaProps,
                      required,
                      additionalProperties: false,
                    },
                  },
                },
                required: ['results'],
                additionalProperties: false,
              },
            },
          }],
          tool_choice: { type: 'function', function: { name: 'classify_posts' } },
        }),
      });

      if (!res.ok) {
        console.error(`[RELEVANCE] AI error ${res.status}`);
        await res.text();
        batch.forEach(p => validIds.add(p.id));
        continue;
      }

      const aiData = await res.json();
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      if (!toolCall) { batch.forEach(p => validIds.add(p.id)); continue; }

      const result = JSON.parse(toolCall.function.arguments);
      const classifications = result.results || [];
      let relevant = 0, irrelevant = 0, mismatch = 0;
      for (const cls of classifications) {
        // Perfect-lead gate (when description provided)
        if (idealLeadDescription && cls.matches_perfect_lead === false) {
          perfectLeadMismatchIds.add(cls.id);
          mismatch++;
          console.log(`[AI] 🚫 perfect-lead-mismatch: post ${cls.id} — ${cls.match_reason || ''}`);
          continue;
        }
        if (cls.relevant) { validIds.add(cls.id); relevant++; console.log(`[RELEVANCE] ✅ ${cls.id}: ${cls.reason}`); }
        else { console.log(`[RELEVANCE] ❌ Filtered ${cls.id}: ${cls.reason}`); irrelevant++; }
      }
      for (const p of batch) {
        if (!classifications.some((c: any) => c.id === p.id)) validIds.add(p.id);
      }
      console.log(`[RELEVANCE] Batch: ${relevant} buyer_intent, ${irrelevant} filtered, ${mismatch} perfect-lead-mismatch`);
    } catch (e) {
      console.error('[RELEVANCE] AI call failed:', e);
      batch.forEach(p => validIds.add(p.id));
    }
  }

  return { validIds, perfectLeadMismatchIds };
}

// ─── Main Handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { agent_id, account_id, user_id, list_name, hashtags, icp: icpRaw, competitor_companies, business_context, ideal_lead_description, run_id, task_key, manual_approval } = await req.json();
    const idealLeadDescription = String(ideal_lead_description || '').trim().slice(0, 800);
    const START = Date.now();
    const MAX_RUNTIME_MS = 105_000;
    const hasTime = () => Date.now() - START < MAX_RUNTIME_MS;

    if (!agent_id || !account_id || !hashtags?.length) {
      return new Response(JSON.stringify({ leads: 0, error: 'Missing required params' }), { status: 400, headers: corsHeaders });
    }

    const UNIPILE_API_KEY = Deno.env.get('UNIPILE_API_KEY')!;
    const UNIPILE_DSN = Deno.env.get('UNIPILE_DSN')!;
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    const icp: ICPFilters = {
      jobTitles: icpRaw?.jobTitles||[], industries: icpRaw?.industries||[], locations: icpRaw?.locations||[],
      companySizes: icpRaw?.companySizes||[], companyTypes: icpRaw?.companyTypes||[],
      excludeKeywords: icpRaw?.excludeKeywords||[], competitorCompanies: competitor_companies||[],
      restrictedCountries: (icpRaw?.restrictedCountries||[]).map((s: string) => s.toLowerCase()),
      restrictedRoles: (icpRaw?.restrictedRoles||[]).map((s: string) => s.toLowerCase()),
    };

    let inserted = 0;
    let hotWarmCount = 0; let coldCount = 0;
    const COLD_CAP = 0.2;
    function canInsertCold() { const total = hotWarmCount + coldCount; return total === 0 || coldCount / (total + 1) < COLD_CAP; }
    const allPosts: any[] = [];

    // Per-task diagnostics
    const diag: Record<string, number> = {
      hashtags_searched: 0,
      raw_posts: 0,
      ai_filtered_posts: 0,
      reactions_fetched: 0,
      total_engagers_raw: 0,
      excluded_no_icp_match: 0,
      excluded_competitor: 0,
      rejected_seller: 0,
      already_in_contacts: 0,
      cold_capped: 0,
      inserted: 0,
      perfect_lead_mismatch: 0,
    };

    console.log('[FIX2_DEPLOYED]', { signal: 'hashtag_engagement', file: 'signal-hashtag-engagement', hashtagCount: hashtags.length });

    // Phase 1: Search posts per hashtag with cursor pagination (up to 3 pages)
    for (let tag of hashtags) {
      if (!hasTime()) break;
      if (!tag.startsWith('#')) tag = `#${tag}`;
      diag.hashtags_searched++;
      await delay(150);
      let cursor: string | null = null;
      const MAX_PAGES = 3;
      try {
        for (let page = 0; page < MAX_PAGES && hasTime(); page++) {
          const searchBody: any = { api: 'classic', category: 'posts', keywords: tag, date_posted: 'past_week', limit: 30 };
          if (cursor) searchBody.cursor = cursor;
          const res = await fetch(`https://${UNIPILE_DSN}/api/v1/linkedin/search?account_id=${account_id}`, {
            method: 'POST',
            headers: { 'X-API-KEY': UNIPILE_API_KEY, 'Content-Type': 'application/json' },
            body: JSON.stringify(searchBody),
          });
          if (!res.ok) { const t = await res.text(); console.error(`hashtag "${tag}" page ${page+1}: HTTP ${res.status} - ${t.slice(0,200)}`); break; }
          const data = await res.json();
          const items = data.items || data.results || [];
          console.log(`hashtag "${tag}" page ${page+1}: ${items.length} posts`);
          for (const item of items) allPosts.push({ ...item, _hashtag: tag });
          cursor = data.cursor || data.next_cursor || null;
          if (!cursor || items.length === 0) break;
          await delay(200);
        }
      } catch (e) { console.error(`Hashtag "${tag}":`, e); }
    }
    diag.raw_posts = allPosts.length;

    // Sort by engagement, take top posts
    const topPosts = allPosts
      .sort((a, b) => ((b.likes_count||0)+(b.comments_count||0)) - ((a.likes_count||0)+(a.comments_count||0)))
      .slice(0, 60);

    // ─── AI Relevance Filter: buyer-intent + perfect-lead match ───────────
    const postsForFilter = topPosts.map(p => {
      const author = p.author || p.user || {};
      return {
        id: p.social_id || p.id || p.provider_id || String(Math.random()),
        text: extractPostText(p),
        hashtag: p._hashtag || '',
        authorHeadline: String(author.headline || author.title || '').slice(0, 200),
        authorCompany: String(author.company || author.current_company?.name || '').slice(0, 100),
      };
    });
    const { validIds: relevantPostIds, perfectLeadMismatchIds } = await filterIrrelevantPosts(postsForFilter, business_context || '', idealLeadDescription);
    diag.perfect_lead_mismatch += perfectLeadMismatchIds.size;
    const filteredPosts = topPosts.filter(p => {
      const id = p.social_id || p.id || p.provider_id;
      return relevantPostIds.has(id);
    });
    diag.ai_filtered_posts = filteredPosts.length;
    console.log(`[RELEVANCE] ${topPosts.length} posts → ${filteredPosts.length} after AI filter (${perfectLeadMismatchIds.size} perfect-lead-mismatch)`);

    // Phase 2: Scan engagers on each filtered post
    for (const post of filteredPosts) {
      if (!hasTime()) break;
      await delay(150);
      const postId = post.social_id || post.id || post.provider_id;
      if (!postId) continue;

      try {
        const reactionsRes = await unipileGet(`/api/v1/posts/${postId}/reactions?account_id=${account_id}&limit=25`, UNIPILE_API_KEY, UNIPILE_DSN);
        if (!reactionsRes.ok) { await reactionsRes.text(); continue; }
        const reactionsData = await reactionsRes.json();
        const engagers = (reactionsData.items || []).slice(0, 25);
        diag.reactions_fetched += engagers.length;
        diag.total_engagers_raw += engagers.length;
        const postUrl = post.url || post.share_url || post.permalink || `https://www.linkedin.com/feed/update/${postId}`;
        const postText = extractPostText(post);

        for (const engager of engagers) {
          if (!hasTime()) break;
          const profile = engager.author || engager;
          const fullProfile = await fetchProfileIfNeeded(profile, account_id, UNIPILE_API_KEY, UNIPILE_DSN);
          if (!fullProfile) continue;
          const match = scoreProfileAgainstICP(fullProfile, icp);
          const hl = fullProfile.headline || fullProfile.title || '';
          if (!matchesTitleOrIndustry(match, icp, hl)) { diag.excluded_no_icp_match++; continue; }
          if (!matchesIndustry(fullProfile, match, icp)) { diag.excluded_no_icp_match++; continue; }
          if (isRestricted(fullProfile, icp.restrictedCountries, icp.restrictedRoles)) { diag.excluded_competitor++; continue; }
          if (isExcluded(fullProfile, icp.excludeKeywords, icp.competitorCompanies)) { diag.excluded_competitor++; continue; }
          // Fix 5: seller filter
          if (isSeller(postText, hl)) { diag.rejected_seller++; continue; }
          const cls = classifyContact(match, icp, hl);
          if (cls === 'cold' && !canInsertCold()) { diag.cold_capped++; continue; }
          const signal = `Engaged with ${post._hashtag}`;
          const result = await insertContact(supabase, fullProfile, user_id, agent_id, list_name, match, signal, postUrl, icp, manual_approval);
          if (result === 'exists') { diag.already_in_contacts++; continue; }
          if (result === 'inserted') { inserted++; diag.inserted++; if (cls === 'cold') coldCount++; else hotWarmCount++; }
        }
      } catch (e) { console.error('Hashtag engager fetch:', e); }
    }

    console.log(`signal-hashtag-engagement: ${inserted} leads total (${Math.round((Date.now()-START)/1000)}s)`);
    console.log('[TASK_FINAL_SUMMARY]', JSON.stringify({
      signal: 'hashtag_engagement',
      rawPosts: diag.raw_posts,
      aiFilteredPosts: diag.ai_filtered_posts,
      rawEngagers: diag.total_engagers_raw,
      inserted: diag.inserted,
      already_in_contacts: diag.already_in_contacts,
      rejected_seller: diag.rejected_seller,
      rejections: {
        noIcpMatch: diag.excluded_no_icp_match,
        competitorOrExcluded: diag.excluded_competitor,
        rejectedSeller: diag.rejected_seller,
        alreadyInContacts: diag.already_in_contacts,
        coldCapped: diag.cold_capped,
      },
    }));

    if (run_id && task_key) {
      try {
        await supabase.from('signal_agent_tasks')
          .update({ diagnostics: diag } as any)
          .eq('run_id', run_id).eq('task_key', task_key);
      } catch (e) { console.warn(`[HASHTAG] Failed to save diagnostics:`, e); }
    }

    return new Response(JSON.stringify({ leads: inserted }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('signal-hashtag-engagement error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error', leads: 0 }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
