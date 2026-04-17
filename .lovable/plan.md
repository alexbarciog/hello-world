

## Diagnosis — what the data actually shows

I read the latest `signal_agent_tasks.diagnostics` rows for StaffiX, Venus One, and Services. Here are the smoking guns from the most recent runs:

### Competitor Engagers (StaffiX, run 7:00 UTC) — task `comp_engagers(5)`
```
posts_fetched:           85    (5 competitors × ~17 posts)
reactions_fetched:     1,095
comments_fetched:         56
total_engagers_raw:    1,151
engagers_after_dedup:    603
skipped_no_id:            56   (anonymous/private)
failed_quick_icp:         50   (rejected on headline alone)
profiles_fetched:        502   ← BLEW PAST THE 30-CAP
excluded_no_icp_match:   438   ← almost all of them lose here
excluded_irrelevant_title:30
excluded_competitor_employee: 32
duplicates:               13
inserted:                  2   ← only 2 leads
```

### Competitor Engagers (Venus One, run 7:14 UTC) — task `comp_engagers(17)`
```
engagers_after_dedup:    523
profiles_fetched:         30   (cap hit, stopped early)
skipped_already_processed: 329 (cross-run dedup ate most candidates)
excluded_no_icp_match:    25
inserted:                  0
```

### Competitor Followers — every single run shows
```
competitors_processed: 0, posts_fetched: 0, profiles_fetched: 0, inserted: 0
```
The `competitor_followers` task is finishing in <1 second with all zeros. Nothing is being fetched at all.

---

## How each system actually works today

### A. `competitor_engagers` (live in `signal-competitor/index.ts` lines 279–579)
1. For each competitor URL → resolve company slug to numeric ID via Unipile
2. Paginate up to 5 pages × 20 posts (max 100), keep top 20 by engagement
3. For each of those 20 posts: fetch up to **100 reactions + 100 comments**
4. Dedupe engagers, then for each unique engager:
   - cross-run dedup against `processed_posts`
   - quick-ICP check on the headline included in the reaction payload
   - early dup-check against `contacts` table
   - **fetch full profile from Unipile** (capped at 30 per task)
   - exclude own company / competitor employee / irrelevant title / wrong country
   - require title OR industry to match ICP
   - insert as contact

### B. `competitor_followers` (lines 608–727)
1. Resolve company slug to numeric ID
2. Call `/api/v1/users/followers?user_id={numericId}` paginated up to 3×100
3. For each follower → quick-ICP → profile fetch → same exclusion + ICP filter pipeline → insert

### C. `profile_engagers` / influencer LinkedIn profiles (in `signal-post-engagers/index.ts` lines 211–260)
1. For each LinkedIn profile/company URL in your influencer list → fetch up to 10 of their posts
2. For each post → fetch 50 reactions + 30 comments **in parallel**
3. For each engager → fetch full profile (no cap) → ICP scoring → `matchesTitleOrIndustry` filter → exclusion check → insert

There is also `own_post_engagers` in the same file (lines 170–208): scans your own last 5 posts, 25 reactors each.

---

## Why you're getting almost no leads — three concrete failures

### Problem 1 — `competitor_followers` is silently broken
Every recent run shows `competitors_processed: 0`. The task returns instantly with all-zero diagnostics. Likely cause: the `pipelineStats.competitors_processed` counter is only incremented inside `processCompetitorEngagers` (line 304), but the followers branch (line 608+) never increments it, AND the followers branch never runs the loop body because either:
- the company slug fails to resolve to a numeric ID (we've seen `resolveCompanyId` warnings before for company URLs that aren't `/company/<slug>` form), or
- `urls` is empty when `signal_type === 'competitor_followers'` is dispatched.

We need to confirm by logging the URLs the task receives + the resolution result. Right now we have zero visibility.

### Problem 2 — `competitor_engagers` profile-fetch cap is starving the funnel
The cap was lowered to **30 profile fetches per task** in the bandwidth pass. But the funnel needs ~250 fetches to find ~2 leads (StaffiX 7:00 run: 502 fetches → 2 inserts = ~0.4% conversion). At 30 fetches the math is: `30 × 0.4% ≈ 0 leads`. That is exactly what Venus One 7:14 returned.

The pre-filter (`engagerPassesQuickIcpCheck`) only rejected 50 of 553 engagers on headline alone — because the Unipile reaction payload usually doesn't include a headline at all, so the function returns "benefit of doubt = pass." So the cap is hit on essentially random engagers, not pre-filtered ones.

### Problem 3 — cross-run dedup is over-blocking re-runs
Venus One run shows `skipped_already_processed: 329` — meaning 63% of engagers were thrown out as "already seen." `processed_posts` accumulates forever per agent. After a few runs almost every engager of a given competitor is already in there, so the new run has nothing to qualify.

---

## Plan — restore lead flow without blowing egress

### Fix 1 — Make `competitor_followers` actually run + observable
- Log `urls` array and resolution results at task entry
- Increment `competitors_processed` in the followers branch too
- Verify the followers API call shape (Unipile recently changed the followers endpoint contract; we may need `?company_id=` instead of `?user_id=`)

### Fix 2 — Smarter cap, not a smaller cap
Replace the flat `PROFILE_FETCH_CAP = 30` with a **two-tier budget**:
- Allow up to **80 profile fetches per task** when no ICP-strong pre-filter signal exists in the engager payload
- Skip the cap entirely for engagers whose included headline already passes a positive ICP keyword check
- Add `RUN_PROFILE_FETCH_CAP` shared across all comp tasks (e.g. 200/run) to keep the global egress ceiling intact

### Fix 3 — Cap cross-run dedup window
Only treat `processed_posts` as "seen" if processed in the **last 30 days**. Older entries get a second chance. Also: only dedupe by post-id, not by engager-id, for the engagers signal (engagers should be re-evaluated when ICP changes).

### Fix 4 — Tighten the engagers funnel before the profile fetch
Currently almost all rejection happens AFTER the expensive fetch:
- `excluded_no_icp_match: 438` — these are full profiles fetched then thrown out
- Move the industry/title check earlier: if the engager payload contains `headline`/`occupation` (Unipile sometimes includes it for commenters), run the strict ICP match before fetching. Only fetch profile when (a) headline is missing, or (b) headline already matches.

### Fix 5 — `profile_engagers` is the one bright spot — prioritize it
It has no profile-fetch cap and no cross-run dedup, and it runs fewer posts (10) but fetches more engagers per post (80). It should be reliably finding leads. We should:
- Add diagnostics to `signal-post-engagers` (currently it only logs to console — no per-task summary in the DB) so we can verify it's actually working
- Add the same quick-ICP pre-filter to save Unipile profile bandwidth

### Fix 6 — Add a hard per-task egress estimate
Track `bytes_fetched_estimate` in diagnostics (count Unipile responses × ~30KB) so the run history shows actual per-task cost. This makes future tuning data-driven instead of guesswork.

---

## Files to change

```text
supabase/functions/signal-competitor/index.ts        Fix 1, 2, 3, 4, 6
supabase/functions/signal-post-engagers/index.ts     Fix 5 (add diagnostics + quick-ICP)
```

No DB migration needed — diagnostics fields are already JSONB.

## Validation

1. Re-run StaffiX agent. Check that:
   - `competitor_followers` task diagnostics show `competitors_processed > 0` and `profiles_fetched > 0`
   - `competitor_engagers` diagnostics show `inserted ≥ 2` with `profiles_fetched ≤ 80`
   - `profile_engagers` task now writes diagnostics
2. Check `bytes_fetched_estimate` in run history — should be 1–2MB per run, not 7–10MB.
3. Confirm cross-run dedup still prevents re-importing the exact same lead from a recent run.

