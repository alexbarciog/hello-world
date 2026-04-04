

# Plan: Simplify Keyword Posts to Collect-First, Filter-Second

## Current Flow (Inefficient)
The code already does 1 query per keyword with `limit: 30`, BUT it loops up to 3 pages per keyword (cursor pagination), wasting time. Then it deduplicates, takes top 80 by engagement, and runs AI filter. After AI filter, it fetches full profiles one-by-one for each approved post author. This profile-fetch step is the main time sink.

## Proposed Flow (Cleaner)

```text
Phase 1: COLLECT (fast, parallel-ish)
  For each keyword → 1 single API call, limit=30, NO pagination
  Collect all posts into a big array

Phase 2: DEDUPE + PREP
  Deduplicate by post ID
  No engagement sorting cap — send ALL unique posts to AI

Phase 3: AI FILTER (batched)
  Send all posts to AI in batches of 10
  AI returns only BUYER_INTENT posts

Phase 4: PROCESS (only AI-approved authors)
  For each approved post → check author against ICP/exclusions
  Skip fetchProfileIfNeeded() — trust AI + use search result data
  Insert as warm (AI-validated)
```

## Changes — File: `signal-keyword-posts/index.ts`

### 1. Remove pagination loop (lines 396-421)
Replace the 3-page cursor loop with a single query per keyword:
- One `POST /search` with `limit: 30` per keyword
- No cursor follow-up
- Saves ~40s of API calls

### 2. Remove the top-80 engagement cap (lines 431-433)
Currently caps at 80 posts sorted by engagement. Instead, send ALL unique posts to the AI filter — let the AI decide what's relevant, not engagement metrics.

### 3. Skip `fetchProfileIfNeeded` for post authors (line 457)
The AI already validated the post content shows buyer intent. Use the author data directly from the search result (name, headline, company are usually present on post authors). This saves ~1s per post.

### 4. Trust AI classification — bypass ICP title gate
When AI says BUYER_INTENT:
- Still run `isExcluded()` to catch competitor employees
- Skip `classifyContact()` — assign `warm` directly
- Only reject if excluded or duplicate

## Expected Impact
- **Speed**: ~15-20s for search (15 keywords × 1 call each) instead of ~60s+ (15 × 3 pages)
- **Volume**: All posts go to AI instead of top 80 → more buyer-intent posts discovered
- **Processing**: No profile fetches → ~5s instead of ~30s
- **Total runtime**: ~30-40s instead of 90s+, well within 105s budget
- **More leads**: AI-validated authors inserted directly as warm, no ICP title gate blocking them

## What stays the same
- AI filter prompt and logic (unchanged)
- `isExcluded()` still runs to catch competitor employees
- Competitor tracking in `signal-competitor` completely untouched
- Deduplication logic stays

## Summary
- 1 edge function modified (`signal-keyword-posts`)
- No database changes, no UI changes
- Simpler code: collect all → AI filter all → insert survivors

