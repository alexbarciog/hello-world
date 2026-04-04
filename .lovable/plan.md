

# Plan: Fix Competitor Employee Leaks + Improve Keyword Buying Intent Detection

## Problem 1: Competitor engagers are mostly employees

**Root cause**: In `signal-competitor/index.ts`, the `competitor_engagers` path (line 373) uses `fetchProfileIfNeeded` which short-circuits when a profile already has `first_name` + `headline` — but reaction/comment data often lacks `company`, `current_positions`, or `experience`. Without those fields, `isExcluded()` cannot detect the person as a competitor employee.

The `competitor_followers` path already uses `fetchFullProfile` (line 228) which always calls the API. The engagers path must do the same.

**Fix**: Replace `fetchProfileIfNeeded` with `fetchFullProfile` in both engager loops (person URL engagers at line 284, and company engagers at line 373).

## Problem 2: Keyword posts returning irrelevant leads

Two sub-issues:

**2a. Search limit too low**: Unipile defaults to 10 results even when `limit: 30` is set. Per their docs, LinkedIn Classic supports up to 50. Increase the limit to 50 per page so we actually get volume from each keyword query, reducing the need for multiple pages.

**2b. AI filter not strict enough on buying intent**: The current prompt catches SELF_PROMOTER vs BUYER_INTENT at a high level, but doesn't give the AI enough guidance on what real buying intent looks like on LinkedIn. The platform's core value is finding people who:
- Ask for recommendations or alternatives
- Describe a problem/challenge they face
- Ask for help or advice
- Compare tools/solutions
- Express frustration with current solutions

NOT people who:
- Share tips/advice as an authority (they're selling, not buying)
- Post thought leadership about a topic
- Announce their own product features
- Share case studies of their own work

**Fix**: Rewrite the AI system prompt with explicit examples of what counts as buying intent vs self-promotion vs thought leadership.

## Changes

### File: `supabase/functions/signal-competitor/index.ts`

1. **Person URL engagers** (around line 284): Change `fetchProfileIfNeeded` to `fetchFullProfile` to always get full position/company data before running `isExcluded()`

2. **Company engagers** (around line 373): Same change — `fetchProfileIfNeeded` → `fetchFullProfile`

3. Increase company page post fetch limit from 10 to 20 per page (line 332) for better coverage

### File: `supabase/functions/signal-keyword-posts/index.ts`

1. **Increase search limit** from 30 to 50 per page (line 397) to match Unipile's LinkedIn Classic maximum

2. **Rewrite AI filter prompt** (lines 242-256) with explicit buying-intent definitions:
   - BUYER_INTENT: person asking for help, recommendations, alternatives, describing a challenge, comparing solutions, expressing frustration
   - SELF_PROMOTER: person sharing their own expertise, promoting their service, posting thought leadership, announcing features
   - IRRELEVANT: personal content, motivational, lifestyle

3. **Reduce MAX_PAGES to 1** since we're now fetching 50 per page (gets us the same volume in 1 call instead of 3)

### What stays the same
- `competitor_followers` logic — already uses `fetchFullProfile`, working correctly
- `isExcluded()` function — already thorough, just needs the full data
- Database schema — no changes
- Insert logic, ICP scoring, deduplication — all unchanged

