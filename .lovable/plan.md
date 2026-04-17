

## Problem

Last 4 signal-agent runs exhausted Supabase egress. Looking at the current architecture:

- `process-signal-agents` enqueues all keyword tasks upfront
- `drain-signal-agent-tasks` runs every minute via cron and dispatches up to 8 tasks per tick
- Each `signal-keyword-posts` invocation runs ~5.5 min, paginates Unipile search results (often hundreds of posts per keyword), fetches each profile individually, then writes leads + diagnostics
- Each task also re-reads `signal_agent_tasks`, `signal_agent_runs`, `processed_posts` repeatedly
- Heartbeats + run-status polling from the UI add constant DB chatter

For an agent with 30+ keywords this becomes:
- 30 keyword searches × ~5 paginated pages × ~50KB per Unipile response = ~7–8 MB of inbound traffic per run
- Plus per-post profile fetches (the expensive part — 1 HTTP call + 1 DB write per post)
- Plus competitor + post-engagers signals doing the same
- Plus the cron worker firing every 60s even when there's nothing to do
- Plus the UI polling run status every few seconds while a run is active

So 4 large runs can easily push 100+ MB of egress, plus thousands of edge invocations.

## Goal

Keep lead quality high (strict filtering stays) while drastically cutting bandwidth and edge-function execution time per run. The current strategy fans out too wide — we need to **fetch less, smarter**.

## Plan — bandwidth-first redesign

### 1. Hard cap what each keyword actually fetches
- Stop paginating Unipile search past page 1 for keyword_posts. One page = ~25 posts is plenty when the query is a real intent phrase. Drop `total_posts_fetched` from "hundreds" to ~25 per keyword.
- Cap total posts processed per **run** at ~150 across all keywords. Once hit, skip remaining tasks and finalize the run cleanly.
- Cap profile fetches per run at ~50. Profile fetches are the single biggest egress driver (each is a full Unipile profile JSON ~30–80 KB).

### 2. Pre-filter posts BEFORE fetching profiles
Right now we fetch the profile of nearly every post author, then run quick-ICP. Flip the order:
- Use the post's already-included author headline + post text to run quick-ICP first (no extra HTTP call)
- Only fetch the full profile when quick-ICP passes
- This alone should cut Unipile egress by 60–80%

### 3. Stop the cron worker from idling
- `drain-signal-agent-tasks` runs every minute forever, even with zero pending tasks. Each tick still does 1–2 SELECTs.
- Add an early-exit: if no agents have an active run in the last 30 min, return immediately without querying tasks at all (one cheap COUNT instead of full task scan).
- Reduce cron from every-minute to every-2-minutes.

### 4. Reduce UI polling pressure
- Run-history page currently polls `signal_agent_runs` + `signal_agent_tasks` every few seconds while a run is active. Move polling to 15s when running, stop entirely when idle.
- Use a single combined query instead of two separate ones.

### 5. Per-user run budget (the safety net)
- Add a per-user **daily run budget**: e.g. max 3 large runs per agent per day. Block "Run now" with a clear toast when exceeded.
- Track in `signal_agent_runs` (already has `started_at`) — no schema change needed.

### 6. Diagnostics size
- `diagnostics` jsonb on each task can grow large (full per-keyword breakdowns). Cap it to a small summary and drop the per-post arrays.

## Files to change

```text
supabase/functions/signal-keyword-posts/index.ts     single-page fetch, quick-ICP before profile fetch, run-level caps
supabase/functions/signal-competitor/index.ts        same: pre-filter before profile fetch, cap fetches
supabase/functions/signal-post-engagers/index.ts     same pre-filter pattern
supabase/functions/drain-signal-agent-tasks/index.ts early-exit when no active runs
supabase/functions/process-signal-agents/index.ts    enforce daily run budget per user/agent
supabase/config.toml                                  (cron schedule update — done via SQL, not config)
src/pages/Signals.tsx (run history)                  reduce polling frequency, single combined query
```

## Expected impact

| Metric | Before | After |
|---|---|---|
| Unipile egress per large run | ~7–10 MB | ~1–2 MB |
| Profile fetches per run | 100–300 | ≤50 |
| Edge function invocations per run | 50–100 | 15–25 |
| DB queries per run | ~500 | ~150 |
| Cron worker idle ticks | 1440/day | ~720/day, mostly cheap |
| Lead quality | strict | strict (unchanged) |

## Validation

- Run StaffiX agent end-to-end and confirm the run finishes cleanly with leads found.
- Check Supabase egress dashboard before/after — should drop ~5x.
- Confirm the daily run budget blocks excessive re-runs with a clear message.
- Confirm UI run history still updates within ~15s.

