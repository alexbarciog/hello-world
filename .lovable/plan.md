

# Fix: Competitor Employee Leak + Low Lead Volume

## Problem Analysis

### Issue 1: Seraphina Delacour (Trigify employee passed as lead)
The `competitor_followers` search returns people matching keyword "Trigify" — but the search API returns **minimal profile data** (name, headline, public_id). Seraphina's search result likely didn't include `company`, `current_positions`, or `experience` fields. The `isExcluded` function checks those fields, but they're empty in search results. The fix: **fetch the full profile** before running the exclusion check so we have company/position data.

### Issue 2: Only 16 leads per run (down from 200)
From the logs:
- **keyword_posts**: 15 leads in 65s — decent but limited by Unipile returning only ~10 posts per keyword despite `limit=30`
- **competitor_followers**: Only 10 people returned per competitor (API ignores `limit=30`), then most rejected for "industry mismatch" — because search results don't include industry data, so `matchesIndustry()` fails
- **competitor_engagers**: 0 leads — HTTP 422 errors for company post fetching (the `/api/v1/users/{company}/posts?is_company=true` endpoint doesn't work)

Root causes:
1. **No pagination** — Unipile search returns ~10 results per query, we never fetch page 2+
2. **Industry mismatch on empty data** — Search results lack industry fields, so `matchesIndustry()` rejects everyone who doesn't have industry in their headline
3. **competitor_engagers is broken** — The API endpoint for company posts returns 422, so this entire signal produces 0 leads
4. **Full profile not fetched** for competitor followers — we check ICP on search-result data that's too sparse

## Solution

### 1. Fetch full profiles for competitor followers (fixes both employee leak AND industry mismatch)
**File**: `signal-competitor/index.ts`

For each person found in competitor_followers search, call `fetchProfileIfNeeded()` to get the full LinkedIn profile before running ICP scoring and exclusion checks. This gives us:
- `current_positions` / `experience` → catches employees like Seraphina
- `industry` field → fixes the mass "industry mismatch" rejections
- Better `headline` data for ICP scoring

### 2. Add cursor-based pagination to all search queries
**Files**: `signal-keyword-posts/index.ts`, `signal-competitor/index.ts`, `signal-hashtag-engagement/index.ts`

The Unipile API returns a `cursor` in the response. Fetch up to 3 pages per query to get ~30 results instead of ~10:
```text
Page 1: POST /search → { items: [...10], cursor: "abc" }
Page 2: POST /search + cursor → { items: [...10], cursor: "def" }  
Page 3: POST /search + cursor → { items: [...10] }
```

### 3. Fix competitor_engagers: use search-based approach instead of broken posts endpoint
**File**: `signal-competitor/index.ts`

The `/api/v1/users/{company}/posts?is_company=true` endpoint returns 422. Replace with a search-based approach:
- Search for posts mentioning the competitor company name (same way keyword_posts works)
- Then fetch reactions/comments on those posts to find engagers
- This actually works with Unipile's API

### 4. Skip industry check when profile has no industry data
**File**: `signal-competitor/index.ts`

When a profile has no `industry` field at all (empty string), don't reject it for "industry mismatch." The industry check should only reject when we have data that contradicts the ICP, not when data is missing. Add a check: if `industry` is empty AND headline doesn't contradict industry, let it through.

## Expected Impact
- **Competitor followers**: 10 people → ~30 per competitor + full profile fetch = fewer false rejections + proper employee exclusion = ~5-10 leads per competitor instead of 0-1
- **Competitor engagers**: from 0 (broken) to ~5-10 leads
- **Keyword posts**: ~10 per keyword → ~30 per keyword = ~25-40 leads
- **Total**: ~40-60 leads per run with better quality (employees properly excluded)

## Technical Details

**Full profile fetch for competitor followers:**
```text
// Before: use sparse search result data directly
// After: call fetchProfileIfNeeded() on each person, 
//        THEN run isExcluded() and ICP scoring
```

**Competitor engagers fix:**
```text
// Before: /api/v1/users/{company}/posts?is_company=true → 422
// After: Search posts with company name as keyword, 
//        then fetch reactions/comments on those posts
```

**Industry check fix:**
```text
// Before: matchesIndustry() rejects when no industry data
// After: if profile.industry is empty, skip industry check 
//        (don't penalize missing data)
```

## Summary
- 3 edge functions modified
- No database changes
- No UI changes
- Fixes employee leak, broken competitor_engagers, and low volume from sparse data rejections

