import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@18.5.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/* ── Helpers ───────────────────────────────────────────────────────── */

function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/* ── AI Relevance Scoring ──────────────────────────────────────────── */

interface CandidatePost {
  userId: string;
  keywordId: string;
  keyword: string;
  subreddit: string;
  author: string;
  title: string;
  body: string | null;
  url: string;
  redditPostId: string;
  score: number;
  postedAt: string | null;
}

async function scoreRelevance(
  supabase: ReturnType<typeof createClient>,
  candidates: CandidatePost[],
  userId: string,
): Promise<Map<number, number>> {
  const scores = new Map<number, number>();
  if (candidates.length === 0) return scores;

  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    console.warn('[poll-reddit] LOVABLE_API_KEY not set, skipping AI scoring');
    candidates.forEach((_, i) => scores.set(i, 5));
    return scores;
  }

  let businessContext = '';
  try {
    const { data: campaigns } = await supabase
      .from('campaigns')
      .select('company_name, description, value_proposition, industry, icp_job_titles, icp_industries, pain_points')
      .eq('user_id', userId)
      .limit(3);

    if (campaigns && campaigns.length > 0) {
      const c = campaigns[0];
      const parts: string[] = [];
      if (c.company_name) parts.push(`Company: ${c.company_name}`);
      if (c.description) parts.push(`Description: ${c.description}`);
      if (c.value_proposition) parts.push(`Value proposition: ${c.value_proposition}`);
      if (c.industry) parts.push(`Industry: ${c.industry}`);
      if (c.icp_job_titles?.length) parts.push(`Target roles: ${c.icp_job_titles.join(', ')}`);
      if (c.icp_industries?.length) parts.push(`Target industries: ${c.icp_industries.join(', ')}`);
      if (c.pain_points?.length) parts.push(`Pain points: ${c.pain_points.join(', ')}`);
      businessContext = parts.join('\n');
    }
  } catch (e) {
    console.warn('[poll-reddit] Failed to fetch business context:', e);
  }

  if (!businessContext) {
    businessContext = 'No business context available. Score based on general B2B/SaaS relevance.';
  }

  const BATCH_SIZE = 15;
  for (let i = 0; i < candidates.length; i += BATCH_SIZE) {
    const batch = candidates.slice(i, i + BATCH_SIZE);
    const postsText = batch.map((c, idx) => {
      const globalIdx = i + idx;
      return `[${globalIdx}] Keyword: "${c.keyword}"\nTitle: ${c.title}\nBody: ${(c.body || '').slice(0, 300)}`;
    }).join('\n---\n');

    const prompt = `You are a strict relevance scoring engine for a B2B sales tool. Score each Reddit post 0-10 based on whether the poster could REALISTICALLY become a customer for this business:

${businessContext}

SCORING CRITERIA (be strict):
- 8-10: The poster is ACTIVELY seeking a solution/service this business sells, or describing a pain point this business directly solves. They would likely pay for the service.
- 5-7: The post is somewhat related to the business domain but the poster is NOT clearly looking to buy. General discussion, sharing news, or tangentially related topics.
- 0-4: The post is unrelated, the keyword match is coincidental, or the poster would never buy this service (e.g., they sell a competing product, they're just venting, off-topic).

IMPORTANT: Be HARSH. Most posts from Reddit search are noise. Only score 8+ if the poster genuinely needs what this business offers. A post mentioning similar words but in an unrelated context should score 3 or below.

Score each post. Return ONLY a JSON object like: {"scores": {"0": 7, "1": 3, "2": 9, ...}}

Posts to score:
${postsText}`;

    try {
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-3-flash-preview',
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (!response.ok) {
        console.warn(`[poll-reddit] AI scoring failed: ${response.status}`);
        batch.forEach((_, idx) => scores.set(i + idx, 4));
        continue;
      }

      const aiData = await response.json();
      const content = aiData.choices?.[0]?.message?.content?.trim() || '';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const scoreMap = parsed.scores || parsed;
        for (const [key, value] of Object.entries(scoreMap)) {
          const globalIdx = parseInt(key);
          if (!isNaN(globalIdx) && typeof value === 'number') {
            scores.set(globalIdx, Math.min(10, Math.max(0, Math.round(value))));
          }
        }
      } else {
        batch.forEach((_, idx) => scores.set(i + idx, 4));
      }
    } catch (e) {
      console.warn('[poll-reddit] AI scoring error:', e);
      batch.forEach((_, idx) => scores.set(i + idx, 4));
    }
  }

  return scores;
}

/* ── Apify: fetch posts for a single keyword ──────────────────────── */

async function fetchPostsForKeyword(
  keyword: string,
  apifyToken: string,
  desiredItems = 20,
): Promise<any[]> {
  const apifyUrl = `https://api.apify.com/v2/acts/easyapi~reddit-posts-search-scraper/run-sync-get-dataset-items?token=${apifyToken}`;

  try {
    const res = await fetch(apifyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: keyword,
        sort: 'relevance',
        time: 'week',
        maxItems: 100,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`[poll-reddit] Apify error for "${keyword}": ${res.status} - ${errText.slice(0, 200)}`);
      return [];
    }

    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.error(`[poll-reddit] Apify fetch error for "${keyword}":`, e);
    return [];
  }
}

/* ── Main handler ──────────────────────────────────────────────────── */

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const APIFY_TOKEN = Deno.env.get('APIFY_TOKEN')!;
    const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !APIFY_TOKEN) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2025-08-27.basil' }) : null;

    // Handle manual trigger with user filter
    let userFilter: string | null = null;
    const authHeader = req.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
      const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: authHeader } },
      });
      const token = authHeader.replace('Bearer ', '');
      const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(token);
      if (!claimsErr && claimsData?.claims?.sub) {
        userFilter = claimsData.claims.sub as string;
      }
    }

    // Fetch active keywords
    let query = supabase.from('reddit_keywords').select('*').eq('active', true);
    if (userFilter) query = query.eq('user_id', userFilter);
    const { data: allKeywords, error: kwErr } = await query;

    if (kwErr) throw kwErr;
    if (!allKeywords || allKeywords.length === 0) {
      console.log('[poll-reddit] No active keywords found');
      return json({ inserted: 0, message: 'No active keywords' });
    }

    console.log(`[poll-reddit] Found ${allKeywords.length} active keywords`);

    // Group by user and check subscription
    const userKeywords = new Map<string, typeof allKeywords>();
    for (const kw of allKeywords) {
      const list = userKeywords.get(kw.user_id) || [];
      list.push(kw);
      userKeywords.set(kw.user_id, list);
    }

    const paidUserKeywords: typeof allKeywords = [];

    for (const [userId, kws] of userKeywords) {
      if (!stripe) {
        paidUserKeywords.push(...kws);
        continue;
      }

      try {
        const { data: userData } = await supabase.auth.admin.getUserById(userId);
        if (!userData?.user?.email) continue;

        const customers = await stripe.customers.list({ email: userData.user.email, limit: 1 });
        if (customers.data.length === 0) continue;

        const customerId = customers.data[0].id;
        const activeSubs = await stripe.subscriptions.list({ customer: customerId, status: 'active', limit: 1 });
        const trialingSubs = await stripe.subscriptions.list({ customer: customerId, status: 'trialing', limit: 1 });

        if (activeSubs.data.length > 0 || trialingSubs.data.length > 0) {
          paidUserKeywords.push(...kws);
        } else {
          console.log(`[poll-reddit] Skipping free user ${userId}`);
        }
      } catch (err) {
        console.warn(`[poll-reddit] Stripe check failed for ${userId}:`, err);
      }
    }

    if (paidUserKeywords.length === 0) {
      console.log('[poll-reddit] No paid users with active keywords');
      return json({ inserted: 0, message: 'No paid users' });
    }

    // ── Keyword rotation: cap 10 per user ──
    const MAX_KEYWORDS_PER_USER = 10;
    const paidUserKwMap = new Map<string, typeof allKeywords>();
    for (const kw of paidUserKeywords) {
      const list = paidUserKwMap.get(kw.user_id) || [];
      list.push(kw);
      paidUserKwMap.set(kw.user_id, list);
    }

    const selectedKeywords: typeof allKeywords = [];
    for (const [userId, kws] of paidUserKwMap) {
      if (kws.length <= MAX_KEYWORDS_PER_USER) {
        selectedKeywords.push(...kws);
      } else {
        const sorted = [...kws].sort((a, b) => {
          const aTime = a.last_polled_at ? new Date(a.last_polled_at).getTime() : 0;
          const bTime = b.last_polled_at ? new Date(b.last_polled_at).getTime() : 0;
          return aTime - bTime;
        });
        selectedKeywords.push(...sorted.slice(0, MAX_KEYWORDS_PER_USER));
        console.log(`[poll-reddit] User ${userId.slice(0, 8)}: rotated ${kws.length} keywords → selected ${MAX_KEYWORDS_PER_USER}`);
      }
    }

    console.log(`[poll-reddit] Processing ${selectedKeywords.length} keywords (per-keyword Apify calls)`);

    // ── Per-keyword Apify calls (no batching) ──
    const ITEMS_PER_KEYWORD = 20;
    const candidatesByUser: Record<string, CandidatePost[]> = {};
    let totalApifyPosts = 0;

    for (const kw of selectedKeywords) {
      const posts = await fetchPostsForKeyword(kw.keyword, APIFY_TOKEN, ITEMS_PER_KEYWORD);
      totalApifyPosts += posts.length;
      console.log(`[poll-reddit] Keyword "${kw.keyword}": ${posts.length} posts from Apify`);

      for (const p of posts) {
        if (!p || p.error) continue;

        const title = p.title || '';
        const body = (p.selftext || p.selfText || p.body || p.text || '').slice(0, 1000);
        const permalink = p.permalink || '';
        const postUrl = p.url || (permalink ? `https://www.reddit.com${permalink}` : '');
        const postSubreddit = p.subreddit || p.subredditName || p.subreddit_name || '';
        const author = p.author || p.authorName || p.author_id || '[unknown]';
        const score = p.score ?? p.ups ?? p.upvoteScore ?? p.upvotes ?? 0;

        const postIdMatch = (permalink || postUrl).match(/\/comments\/([a-z0-9]+)/i);
        const rawId = p.id || p.postId || p.post_id || p.name;
        const redditPostId = postIdMatch
          ? `t3_${postIdMatch[1]}`
          : rawId
            ? (String(rawId).startsWith('t3_') ? String(rawId) : `t3_${rawId}`)
            : `apify_${hashString(postUrl || JSON.stringify(p))}`;

        const finalUrl = postUrl || `https://www.reddit.com${permalink}`;
        if (!finalUrl || finalUrl === 'https://www.reddit.com') continue;

        let postedAt: string | null = null;
        const rawDate = p.createdAt || p.created_time || p.postedDate || p.created_utc || p.postedAt;
        if (rawDate) {
          if (typeof rawDate === 'number') {
            postedAt = new Date(rawDate > 1e12 ? rawDate : rawDate * 1000).toISOString();
          } else if (typeof rawDate === 'string') {
            postedAt = rawDate;
          }
        }

        // No keyword text matching — ALL posts from relevance search are candidates
        if (!candidatesByUser[kw.user_id]) candidatesByUser[kw.user_id] = [];
        candidatesByUser[kw.user_id].push({
          userId: kw.user_id,
          keywordId: kw.id,
          keyword: kw.keyword,
          subreddit: postSubreddit || 'unknown',
          author,
          title: title || 'No title',
          body: body || null,
          url: finalUrl,
          redditPostId,
          score,
          postedAt,
        });
      }
    }

    console.log(`[poll-reddit] Total Apify posts: ${totalApifyPosts}, candidates by user: ${Object.keys(candidatesByUser).length}`);

    // AI relevance scoring per user, then insert (threshold: 6)
    const RELEVANCE_THRESHOLD = 6;
    let totalInserted = 0;
    const userInsertions: Record<string, number> = {};

    for (const [userId, candidates] of Object.entries(candidatesByUser)) {
      // Deduplicate by redditPostId before scoring
      const seen = new Set<string>();
      const uniqueCandidates = candidates.filter(c => {
        if (seen.has(c.redditPostId)) return false;
        seen.add(c.redditPostId);
        return true;
      });

      console.log(`[poll-reddit] Scoring ${uniqueCandidates.length} unique candidates for user ${userId.slice(0, 8)}...`);

      const scores = await scoreRelevance(supabase, uniqueCandidates, userId);
      let userInserted = 0;
      let skippedLowRelevance = 0;

      for (let i = 0; i < uniqueCandidates.length; i++) {
        const relevanceScore = scores.get(i) ?? 4;
        if (relevanceScore < RELEVANCE_THRESHOLD) {
          skippedLowRelevance++;
          continue;
        }

        const c = uniqueCandidates[i];
        const { error } = await supabase.from('reddit_mentions').upsert(
          {
            user_id: c.userId,
            keyword_id: c.keywordId,
            keyword_matched: c.keyword,
            subreddit: c.subreddit,
            author: c.author,
            title: c.title,
            body: c.body,
            url: c.url,
            reddit_post_id: c.redditPostId,
            score: c.score,
            posted_at: c.postedAt,
            relevance_score: relevanceScore,
          },
          { onConflict: 'user_id,reddit_post_id', ignoreDuplicates: true }
        );
        if (!error) userInserted++;
      }

      console.log(`[poll-reddit] User ${userId.slice(0, 8)}: inserted ${userInserted}, skipped ${skippedLowRelevance} low-relevance`);
      if (userInserted > 0) {
        totalInserted += userInserted;
        userInsertions[userId] = (userInsertions[userId] || 0) + userInserted;
      }
    }

    // Notifications
    for (const [userId, count] of Object.entries(userInsertions)) {
      try {
        await supabase.from('notifications').insert({
          user_id: userId,
          title: `🔴 ${count} new Reddit signal${count > 1 ? 's' : ''} found`,
          body: `Your Reddit AI Agent discovered ${count} new relevant post${count > 1 ? 's' : ''} matching your intent keywords.`,
          type: 'reddit_signal',
          link: '/reddit-signals',
        });
      } catch (err) {
        console.error(`[poll-reddit] Notification error for ${userId}:`, err);
      }
    }

    // Update last_polled_at for rotated keywords
    const selectedIds = selectedKeywords.map(k => k.id);
    if (selectedIds.length > 0) {
      const { error: updateErr } = await supabase
        .from('reddit_keywords')
        .update({ last_polled_at: new Date().toISOString() })
        .in('id', selectedIds);
      if (updateErr) console.warn('[poll-reddit] Failed to update last_polled_at:', updateErr.message);
      else console.log(`[poll-reddit] Updated last_polled_at for ${selectedIds.length} keywords`);
    }

    console.log(`[poll-reddit] Done. Inserted ${totalInserted} mentions from ${totalApifyPosts} Apify posts.`);
    return json({ inserted: totalInserted, posts: totalApifyPosts });
  } catch (error) {
    console.error('[poll-reddit] Fatal error:', error);
    return json({ error: error instanceof Error ? error.message : 'Unknown error' }, 500);
  }
});
