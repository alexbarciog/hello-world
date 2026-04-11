

# Free Until First Meeting — Card Required to Activate

## How It Works

1. User signs up and gets full access to create agents, contacts, campaigns
2. To **activate** (turn on) a signal agent, they must add their card via Stripe Checkout (setup mode -- no charge)
3. Platform runs freely with card on file, no subscription yet
4. When the **first meeting** is booked (manual or AI-detected):
   - Auto-create a Stripe subscription using the saved payment method and charge immediately
   - Send congrats email: "You booked your first meeting using Intentsly!"
5. If the charge **fails**:
   - Send failure email: "Your payment failed -- update your card to continue using Intentsly"
   - Do NOT create the subscription

## Technical Plan

### 1. New edge function: `setup-card`

Creates a Stripe Checkout session in **`mode: 'setup'`** to collect card without charging.

- Find or create Stripe customer by email
- Create checkout session with `mode: 'setup'`, `success_url: /signals?card_added=true`, `cancel_url: /signals`
- Return session URL

### 2. New edge function: `auto-subscribe-on-meeting`

Called after first meeting is booked. Creates a real subscription and charges the card.

- Receive `user_id` 
- Look up user email, find Stripe customer
- Check if already has active subscription -- if yes, return early
- Check if customer has a default payment method (from setup checkout) -- if not, return error
- Create subscription with `default_payment_method`, price = Starter price (`price_1TIByxFsgTpFMX56JNwbw3TA`), `payment_behavior: 'default_incomplete'` so the invoice is created
- Check if the invoice payment succeeded:
  - **Success**: Send congrats email via `send-notification-email` ("Congrats! You booked your first meeting using Intentsly! You're now on the Starter plan.")
  - **Failed**: Send failure email ("Your payment failed. Update your card information to continue using Intentsly.") and cancel the subscription

### 3. Update `check-subscription` 

Add a `has_card` field to the response:
- After finding the Stripe customer, check if they have a default payment method or any payment methods on file
- Return `has_card: true/false` alongside existing fields

### 4. Update `useSubscription` hook

- Add `hasCard: boolean` to `SubscriptionState`
- Map from `data.has_card`

### 5. Update agent activation gating (`Signals.tsx`)

Change `toggleAgentStatus()`:
- Currently checks `!sub.subscribed` → change to check `!sub.hasCard`
- If no card: toast "Add your card to activate agents" with action button that calls `setup-card` and redirects to Stripe Checkout
- If has card (even without subscription): allow activation

### 6. Update `process-signal-agents` backend gating

- Currently checks for active Stripe subscription → change to check for **card on file** (customer exists with payment method) OR active subscription
- Users with a card but no subscription can still run agents

### 7. Trigger auto-subscribe from meeting creation

**A. `BookMeetingDialog.tsx` (manual booking):**
- After successful meeting insert, call `supabase.functions.invoke('auto-subscribe-on-meeting', { body: { user_id } })`

**B. `process-ai-replies/index.ts` (AI-detected meeting):**
- After successful meeting insert (line ~447), call `auto-subscribe-on-meeting` with the user_id

### 8. Config

- Add `auto-subscribe-on-meeting` and `setup-card` to `supabase/config.toml` with `verify_jwt = false`

## Files Changed

| File | Change |
|------|--------|
| `supabase/functions/setup-card/index.ts` | **New** -- Stripe setup checkout |
| `supabase/functions/auto-subscribe-on-meeting/index.ts` | **New** -- auto-create subscription + emails |
| `supabase/functions/check-subscription/index.ts` | Add `has_card` field |
| `supabase/functions/process-signal-agents/index.ts` | Change gating from subscription to card-on-file |
| `src/hooks/useSubscription.ts` | Add `hasCard` |
| `src/pages/Signals.tsx` | Change activation check to `hasCard` |
| `src/components/contacts/BookMeetingDialog.tsx` | Call auto-subscribe after booking |
| `supabase/functions/process-ai-replies/index.ts` | Call auto-subscribe after AI meeting detection |
| `supabase/config.toml` | Add new function configs |

## Stripe Details

- **Setup checkout**: `mode: 'setup'`, saves card to customer
- **Subscription creation**: Uses `prod_UGjR0WwP5rbgZX` (Intentsly Starter, $59/mo) with `price_1TIByxFsgTpFMX56JNwbw3TA`
- **Payment method**: Retrieved from customer's default payment method set during setup checkout
- No trial period on auto-created subscriptions (charge immediately)

