-- Paid subscriptions through Creem (merchant of record). Replaces the Stripe
-- subscription columns on profiles from Epic 1 as the source of billing state.
-- Workspace members still inherit access from the workspace owner; see
-- supabase/functions/_shared/account-access.ts.
-- Written to re-run safely (no DROP statements).

-- ── 1. Subscriptions ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  creem_customer_id text,
  creem_subscription_id text NOT NULL UNIQUE,
  product_id text,
  status text NOT NULL CHECK (status IN
    ('trialing', 'active', 'past_due', 'paused', 'scheduled_cancel', 'canceled', 'expired', 'unpaid')),
  trial_end timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  canceled_at timestamptz,
  founding boolean NOT NULL DEFAULT false,
  -- Creem test or live store. Test rows never count once CREEM_MODE=live.
  mode text NOT NULL DEFAULT 'test' CHECK (mode IN ('test', 'live')),
  -- created_at of the newest Creem event applied, so a late retry can't roll the status back.
  last_event_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx ON public.subscriptions (user_id);
CREATE INDEX IF NOT EXISTS subscriptions_customer_idx ON public.subscriptions (creem_customer_id);

-- Users read their own rows; only the service role (creem-webhook) writes.
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'subscriptions'
                 AND policyname = 'Users read their own subscriptions') THEN
    CREATE POLICY "Users read their own subscriptions"
      ON public.subscriptions FOR SELECT TO authenticated USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'subscriptions'
                 AND policyname = 'Admins read all subscriptions') THEN
    CREATE POLICY "Admins read all subscriptions"
      ON public.subscriptions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- ── 2. Webhook events (idempotency and audit) ───────────────────────────────
CREATE TABLE IF NOT EXISTS public.billing_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text NOT NULL UNIQUE,
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  -- Exactly what Creem sent, so a delivery can be replayed to test idempotency.
  raw_body text,
  signature text,
  received_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  error text
);
-- Service role only: no policies.
ALTER TABLE public.billing_events ENABLE ROW LEVEL SECURITY;

-- ── 3. is_paying ────────────────────────────────────────────────────────────
-- Same rule as isPaying() in supabase/functions/_shared/billing.ts.
-- _mode limits it to one Creem store ('test' or 'live'); NULL means either.
CREATE OR REPLACE FUNCTION public.is_paying(_user_id uuid, _mode text DEFAULT NULL)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = _user_id
      AND status IN ('trialing', 'active', 'scheduled_cancel')
      AND current_period_end > now()
      AND (_mode IS NULL OR mode = _mode)
  )
  -- Signed-in users may only ask about themselves (admins about anyone).
  AND (auth.uid() IS NULL OR auth.uid() = _user_id OR public.has_role(auth.uid(), 'admin'));
$$;
REVOKE ALL ON FUNCTION public.is_paying(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_paying(uuid, text) TO authenticated, service_role;

-- ── 4. Webhook helpers (service role only) ──────────────────────────────────
-- Matches a Creem customer email to an account when the checkout metadata is missing.
CREATE OR REPLACE FUNCTION public.user_id_by_email(_email text)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT id FROM auth.users WHERE lower(email) = lower(_email) ORDER BY created_at LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.user_id_by_email(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.user_id_by_email(text) TO service_role;

-- Founding customers: the first `founding_slots` (10) subscriptions to become
-- active in a store keep $97/month for life. Serialised with an advisory lock
-- so two simultaneous activations can't both take the last slot.
CREATE OR REPLACE FUNCTION public.claim_founding_subscription(_creem_subscription_id text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sub public.subscriptions%ROWTYPE;
  slots integer;
  taken integer;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('intentsly_founding_subscriptions'));
  SELECT * INTO sub FROM public.subscriptions WHERE creem_subscription_id = _creem_subscription_id;
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  IF sub.founding THEN
    RETURN true;
  END IF;
  SELECT value INTO slots FROM public.plan_limits WHERE key = 'founding_slots';
  SELECT count(*) INTO taken FROM public.subscriptions WHERE founding AND mode = sub.mode;
  IF taken >= coalesce(slots, 0) THEN
    RETURN false;
  END IF;
  UPDATE public.subscriptions SET founding = true, updated_at = now() WHERE id = sub.id;
  RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.claim_founding_subscription(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_founding_subscription(text) TO service_role;

-- Public count for /pricing ("N of 10 left"): live store only, no user data.
CREATE OR REPLACE FUNCTION public.founding_slots_remaining()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT greatest(
    coalesce((SELECT value FROM public.plan_limits WHERE key = 'founding_slots'), 0)
      - (SELECT count(*)::integer FROM public.subscriptions WHERE founding AND mode = 'live'),
    0);
$$;
REVOKE ALL ON FUNCTION public.founding_slots_remaining() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.founding_slots_remaining() TO anon, authenticated;
