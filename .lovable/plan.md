

## Plan: Rework Subscription Model — Payment Required by Default, Free Trial as Admin Toggle

### Current State
- Users get a **free trial** (no charge) until their first meeting is booked via the "Pay on Success" model
- The `setup-card` edge function collects a card in Stripe Setup mode (no charge)
- The `auto-subscribe-on-meeting` edge function charges the Starter plan ($59/mo) when a meeting is booked
- The `AddCardDialog` UI says "$0 today" and "free until your first meeting is booked"
- Agents/campaigns require a card on file but not an active subscription

### What Changes

**Default behavior (new):** Users must pay for a subscription upfront before activating agents or campaigns. No free trial. No card-only flow.

**Optional (admin toggle):** Admins can enable the old "free trial / pay on success" model from the Admin Dashboard. When enabled, the current card-only flow applies.

### Implementation Steps

#### 1. Create `platform_settings` table
A single-row key-value settings table for platform-wide config:
- `id` (uuid, PK)
- `free_trial_enabled` (boolean, default `false`)
- `updated_at` (timestamptz)
- RLS: admins can read/update, authenticated users can read

#### 2. Add Settings tab to Admin Dashboard
Add a "Settings" tab in the Admin Dashboard with a toggle switch for "Free Trial Mode" that updates `platform_settings.free_trial_enabled`. Simple on/off with descriptive text.

#### 3. Update `check-subscription` edge function
Return the `free_trial_enabled` flag from `platform_settings` so the frontend knows which flow to use.

#### 4. Update `useSubscription` hook
Add `freeTrialEnabled: boolean` to the subscription state from the check-subscription response.

#### 5. Update activation flow in `Signals.tsx` and `Campaigns.tsx`
- **If free trial disabled (default):** When user tries to activate an agent/campaign without an active subscription → redirect to `/billing` (pricing page) instead of showing the AddCardDialog
- **If free trial enabled:** Keep existing behavior (show AddCardDialog, collect card, activate without subscription)

#### 6. Update `AddCardDialog` component
Make the dialog content conditional based on the mode:
- **Direct payment mode:** Update copy to say "Subscribe to activate" with a CTA that goes to checkout (not setup-card). Remove "$0 today" badge.
- **Free trial mode:** Keep current copy ("free until first meeting", "$0 today")

#### 7. Update `auto-subscribe-on-meeting` edge function
Add a check: only auto-subscribe if `free_trial_enabled` is true. If false, the user should already have a subscription, so skip.

### Technical Details

**New table migration:**
```sql
CREATE TABLE public.platform_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  free_trial_enabled boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Seed single row
INSERT INTO public.platform_settings (free_trial_enabled) VALUES (false);

-- Everyone can read
CREATE POLICY "Authenticated can read settings"
  ON public.platform_settings FOR SELECT TO authenticated
  USING (true);

-- Only admins can update
CREATE POLICY "Admins can update settings"
  ON public.platform_settings FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
```

**Files modified:**
- `supabase/functions/check-subscription/index.ts` — add `free_trial_enabled` to response
- `supabase/functions/auto-subscribe-on-meeting/index.ts` — check setting before auto-subscribing
- `src/hooks/useSubscription.ts` — add `freeTrialEnabled` field
- `src/pages/Signals.tsx` — update activation logic
- `src/pages/Campaigns.tsx` — update activation logic
- `src/components/AddCardDialog.tsx` — conditional content based on mode
- `src/pages/AdminDashboard.tsx` — add Settings tab with toggle

