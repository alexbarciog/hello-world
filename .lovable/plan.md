

## Plan: Overhaul Reddit Signal Discovery for Relevance

### Problem
The current approach has a fundamental conflict:
1. The Apify actor (`parseforge~reddit-posts-scraper`) returns posts that Reddit's search engine considers related but often don't contain the exact keywords
2. The 80% keyword-word-match filter then removes most of these posts because the words don't literally appear
3. If we loosen the filter, noise gets through; if we tighten it, relevant posts get filtered out
4. Result: customers get either zero signals or irrelevant ones

### Solution: Two Key Changes

#### 1. Switch Apify Actor
Replace `parseforge~reddit-posts-scraper` with **`easyapi/reddit-posts-search-scraper`**.

Why this actor:
- Uses Reddit's native search API with **relevance sorting** (not just "new")
- Simpler input: just `query`, `sort`, `time`, `maxItems`
- Returns rich metadata: `post_id`, `subreddit`, `author_id`, `title`, `body`, `score`, `created_time`
- High success rate (100% on Apify stats), actively maintained
- No subreddit restriction needed — Reddit's relevance algorithm handles this

#### 2. Remove Keyword Text Matching, Rely on AI Only
The current two-step filter (keyword match → AI score) is the root cause. Posts found via a search for "trying to get sales" ARE about getting sales — they just don't contain those exact words.

New flow:
- **No keyword text matching** — every post returned by Reddit's relevance search is a candidate
- **AI scoring only** — score all candidates against the user's business context
- **Threshold: 6+** (lowered from 7, since Reddit's relevance sort already pre-filters)

#### 3. One Apify Call Per Keyword (not batched)
The current batch approach mixes all keywords into one call, making it impossible to track which keyword returned which result. The new actor takes a single `query`, so we loop keywords (max 10 per user via rotation) with `maxItems: 20` each.

### Technical Flow
```text
Current:
  All keywords → single Apify batch → keyword text filter (80%) → AI score ≥7
  Problem: text filter kills relevant posts, OR lets through noise

New:
  For each keyword (max 10, rotated):
    → Apify search (sort=relevance, maxItems=20)
    → ALL results become candidates (no text filter)
    → AI batch scoring with business context
    → score ≥ 6 → insert
  Total Apify items: max 10 × 20 = 200 (same budget)
```

### Files to Change
- **`supabase/functions/poll-reddit-signals/index.ts`** — Replace Apify actor, remove keyword text matching, loop per-keyword, adjust scoring threshold

### Impact
- Posts returned by Reddit's relevance search are inherently more relevant to the query
- No more false negatives from text matching (the #1 complaint)
- AI scoring catches remaining noise
- Same compute budget (200 items max)
- No database changes needed

