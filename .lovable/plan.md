# Plan: Pre-Filter Architecture for Lead Quality

## Architecture (matching the approved diagram)

```
ICP filter (configured once) — job title, country, industry, company size
        ↓
Signal collection via Unipile (Keyword, Hashtag, Own post, Competitor, Comment)
        ↓
Pre-filter layer (Problems 1, 4, 5):
  1. Phrase match — reject if post doesn't contain signal phrase as substring
  2. Country check — match author.location against ICP countries
  3. Industry check — match author.headline/company against ICP industry
        ↓
Semantic AI classifier (Problems 2, 3):
  Input: post text + author profile + ICP definition
  Output: JSON { is_buyer, intent_score: 0-100, reason, signal_type }
  Prompt includes: TRUE buyer examples + FALSE positive examples
        ↓
Intent score gate:
  score < 60 → discard (log reason for tuning)
  score 60-79 → warm bucket
  score 80+ → hot bucket
        ↓
Qualified lead → DB
```

## Changes Made

### signal-keyword-posts/index.ts
- **Pre-filter layer**: `preFilterPost()` generates phrase variants from keywords and checks substring match before AI
- **Country filter**: Checks author location against ICP locations before AND after full profile fetch
- **Industry/title filter**: Quick headline check against ICP before AI call
- **New AI classifier**: `classifyIntentBatch()` with structured prompt, false positive examples, intent_score 0-100
- **Intent score gate**: MIN_INTENT_SCORE = 60, drives warm/hot tier assignment
- **Reason tracking**: AI reason stored in signal field for auditing

### signal-competitor/index.ts
- **Country filter**: Added to `processPerson()` — rejects leads from wrong country
- **Industry/title filter**: Must match at least one of ICP title OR industry (was previously no filter)
- **Stricter classification**: `classifyCompetitorContact()` still gives warm minimum but only after passing all filters

### What stays the same
- `process-signal-agents/index.ts` — no changes needed
- Database schema — no changes
- Pagination — same 5 pages × 50 limit
- Early dedup — same pattern
- Own-company + competitor employee exclusion — same logic
