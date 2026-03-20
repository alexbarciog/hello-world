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

    // Phase 1: Try RSS and JSON for each keyword/subreddit pair
    for (const kw of shuffledKeywords) {
      const subreddits = shuffle(kw.subreddits?.length > 0 ? kw.subreddits : DEFAULT_SUBREDDITS);
      const keyword = kw.keyword;

      for (const sub of subreddits) {
        try {
          let inserted = await pollViaRSS(supabase, kw.user_id, kw.id, keyword, sub);
          requestCount++;

          if (inserted === 0) {
            await randomDelay(1500, 3500);
            inserted = await pollViaJSON(supabase, kw.user_id, kw.id, keyword, sub);
            requestCount++;
          }

          if (inserted === 0) {
            // Track this pair for batched Apify fallback
            failedPairs.push({ userId: kw.user_id, keywordId: kw.id, keyword, subreddit: sub });
          }

          totalInserted += inserted;
          if (inserted > 0) {
            userInsertions[kw.user_id] = (userInsertions[kw.user_id] || 0) + inserted;
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
      const apifyInserted = await pollViaApifyBatch(supabase, failedPairs);
      totalInserted += apifyInserted;

      // Track per-user insertions from Apify
      // (pollViaApifyBatch returns total; we attribute to users inside the function)
    }

    // Notifications
    for (const [userId, count] of Object.entries(userInsertions)) {
      try {
        await supabase.from('notifications').insert({
          user_id: userId,
          title: `🔴 ${count} new Reddit signal${count > 1 ? 's' : ''} found`,
          body: `Your Reddit AI Agent discovered ${count} new post${count > 1 ? 's' : ''} matching your intent keywords.`,
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

/* ── Poll via RSS feed ─────────────────────────────────────────────── */

async function pollViaRSS(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  keywordId: string,
  keyword: string,
  subreddit: string
): Promise<number> {
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
    return 0;
  }

  const xml = await res.text();
  if (!xml || xml.length < 100) return 0;

  const entries = parseAtomFeed(xml);
  if (entries.length === 0) return 0;

  console.log(`[poll-reddit] RSS: ${entries.length} entries in r/${subreddit} for "${keyword}"`);

  let inserted = 0;
  for (const entry of entries) {
    const postIdMatch = entry.link.match(/\/comments\/([a-z0-9]+)/i);
    const redditPostId = postIdMatch ? `t3_${postIdMatch[1]}` : `rss_${hashString(entry.link)}`;

    const { error } = await supabase.from('reddit_mentions').upsert(
      {
        user_id: userId,
        keyword_id: keywordId,
        keyword_matched: keyword,
        subreddit: entry.subreddit || subreddit,
        author: entry.author || '[unknown]',
        title: entry.title || 'No title',
        body: (entry.body || '').slice(0, 1000) || null,
        url: entry.link,
        reddit_post_id: redditPostId,
        score: 0,
        posted_at: entry.published || null,
      },
      { onConflict: 'user_id,reddit_post_id', ignoreDuplicates: true }
    );
    if (!error) inserted++;
  }
  return inserted;
}

/* ── Poll via JSON API (fallback) ──────────────────────────────────── */

async function pollViaJSON(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  keywordId: string,
  keyword: string,
  subreddit: string
): Promise<number> {
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
    return 0;
  }

  const data = await res.json();
  const posts = data?.data?.children ?? [];
  if (posts.length === 0) return 0;

  console.log(`[poll-reddit] JSON: ${posts.length} posts in r/${subreddit} for "${keyword}"`);

  let inserted = 0;
  for (const post of posts) {
    const p = post.data;
    if (!p || !p.id) continue;

    const { error } = await supabase.from('reddit_mentions').upsert(
      {
        user_id: userId,
        keyword_id: keywordId,
        keyword_matched: keyword,
        subreddit: p.subreddit || subreddit,
        author: p.author || '[deleted]',
        title: p.title || 'No title',
        body: (p.selftext || '').slice(0, 1000) || null,
        url: `https://www.reddit.com${p.permalink}`,
        reddit_post_id: `t3_${p.id}`,
        score: p.score ?? 0,
        posted_at: p.created_utc ? new Date(p.created_utc * 1000).toISOString() : null,
      },
      { onConflict: 'user_id,reddit_post_id', ignoreDuplicates: true }
    );
    if (!error) inserted++;
  }
  return inserted;
}

/* ── Batched Apify fallback (ONE call for all failed pairs) ────────── */

async function pollViaApifyBatch(
  supabase: ReturnType<typeof createClient>,
  failedPairs: FailedPair[]
): Promise<number> {
  const APIFY_TOKEN = Deno.env.get('APIFY_TOKEN');
  if (!APIFY_TOKEN) {
    console.warn('[poll-reddit] APIFY_TOKEN not configured, skipping Apify fallback');
    return 0;
  }

  // Deduplicate keywords and subreddits
  const uniqueKeywords = [...new Set(failedPairs.map(p => p.keyword))];
  const uniqueSubreddits = [...new Set(failedPairs.map(p => p.subreddit))];

  console.log(`[poll-reddit] Apify batch: ${uniqueKeywords.length} keywords × ${uniqueSubreddits.length} subreddits`);
  console.log(`[poll-reddit] Apify keywords: ${JSON.stringify(uniqueKeywords)}`);
  console.log(`[poll-reddit] Apify subreddits: ${JSON.stringify(uniqueSubreddits)}`);

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
      return 0;
    }

    const posts: any[] = await res.json();
    if (!Array.isArray(posts) || posts.length === 0) {
      console.log('[poll-reddit] Apify: 0 results returned');
      return 0;
    }

    // Filter out error objects
    const validPosts = posts.filter((p: any) => p && !p.error && (p.title || p.url || p.permalink));

    if (validPosts.length === 0) {
      console.log(`[poll-reddit] Apify: 0 valid posts (${posts.length} raw items filtered out)`);
      if (posts[0]) {
        console.warn(`[poll-reddit] Apify first item sample: ${JSON.stringify(posts[0]).slice(0, 300)}`);
      }
      return 0;
    }

    // Log first valid post structure for debugging
    console.log(`[poll-reddit] Apify: ${validPosts.length} valid posts from batch call`);
    console.log(`[poll-reddit] Apify sample keys: ${JSON.stringify(Object.keys(validPosts[0]))}`);
    console.log(`[poll-reddit] Apify sample: ${JSON.stringify(validPosts[0]).slice(0, 500)}`);

    // Build a lookup for keyword matching
    // For each post, find which keyword it matches by checking title+body
    const keywordLower = uniqueKeywords.map(k => k.toLowerCase());

    let totalInserted = 0;

    for (const p of validPosts) {
      const title = p.title || '';
      const body = (p.selftext || p.selfText || p.body || p.text || '').slice(0, 1000);
      const permalink = p.permalink || '';
      const postUrl = p.url || (permalink ? `https://www.reddit.com${permalink}` : '');
      const postSubreddit = p.subreddit || p.subredditName || '';
      const author = p.author || p.authorName || '[unknown]';
      const score = p.score ?? p.ups ?? p.upvoteScore ?? 0;

      // Extract reddit post ID from permalink
      const postIdMatch = (permalink || postUrl).match(/\/comments\/([a-z0-9]+)/i);
      const rawId = p.id || p.postId || p.name;
      const redditPostId = postIdMatch
        ? `t3_${postIdMatch[1]}`
        : rawId
          ? (String(rawId).startsWith('t3_') ? String(rawId) : `t3_${rawId}`)
          : `apify_${hashString(postUrl || JSON.stringify(p))}`;

      const finalUrl = postUrl || `https://www.reddit.com${permalink}`;

      // Parse posted_at from various possible fields
      let postedAt: string | null = null;
      const rawDate = p.createdAt || p.postedDate || p.created_utc || p.postedAt;
      if (rawDate) {
        if (typeof rawDate === 'number') {
          // Unix timestamp (seconds or milliseconds)
          postedAt = new Date(rawDate > 1e12 ? rawDate : rawDate * 1000).toISOString();
        } else if (typeof rawDate === 'string') {
          postedAt = rawDate;
        }
      }

      // Match post to keyword by checking title + body content
      const searchText = `${title} ${body}`.toLowerCase();
      let matchedKeywordIdx = keywordLower.findIndex(k => searchText.includes(k));
      if (matchedKeywordIdx === -1) {
        // Post doesn't contain any of our keywords — skip it
        continue;
      }

      const matchedKeyword = uniqueKeywords[matchedKeywordIdx];

      // Find all failedPairs that match this keyword (could be multiple users)
      const matchingPairs = failedPairs.filter(fp => fp.keyword === matchedKeyword);
      if (matchingPairs.length === 0) continue;

      // Insert for each user that had this keyword
      const seenUsers = new Set<string>();
      for (const pair of matchingPairs) {
        if (seenUsers.has(pair.userId)) continue;
        seenUsers.add(pair.userId);

        const { error } = await supabase.from('reddit_mentions').upsert(
          {
            user_id: pair.userId,
            keyword_id: pair.keywordId,
            keyword_matched: matchedKeyword,
            subreddit: postSubreddit || pair.subreddit,
            author,
            title: title || 'No title',
            body: body || null,
            url: finalUrl,
            reddit_post_id: redditPostId,
            score,
            posted_at: postedAt,
          },
          { onConflict: 'user_id,reddit_post_id', ignoreDuplicates: true }
        );

        if (!error) {
          totalInserted++;
        } else {
          console.warn(`[poll-reddit] Apify upsert error: ${error.message}`);
        }
      }
    }

    console.log(`[poll-reddit] Apify batch: inserted ${totalInserted} mentions`);
    return totalInserted;
  } catch (err) {
    console.error(`[poll-reddit] Apify batch error:`, err);
    return 0;
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
