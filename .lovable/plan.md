

## Plan: Smarter Keyword-Posts Pipeline (Pagination Fallback + Fuzzy Filter + Strict Buyer Check)

### Goal
Stop the keyword_posts signal from returning 0 leads run-after-run by combining three changes that work together:
1. When the top results are already processed, automatically reach into older / deeper pages.
2. Allow fuzzy (token + punctuation-tolerant) phrase matching so valid posts aren't rejected on punctuation.
3. Compensate for that looser filter with a stricter "is this a real buyer?" AI gate so quality stays high.

Pagination only kicks in when a run is clearly under-yielding (< 3 leads), so we don't burn Unipile credits on healthy runs.

### How it plugs in (signal-keyword-posts only)

```text
For each keyword query:
  1. Fetch page 1 (top 10, past_week)              ← unchanged
  2. Run pre-filter — NOW FUZZY (token + normalized punct)
       └─ matches "ecommerce growth" against "e-commerce ... growth"
  3. AI buyer-intent gate — NOW STRICTER
       ├─ explicit pain/buying-signal required
       └─ default to REJECT on uncertainty (was: accept)
  4. Cross-run dedup, ICP gates, company gate    ← unchanged
  5. Save lead

After processing the whole keyword:
  IF leads_saved_for_this_keyword < 3:
     → Fetch page 2 (cursor or offset 10–19), repeat steps 2–5
     IF still < 3:
        → Fetch page 3 (offset 20–29), repeat steps 2–5
     STOP at page 3 max (hard cap to protect Unipile budget)
```

Healthy keywords (≥ 3 leads on page 1) cost nothing extra. Starved keywords automatically dig deeper.

### Changes — all in `supabase/functions/signal-keyword-posts/index.ts`

**1. New helper: `fuzzyPhraseMatch(text, phrase)`**
- Normalize both sides: lowercase, strip punctuation (`-`, `.`, `'`, `,`), collapse whitespace.
- Token-based: every token in `phrase` must appear in `text` within a sliding window of `tokens.length + 3`.
- Returns `true` for `"ecommerce growth"` vs `"e-commerce reflects a broader growth..."`.
- Replaces the current literal `text.includes(phrase.toLowerCase())` check.

**2. Stricter buyer-intent AI gate**
- Update the existing intent-classification prompt for keyword_posts to require **explicit buying signals**: stated pain, asking for recommendations, complaining about a current tool, hiring/budget context, or a clear "looking for X" pattern.
- Change default fallback from `accept` → `reject` when the AI is unsure or returns malformed output.
- Reuses the existing `intent-classification-schema` (score, is_buyer, reason) — no new contract.

**3. Pagination fallback (only when starved)**
- Track `leadsSavedForKeyword` counter inside the keyword loop.
- After page 1 finishes, if `leadsSavedForKeyword < 3`, call Unipile again with `cursor` (or `start=10`) for page 2.
- Repeat for page 3 if still `< 3`.
- Hard cap at **page 3** (30 posts max per keyword per run) to bound Unipile cost.
- Each page's posts go through the **same** dedup → fuzzy filter → strict AI gate → ICP/company gates pipeline.
- Add `paginated_pages_fetched` and `pagination_triggered_keywords` counters to the existing `diagnostics` JSON for visibility.

**4. Diagnostics (extend existing JSON, no schema change)**
Add to `diag` in `signal-keyword-posts`:
- `fuzzy_filter_passed` — posts that passed fuzzy match (vs. literal-only)
- `strict_buyer_rejected` — posts the new stricter AI gate rejected
- `pagination_triggered_keywords` — keywords that needed page 2+
- `pagination_pages_fetched` — total extra pages requested across all keywords

### Cost & safety
- **Healthy runs**: zero new Unipile calls, same AI cost (one stricter prompt swap).
- **Starved runs**: up to **+2 Unipile pages × N starved keywords** per run, hard-capped at page 3.
- Stricter AI gate offsets the looser fuzzy filter — net quality should improve, not degrade.
- Cross-run dedup remains intact, so deeper pages on subsequent runs naturally surface fresh posts.
- No DB schema changes. No changes to other signal functions.

### What stays the same
- Reddit / X / hashtag / engagers / competitor functions: untouched.
- Cross-run `processed_posts` dedup logic: untouched (this is what *forces* pagination to find new posts).
- ICP gates, company-page gate, agency-seller pre-filter, exclusion logic: untouched.
- Frontend, agent wizard, contacts table: untouched.

### Out of scope
- Dedup TTL / expiring `processed_posts` (keeping dedup as the source of truth for "already seen" — pagination is the right escape hatch).
- Applying pagination to hashtag/engagers/competitor signals (their result shape is different; can mirror later if needed).
- Backfilling old runs.

