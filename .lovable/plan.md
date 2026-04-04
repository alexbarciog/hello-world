

# Fix: WORKER_LIMIT (CPU exceeded) in process-signal-agents

## Root Cause

The `WORKER_LIMIT` error means the Edge Function exceeded its **CPU time limit** (2 seconds), not the wall-clock time. The current `process-signal-agents` does too much synchronous work in the request handler:

- Stripe API calls (list customers, list subscriptions) per user
- Multiple Supabase queries (agents, profiles, campaigns)
- Building payloads, looping agents, creating run/task records
- **Then** synchronously awaiting each signal function (which themselves take 30-100s)

All of this accumulates CPU time beyond the 2s limit.

## Solution: Fire-and-forget with `EdgeRuntime.waitUntil()`

Return immediately with a job ID, then process everything in the background.

### Changes to `supabase/functions/process-signal-agents/index.ts`

**Step 1: Immediate response pattern**
- Parse request, create a `signal_agent_runs` record with status `'queued'`
- Return `{ job_id: run.id }` immediately (< 100ms)
- Use `EdgeRuntime.waitUntil(processInBackground(...))` to do all the real work

**Step 2: Background processing function**
- Move ALL current logic (Stripe check, agent loop, task creation, sequential signal invocations) into an `async function processInBackground()`
- Wrap in try/catch that updates the run record to `'failed'` on error
- On success, update run to `'done'`

**Step 3: Signal function invocations stay the same**
- Each `invokeSignalFunction()` call is a fetch to another Edge Function — those have their own CPU budgets
- The parent just orchestrates via fetch calls, which are I/O (not CPU)

```text
Before:
  Request → [heavy CPU work + await signals] → Response (timeout/WORKER_LIMIT)

After:
  Request → create run record → Response { job_id }
       └→ EdgeRuntime.waitUntil(background work)
              └→ Stripe check, build tasks, invoke signals sequentially
              └→ Update run record on completion
```

### Changes to `src/pages/Signals.tsx`

- `runAgentNow` already handles the fire-and-forget pattern (sets running state, polls)
- Just ensure it reads `job_id` from the response and continues polling as-is
- No major changes needed — the existing polling logic will pick up results

### Files modified
- `supabase/functions/process-signal-agents/index.ts` — restructure to `waitUntil` pattern
- `src/pages/Signals.tsx` — minor: handle new `{ job_id }` response shape

### What stays the same
- All signal worker functions (`signal-keyword-posts`, `signal-competitor`, etc.) — unchanged
- AI filtering logic — unchanged
- Database schema — unchanged (uses existing `signal_agent_runs` table)
- Stripe subscription gating — unchanged (just runs in background now)

