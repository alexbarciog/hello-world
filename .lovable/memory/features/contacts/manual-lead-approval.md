---
name: Manual Lead Approval
description: Agents with manual_approval=true set contacts to approval_status=pending; only approved/auto_approved leads enter campaigns
type: feature
---
- `signal_agents.manual_approval` (boolean, default false) — toggle in wizard Step 3
- `contacts.approval_status` — values: auto_approved (default), pending, approved, rejected
- Contacts page has "Pending Approval" tab with inline Approve/Reject buttons and bulk actions
- `schedule-daily-leads` filters contacts by approval_status IN (approved, auto_approved)
- When campaign runs out of approved leads and agent has manual_approval, sends email + notification
- `send-approval-digest` edge function sends daily email for pending leads (needs pg_cron job)
- All signal functions (keyword-posts, hashtag-engagement, competitor, post-engagers) pass manual_approval from process-signal-agents basePayload
