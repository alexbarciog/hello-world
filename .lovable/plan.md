

# Plan: Improve Post Discovery Volume & AI Relevance Quality

## Problem
Three issues compound to produce poor lead quality:

1. **Too few posts collected** — Currently fetching only 20 posts per keyword, keeping top 30 total. After AI filtering, only 2-3 survive, and maybe 1 is truly relevant.
2. **AI filter is too generic** — It only checks "is this a business post?" but doesn't ask the critical question: "Would this person actually BUY the user's product/service?"
3. **Self-promoters slip through** — People posting about sales topics to promote their own competing services get treated as leads when they're actually sellers, not buyers.

## Solution

### 1. Increase post volume entering the funnel
- Increase per-keyword post fetch from 20 → **50**
- Increase total post cap from 30 → **80**
- This gives the AI filter a much larger pool to work with

### 2. Make the AI filter context-aware
Pass the **agent's business context** (company description, value proposition, ICP) into the AI prompt so it can answer:
- "Would this post's author realistically be a **buyer** of [user's product/service]?"
- "Is this person **promoting their own service** (a seller), or expressing a need/challenge (a buyer)?"

The new prompt will classify each post into one of three categories:
- **buyer_intent** — Author shows a genuine need, challenge, or interest that aligns with what the user sells
- **self_promoter** — Author is advertising/selling their own similar service
- **irrelevant** — Personal, lifestyle, or unrelated content

Only `buyer_intent` posts pass through.

### 3. Pass business context from the runner
The `process-signal-agents` runner will fetch the user's company website/description and pass it to the signal functions so the AI filter knows what the user actually sells.

## Changes

### File: `supabase/functions/process-signal-agents/index.ts`
- Fetch the agent's associated campaign or onboarding data to get `company_description` / `value_proposition`
- Pass a new `business_context` field in the payload to `signal-keyword-posts` and `signal-hashtag-engagement`

### File: `supabase/functions/signal-keyword-posts/index.ts`
- Accept `business_context` parameter (what the user sells)
- Increase post fetch limit: 20 → 50 per keyword
- Increase total post cap: 30 → 80
- Rewrite AI filter prompt to be context-aware:
  - Include what the user's company sells
  - Ask "would this author buy X?" instead of generic "is this business content?"
  - Detect and reject self-promoters (people selling competing services)
  - Classify as `buyer_intent` / `self_promoter` / `irrelevant`

### File: `supabase/functions/signal-hashtag-engagement/index.ts`
- Apply the same AI prompt improvements and volume increases

## Technical Details

**New AI prompt structure:**
```
You are a LinkedIn buying-intent classifier.

The user sells: "{business_context}"

For each post, determine:
1. BUYER_INTENT — The author has a problem, need, or interest that "{business_context}" could solve. They are a potential customer.
2. SELF_PROMOTER — The author is promoting/selling their OWN similar service or product. They are a competitor or fellow seller, NOT a buyer.
3. IRRELEVANT — Personal content, motivational fluff, or unrelated to the user's business.

Only BUYER_INTENT posts should be marked as relevant.
```

**Business context source:** The `signal_agents` table doesn't store company description directly, but we can pull it from:
- The user's campaigns table (`description`, `value_proposition`)
- Or the agent's keywords as implicit context

**Runtime impact:** More posts fetched (+2-3s for API calls), but the AI batch call scales well (80 posts = 8 batches × ~1s each = ~8s). Total added time: ~10-12s, well within the 105s budget.

## Summary
- 3 edge functions modified
- No database changes
- No UI changes
- Expected result: 3-5x more posts entering the funnel, but only genuine buyer-intent posts surviving the filter

