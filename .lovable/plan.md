

# Fix Competitor Followers: Use Unipile's Real Followers API

## Problem
The `competitor_followers` task uses a keyword search (`keywords: companyName`) which returns anyone mentioning the company name -- not actual followers. This produces false positives.

## Solution
Replace the keyword search (lines 618-696) with the Unipile followers endpoint, and add explicit competitor employee exclusion.

### Changes in `supabase/functions/signal-competitor/index.ts`

**1. Replace Strategy A (keyword search) with the real followers API**

Instead of:
```
POST /api/v1/linkedin/search  { keywords: companyName }
```

Use:
```
GET /api/v1/users/followers?user_id={numericCompanyId}&account_id={accountId}&limit=100
```

- Resolve company slug to numeric ID using the existing `resolveCompanyId()` helper
- Paginate with cursor (up to 3 pages, ~300 followers max)
- If the followers API fails or the company ID can't be resolved, log a warning and skip (no keyword fallback)

**2. Add explicit competitor employee exclusion**

After fetching the full profile of each follower, add an additional check:
- Use the existing `worksAtCompany(fp, companyName)` function to check if the follower currently works at the competitor being tracked
- If they do, skip them with a new counter `excluded_competitor_direct_employee`
- This is in addition to the existing `isExcluded()` check which covers the global competitor list

**3. Keep everything else the same**

The rest of the pipeline stays identical: dedup, quick ICP check, full profile fetch, own-company exclusion, `isExcluded()`, irrelevant title check, location/title/industry filtering, scoring, and insertion.

### Processing flow
```text
For each competitor URL:
  1. Extract slug → resolveCompanyId() → numeric provider_id
  2. GET /api/v1/users/followers?user_id={numericId}&account_id=...&limit=100
  3. Paginate (up to 3 pages)
  4. For each follower:
     a. Dedup check (already processed / already in contacts)
     b. Quick ICP headline check
     c. Fetch full profile
     d. Skip if LinkedIn Member
     e. Skip if works at OWN company
     f. Skip if works at THIS competitor (worksAtCompany)
     g. Skip if isExcluded (global competitor list + exclude keywords)
     h. Skip if irrelevant title
     i. Location/title/industry ICP filtering
     j. Score and insert as "Follows {companyName}"
```

### Files changed
- `supabase/functions/signal-competitor/index.ts` -- replace lines 618-696

