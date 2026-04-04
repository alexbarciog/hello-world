

# Plan: Fix Keyword Post Volume + Exclude Own-Company Employees + Stricter Competitor Lead Filtering

## Problems Identified

### 1. Keyword posts: only 1 lead from 6-7 keywords
`MAX_PAGES = 1` with `limit: 50`, but Unipile often returns only 10 results regardless of limit. With just 1 page per keyword, we get ~10 posts total per keyword instead of 50. Need proper pagination: keep fetching pages until we hit 50 posts or no more cursor.

### 2. Own-company employees showing up as leads
The system excludes competitor employees but never checks if a lead works at the **user's own company**. The orchestrator already fetches `company_name` from campaigns — we just need to pass it and check it.

### 3. Competitor engagers/followers from same industry are not buyers
People from the same industry doing the same thing as the user are not prospects — they're peers/competitors. Need to add the user's own company name to the exclusion list, and add a check: if someone's company description/headline suggests they sell the same thing, skip them.

## Changes

### File: `supabase/functions/signal-keyword-posts/index.ts`

1. **Increase `MAX_PAGES` from 1 to 5** per keyword with `limit: 50`. This allows pagination to collect up to 250 posts per keyword (realistically 50-100 since Unipile may return 10-50 per page). Stop early when cursor is null or we have 50+ posts.

2. **Add own-company exclusion**: Accept `user_company_name` from payload. Before inserting any lead, check if their company/headline matches the user's own company. Skip if it does.

3. **Fetch full profile for AI-approved authors**: Currently uses `fetchProfileIfNeeded` which short-circuits on sparse data. For approved posts (post-AI-filter), use `fetchFullProfile` to get proper company/positions data for accurate exclusion checks.

### File: `supabase/functions/signal-competitor/index.ts`

1. **Add own-company exclusion**: Accept `user_company_name` from payload. Add user's company name to the exclusion check so own employees are never returned as leads.

2. **Stricter same-industry check for competitor signals**: If a lead's headline or company description indicates they sell the same type of product/service as the user (based on `business_context`), reject them. This catches peers who follow competitors out of professional interest, not buying intent.

### File: `supabase/functions/process-signal-agents/index.ts`

1. **Pass `user_company_name`** in `basePayload`: Extract from the campaign data already being fetched (line 133-148). Add `user_company_name: campaign.company_name` to every signal function payload.

## Technical Detail

```text
Current keyword flow (broken):
  keyword "CRM" → 1 page × 50 limit → Unipile returns 10 → AI filters → 1-2 leads

Fixed keyword flow:
  keyword "CRM" → page 1 (10 results) → page 2 (10) → page 3 (10) → ... → up to 50 posts
  → AI filter all → fetch full profiles for approved → exclude own company → insert

Own-company exclusion (new):
  User's company = "Acme Corp"
  Lead headline = "Sales Manager at Acme Corp" → REJECTED (own employee)

Competitor lead stricter filter:
  User sells "AI sales tools"
  Lead headline = "CEO at rival AI sales platform" → REJECTED (same space, not a buyer)
  Lead headline = "VP Marketing at retail company" → ACCEPTED (potential buyer)
```

## Files Modified
- `supabase/functions/signal-keyword-posts/index.ts` — pagination fix, own-company exclusion, full profile fetch
- `supabase/functions/signal-competitor/index.ts` — own-company exclusion
- `supabase/functions/process-signal-agents/index.ts` — pass `user_company_name` in payload

## What Stays the Same
- AI filter prompt and logic (already good)
- Database schema (no changes)
- `isExcluded()` function (extended, not replaced)
- Deduplication via `globalSeenAuthorIds` and `linkedin_profile_id` unique check

