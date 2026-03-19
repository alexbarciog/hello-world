

## Problem Analysis

The current implementation has two critical issues costing money without results:

1. **One Apify call per (keyword, subreddit) pair**: With 1 keyword and 6 default subreddits, that's up to 6 Apify runs at ~$0.22 each = $1.32 per poll cycle, even when RSS/JSON fail.

2. **Wrong field mapping**: The Apify actor's output fields don't match what the code expects, resulting in "blind" entries (no title, no author, no body).

The Apify actor (`parseforge/reddit-posts-scraper`) supports **arrays** for both `searchQueries` and `subreddits`, meaning we can batch everything into **a single API call**.

---

## Plan

### Step 1: Batch all keywords + subreddits into ONE Apify call

Restructure the polling flow so Apify is called **once** at the end, not per subreddit:

```text
Current flow (expensive):
  For each keyword:
    For each subreddit (6):
      1. Try RSS
      2. Try JSON  
      3. Try Apify  ← up to 6 calls @ $0.22 each

New flow (1 call max):
  For each keyword:
    For each subreddit:
      1. Try RSS
      2. Try JSON
      Track which (keyword, subreddit) pairs got 0 results
  
  If any pairs failed → ONE Apify call with:
    searchQueries: [all failed keywords]
    subreddits: [all failed subreddits]
```

### Step 2: Fix the Apify input payload

Use the correct documented schema with residential proxies:

```json
{
  "searchQueries": ["keyword1", "keyword2"],
  "subreddits": ["SaaS", "startups", "marketing"],
  "sort": "new",
  "time": "week",
  "maxItems": 200,
  "postsPerSource": 50,
  "includeNSFW": false,
  "proxyConfiguration": {
    "useApifyProxy": true,
    "apifyProxyGroups": ["RESIDENTIAL"]
  }
}
```

Key changes:
- Add `"apifyProxyGroups": ["RESIDENTIAL"]` (Reddit blocks datacenter IPs)
- Use `subreddits` array instead of `searchInSubreddit` string
- Pass all keywords at once in `searchQueries`

### Step 3: Fix the output field mapping

Based on the actor's documented 18 output fields, update the mapping. The actor uses standard Reddit field names. Add comprehensive logging of the first result's keys on success so we can verify and adjust if needed.

The mapping will try multiple possible field name patterns:
- **title**: `p.title`
- **author**: `p.author`
- **subreddit**: `p.subreddit`
- **body/selftext**: `p.selftext || p.selfText || p.body || p.text`
- **url**: `p.url` or construct from `p.permalink`
- **score**: `p.score || p.upvoteScore`
- **posted_at**: `p.postedDate || p.createdAt || p.created_utc`
- **post ID**: extract from `p.permalink` or `p.redditLink` via `/comments/([a-z0-9]+)/` regex

### Step 4: Associate Apify results back to the correct keyword/user

Since we batch multiple keywords into one call, each Apify result needs to be matched back to the originating keyword. We'll match by checking if the post title or body contains the keyword text, and fall back to the first keyword if no match is found.

---

## Technical Details

**File changed**: `supabase/functions/poll-reddit-signals/index.ts`

- Remove the per-subreddit `pollViaApify()` calls from the inner loop
- After all RSS/JSON attempts, collect failed `(userId, keywordId, keyword, subreddit)` tuples
- Group by user, make one Apify call per user (since keyword_id association matters)
- Actually: since `searchQueries` searches globally when `subreddits` is set, we make **one call total** and match results back
- Parse results with correct field names + detailed logging
- Redeploy the edge function

**Cost impact**: From up to N*6 Apify calls down to 1 single call per poll cycle.

