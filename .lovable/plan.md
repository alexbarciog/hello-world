
# The better algorithm — 6 surgical fixes to restore lead flow

Goal: take per-run output from **0–2 leads** to **75–175 leads**, without blowing egress.

---

## Fix 1 — Competitor engagers: post-fetch ICP becomes OR logic

**Problem**: 343 engagers passed the *headline* ICP check (strong_pass), but only 0 of them survived the *post-fetch* ICP check because we required the structured `experience[0].title` to re-match. LinkedIn search payloads and full profiles describe the same person differently.

**File**: `supabase/functions/signal-competitor/index.ts` — the `excluded_no_icp_match` check inside `processCompetitorEngagers`.

**Change**: any of headline / structured title / profile industry / company industry matching is now sufficient.

```ts
// BEFORE — strict AND (kills 197/200)
const icpMatch = matchesIcpTitle(profile.experience[0]?.title, icp.jobTitles)
              && matchesIndustry(profile.industry, icp.industries);

// AFTER — permissive OR (any signal is enough)
const icpMatch =
  matchesIcpTitle(profile.headline, icp.jobTitles) ||
  matchesIcpTitle(profile.experience?.[0]?.title, icp.jobTitles) ||
  matchesIndustry(profile.industry, icp.industries) ||
  matchesIndustry(profile.company?.industry, icp.industries);
```

Apply the same logic in `processCompetitorFollowers` for symmetry.

**Expected impact**: competitor_engagers goes from `0/343 → 40–80 inserts/run`. This single fix is ~80% of the leak.

---

## Fix 2 — URL sanitization before every Unipile call

**Problem**: `competitor_followers` and `post_engagers` resolved competitors/profiles but Unipile returned 0 posts/followers. Several configured URLs contain `?utm_source=…` query strings or Unicode (`é`, `ñ`) that break Unipile's URL parser.

**Files**:
- `supabase/functions/signal-competitor/index.ts` — `resolveCompanyId`, post fetch, followers fetch
- `supabase/functions/signal-post-engagers/index.ts` — influencer URL loop, own-post URL loop

**Add a shared helper** at the top of each file:

```ts
function sanitizeLinkedinUrl(raw: string): string {
  try {
    const url = new URL(raw.trim());
    url.search = '';                  // strip query params
    url.hash = '';                    // strip fragments
    let clean = url.toString().replace(/\/+$/, '');
    clean = clean.normalize('NFKD').replace(/[\u0300-\u036f]/g, ''); // strip diacritics
    return clean.toLowerCase();
  } catch {
    return raw.trim();
  }
}
```

Run it on every URL before the Unipile call. Add an explicit zero-result log so we can see future failures:

```ts
if (postsResp?.items?.length === 0) {
  console.error('[unipile.zero_posts]', {
    original: rawUrl,
    sanitized: cleanUrl,
    response_preview: JSON.stringify(postsResp).slice(0, 500),
  });
  diagnostics.zero_post_urls.push(cleanUrl);
}
```

Persist `zero_post_urls` in the task `diagnostics` JSONB so the run-history UI surfaces broken inputs.

**Expected impact**: competitor_followers `0 → 20–50 inserts`, post_engagers `0 → 10–30 inserts`.

---

## Fix 3 — Per-signal AI intent thresholds

**Problem**: a flat threshold of 60 across all signal types is too conservative for high-trust signals. People who already engaged with a competitor's post don't need the same proof of intent as someone whose only signal is a keyword phrase.

**File**: `supabase/functions/signal-keyword-posts/index.ts` and any function that scores intent.

**Change**: introduce a thresholds map and key it by signal type.

```ts
const THRESHOLDS: Record<string, number> = {
  keyword_posts:        50,  // was 60
  competitor_engagers:  45,  // already-warm audience
  hashtag_engagement:   55,
  post_engagers:        50,
  default:              55,
};

const minScore = THRESHOLDS[signalType] ?? THRESHOLDS.default;
if (intentScore < minScore) {
  pipelineStats.below_threshold++;
  continue;
}
```

Log `below_threshold` and `min_score_used` in diagnostics so we can tune per signal later.

**Expected impact**: keyword_posts `0 → 5–15 inserts`, plus a small lift across competitor/post engagers.

---

## Fix 4 — Reframe "DB dedup" as "already in pipeline" + bump signal count

**Problem**: the 6 keyword leads that passed AI in the last run were silently dropped because they already exist in `contacts` from a prior run. That's the right behaviour for inserts, but treating it as a rejection hides the fact that those people are *still* showing buying signals.

This requires one tiny schema addition.

**Schema change** (one migration):

```sql
ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS last_signal_at  timestamptz,
  ADD COLUMN IF NOT EXISTS signal_count    integer NOT NULL DEFAULT 1;

CREATE INDEX IF NOT EXISTS contacts_last_signal_at_idx
  ON public.contacts (user_id, last_signal_at DESC NULLS LAST);
```

**Code change** in `signal-keyword-posts`, `signal-competitor`, `signal-post-engagers` — the early-dedup branch:

```ts
if (existingContact) {
  pipelineStats.already_in_pipeline++;            // NOT "rejected"
  await supabase
    .from('contacts')
    .update({
      last_signal_at: new Date().toISOString(),
      signal_count: (existingContact.signal_count ?? 1) + 1,
    })
    .eq('id', existingContact.id);
  continue; // still don't insert duplicate
}
```

**UI surface** (small): on `/contacts`, sort the default view by `last_signal_at desc` so re-engaging warm leads bubble up. Add a tiny "🔁 ×N" badge when `signal_count > 1`.

**Expected impact**: existing high-quality leads get visible reinforcement instead of being filtered into the void; the team can prioritize people who keep showing intent.

---

## Fix 5 — New signal type: `icp_title_search` (job-title-first)

**Problem**: every existing signal requires the buyer to *post* a buying phrase. Most VPs don't post — they comment, react, or browse. A title-first search catches the silent buyers.

**New file**: `supabase/functions/signal-icp-title-search/index.ts`

**Algorithm**:
1. For each ICP job title (max 3 per run), call Unipile `users.search` with `keywords=<title>` + filter `hasRecentActivity=true`, `postedInLast=7_days`.
2. Take top 30 profiles.
3. For each profile, fetch up to 5 of their **most recent posts/comments**.
4. Run `containsBuyingSignal(text, agentKeywords)` — a lightweight regex/phrase check using the agent's existing keywords as the signal lexicon.
5. If any post matches → push through the standard pipeline (AI score with threshold 50, exclusions, insert).

**Wiring**:
- Add `'icp_title_search'` to the `signals_config.enabled[]` enum.
- Surface a toggle in the agent wizard alongside the other signals.
- `process-signal-agents` enqueues one task of this type per run when enabled.
- Apply the same Fix 1 OR-logic ICP check on the post-fetch profile.
- Apply Fix 2 URL sanitization to the profile URLs returned by search.

**Bandwidth budget**: hard cap 30 profile fetches + 5 posts each = ~150 Unipile calls per run, ~4–5MB. Counts against the existing run-wide profile-fetch ceiling.

**Expected impact**: catches the segment of buyers who never appear in keyword search. Estimated 10–30 net-new leads per run.

---

## Fix 6 — Diagnostics + observability

Every change above adds new counters. Standardize them in the `signal_agent_tasks.diagnostics` JSONB so the `/signals` run-history view can show them without code changes (it already renders the JSONB blob).

Per task, add:
```json
{
  "icp_match_breakdown": {
    "by_headline": 12, "by_structured_title": 31,
    "by_profile_industry": 18, "by_company_industry": 9
  },
  "below_threshold": 4,
  "min_score_used": 50,
  "already_in_pipeline": 6,
  "zero_post_urls": ["https://linkedin.com/company/foo"],
  "url_sanitization_changed": 3
}
```

No UI work — the JSONB is already rendered.

---

## Files changed

| File | Fix |
|---|---|
| `supabase/functions/signal-competitor/index.ts` | 1, 2, 4, 6 |
| `supabase/functions/signal-post-engagers/index.ts` | 2, 4, 6 |
| `supabase/functions/signal-keyword-posts/index.ts` | 3, 4, 6 |
| `supabase/functions/signal-icp-title-search/index.ts` | **NEW** Fix 5 |
| `supabase/functions/process-signal-agents/index.ts` | enqueue Fix 5 task |
| `src/components/CreateAgentWizard.tsx` | toggle for `icp_title_search` signal |
| `src/components/onboarding/Step5IntentSignals.tsx` | mirror toggle in onboarding |
| `src/pages/Contacts.tsx` | sort by `last_signal_at`, show 🔁 ×N badge |
| migration | add `contacts.last_signal_at` + `contacts.signal_count` |

---

## Expected results

| Signal | Before | After |
|---|---:|---:|
| Competitor engagers | 0 / 343 strong passes | **40–80** |
| Competitor followers | 0 (URLs broken) | **20–50** |
| Post engagers | 0 (URLs broken) | **10–30** |
| Keyword posts | 0–2 | **5–15** |
| **NEW** ICP title search | — | **10–30** |
| **Per-run total** | **0–2** | **75–175** |

Egress estimate per run stays in the **3–6 MB** band thanks to existing per-task / per-run profile-fetch caps + Fix 2 (no more wasted calls on broken URLs).

---

## Validation

1. Run "Intentsly new strategy" agent end-to-end:
   - `competitor_engagers` diagnostics → `inserted ≥ 30`
   - `competitor_followers` + `post_engagers` → `profiles_fetched > 0`, `zero_post_urls` empty for valid URLs
   - `keyword_posts` → `below_threshold` count visible, at least a few inserts
   - `icp_title_search` task appears and writes diagnostics
2. Check `/contacts` sort order — most recent signals first, 🔁 badges visible on repeats.
3. Confirm Supabase egress for the run is between 3–6 MB (was 8 MB on a single competitor task).
4. Re-run within 30 min — `already_in_pipeline` count should be high, `signal_count` on contacts increments, no duplicate inserts.
