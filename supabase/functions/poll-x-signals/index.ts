import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@18.5.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // Fetch all active X keywords
    const { data: allKeywords, error: kwErr } = await supabase
      .from('x_keywords')
      .select('*')
      .eq('active', true);

    if (kwErr) throw kwErr;
    if (!allKeywords || allKeywords.length === 0) {
      console.log('[poll-x] No active keywords found');
      return new Response(JSON.stringify({ inserted: 0, message: 'No active keywords' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[poll-x] Found ${allKeywords.length} active keywords`);

    // Group keywords by user and check subscription
    const userKeywords = new Map<string, typeof allKeywords>();
    for (const kw of allKeywords) {
      const list = userKeywords.get(kw.user_id) || [];
      list.push(kw);
      userKeywords.set(kw.user_id, list);
    }

    // Check subscriptions and filter to paid users only
    const paidUserKeywords: typeof allKeywords = [];

    for (const [userId, kws] of userKeywords) {
      if (!stripe) {
        // No Stripe key — allow all (dev mode)
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
          console.log(`[poll-x] Skipping free user ${userId}`);
        }
      } catch (err) {
        console.warn(`[poll-x] Stripe check failed for ${userId}:`, err);
      }
    }

    if (paidUserKeywords.length === 0) {
      console.log('[poll-x] No paid users with active keywords');
      return new Response(JSON.stringify({ inserted: 0, message: 'No paid users' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Collect unique keywords for Apify batch
    const uniqueKeywords = [...new Set(paidUserKeywords.map(k => k.keyword))];
    console.log(`[poll-x] Searching X for keywords: ${uniqueKeywords.join(', ')}`);

    // Call Apify apidojo~tweet-scraper actor synchronously
    const apifyUrl = `https://api.apify.com/v2/acts/apidojo~tweet-scraper/run-sync-get-dataset-items?token=${APIFY_TOKEN}`;

    const apifyRes = await fetch(apifyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        searchTerms: uniqueKeywords,
        maxItems: uniqueKeywords.length * 30,
        sort: 'Latest',
      }),
    });

    if (!apifyRes.ok) {
      const errText = await apifyRes.text();
      console.error(`[poll-x] Apify error ${apifyRes.status}: ${errText}`);
      throw new Error(`Apify API error: ${apifyRes.status}`);
    }

    const tweets = await apifyRes.json();

    if (!Array.isArray(tweets)) {
      console.warn('[poll-x] Apify returned non-array response:', typeof tweets);
      return new Response(JSON.stringify({ inserted: 0, message: 'No tweets returned' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Filter out noResults items
    const validTweets = tweets.filter((t: any) => !t.noResults && (t.full_text || t.text || t.tweet_text));
    console.log(`[poll-x] Apify returned ${tweets.length} items, ${validTweets.length} valid tweets`);

    let totalInserted = 0;
    const keywordLower = uniqueKeywords.map(k => k.toLowerCase());

    for (const tweet of validTweets) {
      const tweetText = (tweet.full_text || tweet.text || tweet.tweet_text || '').slice(0, 2000);
      const tweetId = tweet.id_str || tweet.id || tweet.tweet_id || '';
      if (!tweetId) continue;

      const author = tweet.user?.screen_name || tweet.screen_name || tweet.username || tweet.author || '[unknown]';
      const authorName = tweet.user?.name || tweet.name || tweet.author_name || null;
      const url = tweet.url || tweet.tweet_url || `https://x.com/${author}/status/${tweetId}`;
      const likeCount = tweet.favorite_count || tweet.like_count || tweet.likeCount || 0;
      const retweetCount = tweet.retweet_count || tweet.retweetCount || 0;
      const replyCount = tweet.reply_count || tweet.replyCount || 0;

      // Parse posted_at
      let postedAt: string | null = null;
      const rawDate = tweet.created_at || tweet.createdAt || tweet.timestamp;
      if (rawDate) {
        try {
          postedAt = new Date(rawDate).toISOString();
        } catch { /* ignore */ }
      }

      // Match tweet to keywords
      const searchText = tweetText.toLowerCase();
      const matchedIdx = keywordLower.findIndex(k => searchText.includes(k));
      if (matchedIdx === -1) continue;

      const matchedKeyword = uniqueKeywords[matchedIdx];

      // Find all users that have this keyword
      const matchingKws = paidUserKeywords.filter(k => k.keyword === matchedKeyword);
      const seenUsers = new Set<string>();

      for (const kw of matchingKws) {
        if (seenUsers.has(kw.user_id)) continue;
        seenUsers.add(kw.user_id);

        const { error } = await supabase.from('x_mentions').upsert(
          {
            user_id: kw.user_id,
            keyword_id: kw.id,
            keyword_matched: matchedKeyword,
            author,
            author_name: authorName,
            title: tweetText.slice(0, 300),
            body: tweetText.length > 300 ? tweetText : null,
            url,
            x_post_id: String(tweetId),
            like_count: likeCount,
            retweet_count: retweetCount,
            reply_count: replyCount,
            posted_at: postedAt,
          },
          { onConflict: 'user_id,x_post_id', ignoreDuplicates: true }
        );

        if (!error) {
          totalInserted++;
        } else {
          console.warn(`[poll-x] Upsert error: ${error.message}`);
        }
      }
    }

    console.log(`[poll-x] Done. Inserted ${totalInserted} mentions.`);

    return new Response(JSON.stringify({ inserted: totalInserted, tweets: validTweets.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[poll-x] Fatal error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
