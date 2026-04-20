

# Manual Lead Approval System

## Overview
Add a manual approval gate between signal agent lead discovery and campaign enrollment. When enabled on an agent, discovered leads require explicit approve/reject action before they can be used in campaigns. Daily email notifications inform the user of new leads needing review, and campaigns notify when they run out of approved leads.

## Database Changes

### 1. Add `manual_approval` column to `signal_agents`
- `manual_approval boolean NOT NULL DEFAULT false`

### 2. Add `approval_status` column to `contacts`
- `approval_status text NOT NULL DEFAULT 'auto_approved'`
- Values: `auto_approved` (default, for agents without manual approval), `pending`, `approved`, `rejected`

## Frontend Changes

### 3. Agent Wizard — Manual Approval Toggle (Step 3)
In `src/components/CreateAgentWizard.tsx`, add a switch toggle in Step 3 (Leads Management) below the list selector:
- New state: `manualApproval` (boolean)
- Toggle UI: "Require manual approval" with description "Review and approve each lead before they are available for campaigns"
- Save `manual_approval` field in the `agentData` object
- Load the field when editing an existing agent

### 4. Contacts Page — Approve/Reject Buttons + Filter
In `src/pages/Contacts.tsx`:
- Add a new tab or filter for "Pending Approval" contacts (`approval_status = 'pending'`)
- Show Approve (check icon, green) and Reject (X icon, red) buttons in the actions column for contacts with `approval_status = 'pending'`
- Bulk approve/reject using existing selection mechanism
- On approve: update `approval_status` to `'approved'`
- On reject: update `approval_status` to `'rejected'`
- Add visual badge showing pending/approved/rejected status

### 5. Contact Types Update
In `src/components/contacts/types.ts`, add `approval_status` to the `Contact` interface.

## Backend Changes

### 6. Signal Agent Lead Discovery — Set `approval_status`
In `supabase/functions/signal-keyword-posts/index.ts` (and other signal functions that insert contacts):
- When inserting a new contact, check the agent's `manual_approval` flag
- If `true`, set `approval_status = 'pending'`; otherwise `'auto_approved'`

### 7. Schedule Daily Leads — Filter by Approval Status
In `supabase/functions/schedule-daily-leads/index.ts`:
- When fetching contacts from a list for Step 1 scheduling, add a filter: only include contacts where `approval_status IN ('approved', 'auto_approved')`
- When no eligible contacts remain (all pending or rejected), detect this "ran out of approved leads" condition
- If the campaign's source agent has `manual_approval = true` and there ARE pending leads, send a notification email to the user

### 8. Daily "New Leads Found" Email
Create new edge function `supabase/functions/send-approval-digest/index.ts`:
- Runs daily (add pg_cron job)
- For each agent with `manual_approval = true`, count contacts with `approval_status = 'pending'` added in the last 24 hours
- If count > 0, send email via existing `send-notification-email` pattern (Resend) with subject like "🎯 X new leads need your approval — Intentsly"
- Email body: "Hey {name}, your agent '{agentName}' found {count} leads today. Review and approve them to keep your campaigns running."
- Include CTA link to `/contacts` page

### 9. "Campaign Ran Out of Leads" Email
Within `schedule-daily-leads/index.ts`:
- After determining `unseenIds.length === 0` for a campaign, check if the source agent has `manual_approval = true`
- Query for pending contacts in the same list
- If pending count > 0, call the existing `send-notification-email` function with: "Your campaign '{campaignName}' has run out of approved leads. You have {pendingCount} leads waiting for approval."

## Technical Details

- The `approval_status` column defaults to `'auto_approved'` so all existing contacts continue working without migration issues
- The `schedule-daily-leads` filter change is the enforcement point — pending/rejected leads simply never get scheduled
- Email notifications reuse the existing `send-notification-email` edge function and Resend integration
- The daily digest cron job runs once per day (e.g., 08:00 UTC) after signal agents complete their runs

