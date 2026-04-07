

# Diagnosis: Why "Services Lead Agent" Found Only 1 Lead from Competitor Followers

## Root Cause

The `competitor_followers` pipeline has **two strategies**, and both are underperforming:

### Strategy A: LinkedIn People Search (Primary) — BLOCKED by Rate Limits
The code searches for people by company name using Unipile's `/api/v1/linkedin/search` endpoint. Every single attempt in the logs returns **HTTP 429 "Too Many Requests"**. This means Strategy A produces **zero results** every run.

```text
[COMP] follower search "Excel Party Wall Surveyors" page 1: HTTP 429 - Too many requests
[COMP] follower search "Vicennium Surveyors Llp" page 1: HTTP 429 - Too many requests
[COMP] follower search "Grey & Associates" page 1: HTTP 429 - Too many requests
```

The LinkedIn search API has strict rate limits, and processing multiple competitors sequentially exhausts the quota immediately.

### Strategy B: Post Engagers as Proxy — Works but Very Limited
After the search fails, the code falls back to scanning reactions/comments on competitor posts. This works, but it only captures people who actively engaged with recent posts — a tiny fraction of actual followers. This is where the ~1-8 leads per run come from.

### Additional Bottlenecks
- **Cross-run dedup**: 146 engagers were skipped as already processed from previous runs, shrinking the pool further each run
- **ICP filtering**: Of 86 profiles fetched, 45 were excluded as competitor employees, 22 failed ICP match, 11 failed country filter
- **Only 1 competitor URL configured**: The agent has only `excel-party-wall-surveyors` — so there's only one company to scan

## Proposed Fix — 3 Changes

### 1. Add rate-limit backoff and retry to Strategy A
Currently, on a 429 error, the code immediately gives up. Instead, wait 5-10 seconds and retry up to 2 times. LinkedIn 429s are often short-lived. This alone could unlock the people search results.

### 2. Stagger competitor processing with delays
Instead of hitting the search API for all competitors back-to-back (which triggers rate limits), add a 3-5 second cooldown between competitors. Process the search for one competitor, wait, then search the next.

### 3. Use LinkedIn company followers endpoint if available
Check if Unipile exposes a `/api/v1/linkedin/company/{id}/followers` endpoint (or similar). If it does, use it directly instead of the generic people search. This would return actual followers rather than keyword-matching people.

## Technical Details

**File**: `supabase/functions/signal-competitor/index.ts`

**Change 1 — Retry logic for search (lines ~577-586)**:
Wrap the search fetch in a retry loop (max 2 retries) with exponential backoff (5s, then 10s) when receiving 429 responses.

**Change 2 — Inter-competitor delay (lines ~562-665)**:
Add a `await delay(5000)` between each competitor URL in the `competitor_followers` loop to space out API calls.

**Change 3 — Explore company followers API**:
Before the people search, attempt `GET /api/v1/linkedin/company/{numericId}/followers` (or `/api/v1/users/{numericId}/followers`). If the endpoint exists and returns results, use those directly. Fall back to the search strategy only if this fails.

## Expected Outcome
With retry logic, the people search should succeed on at least some competitors, producing 30-90 search results per competitor instead of zero. Combined with the post engagers proxy, this should yield 10-30+ qualified leads per run instead of 1.

