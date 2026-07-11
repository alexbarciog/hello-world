## Overview
Add a new workflow step type `comment` to campaign workflows. It lets the AI post a personalised comment on the LinkedIn post that triggered the lead. This spans the workflow builder UI, a new preview edge function, backend execution, and activity logging.

## 1. Data model (no migration needed)
Store as a new entry in `campaigns.workflow_steps` (jsonb):
```json
{
  "type": "comment",
  "post_filter": "authored_only" | "all_signals",
  "ai_instructions": "…",
  "delay_hours": 0
}
```
Signal-source detection uses existing `contacts.signal` field. Treat signals matching `/^posted about/i` (case-insensitive) as "lead authored". Everything else (Liked, Commented, Engaged) → skip.

## 2. Workflow builder UI (`src/pages/CampaignDetail.tsx`)
- Add `Comment on signal post` (MessageCircle icon) to the "Add step" picker (currently at ~line 1637).
- Render a new card variant for `type === "comment"` alongside the existing message card, with:
  - Radio: post filter (`authored_only` default / `all_signals`) + helper text.
  - Textarea: AI instructions + placeholder + helper text.
  - "Preview comment" button → calls new edge function, shows sample in read-only box.
  - Reuse existing delay selector component.
  - Badge on card header: "⚡ Only runs on 'Posted about' signals" when `authored_only`.
- Non-blocking tip banner if a `message` step precedes a `comment` step.
- Add/edit/delete/reorder wired through the same `workflow_steps` update path already used for message steps.

## 3. New edge function: `generate-comment-preview`
- Input: `{ ai_instructions, sample_post? }`
- Uses Lovable AI Gateway (`google/gemini-2.5-flash`) with a system prompt that mirrors the runtime generator.
- Returns `{ comment: string }`.
- Deployed automatically.

## 4. New edge function: `post-signal-comment` (runtime executor)
- Input: `{ request_id }` (a `campaign_connection_requests` row at this step).
- Loads campaign step config, contact (signal text, signal_post_url, first_name, company), user's Unipile account.
- If `post_filter === "authored_only"` and signal is not "Posted about" → mark step complete, insert activity log entry "Comment step skipped — signal type was X", advance to next step.
- Else: generate comment via Lovable AI, POST to `https://api{DSN}/api/v1/posts/{post_id}/comments` via Unipile (extract post id from signal_post_url), store generated comment + status in activity log.

## 5. Runtime integration
- `process-campaign-followups` (existing dispatcher) gets a branch: when the next step's `type === "comment"`, invoke `post-signal-comment` instead of the message sender. Reuse existing scheduling/delay logic; the delay_hours field is honoured the same way as other steps.

## 6. Activity log
Reuse existing `scheduled_messages` / activity-timeline pattern already used for messages. Add rows with `action_type = "comment"`, `status ∈ {sent, skipped, failed}`, `body = generated comment`, and (for skipped) a `skip_reason` field in metadata.

## What is NOT changed
- Existing step types, delay logic, personalisation, sequencing, and Reply Guard behaviour are untouched.
- No changes to onboarding, signals, dashboard, or other unrelated surfaces.

## Technical notes
- File touched most heavily: `src/pages/CampaignDetail.tsx` (workflow builder region only).
- Two new edge functions under `supabase/functions/`.
- Small change to `process-campaign-followups/index.ts` to route `comment` steps.
- No DB migration required; step config lives inside the existing `workflow_steps` jsonb column.
