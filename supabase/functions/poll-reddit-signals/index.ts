const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0',
];

const ACCEPT_LANGUAGES = [
  'en-US,en;q=0.9',
  'en-GB,en;q=0.9,en-US;q=0.8',
  'en-US,en;q=0.9,fr;q=0.8',
  'en,en-US;q=0.9,de;q=0.7',
  'en-US,en;q=0.8',
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

    // Shuffle keywords to randomize order across users
    const shuffledKeywords = shuffle(keywords);

    console.log(`[poll-reddit] Processing ${shuffledKeywords.length} keyword(s)`);

    let totalInserted = 0;
    let requestCount = 0;
    const DEFAULT_SUBREDDITS = ['SaaS', 'startups', 'Entrepreneur', 'smallbusiness', 'marketing', 'sales'];
    const userInsertions: Record<string, number> = {};

    for (const kw of shuffledKeywords) {
      // Shuffle subreddits per keyword
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

          // Apify fallback when both RSS and JSON fail
          if (inserted === 0) {
            await randomDelay(1000, 2500);
            inserted = await pollViaApify(supabase, kw.user_id, kw.id, keyword, sub);
          }

          totalInserted += inserted;
          if (inserted > 0) {
            userInsertions[kw.user_id] = (userInsertions[kw.user_id] || 0) + inserted;
          }
        } catch (err) {
          console.error(`[poll-reddit] Error polling r/${sub} for "${keyword}":`, err);
        }

        // Variable delay between requests; longer pause every 5-8 requests
        if (requestCount % randInt(5, 8) === 0) {
          await randomDelay(5000, 15000);
        } else {
          await randomDelay(1500, 4500);
        }
      }

      // Inter-keyword delay
      await randomDelay(2000, 8000);
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

/* ── Fallback: Apify Reddit Posts Scraper ───────────────────────────── */

async function pollViaApify(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  keywordId: string,
  keyword: string,
  subreddit: string
): Promise<number> {
  const APIFY_TOKEN = Deno.env.get('APIFY_TOKEN');
  if (!APIFY_TOKEN) {
    console.warn('[poll-reddit] APIFY_TOKEN not configured, skipping Apify fallback');
    return 0;
  }

  const actorUrl = `https://api.apify.com/v2/acts/parseforge~reddit-posts-scraper/run-sync-get-dataset-items?token=${APIFY_TOKEN}`;

  console.log(`[poll-reddit] Apify fallback: r/${subreddit} for "${keyword}"`);

  try {
    const res = await fetch(actorUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        searchQuery: keyword,
        subreddit: subreddit,
        sort: 'new',
        time: 'month',
        maxResults: 50,
        proxyConfiguration: { useApifyProxy: true },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn(`[poll-reddit] Apify returned ${res.status}: ${errText.slice(0, 200)}`);
      return 0;
    }

    const posts: any[] = await res.json();
    if (!posts || posts.length === 0) {
      console.log(`[poll-reddit] Apify: 0 results for r/${subreddit} "${keyword}"`);
      return 0;
    }

    console.log(`[poll-reddit] Apify: ${posts.length} posts in r/${subreddit} for "${keyword}"`);
    // Log first post structure for debugging
    if (posts.length > 0) {
      console.log(`[poll-reddit] Apify sample post keys: ${JSON.stringify(Object.keys(posts[0]))}`);
      console.log(`[poll-reddit] Apify sample post: ${JSON.stringify(posts[0]).slice(0, 500)}`);
    }

    let inserted = 0;
    for (const p of posts) {
      if (!p) continue;

      // Extract post ID from URL or use provided id
      const postId = p.id || p.postId;
      const url = p.url || p.postUrl || `https://www.reddit.com${p.permalink || ''}`;
      const postIdMatch = url.match(/\/comments\/([a-z0-9]+)/i);
      const redditPostId = postIdMatch
        ? `t3_${postIdMatch[1]}`
        : postId
          ? `t3_${postId}`
          : `apify_${hashString(url)}`;

      const { error } = await supabase.from('reddit_mentions').upsert(
        {
          user_id: userId,
          keyword_id: keywordId,
          keyword_matched: keyword,
          subreddit: p.subreddit || subreddit,
          author: p.author || p.username || '[unknown]',
          title: p.title || 'No title',
          body: (p.body || p.selftext || p.text || '').slice(0, 1000) || null,
          url: url,
          reddit_post_id: redditPostId,
          score: p.score ?? p.upvotes ?? 0,
          posted_at: p.createdAt || p.posted_at || p.created_utc
            ? (typeof p.created_utc === 'number'
              ? new Date(p.created_utc * 1000).toISOString()
              : p.createdAt || p.posted_at)
            : null,
        },
        { onConflict: 'user_id,reddit_post_id', ignoreDuplicates: true }
      );
      if (!error) inserted++;
    }

    return inserted;
  } catch (err) {
    console.error(`[poll-reddit] Apify error for r/${subreddit} "${keyword}":`, err);
    return 0;
  }
}

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
