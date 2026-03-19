const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

    // Determine scope: specific user or all users (cron)
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

    // Fetch active keywords
    let query = supabase.from('reddit_keywords').select('*').eq('active', true);
    if (userFilter) {
      query = query.eq('user_id', userFilter);
    }
    const { data: keywords, error: kwErr } = await query;
    if (kwErr) throw kwErr;
    if (!keywords || keywords.length === 0) {
      return json({ message: 'No active keywords to poll', processed: 0 });
    }

    console.log(`[poll-reddit] Processing ${keywords.length} keyword(s) via RSS feeds`);

    let totalInserted = 0;
    const DEFAULT_SUBREDDITS = ['SaaS', 'startups', 'Entrepreneur', 'smallbusiness', 'marketing', 'sales'];

    // Track insertions per user for notifications
    const userInsertions: Record<string, number> = {};

    for (const kw of keywords) {
      const subreddits = kw.subreddits?.length > 0 ? kw.subreddits : DEFAULT_SUBREDDITS;
      const keyword = kw.keyword;

      for (const sub of subreddits) {
        try {
          // Primary: RSS feed search
          let inserted = await pollViaRSS(supabase, kw.user_id, kw.id, keyword, sub);

          // Fallback: JSON API if RSS returns 0 (some subreddits block RSS search)
          if (inserted === 0) {
            inserted = await pollViaJSON(supabase, kw.user_id, kw.id, keyword, sub);
          }

          totalInserted += inserted;
          if (inserted > 0) {
            userInsertions[kw.user_id] = (userInsertions[kw.user_id] || 0) + inserted;
          }
        } catch (err) {
          console.error(`[poll-reddit] Error polling r/${sub} for "${keyword}":`, err);
        }

        // Small delay between requests to be polite
        await new Promise(r => setTimeout(r, 500));
      }
    }

    // Send in-app notifications for users with new mentions
    for (const [userId, count] of Object.entries(userInsertions)) {
      try {
        await supabase.from('notifications').insert({
          user_id: userId,
          title: `🔴 ${count} new Reddit signal${count > 1 ? 's' : ''} found`,
          body: `Your Reddit AI Agent discovered ${count} new post${count > 1 ? 's' : ''} matching your intent keywords.`,
          type: 'reddit_signal',
          link: '/reddit-signals',
        });
        console.log(`[poll-reddit] Notification sent to user ${userId}: ${count} mentions`);
      } catch (err) {
        console.error(`[poll-reddit] Failed to send notification to ${userId}:`, err);
      }
    }

    console.log(`[poll-reddit] Done. Inserted ${totalInserted} new mention(s).`);
    return json({ message: 'Polling complete', processed: keywords.length, inserted: totalInserted });
  } catch (error) {
    console.error('[poll-reddit] Fatal error:', error);
    return json({ error: error instanceof Error ? error.message : 'Unknown error' }, 500);
  }
});

/* ── Poll via RSS feed (primary, lightweight, no API key needed) ────── */

async function pollViaRSS(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  keywordId: string,
  keyword: string,
  subreddit: string
): Promise<number> {
  // Reddit RSS search: reddit.com/r/{sub}/search.rss?q={keyword}&restrict_sr=on&sort=new&t=week
  const rssUrl = `https://www.reddit.com/r/${encodeURIComponent(subreddit)}/search.rss?q=${encodeURIComponent(keyword)}&restrict_sr=on&sort=new&t=week&limit=25`;

  console.log(`[poll-reddit] RSS: r/${subreddit} for "${keyword}"`);

  const res = await fetch(rssUrl, {
    headers: {
      'User-Agent': 'Intentsly:v1.0.0 (intent-monitoring-bot)',
      'Accept': 'application/rss+xml, application/xml, text/xml',
    },
  });

  if (!res.ok) {
    console.warn(`[poll-reddit] RSS returned ${res.status} for r/${subreddit} "${keyword}"`);
    return 0;
  }

  const xml = await res.text();
  if (!xml || xml.length < 100) return 0;

  // Parse RSS/Atom feed entries
  const entries = parseAtomFeed(xml);
  if (entries.length === 0) {
    console.log(`[poll-reddit] RSS: No entries in r/${subreddit} for "${keyword}"`);
    return 0;
  }

  console.log(`[poll-reddit] RSS: Found ${entries.length} entries in r/${subreddit} for "${keyword}"`);

  let inserted = 0;
  for (const entry of entries) {
    // Extract reddit post ID from the URL (e.g., /r/SaaS/comments/abc123/...)
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

/* ── Parse Atom/RSS XML without external deps ──────────────────────── */

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

  // Reddit returns Atom format. Match <entry>...</entry> blocks
  const entryBlocks = xml.match(/<entry[\s>][\s\S]*?<\/entry>/gi) || [];

  for (const block of entryBlocks) {
    const title = extractTag(block, 'title') || '';
    const link = extractAttr(block, 'link', 'href') || extractTag(block, 'link') || '';
    const author = extractTag(block, 'name') || '[unknown]';
    const published = extractTag(block, 'published') || extractTag(block, 'updated') || null;
    const content = extractTag(block, 'content') || '';

    // Strip HTML tags from content to get plain text body
    const body = content.replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();

    // Extract subreddit from link
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

/* ── Fallback: JSON API (if RSS fails or returns empty) ────────────── */

async function pollViaJSON(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  keywordId: string,
  keyword: string,
  subreddit: string
): Promise<number> {
  const searchUrl = `https://old.reddit.com/r/${encodeURIComponent(subreddit)}/search.json?q=${encodeURIComponent(keyword)}&restrict_sr=on&sort=new&t=week&limit=25`;

  const res = await fetch(searchUrl, {
    headers: {
      'User-Agent': 'Intentsly:v1.0.0 (intent-monitoring-bot)',
      'Accept': 'application/json',
    },
  });

  if (!res.ok) {
    console.warn(`[poll-reddit] JSON fallback returned ${res.status} for r/${subreddit} "${keyword}"`);
    return 0;
  }

  const data = await res.json();
  const posts = data?.data?.children ?? [];
  if (posts.length === 0) return 0;

  console.log(`[poll-reddit] JSON fallback: ${posts.length} posts in r/${subreddit} for "${keyword}"`);

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

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
