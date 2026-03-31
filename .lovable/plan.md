
Goal: make the campaign page update as soon as a lead accepts, so the lead appears in the right-hand “today” queue when the next step is due today, and the generated Step 2 message is visible/editable there.

What I found
- The right-hand list is loaded only once on page load from `daily_scheduled_leads` via `loadDailyQueue()` in `src/pages/CampaignDetail.tsx`. There is no polling and no realtime subscription, so the UI can stay stale forever.
- `process-campaign-followups` does detect newly accepted contacts and generates the next message, but it only inserts into `daily_scheduled_leads` when the next step is due before end of day. If that insert fails, or if the lead becomes due after the page already loaded, the UI never refreshes.
- The “Upcoming Messages” panel is also stale and currently hides accepted contacts that have no `chat_id`, even though messages are already being generated for them.
- There is a timing mismatch risk:
  - `scheduled_messages.scheduled_for` stores only a date, not the actual due time
  - `daily_scheduled_leads` also stores only `scheduled_date`, not when within the day the step becomes ready
  - so the queue can show “pending today” but not know “ready in 1 hour” vs “ready now”

Implementation plan

1. Strengthen backend same-day materialization in `process-campaign-followups`
- Extract one shared helper for “queue next step if it becomes due today”.
- Run it immediately after acceptance is detected and again after a message send advances to the next step.
- Base readiness on `step_completed_at + delay_hours`, not `Date.now() + delay_hours`, so the due time is deterministic and consistent.
- Keep connection and message quotas separate using `profiles.daily_connections_limit` and `profiles.daily_messages_limit`.
- Add clear logs for:
  - accepted contact
  - generated step message
  - queued same-day step
  - skipped because tomorrow / limit reached / duplicate already exists

2. Make scheduling idempotent and safer
- Keep using `upsert` on `daily_scheduled_leads` and `scheduled_messages`, but normalize the step mapping so:
  - `action_type = message_step_N`
  - `step_index` always matches the workflow index used in `scheduled_messages.step_index`
- Ensure the helper checks whether the message record exists; if not, generate it first, then queue the step.
- If a lead is accepted after midnight scheduling but is due later today, the helper should re-materialize that step into today’s queue immediately instead of waiting for tomorrow’s snapshot.

3. Improve the campaign page data model
- Update `loadDailyQueue()` in `src/pages/CampaignDetail.tsx` to also read enough info from `campaign_connection_requests` and/or `scheduled_messages` to compute:
  - accepted at
  - step completed at
  - actual message availability
  - whether the message is ready now or later today
- Extend the queue item type with a due timestamp/status such as:
  - `ready_now`
  - `due_later_today`
  - `sent`
- Use that to display the lead as soon as it belongs to today’s schedule, even before the exact send moment.

4. Fix the stale UI problem
- Add a realtime subscription on `daily_scheduled_leads`, `scheduled_messages`, and `campaign_connection_requests` for the current campaign, then reload:
  - `loadDailyQueue(campaignId)`
  - `loadScheduledMessages(campaignId, workflowSteps)`
  when relevant inserts/updates happen.
- Also add a lightweight fallback refresh interval while the campaign page is open, so the queue self-heals even if realtime misses an event.

5. Make “Upcoming Messages” consistent with acceptance flow
- Update `loadScheduledMessages()` so it no longer hides accepted contacts only because `chat_id` is still missing.
- Show generated/editable Step 2 messages for accepted contacts when:
  - status is `accepted`
  - the next step exists
  - a `scheduled_messages` row exists or can be derived from the workflow
- Keep sending blocked until `chat_id` is resolved, but do not hide the preview from the UI.

6. Clarify queue display behavior
- In the right-hand queue:
  - if a lead accepted and the next step is due within today, show it immediately
  - if it becomes ready in 1 hour, show the card with a “Due in 1h” / “Later today” state
  - if it is ready now and message exists, show Preview/Edit/Regenerate
- This matches your desired “smart” behavior instead of treating the list as a midnight-only snapshot.

Files to update
- `supabase/functions/process-campaign-followups/index.ts`
- `src/pages/CampaignDetail.tsx`

Technical notes
```text
Current issue:
accept detected -> message may be generated
                -> queue insert may happen
                -> campaign page never refreshes
                -> lead/message not visible

Target flow:
accept detected
  -> update campaign_connection_requests
  -> generate next-step message
  -> if due today, upsert into daily_scheduled_leads
  -> campaign page realtime/poll refresh
  -> lead appears in today queue with preview/edit state
```

Expected result
- If a lead accepts now and Step 2 is due in 1 hour today, the lead will appear on the campaign page today.
- The Step 2 AI message will be visible there, with regenerate/edit controls.
- The UI will no longer require a full reload or next-day scheduler run to show newly accepted leads.
