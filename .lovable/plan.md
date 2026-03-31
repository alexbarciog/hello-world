

## Plan: Reduce Reddit Signal Compute Usage for High-Keyword Users

### Problem
Users with 30-40 keywords trigger a massive Apify call: `maxItems = keywords * subreddits * 5` can reach 30 × 6 × 5 = 900 items. This consumes huge Apify compute (residential proxies are expensive) and risks hitting the edge function's 110s timeout.

### Strategy: Keyword Batching with a Per-User Cap

Instead of sending all keywords in one giant Apify call, limit and rotate which keywords get processed per run.

### Implementation

#### 1. Cap keywords per user per run (max 10)
- Each run, select up to 10 keywords per user using round-robin rotation
- Track which keywords were last polled using a `last_polled_at` column on `reddit_keywords`
- Pick the 10 keywords with the oldest `last_polled_at` (or null = never polled)
- After processing, update `last_polled_at` on those keywords

This means a user with 40 keywords gets full coverage across 4 runs (2 days at current 2x/day schedule).

#### 2. Reduce maxItems calculation
- Change from `keywords * subreddits * 5` to a flat cap: `min(200, keywords * 10)`
- This drastically cuts Apify compute while still returning enough posts per keyword

#### 3. Cap `postsPerSource` to 10 (down from 50)
- 50 posts per source is excessive; most relevant posts appear in the top 10

#### 4. Migration: add `last_polled_at` to `reddit_keywords`
```sql
ALTER TABLE reddit_keywords ADD COLUMN last_polled_at timestamptz DEFAULT NULL;
```

### Files to Change
- `supabase/functions/poll-reddit-signals/index.ts` — keyword rotation logic, reduced limits
- New migration — add `last_polled_at` column

### Technical Flow
```text
Current (40 keywords):
  All 40 keywords → Apify (maxItems=1200, postsPerSource=50)
  = massive compute, often times out

Proposed (40 keywords):
  Pick 10 oldest-polled → Apify (maxItems=100, postsPerSource=10)
  Update last_polled_at on those 10
  Next run picks next 10 oldest
  Full rotation every 4 runs (2 days)
```

### Impact
- Apify compute reduced ~90% per run (from ~1200 items to ~100)
- Edge function stays well within 110s budget
- All keywords still get polled every 2 days
- No user-facing changes needed

