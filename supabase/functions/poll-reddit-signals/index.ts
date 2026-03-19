const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Poll Reddit RSS feeds for user-defined intent keywords.
 * Can be called:
 *   - By cron (no auth needed, processes ALL active keywords)
 *   - By user (auth required, processes only their keywords — or manual trigger)
 */
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

    // Default subreddits to search if none specified
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

/* ── Poll a single subreddit search for a keyword via RSS ── */

async function pollSubredditForKeyword(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  keywordId: string,
  keyword: string,
  subreddit: string
): Promise<number> {
  // Use Reddit search RSS: searches within a subreddit for the keyword
  const searchUrl = `https://www.reddit.com/r/${encodeURIComponent(subreddit)}/search.rss?q=${encodeURIComponent(keyword)}&restrict_sr=on&sort=new&t=week&limit=25`;

  const res = await fetch(searchUrl, {
    headers: {
      'User-Agent': 'Intentsly/1.0 (Reddit Signal Monitor)',
      'Accept': 'application/rss+xml, text/xml, application/xml',
    },
  });

  if (!res.ok) {
    const text = await res.text();
    console.warn(`[poll-reddit] Reddit returned ${res.status} for r/${subreddit} "${keyword}": ${text.slice(0, 200)}`);
    return 0;
  }

  const xml = await res.text();
  const entries = parseAtomEntries(xml);

  if (entries.length === 0) return 0;

  console.log(`[poll-reddit] Found ${entries.length} entries in r/${subreddit} for "${keyword}"`);

  // Upsert mentions (ignore duplicates via unique constraint)
  let inserted = 0;
  for (const entry of entries) {
    const { error } = await supabase.from('reddit_mentions').upsert(
      {
        user_id: userId,
        keyword_id: keywordId,
        keyword_matched: keyword,
        subreddit,
        author: entry.author || 'unknown',
        title: entry.title,
        body: entry.content?.slice(0, 1000) || null,
        url: entry.link,
        reddit_post_id: entry.id,
        posted_at: entry.published || null,
      },
      { onConflict: 'user_id,reddit_post_id', ignoreDuplicates: true }
    );

    if (!error) inserted++;
  }

  return inserted;
}

/* ── Simple Atom XML parser (Reddit RSS uses Atom format) ── */

interface AtomEntry {
  id: string;
  title: string;
  link: string;
  author: string | null;
  content: string | null;
  published: string | null;
}

function parseAtomEntries(xml: string): AtomEntry[] {
  const entries: AtomEntry[] = [];
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/gi;
  let match: RegExpExecArray | null;

  while ((match = entryRegex.exec(xml)) !== null) {
    const block = match[1];

    const id = extractTag(block, 'id') || `unknown-${Math.random()}`;
    const title = decodeHtmlEntities(extractTag(block, 'title') || 'No title');
    const link = extractAttr(block, 'link', 'href') || '';
    const author = extractTag(block, 'name');
    const content = decodeHtmlEntities(extractTag(block, 'content') || extractTag(block, 'summary') || '');
    const published = extractTag(block, 'published') || extractTag(block, 'updated');

    if (link) {
      entries.push({ id, title, link, author, content, published });
    }
  }

  return entries;
}

function extractTag(xml: string, tag: string): string | null {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const m = regex.exec(xml);
  return m ? m[1].trim() : null;
}

function extractAttr(xml: string, tag: string, attr: string): string | null {
  const regex = new RegExp(`<${tag}[^>]*${attr}="([^"]*)"`, 'i');
  const m = regex.exec(xml);
  return m ? m[1] : null;
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<[^>]*>/g, ''); // Strip HTML tags from content
}

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
