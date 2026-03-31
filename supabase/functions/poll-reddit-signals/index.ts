const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@18.5.0';

/* ── Anti-detection utilities ──────────────────────────────────────── */

const BROWSER_USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:125.0) Gecko/20100101 Firefox/125.0',
  'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:124.0) Gecko/20100101 Firefox/124.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36 Edg/123.0.0.0',
];

const ACCEPT_LANGUAGES = [
  'en-US,en;q=0.9',
  'en-GB,en;q=0.9,en-US;q=0.8',
  'en-US,en;q=0.9,fr;q=0.8',
  'en,en-US;q=0.9,de;q=0.7',
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDelay(minMs: number, maxMs: number): Promise<void> {
  return new Promise(r => setTimeout(r, randInt(minMs, maxMs)));
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getRandomHeaders(accept: string): Record<string, string> {
  return {
    'User-Agent': pick(BROWSER_USER_AGENTS),
    'Accept': accept,
    'Accept-Language': pick(ACCEPT_LANGUAGES),
    'Accept-Encoding': 'gzip, deflate, br',
    'Cache-Control': pick(['no-cache', 'max-age=0']),
    'Connection': 'keep-alive',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1',
  };
}

function randomRedditDomain(): string {
  return pick(['www.reddit.com', 'old.reddit.com']);
}

function randomTimeRange(): string {
  return pick(['week', 'month']);
}

function randomSort(): string {
  return pick(['new', 'relevance']);
}

function randomLimit(): number {
  return pick([25, 50, 75, 100]);
}

/* ── Types ─────────────────────────────────────────────────────────── */

interface FailedPair {
  userId: string;
  keywordId: string;
  keyword: string;
  subreddit: string;
}

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

/* ── Keyword-in-text check ─────────────────────────────────────────── */

function keywordInText(keyword: string, title: string, body: string | null): boolean {
  const searchText = `${title} ${body || ''}`.toLowerCase();
  return searchText.includes(keyword.toLowerCase());
}

/* ── AI Relevance Scoring ──────────────────────────────────────────── */

async function scoreRelevance(
  supabase: ReturnType<typeof createClient>,
  candidates: CandidatePost[],
  userId: string,
): Promise<Map<number, number>> {
  const scores = new Map<number, number>();
  if (candidates.length === 0) return scores;

  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    console.warn('[poll-reddit] LOVABLE_API_KEY not set, skipping AI relevance scoring');
    // Return all as score 7 (pass through)
    candidates.forEach((_, i) => scores.set(i, 7));
    return scores;
  }

  // Fetch user's business context from campaigns
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
      if (c.pain_points?.length) parts.push(`Pain points addressed: ${c.pain_points.join(', ')}`);
      businessContext = parts.join('\n');
    }
  } catch (e) {
    console.warn('[poll-reddit] Failed to fetch business context:', e);
  }

  if (!businessContext) {
    businessContext = 'No business context available. Score based on general B2B/SaaS relevance.';
  }

  // Batch into groups of 15
  const BATCH_SIZE = 15;
  for (let i = 0; i < candidates.length; i += BATCH_SIZE) {
    const batch = candidates.slice(i, i + BATCH_SIZE);
    const postsText = batch.map((c, idx) => {
      const globalIdx = i + idx;
      return `[${globalIdx}] Title: ${c.title}\nBody: ${(c.body || '').slice(0, 300)}`;
    }).join('\n---\n');

    const prompt = `You are a relevance scoring engine for a B2B lead generation tool. Score each Reddit post from 0-10 based on how relevant it is as a potential sales opportunity for this business:

${businessContext}

A high score (7-10) means the poster is likely:
- Actively looking for a solution the business offers
- Expressing pain points the business addresses
- Asking for recommendations in the business's domain
- Discussing topics where the business could add value

A low score (0-3) means:
- The post is unrelated to the business
- The keyword match is coincidental
- The post is about something completely different

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
          messages: [
            { role: 'user', content: prompt },
          ],
        }),
      });

      if (!response.ok) {
        console.warn(`[poll-reddit] AI scoring failed: ${response.status}`);
        // Default pass-through
        batch.forEach((_, idx) => scores.set(i + idx, 7));
        continue;
      }

      const aiData = await response.json();
      const content = aiData.choices?.[0]?.message?.content?.trim() || '';
      
      // Extract JSON from response (might be wrapped in markdown)
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
        console.warn('[poll-reddit] Could not parse AI scores, defaulting to pass-through');
        batch.forEach((_, idx) => scores.set(i + idx, 7));
      }
    } catch (e) {
      console.warn('[poll-reddit] AI scoring error:', e);
      batch.forEach((_, idx) => scores.set(i + idx, 7));
    }

    // Small delay between AI batches
    if (i + BATCH_SIZE < candidates.length) {
      await randomDelay(500, 1000);
    }
  }

  return scores;
}

/* ── Main handler ──────────────────────────────────────────────────── */

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing server configuration');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

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
        userFilter = claimsData.claims.sub;
      }
    }

    let query = supabase.from('reddit_keywords').select('*').eq('active', true);
    if (userFilter) query = query.eq('user_id', userFilter);
    const { data: keywords, error: kwErr } = await query;
    if (kwErr) throw kwErr;
    if (!keywords || keywords.length === 0) {
      return json({ message: 'No active keywords to poll', processed: 0 });
    }

    const shuffledKeywords = shuffle(keywords);
    console.log(`[poll-reddit] Processing ${shuffledKeywords.length} keyword(s)`);

    let totalInserted = 0;
    let requestCount = 0;
    const DEFAULT_SUBREDDITS = ['SaaS', 'startups', 'Entrepreneur', 'smallbusiness', 'marketing', 'sales'];
    const userInsertions: Record<string, number> = {};
    const failedPairs: FailedPair[] = [];

    // Collect candidates per user for AI scoring
    const candidatesByUser: Record<string, CandidatePost[]> = {};

    // Phase 1: Try RSS and JSON for each keyword/subreddit pair
    for (const kw of shuffledKeywords) {
      const subreddits = shuffle(kw.subreddits?.length > 0 ? kw.subreddits : DEFAULT_SUBREDDITS);
      const keyword = kw.keyword;

      for (const sub of subreddits) {
        try {
          let candidates = await collectViaRSS(kw.user_id, kw.id, keyword, sub);
          requestCount++;

          if (candidates.length === 0) {
            await randomDelay(1500, 3500);
            candidates = await collectViaJSON(kw.user_id, kw.id, keyword, sub);
            requestCount++;
          }

          if (candidates.length === 0) {
            failedPairs.push({ userId: kw.user_id, keywordId: kw.id, keyword, subreddit: sub });
          } else {
            if (!candidatesByUser[kw.user_id]) candidatesByUser[kw.user_id] = [];
            candidatesByUser[kw.user_id].push(...candidates);
          }
        } catch (err) {
          console.error(`[poll-reddit] Error polling r/${sub} for "${keyword}":`, err);
          failedPairs.push({ userId: kw.user_id, keywordId: kw.id, keyword, subreddit: sub });
        }

        if (requestCount % randInt(5, 8) === 0) {
          await randomDelay(5000, 15000);
        } else {
          await randomDelay(1500, 4500);
        }
      }

      await randomDelay(2000, 8000);
    }

    // Phase 2: ONE batched Apify call for all failed pairs
    if (failedPairs.length > 0) {
      console.log(`[poll-reddit] ${failedPairs.length} pairs failed RSS/JSON, attempting single Apify batch call`);
      const apifyCandidates = await collectViaApifyBatch(failedPairs);
      
      for (const c of apifyCandidates) {
        if (!candidatesByUser[c.userId]) candidatesByUser[c.userId] = [];
        candidatesByUser[c.userId].push(c);
      }
    }

    // Phase 3: AI relevance scoring per user, then insert
    for (const [userId, candidates] of Object.entries(candidatesByUser)) {
      console.log(`[poll-reddit] Scoring ${candidates.length} candidates for user ${userId.slice(0, 8)}...`);
      
      const scores = await scoreRelevance(supabase, candidates, userId);
      
      let userInserted = 0;
      let skippedLowRelevance = 0;

      for (let i = 0; i < candidates.length; i++) {
        const relevanceScore = scores.get(i) ?? 7; // default pass-through
        
        if (relevanceScore < 6) {
          skippedLowRelevance++;
          continue;
        }

        const c = candidates[i];
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

    console.log(`[poll-reddit] Done. Inserted ${totalInserted} new mention(s).`);
    return json({ message: 'Polling complete', processed: shuffledKeywords.length, inserted: totalInserted });
  } catch (error) {
    console.error('[poll-reddit] Fatal error:', error);
    return json({ error: error instanceof Error ? error.message : 'Unknown error' }, 500);
  }
});

/* ── Collect candidates via RSS feed (no insert, just collect) ────── */

async function collectViaRSS(
  userId: string,
  keywordId: string,
  keyword: string,
  subreddit: string
): Promise<CandidatePost[]> {
  const domain = randomRedditDomain();
  const timeRange = randomTimeRange();
  const sort = randomSort();
  const limit = randomLimit();

  const rssUrl = `https://${domain}/r/${encodeURIComponent(subreddit)}/search.rss?q=${encodeURIComponent(keyword)}&restrict_sr=on&sort=${sort}&t=${timeRange}&limit=${limit}`;

  const res = await fetch(rssUrl, {
    headers: getRandomHeaders('application/rss+xml, application/xml, text/xml, */*'),
  });

  if (!res.ok) {
    console.warn(`[poll-reddit] RSS ${res.status} for r/${subreddit} "${keyword}"`);
    return [];
  }

  const xml = await res.text();
  if (!xml || xml.length < 100) return [];

  const entries = parseAtomFeed(xml);
  if (entries.length === 0) return [];

  console.log(`[poll-reddit] RSS: ${entries.length} entries in r/${subreddit} for "${keyword}"`);

  const candidates: CandidatePost[] = [];
  for (const entry of entries) {
    // Keyword-in-text filter
    if (!keywordInText(keyword, entry.title, entry.body)) {
      continue;
    }

    const postIdMatch = entry.link.match(/\/comments\/([a-z0-9]+)/i);
    const redditPostId = postIdMatch ? `t3_${postIdMatch[1]}` : `rss_${hashString(entry.link)}`;

    candidates.push({
      userId,
      keywordId,
      keyword,
      subreddit: entry.subreddit || subreddit,
      author: entry.author || '[unknown]',
      title: entry.title || 'No title',
      body: (entry.body || '').slice(0, 1000) || null,
      url: entry.link,
      redditPostId,
      score: 0,
      postedAt: entry.published || null,
    });
  }

  console.log(`[poll-reddit] RSS: ${candidates.length}/${entries.length} passed keyword filter for "${keyword}"`);
  return candidates;
}

/* ── Collect candidates via JSON API ───────────────────────────────── */

async function collectViaJSON(
  userId: string,
  keywordId: string,
  keyword: string,
  subreddit: string
): Promise<CandidatePost[]> {
  const domain = randomRedditDomain();
  const timeRange = randomTimeRange();
  const sort = randomSort();
  const limit = randomLimit();

  const searchUrl = `https://${domain}/r/${encodeURIComponent(subreddit)}/search.json?q=${encodeURIComponent(keyword)}&restrict_sr=on&sort=${sort}&t=${timeRange}&limit=${limit}`;

  const res = await fetch(searchUrl, {
    headers: getRandomHeaders('application/json, text/plain, */*'),
  });

  if (!res.ok) {
    console.warn(`[poll-reddit] JSON ${res.status} for r/${subreddit} "${keyword}"`);
    return [];
  }

  const data = await res.json();
  const posts = data?.data?.children ?? [];
  if (posts.length === 0) return [];

  console.log(`[poll-reddit] JSON: ${posts.length} posts in r/${subreddit} for "${keyword}"`);

  const candidates: CandidatePost[] = [];
  for (const post of posts) {
    const p = post.data;
    if (!p || !p.id) continue;

    const title = p.title || 'No title';
    const body = (p.selftext || '').slice(0, 1000) || null;

    // Keyword-in-text filter
    if (!keywordInText(keyword, title, body)) {
      continue;
    }

    candidates.push({
      userId,
      keywordId,
      keyword,
      subreddit: p.subreddit || subreddit,
      author: p.author || '[deleted]',
      title,
      body,
      url: `https://www.reddit.com${p.permalink}`,
      redditPostId: `t3_${p.id}`,
      score: p.score ?? 0,
      postedAt: p.created_utc ? new Date(p.created_utc * 1000).toISOString() : null,
    });
  }

  console.log(`[poll-reddit] JSON: ${candidates.length}/${posts.length} passed keyword filter for "${keyword}"`);
  return candidates;
}

/* ── Batched Apify fallback (collect candidates, no insert) ────────── */

async function collectViaApifyBatch(
  failedPairs: FailedPair[]
): Promise<CandidatePost[]> {
  const APIFY_TOKEN = Deno.env.get('APIFY_TOKEN');
  if (!APIFY_TOKEN) {
    console.warn('[poll-reddit] APIFY_TOKEN not configured, skipping Apify fallback');
    return [];
  }

  const uniqueKeywords = [...new Set(failedPairs.map(p => p.keyword))];
  const uniqueSubreddits = [...new Set(failedPairs.map(p => p.subreddit))];

  console.log(`[poll-reddit] Apify batch: ${uniqueKeywords.length} keywords × ${uniqueSubreddits.length} subreddits`);

  const actorUrl = `https://api.apify.com/v2/acts/parseforge~reddit-posts-scraper/run-sync-get-dataset-items?token=${APIFY_TOKEN}`;

  try {
    const res = await fetch(actorUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        searchQueries: uniqueKeywords,
        subreddits: uniqueSubreddits,
        sort: 'new',
        time: 'week',
        maxItems: 200,
        postsPerSource: 50,
        includeNSFW: false,
        proxyConfiguration: {
          useApifyProxy: true,
          apifyProxyGroups: ['RESIDENTIAL'],
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`[poll-reddit] Apify returned ${res.status}: ${errText.slice(0, 300)}`);
      return [];
    }

    const posts: any[] = await res.json();
    if (!Array.isArray(posts) || posts.length === 0) {
      console.log('[poll-reddit] Apify: 0 results returned');
      return [];
    }

    const validPosts = posts.filter((p: any) => p && !p.error && (p.title || p.url || p.permalink));
    if (validPosts.length === 0) {
      console.log(`[poll-reddit] Apify: 0 valid posts (${posts.length} raw items filtered out)`);
      return [];
    }

    console.log(`[poll-reddit] Apify: ${validPosts.length} valid posts from batch call`);

    const keywordLower = uniqueKeywords.map(k => k.toLowerCase());
    const candidates: CandidatePost[] = [];

    for (const p of validPosts) {
      const title = p.title || '';
      const body = (p.selftext || p.selfText || p.body || p.text || '').slice(0, 1000);
      const permalink = p.permalink || '';
      const postUrl = p.url || (permalink ? `https://www.reddit.com${permalink}` : '');
      const postSubreddit = p.subreddit || p.subredditName || '';
      const author = p.author || p.authorName || '[unknown]';
      const score = p.score ?? p.ups ?? p.upvoteScore ?? 0;

      const postIdMatch = (permalink || postUrl).match(/\/comments\/([a-z0-9]+)/i);
      const rawId = p.id || p.postId || p.name;
      const redditPostId = postIdMatch
        ? `t3_${postIdMatch[1]}`
        : rawId
          ? (String(rawId).startsWith('t3_') ? String(rawId) : `t3_${rawId}`)
          : `apify_${hashString(postUrl || JSON.stringify(p))}`;

      const finalUrl = postUrl || `https://www.reddit.com${permalink}`;

      let postedAt: string | null = null;
      const rawDate = p.createdAt || p.postedDate || p.created_utc || p.postedAt;
      if (rawDate) {
        if (typeof rawDate === 'number') {
          postedAt = new Date(rawDate > 1e12 ? rawDate : rawDate * 1000).toISOString();
        } else if (typeof rawDate === 'string') {
          postedAt = rawDate;
        }
      }

      // Match to keyword
      const searchText = `${title} ${body}`.toLowerCase();
      const matchedKeywordIdx = keywordLower.findIndex(k => searchText.includes(k));
      if (matchedKeywordIdx === -1) continue;

      const matchedKeyword = uniqueKeywords[matchedKeywordIdx];
      const matchingPairs = failedPairs.filter(fp => fp.keyword === matchedKeyword);
      if (matchingPairs.length === 0) continue;

      const seenUsers = new Set<string>();
      for (const pair of matchingPairs) {
        if (seenUsers.has(pair.userId)) continue;
        seenUsers.add(pair.userId);

        candidates.push({
          userId: pair.userId,
          keywordId: pair.keywordId,
          keyword: matchedKeyword,
          subreddit: postSubreddit || pair.subreddit,
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

    console.log(`[poll-reddit] Apify batch: ${candidates.length} candidates after keyword filter`);
    return candidates;
  } catch (err) {
    console.error(`[poll-reddit] Apify batch error:`, err);
    return [];
  }
}

/* ── XML parsing helpers ───────────────────────────────────────────── */

interface FeedEntry {
  title: string;
  link: string;
  author: string;
  body: string;
  published: string | null;
  subreddit: string;
}

function parseAtomFeed(xml: string): FeedEntry[] {
  const entries: FeedEntry[] = [];
  const entryBlocks = xml.match(/<entry[\s>][\s\S]*?<\/entry>/gi) || [];

  for (const block of entryBlocks) {
    const title = extractTag(block, 'title') || '';
    const link = extractAttr(block, 'link', 'href') || extractTag(block, 'link') || '';
    const author = extractTag(block, 'name') || '[unknown]';
    const published = extractTag(block, 'published') || extractTag(block, 'updated') || null;
    const content = extractTag(block, 'content') || '';
    const body = content.replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();
    const subMatch = link.match(/\/r\/([^/]+)/);
    const subreddit = subMatch ? subMatch[1] : '';

    if (link) {
      entries.push({ title, link, author, body, published, subreddit });
    }
  }
  return entries;
}

function extractTag(xml: string, tag: string): string {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return match ? match[1].trim() : '';
}

function extractAttr(xml: string, tag: string, attr: string): string {
  const match = xml.match(new RegExp(`<${tag}[^>]*${attr}="([^"]*)"`, 'i'));
  return match ? match[1] : '';
}

function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
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
