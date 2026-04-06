

# Fix Competitor Posts Fetch (422 Errors)

## Root Cause

The Unipile "list posts" endpoint (`/api/v1/users/{identifier}/posts?is_company=true`) requires a **numeric company ID** for companies (e.g., `12345678`), not the LinkedIn slug (e.g., `vizion-interiors-limited`). The current code passes the slug directly, which causes the 422 "Unprocessable Entity" error every time.

## Solution

Add a **slug-to-numeric-ID resolution step** before fetching posts. Use the Unipile company profile endpoint (`/api/v1/linkedin/company/{identifier}`) which accepts slugs and returns the numeric `id`.

## Changes — `supabase/functions/signal-competitor/index.ts`

### 1. Add a `resolveCompanyId` helper function

Before fetching posts, call `/api/v1/linkedin/company/{slug}?account_id=...` to get the company profile. Extract the numeric `id` field from the response. Cache the result within the request so it's only resolved once per competitor.

### 2. Update `processCompetitorEngagers` — company branch

In the `if (isCompany)` block (around line 270), call `resolveCompanyId(companyId)` first. If resolution fails (e.g., company not found), log a clear error and skip that competitor. If it succeeds, use the returned numeric ID for the posts fetch URL instead of the slug.

### 3. Log the resolution

Add a log line showing: `[COMP] Resolved "vizion-interiors-limited" → numeric ID 12345678` so future diagnostics are clear.

## What stays the same
- Person URL handling (already works)
- Reactions/comments fetching (uses post IDs, not company IDs)
- All filtering, dedup, and insertion logic
- The `is_company=true` parameter (still needed)

## Expected outcome
After this fix, the competitor pipeline will resolve each company slug to its numeric ID, then successfully fetch posts. The 422 errors will stop, and the engager extraction pipeline will finally receive posts to scan.

