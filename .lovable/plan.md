

# Free Plan Gating for Signal Agents & Reddit Signals

## Summary
Prevent free (unpaid) users from running AI agents and Reddit polling while still allowing them to configure everything. Agents created during onboarding are set to "paused" for free users. UI notifications clearly communicate the restriction and link to the billing/trial page.

## What Changes

### 1. Onboarding: Create agent as "paused" for free users
**File: `src/components/onboarding/StepComplete.tsx`**
- Currently the agent status is set based on LinkedIn connection status (`active` or `pending_linkedin`).
- Change: Always set agent status to `"paused"` regardless of LinkedIn status. The agent gets created with all config but won't run until the user subscribes.
- Same for the campaign: set status to `"paused"` instead of `"active"`.

### 2. Sidebar notification tooltip (8-second auto-dismiss)
**File: `src/components/DashboardLayout.tsx`**
- When `sub.subscribed === false` and `sub.loading === false`, show a floating tooltip/banner next to the "Signals Agents" nav item.
- It appears on mount with an 8-second auto-dismiss timer.
- Text: "AI agents are currently not running" with a small warning icon.
- Styled as a small popover/badge anchored to the right of the nav item.

### 3. Signals page: free plan banner
**File: `src/pages/Signals.tsx`**
- Import `useSubscription` hook.
- When `!sub.subscribed`, show a prominent banner at the top of the page:
  - Text: "Your AI agents are paused because you're on the Free plan."
  - Include a hyperlink "Start your free trial" pointing to `/billing`.
- Style: light amber/warning container with border.

### 4. Prevent activating agents on free plan
**File: `src/pages/Signals.tsx`**
- In `toggleAgentStatus()`: if the user is trying to activate (newStatus === "active") and `!subscribed`, show a toast error ("Upgrade to activate agents") and return early.
- In `AgentCard` and the desktop table: disable/hide the "Activate" option when on free plan, or show it but with a lock icon redirecting to billing.

### 5. Reddit Signals: pause keywords for free users
**File: `src/pages/RedditSignals.tsx`**
- Import `useSubscription`.
- Show same style banner: "Reddit monitoring is paused on the Free plan. Start your free trial."
- Prevent toggling keywords to "active" if not subscribed (same pattern as signal agents).

### 6. Backend: Skip Unipile calls for free users
**File: `supabase/functions/process-signal-agents/index.ts`**
- After loading the agent's `user_id`, query the Stripe subscription status via the existing `check-subscription` logic, or more simply: check if the user has an active subscription by calling the Stripe API directly within the function (list subscriptions by customer email).
- Simpler approach: Add a `subscribed` boolean column to `profiles` table, updated by `check-subscription`. Then in `process-signal-agents`, check `profile.subscribed` -- if false, skip the agent.
- **Chosen approach**: Query Stripe directly in the edge function to avoid schema changes. Look up the user's email from `auth.users` (via service role), check Stripe for active subscription. Skip agent if no active sub.

### 7. Backend: Skip Apify/Reddit polling for free users
**File: `supabase/functions/poll-reddit-signals/index.ts`**
- Same pattern: for each keyword's `user_id`, check if user has active Stripe subscription before processing.
- To avoid N Stripe calls, batch-check: collect unique user_ids, check subscription for each once, then skip keywords belonging to free users.

## Technical Details

**Subscription check in edge functions:**
```text
For each unique user_id in the batch:
  1. Get user email from auth.users (service role)
  2. Call stripe.customers.list({ email, limit: 1 })
  3. If customer found, call stripe.subscriptions.list({ customer, status: "active", limit: 1 })
  4. Cache result: paidUsers.add(userId) or skip
```

This adds ~1-2 Stripe API calls per unique user but ensures no free user consumes Unipile/Apify resources.

**Files modified:**
1. `src/components/onboarding/StepComplete.tsx` -- agent status = "paused"
2. `src/components/DashboardLayout.tsx` -- 8s tooltip notification
3. `src/pages/Signals.tsx` -- free plan banner + block activation
4. `src/pages/RedditSignals.tsx` -- free plan banner + block activation
5. `supabase/functions/process-signal-agents/index.ts` -- Stripe check, skip free users
6. `supabase/functions/poll-reddit-signals/index.ts` -- Stripe check, skip free users

