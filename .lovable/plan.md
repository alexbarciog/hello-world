
Plan: Fix the “agent runs but returns no leads” regression without relaxing quality

What I found
- This is not just a preview/UI issue anymore. The backend itself is timing out: `process-signal-agents` returned `546` after about `150.8s`.
- The strict AI filter is not the main blocker. `signal-keyword-posts` logs show many posts being classified as `BUYER_INTENT`, so relevant posts are being found.
- The loss happens after AI classification: I found many `[RELEVANCE]` logs, but no `[PIPELINE]` insert logs and no final `signal-keyword-posts: X leads` summary. That means the function is very likely dying before Phase 4 (author processing + contact insert).
- Historical data proves inserts can work: this user already has keyword-post leads in `contacts`, so this is a runtime regression, not a general DB/RLS failure.
- There is also a reliability bug in all signal functions: `START = Date.now()` is defined at module scope, not per request. On warm isolates, `hasTime()` can become stale and future runs can stop early.
- One hidden flow bug: the agent has `job_changes` enabled, but `process-signal-agents` does not execute any `job_changes` branch, so that signal currently contributes zero volume.
- Quality context is weaker than it should be: the latest campaign row is blank, so the AI prompt falls back to agent name + keywords instead of the real company description/value proposition.

Implementation plan

1. Fix the real failure point first: timeout-safe orchestration
- Refactor `process-signal-agents` into a lightweight orchestrator instead of one long blocking request.
- Add a small run/task system so work is split into safe chunks:
  - 1 keyword = 1 task
  - 1 competitor URL = 1 task
  - 1 tracked profile = 1 task
  - 1 hashtag = 1 task
- Each task finishes well under the edge timeout, updates progress, and the next task continues from saved state.

2. Change keyword discovery to insert continuously
- Refactor `signal-keyword-posts` from:
  - collect all keywords -> AI all posts -> insert at the end
- Into:
  - fetch 30 posts for one keyword -> AI-filter that keyword in batches -> immediately process and insert approved authors -> save counts -> move to next keyword
- This keeps the current strict AI filter and competitor exclusions, but prevents “0 leads because timeout hit before insert”.

3. Fix the request timer bug in every signal worker
- Move the deadline start inside each request handler for:
  - `signal-keyword-posts`
  - `signal-competitor`
  - `signal-post-engagers`
  - `signal-hashtag-engagement`
- Replace the shared top-level timer with a per-request helper so warm invocations cannot inherit an expired clock.

4. Add precise bottleneck logging
- Emit structured counts per task:
  - collected posts/people
  - unique items
  - AI-approved
  - skipped: no author
  - skipped: missing stable LinkedIn ID
  - skipped: excluded as competitor employee
  - skipped: duplicate
  - inserted
- Add a final summary for every keyword/task so the next time a run underperforms, we immediately know where the funnel is collapsing.

5. Fix context quality without weakening filters
- Build `business_context` from the newest campaign that actually has non-empty `company_name`, `description`, `value_proposition`, or `industry`.
- If none exists, keep the current fallback.
- This makes the AI stricter in the right way, because it will judge posts against the real offer instead of a weak fallback.

6. Close the hidden volume gap
- Either implement `job_changes` in `process-signal-agents` or remove/disable it until supported.
- Right now the agent says it is enabled, but it never runs, which lowers expected volume and makes the flow misleading.

Files involved
- `supabase/functions/process-signal-agents/index.ts`
- `supabase/functions/signal-keyword-posts/index.ts`
- `supabase/functions/signal-competitor/index.ts`
- `supabase/functions/signal-post-engagers/index.ts`
- `supabase/functions/signal-hashtag-engagement/index.ts`
- `src/pages/Signals.tsx`
- plus a small migration for run/task tracking tables and RLS

Technical details
```text
Current failure path
Run agent
  -> process-signal-agents waits synchronously
  -> signal-post-engagers finishes quickly
  -> signal-keyword-posts spends most time on:
       search pagination across many keywords
       + AI batches across all unique posts
  -> timeout hits before author processing / insert stage
  -> parent function also times out
  -> no final counts, no reliable progress, no new contacts
```

```text
Target flow
Run agent
  -> create run record
  -> enqueue small tasks
  -> worker handles one task at a time
  -> each task inserts leads immediately
  -> run status updates after every task
  -> UI polls progress until complete
```

Result
- Fixes the real regression without relaxing quality
- Preserves competitor tracking and exclusions
- Makes keyword discovery reliable again
- Prevents “AI found buyer-intent posts, but zero leads landed in Contacts”
