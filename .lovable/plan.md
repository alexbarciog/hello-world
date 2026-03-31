

## Problem

Currently `send-connection-requests` runs 5 times/day at fixed 2-hour slots (08, 10, 12, 14, 16 UTC), sending `dailyLimit / 5` connections per batch. With a limit of 30, that's 6 connections fired in bursts — not very human-like and leaves big gaps between batches.

## Solution

Align `send-connection-requests` with the same 30-minute cadence we just set for follow-ups, but **restrict it to business hours** (08:00–18:00 UTC) so connections aren't sent at odd hours. This gives **20 slots/day**, meaning a daily limit of 30 sends ~1-2 connections per slot — much more natural-looking to LinkedIn.

### Changes

**1. Update `send-connection-requests/index.ts`**

- Change `SEQUENCES_PER_DAY` from `5` to `20` (20 half-hour slots across 10 business hours)
- Add a business-hours guard at the top: if the current UTC hour is outside 08–18, return early with no work done
- This ensures batch sizes are small and spread evenly (e.g., 30 limit ÷ 20 slots = 1-2 per run)

**2. Database migration — update cron schedule**

Replace the current 5 fixed cron entries for `send-connection-requests` with a single entry running every 30 minutes:

```sql
-- Remove existing 5 entries
SELECT cron.unschedule('send-connection-requests-run-1');
-- ... through run-5

-- New: every 30 minutes
SELECT cron.schedule(
  'send-connection-requests',
  '*/30 * * * *',
  ...
);
```

The business-hours check in the edge function itself will skip execution outside 08–18 UTC, so the cron can safely fire 24/7.

**3. No other changes needed**

The daily limit guard (line 128) already prevents over-sending regardless of how often the function runs. The batch size calculation automatically adjusts based on `SEQUENCES_PER_DAY`.

### How it works in practice

With a daily limit of 30 and 20 business-hour slots:
- Each slot sends ~1-2 connection requests
- Connections are spread across 08:00–18:00 UTC every 30 minutes
- Looks much more natural to LinkedIn than 6-connection bursts
- Daily limit is still strictly enforced

