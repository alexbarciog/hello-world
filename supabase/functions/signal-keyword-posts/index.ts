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

async function fetchProfileIfNeeded(item: any, accountId: string, apiKey: string, dsn: string): Promise<any | null> {
  const norm = normalizeProfile({ ...item });
  const existingId = extractLinkedinProfileId(norm);
  if (norm.first_name && (norm.headline || norm.title) && existingId) return { ...norm, public_id: norm.public_id || existingId };
  const fetchId = existingId || (item.id && !String(item.id).startsWith('urn:') && !String(item.id).startsWith('ACo') ? item.id : null);
  if (!fetchId) return norm.first_name ? { ...norm, public_id: norm.public_id || existingId } : null;
  try {
    const res = await unipileGet(`/api/v1/linkedin/profile/${fetchId}?account_id=${accountId}`, apiKey, dsn);
    if (!res.ok) { await res.text(); return norm.first_name ? { ...norm, public_id: norm.public_id || existingId } : null; }
    const fetched = await res.json();
    const normalizedFetched = normalizeProfile(fetched);
    return { ...normalizedFetched, public_id: normalizedFetched.public_id || extractLinkedinProfileId(normalizedFetched) || existingId };
  } catch {
    return norm.first_name ? { ...norm, public_id: norm.public_id || existingId } : null;
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
): Promise<boolean> {
  const linkedinProfileId = extractLinkedinProfileId(profile) || (profile.id ? String(profile.id) : null);
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

async function filterIrrelevantPosts(posts: { id: string; text: string; keyword: string }[], businessContext: string): Promise<Set<string>> {
  const validIds = new Set<string>();

  const postsWithText = posts.filter(p => {
    if (!p.text || p.text.length < 20) return false;
    return true;
  });

  if (postsWithText.length === 0) return validIds;

  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    postsWithText.forEach(p => validIds.add(p.id));
    return validIds;
  }

  const systemPrompt = businessContext
    ? `You are a LinkedIn buying-intent classifier for B2B sales prospecting.

The user's company sells: "${businessContext}"

For each LinkedIn post, classify the post author into one of three categories:

1. BUYER_INTENT (relevant=true) — The author is expressing a GENUINE NEED as a potential buyer. Examples:
   - Asking for recommendations: "Can anyone recommend a good CRM?"
   - Describing a problem/challenge: "We're struggling with lead generation"
   - Asking for help or advice: "How do you handle X at your company?"
   - Comparing tools/solutions: "We're evaluating alternatives to X"
   - Expressing frustration with current solutions: "Our current tool doesn't do Y"
   - Looking for alternatives: "Is there something better than X?"

2. SELF_PROMOTER (relevant=false) — The author is NOT a buyer. They are promoting their own service, sharing expertise as an authority, or trying to attract clients. Examples:
   - Sharing tips/advice as a thought leader: "Here are 5 ways to improve your sales"
   - Promoting their own product/service: "Excited to launch our new feature"
   - Publishing case studies of their own work: "Here's how we helped Client X"
   - Posting thought leadership to build their brand
   - Offering free resources to generate leads for themselves
   - Announcing features, partnerships, or milestones of their company

3. IRRELEVANT (relevant=false) — Personal content, motivational quotes, lifestyle, celebrations, job announcements, or completely unrelated topics.

CRITICAL RULES:
- Only mark relevant=true for genuine BUYER_INTENT — people who would realistically PAY for "${businessContext}".
- If the author is GIVING advice about the topic rather than SEEKING help, they are a SELF_PROMOTER (relevant=false).
- If the author works in the same space and is sharing expertise, they are a SELF_PROMOTER, not a buyer.
- When in doubt, mark as relevant=false. Quality over quantity.`
    : `You are a LinkedIn post relevance classifier for B2B sales prospecting. Only mark posts where the author is expressing a genuine need, asking for help, recommendations, or alternatives as relevant. Posts where the author is sharing expertise, promoting their services, or giving advice should be marked irrelevant.`;

  for (let i = 0; i < postsWithText.length; i += 10) {
    const batch = postsWithText.slice(i, i + 10);
    const postList = batch.map((p, idx) => `POST ${idx + 1} [id=${p.id}]:\n${p.text.slice(0, 400)}`).join('\n\n');

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
                      properties: {
                        id: { type: 'string' },
                        relevant: { type: 'boolean' },
                        reason: { type: 'string' },
                      },
                      required: ['id', 'relevant', 'reason'],
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
        await res.text();
        batch.forEach(p => validIds.add(p.id));
        continue;
      }

      const aiData = await res.json();
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      if (!toolCall) { batch.forEach(p => validIds.add(p.id)); continue; }

      const result = JSON.parse(toolCall.function.arguments);
      const classifications = result.results || [];
      let relevant = 0, irrelevant = 0;

      for (const cls of classifications) {
        if (cls.relevant) {
          validIds.add(cls.id);
          relevant++;
          console.log(`[RELEVANCE] ✅ ${cls.id}: ${cls.reason}`);
        } else {
          console.log(`[RELEVANCE] ❌ Filtered ${cls.id}: ${cls.reason}`);
          irrelevant++;
        }
      }

      for (const p of batch) {
        if (!classifications.some((c: any) => c.id === p.id)) validIds.add(p.id);
      }

      console.log(`[RELEVANCE] Batch: ${relevant} buyer_intent, ${irrelevant} filtered`);
    } catch (e) {
      console.error('[RELEVANCE] AI call failed:', e);
      batch.forEach(p => validIds.add(p.id));
    }
  }

  return validIds;
}

// ─── Main Handler: Per-Keyword Collect → AI Filter → Insert ──────────────────
// Processes one keyword at a time. After each keyword's AI filter,
// approved authors are inserted immediately. This ensures leads are saved
// incrementally even if the function times out mid-way.

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  // Per-request timer (fixes warm isolate bug)
  const START = Date.now();
  const MAX_RUNTIME_MS = 105_000;
  const hasTime = () => Date.now() - START < MAX_RUNTIME_MS;

  try {
    const { agent_id, account_id, user_id, list_name, keywords, icp: icpRaw, competitor_companies, business_context } = await req.json();
    if (!agent_id || !account_id || !keywords?.length) {
      return new Response(JSON.stringify({ leads: 0, error: 'Missing required params' }), { status: 400, headers: corsHeaders });
    }

    const UNIPILE_API_KEY = Deno.env.get('UNIPILE_API_KEY')!;
    const UNIPILE_DSN = Deno.env.get('UNIPILE_DSN')!;
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const searchUrl = `https://${UNIPILE_DSN}/api/v1/linkedin/search?account_id=${account_id}`;
    const searchHeaders = { 'X-API-KEY': UNIPILE_API_KEY, 'Content-Type': 'application/json' };

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
    const globalSeenPostIds = new Set<string>();
    const globalSeenAuthorIds = new Set<string>();

    // ── Process one keyword at a time: fetch → AI filter → insert ──
    for (const keyword of keywords) {
      if (!hasTime()) { console.log(`[TIMEOUT] Stopping at keyword "${keyword}" — ${inserted} leads saved so far`); break; }

      // Step 1: Fetch up to 30 posts for this keyword (paginate up to 3 pages)
      const keywordPosts: any[] = [];
      let cursor: string | null = null;
      const MAX_PAGES = 3;
      const TARGET_POSTS = 30;

      try {
        for (let page = 0; page < MAX_PAGES && hasTime() && keywordPosts.length < TARGET_POSTS; page++) {
          const searchBody: any = { api: 'classic', category: 'posts', keywords: keyword, date_posted: 'past_week', limit: 30 };
          if (cursor) searchBody.cursor = cursor;
          const res = await fetch(searchUrl, { method: 'POST', headers: searchHeaders, body: JSON.stringify(searchBody) });
          if (!res.ok) { const t = await res.text(); console.error(`keyword "${keyword}" p${page + 1}: HTTP ${res.status} - ${t.slice(0, 200)}`); break; }
          const data = await res.json();
          const items = data.items || data.results || [];
          keywordPosts.push(...items);
          cursor = data.cursor || data.next_cursor || null;
          if (!cursor || items.length === 0) break;
          if (page < MAX_PAGES - 1) await delay(200);
        }
      } catch (e) { console.error(`Keyword search "${keyword}":`, e); }

      // Step 2: Dedupe against global seen posts
      const uniquePosts = keywordPosts.filter(p => {
        const id = p.social_id || p.id || p.provider_id;
        if (!id || globalSeenPostIds.has(id)) return false;
        globalSeenPostIds.add(id);
        return true;
      });

      if (uniquePosts.length === 0) {
        console.log(`[KEYWORD] "${keyword}": ${keywordPosts.length} fetched, 0 unique — skipping`);
        continue;
      }

      // Step 3: AI filter this keyword's posts
      const postsForFilter = uniquePosts.map(p => ({
        id: p.social_id || p.id || p.provider_id || String(Math.random()),
        text: extractPostText(p),
        keyword,
      }));
      const relevantIds = await filterIrrelevantPosts(postsForFilter, business_context || '');
      const approvedPosts = uniquePosts.filter(p => {
        const id = p.social_id || p.id || p.provider_id;
        return relevantIds.has(id);
      });

      // Step 4: Process and insert approved authors IMMEDIATELY
      let keywordInserted = 0;
      let keywordSkipped = { noAuthor: 0, dupAuthor: 0, noId: 0, excluded: 0, insertFail: 0 };

      for (const post of approvedPosts) {
        if (!hasTime()) break;

        const authorData = post.author || post.actor || post.author_detail || null;
        if (!authorData) { keywordSkipped.noAuthor++; continue; }

        let author = normalizeProfile({ ...authorData });
        let authorId = extractLinkedinProfileId(author);

        // Dedupe authors across keywords
        if (authorId && globalSeenAuthorIds.has(authorId)) { keywordSkipped.dupAuthor++; continue; }
        if (authorId) globalSeenAuthorIds.add(authorId);

        // Fetch full profile if missing ID or basic info
        if (!authorId || !author.first_name) {
          const fetchedAuthor = await fetchProfileIfNeeded(authorData, account_id, UNIPILE_API_KEY, UNIPILE_DSN);
          if (fetchedAuthor) {
            author = fetchedAuthor;
            authorId = extractLinkedinProfileId(author);
            if (authorId) globalSeenAuthorIds.add(authorId);
          }
        }

        const lpid = authorId || 'unknown';

        if (isExcluded(author, icp.excludeKeywords, icp.competitorCompanies)) {
          console.log(`[PIPELINE] ⏭ ${lpid}: excluded (competitor)`);
          keywordSkipped.excluded++;
          continue;
        }

        const match = scoreProfileAgainstICP(author, icp);
        const postUrl = post.url || post.share_url || post.permalink || (post.id ? `https://www.linkedin.com/feed/update/${post.id}` : null);
        const signal = `Posted about "${keyword}"`;
        const ok = await insertContact(supabase, author, user_id, agent_id, list_name, match, signal, postUrl, icp);

        if (ok) {
          keywordInserted++;
          inserted++;
          hotWarmCount++;
          console.log(`[PIPELINE] ✅ ${lpid}: inserted as warm (kw="${keyword}")`);
        } else {
          keywordSkipped.insertFail++;
        }
      }

      console.log(`[KEYWORD] "${keyword}": ${keywordPosts.length} fetched → ${uniquePosts.length} unique → ${approvedPosts.length} AI-approved → ${keywordInserted} inserted (skip: author=${keywordSkipped.noAuthor} dup=${keywordSkipped.dupAuthor} excl=${keywordSkipped.excluded} fail=${keywordSkipped.insertFail})`);
    }

    console.log(`signal-keyword-posts: ${inserted} leads total (hot/warm=${hotWarmCount}, cold=${coldCount}) in ${Math.round((Date.now() - START) / 1000)}s`);
    return new Response(JSON.stringify({ leads: inserted }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('signal-keyword-posts error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error', leads: 0 }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
