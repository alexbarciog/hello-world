
Goal

Make large signal-agent runs like “StaffiX Lead Agent” complete reliably when they have 30+ keywords, without getting cut off by the current timeout/reaper design.

What I found

- `process-signal-agents` currently splits keyword searches into batches of 4 and launches them 60s apart.
- With 30+ keywords, that becomes ~8 batches, so the last batch may not even start until ~7 minutes after the run begins.
- But the backend still force-finalizes runs after 5 minutes, and `reap-stuck-runs` also reaps `running/queued` runs older than 5 minutes based on `started_at`.
- `signal-keyword-posts` also stops itself after 145s and only uses light 429 backoff plus ~2–3s spacing.
- So this is not just “too short a timeout” — the current lifecycle is fundamentally too short for large keyword agents.

Implementation plan

1. Replace the fixed 5-minute run lifecycle
- Remove the orchestrator’s hard 5-minute force-finalize path for runs that still have keyword work pending.
- Update the reaper so it no longer treats every run older than 5 minutes as stuck.
- Finalize runs based on task completion, not elapsed wall-clock time from run creation.

2. Reuse `signal_agent_tasks` as the durable queue
- Extend `signal_agent_tasks` with queue/lease metadata:
  - `payload jsonb`
  - `available_at timestamptz`
  - `lease_expires_at timestamptz`
  - `attempt_count integer`
  - `last_heartbeat_at timestamptz`
- Store the exact keyword batch payload on each task row when the run is created.
- Keep keyword tasks as `pending` until actually claimed, instead of marking them all `running` immediately.

3. Add a dedicated keyword-task worker
- Create a new edge function that claims the next due keyword task, processes it, then marks it `done/failed`.
- Only let one keyword batch per run/account execute at a time.
- After each completed batch, schedule the next batch by setting its `available_at` into the future instead of launching everything upfront.
- This avoids long-lived orchestrator waits and makes pacing durable even if a run takes 10–20+ minutes.

4. Make the pacing adaptive and more conservative
- Reduce keyword batch size again for large agents:
  - likely 2 keywords per batch for large runs
  - possibly 3 for smaller runs
- Increase pauses:
  - between keywords: ~4–6s + jitter
  - between paginated search pages: ~1–2s
  - between batches: ~60–120s cooldown
- Upgrade 429 handling to a longer backoff ladder, e.g. `5s -> 10s -> 20s -> 30s cap`
- Add a cool-off window after repeated 429s before the next batch becomes available.

5. Make stuck-run cleanup lease-based
- `reap-stuck-runs` should look for expired leases / missing heartbeats, not just old `started_at`.
- Use a much longer run-level safety window (for example 20–30 minutes) for large keyword agents.
- Only fail tasks that truly stopped heartbeating or exceeded retry policy.

Files to change

- `supabase/functions/process-signal-agents/index.ts`
- `supabase/functions/signal-keyword-posts/index.ts`
- `supabase/functions/reap-stuck-runs/index.ts`
- new worker function, e.g. `supabase/functions/drain-signal-agent-tasks/index.ts`
- new migration for `signal_agent_tasks` queue fields + indexes

Technical details

```text
Current
run starts
  -> all keyword tasks marked running
  -> batches launched every 60s
  -> run/reaper kill it after 5m

Proposed
run starts
  -> keyword tasks created as pending + payload
  -> worker claims one due task
  -> batch runs with stronger pacing/backoff
  -> next batch becomes available after cooldown
  -> run finishes only when all tasks are done/failed
```

Why this is the right fix

- Simply “increasing the timeout” will still be brittle.
- StaffiX has enough keywords that the current 5-minute model is too short by design.
- A queue + lease + adaptive pacing approach fits the existing `signal_agent_runs` / `signal_agent_tasks` architecture and solves both timeout risk and Unipile rate limiting.

Validation

- Run “StaffiX Lead Agent” end to end with its full keyword set.
- Confirm the run can stay active beyond 5 minutes without being reaped.
- Confirm batches progress one by one in run history.
- Confirm `unipile_errors` drop and more keywords are actually processed.
- Confirm the final toast/count only appears after the last batch finishes.
