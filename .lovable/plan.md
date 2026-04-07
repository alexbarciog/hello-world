

# Why Competitor Followers Still Finds Very Few Leads

## Current Situation (from latest logs)

Two separate invocations run for the same agent:

| Invocation | Result |
|---|---|
| `comp_followers` | **0 leads** — 116 engagers after dedup, but 0 profiles fetched, 74 skipped_no_id |
| `comp_engagers` | **15 leads** — 216 after dedup, 59 profiles fetched, 15 inserted |

The `comp_followers` invocation is essentially dead weight — it finds zero leads every run.

## Root Causes

### 1. Strategy A (LinkedIn search) — 429s persist despite retries
The retry backoff (5s, then 10s) is too short. LinkedIn rate limits on search often last 60+ seconds. After exhausting 2 retries (~15s total wait), it still gets 429. This produces **zero search results** every run.

### 2. Strategy 0 (Direct followers endpoint) — silently fails
The endpoint `/api/v1/linkedin/company/{id}/followers` does not exist in Unipile's API. It returns a non-OK status, logs a fallback message, and moves on. This strategy has never produced results.

### 3. Strategy B within comp_followers — duplicate work with comp_engagers
Both `comp_followers` and `comp_engagers` call `processCompetitorEngagers()` on the same competitor URLs. The first invocation to run (comp_followers) processes engagers and marks them as "already processed" in the dedup set. The second invocation (comp_engagers) then finds many of those same IDs already processed, wasting capacity.

However, in this run, comp_followers processed engagers but **skipped_no_id: 74** — meaning 74 engagers from reactions had no extractable LinkedIn profile ID. This is because reaction authors from Unipile sometimes only have a `name` field with no `public_id`, `provider_id`, or LinkedIn URL.

### 4. Reactions returning HTTP 500
Multiple posts show `reactions HTTP 500` errors from Unipile. These are lost data points — reactions that could have yielded leads but returned server errors.

## Proposed Fixes

### Fix 1: Increase retry backoff dramatically for search
Change from 5s/10s to **15s/30s/60s** with 3 retries instead of 2. LinkedIn search rate limits need longer cooldown.

### Fix 2: Remove the dead Strategy 0 (direct followers endpoint)  
It clutters logs and wastes an API call per competitor. Remove it since Unipile does not support this endpoint.

### Fix 3: Prevent duplicate engager processing between invocations
When `comp_followers` runs, it calls `processCompetitorEngagers()` as Strategy B. Then `comp_engagers` runs the same function on the same URLs. Fix: load the `processed_posts` table at the start of each invocation (already done), but also **save newly processed IDs to the DB immediately** at the end of `processCompetitorEngagers` in the comp_followers run, so comp_engagers can skip them. Currently, IDs are only saved at the very end of the function.

### Fix 4: Add retry logic for reactions HTTP 500 errors
Wrap reaction fetches in a single retry (1 attempt after 2s delay) for HTTP 500 errors. These are transient Unipile errors that often succeed on retry.

### Fix 5: Extract IDs from reaction author `name` field as fallback
When `extractLinkedinProfileId` returns null (74 cases), check if the engager has a `name` or `id` field that can be used as a Unipile user lookup key. Some reaction objects have an `id` field that starts with numeric values — these can be used with `/api/v1/users/{id}` to fetch the full profile.

## Technical Details

**File**: `supabase/functions/signal-competitor/index.ts`

- **Fix 1** (lines 559-570): Change `fetchWithRetry` maxRetries default to 3, backoff formula to `(attempt + 1) * 15000` (15s, 30s, 45s)
- **Fix 2** (lines 590-661): Remove the Strategy 0 block entirely
- **Fix 3** (lines 744-746): After `processCompetitorEngagers()` in the comp_followers path, flush `newlyProcessedIds` to the `processed_posts` table immediately (move the save logic into a reusable helper)
- **Fix 4** (lines 370-384): Add single retry with 2s delay for reaction fetch when HTTP 500
- **Fix 5** (lines 91-100): In `extractLinkedinProfileId`, add fallback to check `item?.id` when it's a numeric string (not a URN), and `item?.actor_id`

## Expected Outcome
- Strategy A search may start succeeding with longer backoff, unlocking 30-90 leads per competitor
- Eliminating duplicate processing between invocations will preserve more fresh engagers for comp_engagers
- Reaction retries will recover some of the lost data from HTTP 500s
- Better ID extraction will reduce the 74 skipped_no_id to near zero

