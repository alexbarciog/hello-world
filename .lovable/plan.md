

## Problem

The workflow step delays (e.g., "+1 hr", "+2 hrs") are configured per-step, but `process-campaign-followups` only runs 5 times/day (every ~2 hours). This means a 1-hour delay could actually take up to 3 hours because the function must wait for the next cron slot.

## Solution

Increase the `process-campaign-followups` cron frequency to **every 30 minutes** so follow-ups fire close to their configured delay time. The function already has the delay check built in (line 291-293), so no logic changes are needed — just more frequent polling.

### Changes

**1. Database migration — update cron schedule**

Replace the current 5x/day cron for `process-campaign-followups` with a single entry running every 30 minutes:

```sql
-- Remove existing 5 separate cron entries
SELECT cron.unschedule('invoke-process-campaign-followups-1');
SELECT cron.unschedule('invoke-process-campaign-followups-2');
SELECT cron.unschedule('invoke-process-campaign-followups-3');
SELECT cron.unschedule('invoke-process-campaign-followups-4');
SELECT cron.unschedule('invoke-process-campaign-followups-5');

-- Schedule every 30 minutes
SELECT cron.schedule(
  'invoke-process-campaign-followups',
  '*/30 * * * *',
  ...
);
```

**2. No edge function changes needed**

The existing `process-campaign-followups` already:
- Checks `delay_hours` against `step_completed_at` (line 291-293)
- Only sends when the delay has elapsed
- Is idempotent (safe to run frequently)

Running every 30 minutes means a configured 1-hour delay will fire within 1h–1h30m instead of potentially 3+ hours.

### Technical note

The function is lightweight when there's nothing to do (just queries + skips), so running every 30 minutes won't cause issues.

