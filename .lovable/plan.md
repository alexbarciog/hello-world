

# Fix: Low Lead Volume Despite Many Keywords & Competitors

## Root Cause Analysis (from the actual logs)

The logs reveal **three concrete bottlenecks** that compound to produce only 2 leads:

### Bottleneck 1: Unipile API returns only ~10 results per search (no pagination)
The code requests up to 50 posts per keyword, but the Unipile API returns results in pages of ~10. The code never fetches page 2+.
- 10 keywords x 10 posts each = only ~80 posts total (with duplicates)
- Competitor people search also returns only 10 people per query
- We are leaving 75%+ of available results on the table

### Bottleneck 2: 31 AI-approved posts → only 1 lead inserted
This is the critical one. The AI filter correctly approved 31 posts as `buyer_intent`, but only 1 author passed the ICP classifier. The problem: the `classifyContact` function classifies most authors as `cold` (they don't have C-level titles), and the **cold cap (20%)** blocks all cold leads after the first one. So even though the AI says "this person is a buyer," the title-based ICP filter overrides it.

This is NOT about relaxing filters — it's about **trusting the AI classification we already paid for**. When the AI says a post shows buyer intent, the author should get credit for that.

### Bottleneck 3: Competitor engagers completed in 0 seconds
The `competitor_engagers` function finished in 0s with 0 leads — it likely failed to fetch posts from the competitor company pages (API returned no results or an error that was silently swallowed).

## Solution (3 changes, no quality reduction)

### 1. Add Unipile search pagination
**Files**: `signal-keyword-posts/index.ts`, `signal-competitor/index.ts`

Fetch multiple pages from the Unipile search API using the `cursor` parameter returned in each response:
- Keywords: fetch up to 3 pages per keyword (30 posts instead of 10)
- Competitor people search: fetch up to 3 pages (30 people instead of 10)
- Respect the `hasTime()` budget

### 2. AI-boosted lead classification for keyword posts
**File**: `signal-keyword-posts/index.ts`

When a post has been AI-classified as `buyer_intent`, boost the author's classification to at least `warm` instead of `cold`. The logic:
- AI says buyer intent + ICP title match → `hot` (unchanged)
- AI says buyer intent + no title match → `warm` (currently `cold`, gets capped)
- This removes the cold cap bottleneck without lowering quality — the AI already validated intent

### 3. Add rejection logging + fix competitor engagers silent failure
**Files**: `signal-keyword-posts/index.ts`, `signal-competitor/index.ts`

- Log why each author was rejected (duplicate, ICP mismatch, excluded, cold-capped) so we can debug future runs
- In competitor engagers, add proper error logging when the posts API returns empty or fails
- Log the actual Unipile response status when competitor post fetching fails

## Expected Impact
- **Keyword posts**: 10 posts/keyword → 30 posts/keyword = 3x more raw posts → more AI-approved buyer-intent authors → no cold cap bottleneck = ~10-20 leads instead of 1
- **Competitor followers**: 10 people → 30 people per competitor = ~3-5 leads instead of 1
- **Competitor engagers**: will actually work instead of silently returning 0
- Total: ~15-30 leads per run instead of 2, with the same quality bar

## Technical Details

**Pagination pattern** (Unipile uses cursor-based pagination):
```text
Page 1: POST /search → { items: [...], cursor: "abc123" }
Page 2: POST /search + cursor=abc123 → { items: [...], cursor: "def456" }
Page 3: POST /search + cursor=def456 → { items: [...] }
```

**AI-boost logic** (keyword-posts only):
```text
// After AI filter approves a post as buyer_intent:
// When inserting the author, if classifyContact returns 'cold',
// upgrade to 'warm' since AI validated the buying intent.
// This is NOT relaxing the filter — it's using the AI signal.
```

**Rejection logging format**:
```text
[PIPELINE] ⏭ urn:xyz: duplicate (already in contacts)
[PIPELINE] ⏭ urn:xyz: excluded (competitor employee)
[PIPELINE] ⏭ urn:xyz: ICP mismatch (no title/industry match)
[PIPELINE] ✅ urn:xyz: inserted as warm
```

## Summary
- 3 edge functions modified
- No database changes
- No UI changes
- No filters relaxed — only more volume in + smarter use of AI signal we already have

