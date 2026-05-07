---
name: Engagement Spikes
description: Scheduled bursts of human-sounding AI LinkedIn comments dropped via Unipile in the minutes before a target time
type: feature
---
**Route**: `/engagement-spikes` (list) and `/engagement-spikes/:id` (detail).
**Nav**: "Engagement Spikes" with Flame icon, badge "New", placed under Signals Agents.

**Tables**: `engagement_spikes`, `engagement_spike_comments` (RLS: org members read, owner writes).

**Pipeline**:
1. `schedule-engagement-spike` — creates spike row (status=discovering), enforces max 2 active spikes/org, requires unipile_account_id.
2. `discover-spike-posts` — Unipile `POST /api/v1/linkedin/search` with `category:posts`, aggregates across keywords, computes `scheduled_drop_at` between T-window and T-2min, randomized order.
3. `generate-spike-comments` — Lovable AI Gateway `google/gemini-2.5-flash`. Strict prompt: ≤2 sentences, ≤180 chars, banned words ("great post", "love this", "leverage", "synergy", "🔥" unless tone=playful). If `require_approval=false`, sets status=approved.
4. `process-engagement-spikes` — pg_cron every minute, posts to Unipile `POST /api/v1/posts/{post_id}/comments`, marks sent/failed.
5. `cancel-engagement-spike` — owner-auth, cancels spike + skips pending.

**Tones**: curious_peer, hot_take, supportive, playful.
**Limits**: target_count 3-20, drop_window 5-60min, spacing 30-900s.
**Cron job**: `process-engagement-spikes-every-minute`.
