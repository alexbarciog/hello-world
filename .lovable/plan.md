
## Goal

Cut round-trips inside our three heaviest cron-driven edge functions. Combined with the crons-staggering + indexes already shipped, this should end the connection-pool exhaustion.

## Scope (surgical, no behavior change)

### 1. `drain-signal-agent-tasks` (runs every 2 min)
Currently: for each candidate task (up to N per tick), we run 4 sequential queries — in-flight check, claim, parent-run check, next-task lookup + per-row update loop.

Change:
- Fetch in-flight guard + parent-run status in a single `.in('run_id', [...])` batch up-front for all candidates.
- Replace the per-row `next_tasks` update loop with a single bulk `update` using `.in('id', ids)`.

Expected: ~4x fewer queries per tick.

### 2. `process-campaign-followups` (runs at :07 and :37)
Currently: iterates contacts and issues per-contact selects/updates (message lookups, status writes, connection-request updates).

Change:
- Prefetch related rows for the full batch with `.in('contact_id', ids)` and build in-memory maps.
- Group all status writes into 2-3 bulk `update ... in (...)` calls at the end of the loop.
- Keep the actual Unipile send calls untouched — only the DB layer changes.

### 3. `process-signal-agents` (runs 5 times/day)
Currently: per-agent lookups for org, list, and results-count.

Change:
- Single upfront query loading all agents-due-to-run + joined org/list in one round-trip.
- Bulk update `results_count` at the end.

## Non-goals

- No logic changes, no schedule changes, no new tables, no schema changes.
- Reddit/X pollers are already 2x/day — not worth touching.
- Signal-keyword-posts fetcher stays as-is (already parallelizable at the run level).

## Rollout & safety

- Ship all three in one commit so tomorrow morning's cron ticks all benefit.
- Add one `console.log('[BATCH] fetched N in 1 query')` line per hot loop so we can eyeball logs after.
- If anything misbehaves, revert is a one-file git revert per function (no schema to unwind).

## Technical notes

- `.in()` PostgREST queries have a ~2000-char URL limit; if a batch would exceed it we chunk into 500-id groups (already the pattern used in `drain-signal-agent-tasks`).
- Optimistic-claim semantics are preserved: we still guard with `.eq('status', 'pending')` on the update so two workers can't double-claim.
- Heartbeat / lease timings unchanged.
