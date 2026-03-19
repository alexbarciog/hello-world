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

    console.log(`[poll-reddit] Processing ${keywords.length} keyword(s)`);

    let totalInserted = 0;
    const DEFAULT_SUBREDDITS = ['SaaS', 'startups', 'Entrepreneur', 'smallbusiness', 'marketing', 'sales'];

    for (const kw of keywords) {
      const subreddits = kw.subreddits?.length > 0 ? kw.subreddits : DEFAULT_SUBREDDITS;
      const keyword = kw.keyword;

      for (const sub of subreddits) {
        try {
          const inserted = await pollSubredditForKeyword(supabase, kw.user_id, kw.id, keyword, sub);
          totalInserted += inserted;
        } catch (err) {
          console.error(`[poll-reddit] Error polling r/${sub} for "${keyword}":`, err);
        }
      }
    }

    console.log(`[poll-reddit] Done. Inserted ${totalInserted} new mention(s).`);
    return json({ message: 'Polling complete', processed: keywords.length, inserted: totalInserted });
  } catch (error) {
    console.error('[poll-reddit] Fatal error:', error);
    return json({ error: error instanceof Error ? error.message : 'Unknown error' }, 500);
  }
});

/* ── Poll a single subreddit search for a keyword via Reddit JSON API ── */

async function pollSubredditForKeyword(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  keywordId: string,
  keyword: string,
  subreddit: string
): Promise<number> {
  // Use Reddit's JSON API (old.reddit.com is more lenient with server requests)
  const searchUrl = `https://old.reddit.com/r/${encodeURIComponent(subreddit)}/search.json?q=${encodeURIComponent(keyword)}&restrict_sr=on&sort=new&t=week&limit=25`;

  const res = await fetch(searchUrl, {
    headers: {
      'User-Agent': 'Intentsly:v1.0.0 (by /u/intentsly_bot)',
      'Accept': 'application/json',
    },
  });

  if (!res.ok) {
    // Try fallback: global Reddit search
    const fallbackUrl = `https://old.reddit.com/search.json?q=${encodeURIComponent(keyword + ' subreddit:' + subreddit)}&sort=new&t=week&limit=25`;
    const fallbackRes = await fetch(fallbackUrl, {
      headers: {
        'User-Agent': 'Intentsly:v1.0.0 (by /u/intentsly_bot)',
        'Accept': 'application/json',
      },
    });

    if (!fallbackRes.ok) {
      const text = await fallbackRes.text();
      console.warn(`[poll-reddit] Reddit returned ${fallbackRes.status} for r/${subreddit} "${keyword}": ${text.slice(0, 200)}`);
      return 0;
    }

    return await processJsonResponse(supabase, await fallbackRes.json(), userId, keywordId, keyword, subreddit);
  }

  return await processJsonResponse(supabase, await res.json(), userId, keywordId, keyword, subreddit);
}

/* ── Process Reddit JSON API response ── */

interface RedditPost {
  kind: string;
  data: {
    id: string;
    title: string;
    selftext: string;
    author: string;
    permalink: string;
    subreddit: string;
    created_utc: number;
    score: number;
    url: string;
  };
}

async function processJsonResponse(
  supabase: ReturnType<typeof createClient>,
  data: { data?: { children?: RedditPost[] } },
  userId: string,
  keywordId: string,
  keyword: string,
  subreddit: string
): Promise<number> {
  const posts = data?.data?.children ?? [];

  if (posts.length === 0) {
    console.log(`[poll-reddit] No results in r/${subreddit} for "${keyword}"`);
    return 0;
  }

  console.log(`[poll-reddit] Found ${posts.length} posts in r/${subreddit} for "${keyword}"`);

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
