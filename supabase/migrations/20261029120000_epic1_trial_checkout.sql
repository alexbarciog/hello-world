-- Epic 1: self-serve checkout and the 7-day trial.
-- Billing state lives on the profile of the user who pays (the Stripe customer
-- is per user). Workspace members inherit access from the workspace owner; see
-- supabase/functions/_shared/billing.ts.
-- Every statement is idempotent so the file can be re-run on a branch.

-- ── 1. Billing columns ──────────────────────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS subscription_id text,
  ADD COLUMN IF NOT EXISTS subscription_status text,
  ADD COLUMN IF NOT EXISTS trial_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz,
  ADD COLUMN IF NOT EXISTS current_period_end timestamptz,
  ADD COLUMN IF NOT EXISTS plan_price_id text,
  ADD COLUMN IF NOT EXISTS founding boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS founding_rank integer,
  ADD COLUMN IF NOT EXISTS legacy_ends_at timestamptz,
  ADD COLUMN IF NOT EXISTS billing_updated_at timestamptz;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_subscription_status_check') THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_subscription_status_check
      CHECK (subscription_status IS NULL OR subscription_status IN
        ('legacy_free', 'trialing', 'active', 'past_due', 'canceled'));
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_stripe_customer_id_key
  ON public.profiles (stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS profiles_subscription_id_idx
  ON public.profiles (subscription_id) WHERE subscription_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS profiles_subscription_status_idx
  ON public.profiles (subscription_status);

-- Only Stripe (through the stripe-webhook / billing-enforcer functions, which
-- use the service role) may change billing state. Block direct client writes.
CREATE OR REPLACE FUNCTION public.guard_profile_billing_columns()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  col text;
  old_row jsonb := to_jsonb(OLD);
  new_row jsonb := to_jsonb(NEW);
BEGIN
  IF current_user NOT IN ('authenticated', 'anon') THEN
    RETURN NEW;
  END IF;
  FOREACH col IN ARRAY ARRAY[
    'stripe_customer_id', 'subscription_id', 'subscription_status',
    'trial_started_at', 'trial_ends_at', 'current_period_end', 'plan_price_id',
    'founding', 'founding_rank', 'legacy_ends_at', 'billing_updated_at'
  ] LOOP
    IF (new_row -> col) IS DISTINCT FROM (old_row -> col) THEN
      RAISE EXCEPTION 'Column "%" cannot be changed directly', col USING ERRCODE = '42501';
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_profile_billing_columns ON public.profiles;
CREATE TRIGGER guard_profile_billing_columns
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_profile_billing_columns();

-- ── 2. Plan limits (numbers live here, not in code) ─────────────────────────
CREATE TABLE IF NOT EXISTS public.plan_limits (
  key text PRIMARY KEY,
  value integer NOT NULL,
  description text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.plan_limits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone signed in can read plan limits" ON public.plan_limits;
CREATE POLICY "Anyone signed in can read plan limits"
  ON public.plan_limits FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Admins manage plan limits" ON public.plan_limits;
CREATE POLICY "Admins manage plan limits"
  ON public.plan_limits FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.plan_limits (key, value, description) VALUES
  ('trial_days', 7, 'Length of the free trial in days'),
  ('trial_signal_cap', 20, 'Trial ends early once this many signals (contacts) have been delivered'),
  ('trial_banner_day', 5, 'Trial day from which the "trial ends" banner is shown'),
  ('founding_slots', 10, 'Number of founding customers (first paid subscriptions after launch)'),
  ('legacy_grace_days', 14, 'Days existing free accounts keep working after the Epic 1 deploy')
ON CONFLICT (key) DO NOTHING;

-- ── 3. Stripe webhook idempotency ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.stripe_events (
  id text PRIMARY KEY,
  type text NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  error text
);
-- Service role only: no policies.
ALTER TABLE public.stripe_events ENABLE ROW LEVEL SECURITY;

-- ── 4. Founding customers ───────────────────────────────────────────────────
-- Called by stripe-webhook on a subscription's first paid invoice. Serialised
-- with an advisory lock so two simultaneous invoices can't both take slot 10.
CREATE OR REPLACE FUNCTION public.claim_founding_slot(_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing integer;
  slots integer;
  taken integer;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('intentsly_founding_slots'));
  SELECT founding_rank INTO existing FROM public.profiles WHERE user_id = _user_id AND founding;
  IF existing IS NOT NULL THEN
    RETURN existing;
  END IF;
  SELECT value INTO slots FROM public.plan_limits WHERE key = 'founding_slots';
  SELECT count(*) INTO taken FROM public.profiles WHERE founding;
  IF taken >= coalesce(slots, 0) THEN
    RETURN NULL;
  END IF;
  UPDATE public.profiles SET founding = true, founding_rank = taken + 1, billing_updated_at = now()
    WHERE user_id = _user_id;
  RETURN taken + 1;
END;
$$;
REVOKE ALL ON FUNCTION public.claim_founding_slot(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_founding_slot(uuid) TO service_role;

-- Public count for /pricing ("N of 10 founding spots left"). No user data.
CREATE OR REPLACE FUNCTION public.founding_slots_remaining()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT greatest(
    coalesce((SELECT value FROM public.plan_limits WHERE key = 'founding_slots'), 0)
      - (SELECT count(*)::integer FROM public.profiles WHERE founding),
    0);
$$;
REVOKE ALL ON FUNCTION public.founding_slots_remaining() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.founding_slots_remaining() TO anon, authenticated;

-- ── 5. Existing accounts become legacy_free for 14 days ─────────────────────
-- Paying customers are moved to 'active' by the stripe-backfill function
-- (Stripe is the source of truth for who pays); until then legacy_free keeps
-- their account working exactly as before.
UPDATE public.profiles
SET subscription_status = 'legacy_free',
    legacy_ends_at = now() + make_interval(days =>
      coalesce((SELECT value FROM public.plan_limits WHERE key = 'legacy_grace_days'), 14)),
    billing_updated_at = now()
WHERE subscription_status IS NULL;

-- ── 6. Billing enforcer every 15 minutes ────────────────────────────────────
-- Ends trials that hit the signal cap and pauses agents/campaigns of accounts
-- without access. Idempotent, so being callable with the public key is harmless.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'billing-enforcer') THEN
    PERFORM cron.unschedule('billing-enforcer');
  END IF;
END $$;
SELECT cron.schedule(
  'billing-enforcer',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url:='https://uwwajlezgeurnvvrvdvb.supabase.co/functions/v1/billing-enforcer',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3d2FqbGV6Z2V1cm52dnJ2ZHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3NjMxMzcsImV4cCI6MjA4OTMzOTEzN30.ceVF9PcMblbGAmAEqCwm9qOdtZfUxy_clBcTAW9VNLw"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);
