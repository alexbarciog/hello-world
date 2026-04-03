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

const START = Date.now();
const MAX_RUNTIME_MS = 105_000;
function hasTime() { return Date.now() - START < MAX_RUNTIME_MS; }

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

// ─── Blacklist of generic/lifestyle terms that produce false positives ────────
const GENERIC_BLACKLIST = new Set([
  'sales', 'marketing', 'leadership', 'motivation', 'success', 'growth',
  'entrepreneur', 'business', 'innovation', 'networking', 'mindset',
  'hustle', 'grateful', 'blessed', 'family', 'weekend', 'vacation',
  'holiday', 'inspiration', 'grind', 'lifestyle', 'love', 'happiness',
  'thankful', 'morning', 'coffee', 'fitness', 'health', 'travel',
]);

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

function classifyContact(match: MatchResult, icp: ICPFilters, headline?: string): 'hot' | 'warm' | 'cold' | null {
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

function matchesTitleOrIndustry(match: MatchResult, icp: ICPFilters, headline?: string): boolean {
  return classifyContact(match, icp, headline) !== null;
}

function isExcluded(profile: any, excludeKeywords: string[], competitorCompanies: string[] = []): boolean {
  const company = (profile.company || profile.current_company?.name || '').toLowerCase().trim();
  const headline = (profile.headline || profile.title || '').toLowerCase();
  if (competitorCompanies.length > 0) {
    const textToCheck = `${company} ${headline}`;
    for (const comp of competitorCompanies) { if (textToCheck.includes(comp)) return true; }
  }
  if (excludeKeywords.length === 0) return false;
  const text = [profile.headline, profile.title, profile.company, profile.current_company?.name, profile.industry].filter(Boolean).join(' ').toLowerCase();
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

async function fetchProfileIfNeeded(item: any, accountId: string, apiKey: string, dsn: string): Promise<any | null> {
  const norm = normalizeProfile({ ...item });
  if (norm.first_name && (norm.headline || norm.title)) return norm;
  const id = item.public_identifier || item.provider_id || item.public_id || item.author_id;
  const numericOrUrn = item.id;
  const fetchId = id || (numericOrUrn && !String(numericOrUrn).startsWith('urn:') && !String(numericOrUrn).startsWith('ACo') ? numericOrUrn : null);
  if (!fetchId) return norm.first_name ? norm : null;
  try {
    const res = await unipileGet(`/api/v1/linkedin/profile/${fetchId}?account_id=${accountId}`, apiKey, dsn);
    if (!res.ok) { await res.text(); return norm.first_name ? norm : null; }
    const fetched = await res.json();
    return normalizeProfile(fetched);
  } catch { return norm.first_name ? norm : null; }
}

function delay(ms: number) { return new Promise(r => setTimeout(r, ms)); }

async function ensureList(supabase: any, userId: string, listName: string, agentId: string): Promise<string | null> {
  const { data: existing } = await supabase.from('lists').select('id').eq('user_id', userId).eq('name', listName).limit(1);
  if (existing && existing.length > 0) return existing[0].id;
  const { data: created, error } = await supabase.from('lists').insert({ user_id: userId, name: listName, source_agent_id: agentId }).select('id').single();
  if (error) { console.error(`Create list error: ${error.message}`); return null; }
  return created?.id || null;
}

async function insertContact(
  supabase: any, profile: any, userId: string, agentId: string,
  listName: string, match: MatchResult, signal: string, signalPostUrl: string | null, icp?: ICPFilters,
): Promise<boolean> {
  const linkedinProfileId = profile.public_id || profile.public_identifier || profile.provider_id || profile.id;
  if (!linkedinProfileId) return false;
  const { data: existing } = await supabase.from('contacts').select('id').eq('user_id', userId).eq('linkedin_profile_id', linkedinProfileId).limit(1);
  if (existing && existing.length > 0) return false;
  const firstName = profile.first_name || profile.name?.split(' ')[0] || 'Unknown';
  const lastName = profile.last_name || profile.name?.split(' ').slice(1).join(' ') || '';
  const hl = profile.headline || profile.title || '';
  const emptyIcp: ICPFilters = { jobTitles: [], industries: [], locations: [], companySizes: [], companyTypes: [], excludeKeywords: [], competitorCompanies: [] };
  const relevanceTier = classifyContact(match, icp || emptyIcp, hl) || 'cold';
  const signalAHit = true;
  const signalBHit = match.score >= 60;
  const signalCHit = match.score >= 80;
  const aiScore = Math.min(3, [signalAHit, signalBHit, signalCHit].filter(Boolean).length);
  const { data: inserted, error } = await supabase.from('contacts').insert({
    user_id: userId, first_name: firstName, last_name: lastName,
    title: profile.headline || profile.title || null,
    company: profile.company || profile.current_company?.name || null,
    linkedin_url: profile.linkedin_url || profile.public_url || profile.profile_url || (linkedinProfileId ? `https://www.linkedin.com/in/${linkedinProfileId}` : null),
    linkedin_profile_id: linkedinProfileId, source_campaign_id: null,
    signal, signal_post_url: signalPostUrl, ai_score: aiScore,
    signal_a_hit: signalAHit, signal_b_hit: signalBHit, signal_c_hit: signalCHit,
    email_enriched: false, list_name: listName,
    company_icon_color: ['orange', 'blue', 'green', 'purple', 'pink', 'gray'][Math.floor(Math.random() * 6)],
    relevance_tier: relevanceTier,
  }).select('id').single();
  if (error) { console.error(`Insert contact error: ${error.message}`); return false; }
  if (inserted?.id && listName) {
    const listId = await ensureList(supabase, userId, listName, agentId);
    if (listId) await supabase.from('contact_lists').insert({ contact_id: inserted.id, list_id: listId });
  }
  return true;
}

// ─── AI Post Relevance Filter ─────────────────────────────────────────────────

function extractPostText(post: any): string {
  return (post.text || post.commentary || post.description || post.title || '').trim();
}

function isBlacklistOnlyMatch(keyword: string): boolean {
  const words = normalizeText(keyword).split(/\s+/).filter(w => w.length > 0);
  return words.length > 0 && words.every(w => GENERIC_BLACKLIST.has(w));
}

async function filterIrrelevantPosts(posts: { id: string; text: string; keyword: string }[]): Promise<Set<string>> {
  const validIds = new Set<string>();
  
  // Posts with no text are automatically skipped
  const postsWithText = posts.filter(p => {
    if (!p.text || p.text.length < 20) {
      console.log(`[RELEVANCE] Skipped post ${p.id}: no text or too short (${p.text?.length || 0} chars)`);
      return false;
    }
    return true;
  });

  // Posts matched only by blacklisted generic terms get extra scrutiny
  const needsAICheck = postsWithText.filter(p => {
    if (!isBlacklistOnlyMatch(p.keyword)) {
      // Matched by a specific non-generic keyword — probably relevant
      validIds.add(p.id);
      return false;
    }
    return true;
  });

  if (needsAICheck.length === 0) return validIds;

  // Batch AI relevance check
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    console.warn('[RELEVANCE] No LOVABLE_API_KEY — skipping AI filter, allowing all posts');
    needsAICheck.forEach(p => validIds.add(p.id));
    return validIds;
  }

  // Process in batches of 10
  for (let i = 0; i < needsAICheck.length; i += 10) {
    const batch = needsAICheck.slice(i, i + 10);
    const postList = batch.map((p, idx) => `POST ${idx + 1} [id=${p.id}]:\n${p.text.slice(0, 300)}`).join('\n\n');

    try {
      const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'google/gemini-3-flash-preview',
          messages: [
            {
              role: 'system',
              content: `You are a LinkedIn post relevance classifier for B2B sales prospecting. Your job is to determine if LinkedIn posts contain genuine BUSINESS/PROFESSIONAL content with potential buying intent, or if they are personal/lifestyle posts that happen to use business hashtags.

RELEVANT posts discuss: business challenges, product needs, industry trends, professional achievements, company updates, hiring, tool comparisons, case studies, ROI, strategy, pain points, buying decisions.

IRRELEVANT posts discuss: family time, vacations, personal milestones, motivational quotes, weekend activities, fitness, food, personal reflections, gratitude posts, humble brags about personal life, inspirational stories unrelated to business.

Be strict: if the post is primarily personal/lifestyle content even with a business hashtag thrown in, mark it as NOT relevant.`,
            },
            {
              role: 'user',
              content: `Classify each post as relevant (true) or irrelevant (false) for B2B sales prospecting:\n\n${postList}`,
            },
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
                      properties: {
                        id: { type: 'string', description: 'The post id' },
                        relevant: { type: 'boolean', description: 'true if business-relevant, false if personal/lifestyle' },
                      },
                      required: ['id', 'relevant'],
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
        console.error(`[RELEVANCE] AI error ${res.status}, allowing all posts in batch`);
        await res.text();
        batch.forEach(p => validIds.add(p.id));
        continue;
      }

      const aiData = await res.json();
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      if (!toolCall) {
        console.warn('[RELEVANCE] No tool call returned, allowing all posts in batch');
        batch.forEach(p => validIds.add(p.id));
        continue;
      }

      const result = JSON.parse(toolCall.function.arguments);
      const classifications = result.results || [];
      let relevant = 0, irrelevant = 0;
      
      for (const cls of classifications) {
        if (cls.relevant) {
          validIds.add(cls.id);
          relevant++;
        } else {
          console.log(`[RELEVANCE] Filtered out post ${cls.id} as personal/lifestyle content`);
          irrelevant++;
        }
      }
      
      // Add any posts that weren't classified (safety net)
      for (const p of batch) {
        if (!classifications.some((c: any) => c.id === p.id)) {
          validIds.add(p.id);
        }
      }
      
      console.log(`[RELEVANCE] Batch: ${relevant} relevant, ${irrelevant} filtered out`);
    } catch (e) {
      console.error('[RELEVANCE] AI call failed:', e);
      batch.forEach(p => validIds.add(p.id));
    }
  }

  return validIds;
}

// ─── Main Handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { agent_id, account_id, user_id, list_name, keywords, icp: icpRaw, competitor_companies } = await req.json();
    if (!agent_id || !account_id || !keywords?.length) {
      return new Response(JSON.stringify({ leads: 0, error: 'Missing required params' }), { status: 400, headers: corsHeaders });
    }

    const UNIPILE_API_KEY = Deno.env.get('UNIPILE_API_KEY')!;
    const UNIPILE_DSN = Deno.env.get('UNIPILE_DSN')!;
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    const icp: ICPFilters = {
      jobTitles: icpRaw?.jobTitles || [],
      industries: icpRaw?.industries || [],
      locations: icpRaw?.locations || [],
      companySizes: icpRaw?.companySizes || [],
      companyTypes: icpRaw?.companyTypes || [],
      excludeKeywords: icpRaw?.excludeKeywords || [],
      competitorCompanies: competitor_companies || [],
    };

    console.log(`[DEBUG] ICP: jobTitles=[${icp.jobTitles.join(',')}], industries=[${icp.industries.join(',')}], locations=[${icp.locations.join(',')}], excludeKw=[${icp.excludeKeywords.join(',')}]`);
    let inserted = 0;
    let hotWarmCount = 0;
    let coldCount = 0;
    const COLD_CAP = 0.2;
    function canInsertCold() { const total = hotWarmCount + coldCount; return total === 0 || coldCount / (total + 1) < COLD_CAP; }
    const allPosts: any[] = [];

    // Phase 1: Search posts for ALL keywords (use 40% of time)
    for (const keyword of keywords) {
      if (!hasTime()) break;
      await delay(150);
      try {
        const res = await fetch(`https://${UNIPILE_DSN}/api/v1/linkedin/search?account_id=${account_id}`, {
          method: 'POST',
          headers: { 'X-API-KEY': UNIPILE_API_KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify({ api: 'classic', category: 'posts', keywords: keyword, date_posted: 'past_week' }),
        });
        if (!res.ok) { await res.text(); continue; }
        const data = await res.json();
        const items = (data.items || data.results || []).slice(0, 20);
        console.log(`keyword_posts "${keyword}": ${items.length} posts`);
        for (const item of items) allPosts.push({ ...item, _keyword: keyword });
      } catch (e) { console.error(`Keyword search "${keyword}":`, e); }
    }

    // Deduplicate & sort by engagement
    const seenPostIds = new Set<string>();
    const uniquePosts = allPosts.filter(p => {
      const id = p.social_id || p.id || p.provider_id;
      if (!id || seenPostIds.has(id)) return false;
      seenPostIds.add(id);
      return true;
    });
    const topPosts = uniquePosts
      .sort((a, b) => ((b.likes_count || 0) + (b.comments_count || 0)) - ((a.likes_count || 0) + (a.comments_count || 0)))
      .slice(0, 30);

    // ─── AI Relevance Filter: remove personal/lifestyle posts ───────────
    const postsForFilter = topPosts.map(p => ({
      id: p.social_id || p.id || p.provider_id || String(Math.random()),
      text: extractPostText(p),
      keyword: p._keyword || '',
    }));
    const relevantPostIds = await filterIrrelevantPosts(postsForFilter);
    const filteredPosts = topPosts.filter(p => {
      const id = p.social_id || p.id || p.provider_id;
      return relevantPostIds.has(id);
    });
    console.log(`[RELEVANCE] ${topPosts.length} posts → ${filteredPosts.length} after AI filter`);

    // Phase 2: Process each post — fetch author profile + scan engagers
    for (const post of filteredPosts) {
      if (!hasTime()) break;
      await delay(100);

      const authorData = post.author || post.actor || post.author_detail || null;
      if (!authorData) continue;

      const authorId = authorData.provider_id || authorData.id || authorData.public_id || authorData.public_identifier || authorData.author_id;
      const fullAuthor = await fetchProfileIfNeeded(authorData, account_id, UNIPILE_API_KEY, UNIPILE_DSN);
      if (fullAuthor) {
        const match = scoreProfileAgainstICP(fullAuthor, icp);
        const hl = fullAuthor.headline || fullAuthor.title || '';
        const classification = classifyContact(match, icp, hl);
        if (matchesTitleOrIndustry(match, icp, hl) && !isExcluded(fullAuthor, icp.excludeKeywords, icp.competitorCompanies)) {
          if (classification === 'cold' && !canInsertCold()) continue;
          const postUrl = post.url || post.share_url || post.permalink || (post.id ? `https://www.linkedin.com/feed/update/${post.id}` : null);
          const signal = `Posted about "${post._keyword}"`;
          const ok = await insertContact(supabase, fullAuthor, user_id, agent_id, list_name, match, signal, postUrl, icp);
          if (ok) { inserted++; if (classification === 'cold') coldCount++; else hotWarmCount++; }
        }
      }

      // Scan engagers on this post
      const postId = post.social_id || post.id || post.provider_id;
      if (postId && hasTime()) {
        try {
          await delay(150);
          const reactionsRes = await unipileGet(`/api/v1/posts/${postId}/reactions?account_id=${account_id}&limit=25`, UNIPILE_API_KEY, UNIPILE_DSN);
          if (reactionsRes.ok) {
            const reactionsData = await reactionsRes.json();
            const engagers = (reactionsData.items || []).slice(0, 20);
            for (const engager of engagers) {
              if (!hasTime()) break;
              const engagerProfile = engager.author || engager;
              const fullEngager = await fetchProfileIfNeeded(engagerProfile, account_id, UNIPILE_API_KEY, UNIPILE_DSN);
              if (!fullEngager) continue;
              const eMatch = scoreProfileAgainstICP(fullEngager, icp);
              const eHl = fullEngager.headline || fullEngager.title || '';
              if (!matchesTitleOrIndustry(eMatch, icp, eHl)) continue;
              if (isExcluded(fullEngager, icp.excludeKeywords, icp.competitorCompanies)) continue;
              const eClass = classifyContact(eMatch, icp, eHl);
              if (eClass === 'cold' && !canInsertCold()) continue;
              const eSignal = `Engaged with post about "${post._keyword}"`;
              const postUrl = post.url || post.share_url || post.permalink || `https://www.linkedin.com/feed/update/${postId}`;
              const eOk = await insertContact(supabase, fullEngager, user_id, agent_id, list_name, eMatch, eSignal, postUrl, icp);
              if (eOk) { inserted++; if (eClass === 'cold') coldCount++; else hotWarmCount++; }
            }
          } else { await reactionsRes.text(); }
        } catch (e) { console.error('engager scan:', e); }
      }
    }

    console.log(`signal-keyword-posts: ${inserted} leads (hot/warm=${hotWarmCount}, cold=${coldCount}) in ${Math.round((Date.now() - START) / 1000)}s`);
    return new Response(JSON.stringify({ leads: inserted }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('signal-keyword-posts error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error', leads: 0 }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
