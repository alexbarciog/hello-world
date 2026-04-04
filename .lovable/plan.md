

# Plan: Strategic Overhaul of Lead Quality & Volume

## What the Logs Actually Reveal

The data tells a clear story of **5 distinct blockers** killing lead volume and quality:

### Blocker 1: Keyword leads — 23 AI-approved but 22 "fail" (duplicates from prior runs)
"looking for lead generation": 50 posts → 23 AI-approved → **0 new** (all 22 already exist in contacts). This is not a bug — it means the system is re-finding the same people. The dedup check is correct but there's no mechanism to **skip already-known profiles before doing expensive full-profile fetches**.

### Blocker 2: AI filter is too strict on certain keyword phrasings
"recommendation for lead gen tools": 49 posts → **0 AI-approved**. The AI classified every single post as self-promotion. "i need to find some clients": 30 posts → **1 AI-approved**. The prompt tells the AI to only approve people who would "PAY for" the user's product — but it interprets this too narrowly.

### Blocker 3: Competitor followers — cold cap blocks 90%+ of results
Out of 60 people found across Pangea AI and Trigify, only **1 was inserted**. The rest were either "cold-capped" (19 people), "ICP mismatch", or "excluded as competitor employee". The **20% cold cap** is devastating: after 1 hot/warm lead, it allows ~0 cold leads. But most competitor followers lack LinkedIn `industry` data, so they fall to "cold" classification and get blocked.

### Blocker 4: `classifyContact()` doesn't account for signal context
A person who follows a competitor or posts about a keyword is **inherently warmer** than a random cold lead — but the classifier ignores this context entirely. It only checks: does their job title match ICP → hot, are they C-suite → warm, otherwise → cold. This means a "VP of Operations at a logistics company" who follows a competitor gets marked cold because "VP of Operations" doesn't fuzzy-match the ICP job titles.

### Blocker 5: No early dedup — wasting API calls on known contacts
The system fetches full profiles (expensive API calls) for all AI-approved authors, only to discover 22 of 23 already exist. Should check the contacts table BEFORE calling Unipile's profile API.

## Strategic Changes

### 1. Remove the cold cap entirely
The cold cap was meant to prevent low-quality floods, but it's blocking legitimate leads. The AI filter and exclusion logic are already strict enough gatekeepers. Remove the `canInsertCold()` check from both `signal-keyword-posts` and `signal-competitor`.

**Files**: `signal-keyword-posts/index.ts`, `signal-competitor/index.ts`

### 2. Make `classifyContact()` signal-aware
Add a `signalBoost` parameter. When a lead comes from:
- **Keyword post (AI-approved buyer intent)** → minimum "warm"
- **Competitor follower/engager** → minimum "warm" (they chose to follow/engage with a competing product)
- **Own post engager** → minimum "warm"

This means `classifyContact` can still downgrade to `null` for clearly irrelevant titles (interns, students), but it won't mark genuine prospects as "cold" just because their title doesn't fuzzy-match.

**Files**: `signal-keyword-posts/index.ts` (insertContact call), `signal-competitor/index.ts` (insertContact call)

### 3. Early dedup — check contacts table BEFORE fetching full profile
In both keyword and competitor flows, after extracting the author ID from the post/engager data, check `contacts.linkedin_profile_id` immediately. If the person already exists, skip the expensive `fetchFullProfile` API call.

**Files**: `signal-keyword-posts/index.ts`, `signal-competitor/index.ts`

### 4. Relax the AI filter prompt for keywords
The current prompt is too product-specific ("would PAY for ${businessContext}"). Change it to identify **anyone expressing a business need, challenge, or seeking solutions** — not just people who would specifically buy the user's product. The user's product is a prospecting tool, but their clients' clients might be posting about anything. The AI should identify buying intent in the context of the keyword, not the user's specific product.

**File**: `signal-keyword-posts/index.ts`

### 5. Don't require industry match for competitor signals
Competitor followers/engagers are inherently relevant — they follow a competing product. Remove the `matchesIndustry()` gate for competitor signals. Keep the `isExcluded()` check (to reject competitor employees) and `isClearlyIrrelevant()` (to reject interns/students), but don't require industry data that LinkedIn rarely provides.

**File**: `signal-competitor/index.ts`

## Technical Detail

```text
Current competitor flow:
  60 people found → fetchFullProfile each → isExcluded? → matchesTitleOrIndustry? → matchesIndustry? → classifyContact → cold cap
  Result: 1 lead (19 cold-capped, rest filtered)

Fixed competitor flow:
  60 people → early dedup (skip known) → fetchFullProfile → isExcluded? → isClearlyIrrelevant? → insert as "warm" minimum
  Expected: 15-25 leads

Current keyword flow:
  50 posts → AI filter (23 approved) → fetchFullProfile each → dedup → insert → classifyContact → cold
  Result: 0 new (22 duplicates, 1 excluded)

Fixed keyword flow:
  50 posts → AI filter → early dedup (skip 22 known BEFORE profile fetch) → fetchFullProfile 1 → insert as "warm"
  Expected: Same leads but much faster, no wasted API calls. New leads from new keywords get inserted as warm.
```

## Files Modified

- `supabase/functions/signal-keyword-posts/index.ts` — early dedup, remove cold cap, warm-minimum for AI-approved, relax AI prompt
- `supabase/functions/signal-competitor/index.ts` — early dedup, remove cold cap, warm-minimum for followers/engagers, remove industry gate

## What Stays the Same
- `process-signal-agents/index.ts` — no changes needed
- `isExcluded()` — still rejects competitor employees and own-company employees  
- `isClearlyIrrelevant()` — still rejects interns/students/developers
- Database schema — no changes
- Pagination — already working correctly (5 pages × 10 results per keyword)

