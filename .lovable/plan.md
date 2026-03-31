

## Problem

The current "Run 1–5" cards are static placeholders that don't reflect real activity. You want to see **which specific leads are scheduled for today** — both connection requests and follow-up messages — pre-selected at midnight based on daily limits.

## Solution

### 1. New database table: `daily_scheduled_leads`

Stores the pre-selected leads for each day per campaign:

```sql
CREATE TABLE public.daily_scheduled_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  user_id uuid NOT NULL,
  scheduled_date date NOT NULL DEFAULT CURRENT_DATE,
  action_type text NOT NULL, -- 'connection' or 'message_step_2', 'message_step_3', etc.
  step_index integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'pending', -- pending, sent, failed, skipped
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, contact_id, scheduled_date, action_type)
);
```

With RLS for authenticated users (`user_id = auth.uid()`) and service role full access.

### 2. New edge function: `schedule-daily-leads`

Runs once daily at **00:05 UTC** via pg_cron. For each active campaign:

- **Connections**: Pick up to `daily_connections_limit` unsent contacts (prioritized by relevance_tier: hot → warm → cold), insert as `action_type = 'connection'`
- **Messages**: For each accepted lead whose `delay_hours` has elapsed or will elapse today, insert as `action_type = 'message_step_N'`, up to `daily_messages_limit`
- Reads limits from `profiles.daily_connections_limit` and `profiles.daily_messages_limit`

### 3. Update `send-connection-requests` to use pre-scheduled leads

Instead of picking contacts on-the-fly, it reads from `daily_scheduled_leads` where `scheduled_date = TODAY` and `action_type = 'connection'` and `status = 'pending'`. After sending, updates status to `'sent'`. Batch size stays at `dailyLimit / 20` per run.

### 4. Update `process-campaign-followups` to use pre-scheduled leads

Same pattern — reads message-type entries from `daily_scheduled_leads` for today, sends them, marks as sent.

### 5. Replace Run cards in UI with scheduled leads list

Replace the "Run 1–5" section in `CampaignDetail.tsx` with a query to `daily_scheduled_leads` for today's campaign. Display:

- Each lead's name, company, avatar
- Action type badge: "Send Connection" or "Step 2 Message", etc.
- Status indicator: pending (⏳), sent (✓), failed (✗)
- Group by action type with counts

Shows a "No leads scheduled for today" state when empty, and a summary like "12 connections + 5 messages scheduled today".

### 6. Cron job migration

```sql
SELECT cron.schedule(
  'schedule-daily-leads',
  '5 0 * * *',  -- 00:05 UTC daily
  $$ SELECT net.http_post(...schedule-daily-leads...) $$
);
```

## How it works in practice

1. At 00:05 UTC, `schedule-daily-leads` pre-selects today's leads per campaign based on limits
2. Throughout the day, `send-connection-requests` (every 30 min, business hours) picks pending connection entries in small batches and sends them
3. `process-campaign-followups` (every 30 min) picks pending message entries and sends them
4. The UI shows the real scheduled leads list with live status updates

## Technical details

- **Files to create**: `supabase/functions/schedule-daily-leads/index.ts`, 1 migration for table + cron
- **Files to modify**: `send-connection-requests/index.ts` (read from daily_scheduled_leads instead of contacts), `process-campaign-followups/index.ts` (same), `src/pages/CampaignDetail.tsx` (replace run cards with scheduled leads UI)
- The `schedule-daily-leads` function is idempotent — re-running it won't duplicate entries due to the UNIQUE constraint

