

## Plan: Improve Reddit Signal Relevance

### Problem
Reddit's search API returns loosely matched posts. Many results don't contain the keyword at all or aren't relevant to the user's services. The current system inserts everything Reddit returns without any relevance check (RSS/JSON paths don't filter; only the Apify path checks if the keyword appears in the text).

### Root Causes
1. **RSS and JSON paths have zero content filtering** — every result from Reddit's search endpoint is inserted, regardless of whether the keyword actually appears in the post
2. **No relevance scoring** — even when a keyword appears, the post may be unrelated to the user's business (e.g., keyword "sales" matches someone selling a couch)
3. **Broad default subreddits** — `SaaS`, `startups`, `Entrepreneur`, etc. produce high-volume, low-relevance noise

### Implementation

#### 1. Add keyword-in-text filtering to RSS and JSON paths
In `supabase/functions/poll-reddit-signals/index.ts`, before inserting each post from RSS/JSON, check that the keyword actually appears in the title or body (case-insensitive). This matches what the Apify path already does. Skip posts that don't contain the keyword.

#### 2. Add AI relevance scoring as a post-processing step
After collecting all candidate posts (from RSS, JSON, or Apify), batch them through an AI call that scores each post's relevance to the user's business context. This requires:

- Fetching the user's company description and ICP from their profile/campaigns to build context
- Sending batches of post titles+bodies to the AI gateway with a scoring prompt
- Only inserting posts that score above a relevance threshold (e.g., 6/10)
- Storing the relevance score in a new `relevance_score` column on `reddit_mentions`

#### 3. Migration: add relevance_score column
Add `relevance_score integer default null` to `reddit_mentions` table.

#### 4. Surface relevance in the UI
In `src/pages/RedditSignals.tsx`, sort results by relevance score (highest first) when available, and show a relevance indicator badge on each post.

### Files to Change
- `supabase/functions/poll-reddit-signals/index.ts` — keyword filtering + AI relevance scoring
- `src/pages/RedditSignals.tsx` — display relevance score, sort by it
- New migration — add `relevance_score` column

### Technical Flow
```text
Current:
  Reddit search → insert all results

Proposed:
  Reddit search → filter: keyword in title/body?
    → YES → collect candidate
    → NO  → skip
  All candidates → AI batch scoring (with user's ICP context)
    → score >= 6 → insert with relevance_score
    → score < 6  → discard
```

