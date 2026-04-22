

# Reorder keyword pipeline: ICP + competitor check BEFORE AI buying intent

Today the keyword-posts pipeline does: **fetch → phrase match → AI buyer intent → fetch full profile → company ICP gate**. That wastes AI budget on posts whose author would later be rejected for ICP/industry, and the strict phrase pre-filter throws away buyers who phrase their pain differently.

We'll flip this so we **filter on the lead first** (cheap), and only run the AI buying-intent classifier on posts whose author already passed ICP + is not a competitor.

## New pipeline (per keyword, per page)

```text
1. Fetch posts by keyword (Unipile)
2. Cross-run + in-run dedup (unchanged)
3. SKIP "phrase match" pre-filter         ← removed for now
4. SELLER / agency-seller short-circuit    (cheap regex on headline+post)
5. Fetch full author profile + enrich company
6. Company ICP gate
   ├─ industry / location of company match → continue
   └─ no match → reject  (logged as icp_mismatch)
7. Headline + About "do they sell our service?" check
   ├─ provides similar services → reject as competitor
   └─ not a service provider → continue
8. AI buying-intent score on the POST (only for survivors)
   ├─ score ≥ MIN_INTENT_SCORE → INSERT lead
   └─ below threshold → reject
9. Insert + dedup (unchanged)
```

The flow is "lead-first, post-second": once we know the lead is in our ICP and isn't a competitor, the AI only judges whether *this specific post* expresses buying intent.

## What changes in `supabase/functions/signal-keyword-posts/index.ts`

**Skip the phrase match (temporary)**
- In `preFilterPost`, remove the `no_phrase_match` rejection for both `discovery` and `high_precision` modes. Keep the seller short-circuit, country, and industry guards.
- Still compute `matchedPhrase` if found, just for diagnostics — never reject on its absence.
- Keep `pipelineStats.rejected_no_phrase_match` field but it should stay at 0 going forward.

**Reorder Step 4 (AI) and Step 5 (profile + ICP)**
Today Step 4 calls `classifyIntentBatch` on all pre-filtered posts, then Step 5 fetches the profile and runs `companyIcpGate`. We swap them:

1. New **Step 4 — Author qualification loop** (runs once per post, no AI):
   - Author dedup (in-memory + DB) — same as current Step 5 head.
   - Lightweight preview-headline screen (`isClearlyIrrelevant`, own-company) — unchanged.
   - `fetchFullProfile` (counts against `RUN_PROFILE_FETCH_CAP` as today).
   - Restricted countries/roles, competitor exclusion list, post-profile country re-check — unchanged.
   - **Always run `companyIcpGate`** (currently `if (isHighPrecision)`). For `discovery` mode we keep it lenient (existing AI gate already defaults to `matches=true` when ambiguous), so it won't over-reject. Drop on `reject` / `reject_headline`.
   - **Run `looksLikeAgencySeller(author)`** here too (was high-precision only). If matched → reject as competitor (new bucket `rejected_competitor_seller`).

2. New **Step 5 — AI intent on survivors**:
   - Build `postsForAI` only from posts whose authors survived Step 4 (typically 1–5 per page instead of 20+).
   - Call `classifyIntentBatch` → if `intent_score >= MIN_INTENT_SCORE` insert; otherwise log to `sample_ai_rejections`.
   - The `is_competitor` branch inside the AI prompt becomes a backup; the main competitor decision now happens in Step 4.

**Diagnostics additions**
- `rejected_competitor_seller` (post-ICP service-provider catch).
- `passed_company_icp` counter (so the funnel diagram has a clean "Company / ICP" pass count regardless of precision mode).
- `sample_competitor_rejections` array (cap 5): name, headline, company, matched_pattern.
- Keep `sample_icp_passed` / `sample_icp_rejections` populated in **both** modes (today only HP populates them).
- `MIN_INTENT_SCORE` semantics unchanged.

## What changes in the Admin Run Diagram (`FunnelTemplates.ts`)

Update `buildLinkedInFunnel` to reflect the new order so the visualisation matches reality:

```text
Fetched → Dedup → Company / ICP → Not a competitor → AI buyer intent → Inserted
                       │                  │                  │
                       └─ ICP mismatch    └─ Competitor      └─ Not buyer / low score
```

- Move the "Company / ICP" node **before** "AI buyer intent".
- Add a dedicated "Competitor / Seller" node between ICP and AI, fed by `rejected_competitor_seller + rejected_competitor + rejected_seller`, sample key `sample_competitor_rejections`.
- Drop the standalone "Match keywords" node (since we're skipping phrase match) — replace with a passthrough so existing runs that still have those counters render gracefully (show only if `rejected_no_phrase_match > 0`, for backward compat with old runs).

No DB schema changes. No RLS changes. No UI route changes.

## Out of scope

- Phrase match removal is **temporary** — flagged in code with a `// TEMP: phrase match disabled` comment so we can flip it back on with one boolean.
- Re-tuning `MIN_INTENT_SCORE` thresholds. We keep the current 80 / 70.
- Other agent types (`hashtag_engagement`, `post_engagers`, `competitor`, `reddit`, `x`) — unchanged.
- Backfilling diagnostics for old runs — old runs keep rendering with the legacy template fallbacks.

