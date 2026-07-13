## Goal
Make the workflow builder more flexible: allow Comment and new Like steps to sit **before** or **between** the Invitation step, and add an inline "+ Add step here" affordance between every step.

## Changes

### 1. New step type: `like`
- Add `Like post` option in the Add Step picker (ThumbsUp icon).
- Schema stored in `workflow_steps`:
  ```json
  { "type": "like", "post_filter": "authored_only" | "all_signals", "delay_hours": 0 }
  ```
- Render like-step card similarly to Comment (compact, with post filter + delay).
- No message/AI needed — just a signal action.

### 2. Execution (edge functions)
- New edge function `execute-like-step` (mirrors `execute-comment-step` but calls Unipile "react to post" endpoint, no text generation).
- `process-campaign-followups`: route `step.type === "like"` → `execute-like-step`.
- Pre-invitation execution: currently the followups processor assumes step[0] is invitation. Update it so steps positioned **before** the invitation run first (respecting `delay_hours` from enrollment), and the invitation only fires after all preceding non-invitation steps complete. Only `comment` and `like` are permitted before invitation (invite/message/email require accepted connection).

### 3. Builder UI (`src/pages/CampaignDetail.tsx`)
- Remove the hard assumption that the invitation is always index 0. Track it by `type === "invitation"` wherever needed (indexing, metrics, dialogs).
- Add "+ Add step here" thin insert buttons between every pair of steps **and** above the invitation card.
- When the insert position is **before or at** the invitation index, the Add Step picker only shows: `Comment on signal`, `Like post`. Elsewhere the full menu (Message / Email / Visit / Comment / Like) is shown.
- `saveNewStep` gains an `insertIndex` argument; instead of always appending, it splices into `workflow_steps` at the chosen index.
- Add drag-free reorder for existing Comment/Like steps: small up/down arrows on the card to move it across the invitation boundary (constrained so message/email/visit steps can't move above invitation).
- Existing metrics helpers (`nonInvitationSteps`, `stepIndexInWorkflow`, edit/delete by index) refactored to compute the actual workflow index instead of assuming invitation-at-0.

### 4. Data / migration
- No schema change required (`workflow_steps` is jsonb). No new tables.

### 5. Out of scope
- Reply Guard, Conversational AI, and existing message/email/invite behavior are untouched.
- No changes to onboarding or campaign creation wizard defaults (new campaigns still start with Invitation as step 1).

## Technical notes
- Unipile "react" endpoint: `POST /api/v1/users/{account_id}/posts/{post_id}/reactions` with `{ reaction_type: "like" }` — same auth pattern as `execute-comment-step`.
- Insert-index UI: render a 24px-tall dashed row between steps with a centered `+` button; on click open the existing Add Step sheet with `insertIndex` preset and a filtered type list based on invitation position.
- All indices used by `updateStep`, `deleteStep`, scheduled-messages mapping, and `saveNewStep` derived from a single `resolveStepIndex(workflowSteps, item)` helper to avoid off-by-one bugs.
