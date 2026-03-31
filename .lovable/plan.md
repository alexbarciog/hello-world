

## Completed: Daily Scheduled Leads System

### What was done

1. **New `daily_scheduled_leads` table** — stores pre-selected leads for each day per campaign (connection requests + follow-up messages)

2. **New `schedule-daily-leads` edge function** — runs daily at 00:05 UTC via pg_cron, pre-selects leads based on user's `daily_connections_limit` and `daily_messages_limit`, prioritizing hot → warm → cold contacts

3. **Updated `send-connection-requests`** — now reads from `daily_scheduled_leads` (pending connections for today) instead of picking contacts on-the-fly; marks entries as sent/failed/skipped

4. **Updated `process-campaign-followups`** — marks `daily_scheduled_leads` message entries as sent after successful delivery

5. **Updated `CampaignDetail.tsx`** — replaced "Last Launches" (Run 1–5 cards) with "Today's Queue" tab showing real scheduled leads with name, company, action type badges, and status indicators

### How it works

- At 00:05 UTC daily, leads are pre-selected respecting per-user daily limits
- Throughout the day, `send-connection-requests` (every 30 min, business hours 08-18 UTC) sends pending connections in small batches
- `process-campaign-followups` (every 30 min) sends pending message entries
- The UI shows the real scheduled leads list with live status updates
