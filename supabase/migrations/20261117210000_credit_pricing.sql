-- Credit-based pricing: Starter $29 / Growth $68 / Pro $97, no trial.
--
-- billing_plans      price, monthly credits and limits per plan. Alex edits rows, no deploy needed.
-- credit_costs       credits per action.
-- billing_settings   one row: credits_enforced (false until billing is live: only accounts with a
--                    plan are charged, so nobody is paused while nobody can pay yet).
-- credit_ledger      every grant, spend and refund. profiles.credits is the balance and is only
--                    changed by spend_credits / grant_credits / refund_credits.
-- Idempotent; no DROP statements.

-- ── Config ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.billing_plans (
  key text PRIMARY KEY CHECK (key ~ '^[a-z][a-z0-9_]*$'),
  name text NOT NULL,
  price_cents integer NOT NULL CHECK (price_cents >= 0),
  monthly_credits integer NOT NULL CHECK (monthly_credits >= 0),
  max_signal_agents integer CHECK (max_signal_agents IS NULL OR max_signal_agents >= 0),   -- NULL = unlimited
  max_active_campaigns integer CHECK (max_active_campaigns IS NULL OR max_active_campaigns >= 0), -- NULL = unlimited
  linkedin_accounts integer NOT NULL DEFAULT 1,
  priority_support boolean NOT NULL DEFAULT false,
  creem_product_id_test text,
  creem_product_id_live text,
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.billing_plans (key, name, price_cents, monthly_credits, max_signal_agents, max_active_campaigns, linkedin_accounts, priority_support, sort_order)
VALUES
  ('starter', 'Starter', 2900, 300, 1, 1, 1, false, 1),
  ('growth', 'Growth', 6800, 900, 3, 5, 1, false, 2),
  ('pro', 'Pro', 9700, 1600, NULL, NULL, 1, true, 3)
ON CONFLICT (key) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.credit_costs (
  action text PRIMARY KEY CHECK (action IN ('lead_1', 'lead_2', 'lead_3', 'connection', 'ai_message', 'template_message')),
  credits integer NOT NULL CHECK (credits >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.credit_costs (action, credits) VALUES
  ('lead_1', 1), ('lead_2', 3), ('lead_3', 5), ('connection', 1), ('ai_message', 5), ('template_message', 2)
ON CONFLICT (action) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.billing_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  credits_enforced boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.billing_settings (id) VALUES (true) ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.billing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_settings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'billing_plans' AND policyname = 'Anyone reads active plans') THEN
    CREATE POLICY "Anyone reads active plans" ON public.billing_plans FOR SELECT TO anon, authenticated USING (active OR public.has_role(auth.uid(), 'admin'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'billing_plans' AND policyname = 'Admins edit plans') THEN
    CREATE POLICY "Admins edit plans" ON public.billing_plans FOR ALL TO authenticated
      USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'credit_costs' AND policyname = 'Anyone reads credit costs') THEN
    CREATE POLICY "Anyone reads credit costs" ON public.credit_costs FOR SELECT TO anon, authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'credit_costs' AND policyname = 'Admins edit credit costs') THEN
    CREATE POLICY "Admins edit credit costs" ON public.credit_costs FOR ALL TO authenticated
      USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'billing_settings' AND policyname = 'Admins manage billing settings') THEN
    CREATE POLICY "Admins manage billing settings" ON public.billing_settings FOR ALL TO authenticated
      USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;
END
$$;

-- ── Account state ───────────────────────────────────────────────────────────

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS plan text REFERENCES public.billing_plans(key),
  -- A downgrade waits for the next renewal.
  ADD COLUMN IF NOT EXISTS pending_plan text REFERENCES public.billing_plans(key),
  -- creem: renewed by Creem webhooks. legacy / manual: no renewals, reset monthly by reset_unbilled_credits().
  ADD COLUMN IF NOT EXISTS plan_source text CHECK (plan_source IS NULL OR plan_source IN ('creem', 'legacy', 'manual')),
  ADD COLUMN IF NOT EXISTS credits_period_end timestamptz,
  ADD COLUMN IF NOT EXISTS credits_exhausted_at timestamptz;

ALTER TABLE public.signal_agents ADD COLUMN IF NOT EXISTS paused_reason text;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS paused_reason text;

-- ── Ledger ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.credit_ledger (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  delta integer NOT NULL,
  reason text NOT NULL CHECK (reason IN ('plan_grant', 'lead_1', 'lead_2', 'lead_3', 'connection', 'ai_message', 'template_message', 'refund', 'admin_adjust')),
  ref_type text,
  ref_id text,
  balance_after integer
);
-- The same lead, message, invitation or billing period can never be charged or granted twice.
CREATE UNIQUE INDEX IF NOT EXISTS credit_ledger_once ON public.credit_ledger (user_id, reason, ref_id) WHERE ref_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS credit_ledger_user_time ON public.credit_ledger (user_id, created_at DESC);

ALTER TABLE public.credit_ledger ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.credit_ledger FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.credit_ledger FROM authenticated;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'credit_ledger' AND policyname = 'Users read their own credit ledger') THEN
    CREATE POLICY "Users read their own credit ledger" ON public.credit_ledger FOR SELECT TO authenticated
      USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
  END IF;
END
$$;

-- The new plan columns follow guard_profile_privileged_columns (which already
-- protects credits): users can't change them; service role, SECURITY DEFINER
-- functions and admins can.
CREATE OR REPLACE FUNCTION public.protect_profile_billing()
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
  IF public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RETURN NEW;
  END IF;
  FOREACH col IN ARRAY ARRAY['plan', 'pending_plan', 'plan_source', 'credits_period_end', 'credits_exhausted_at'] LOOP
    IF (new_row -> col) IS DISTINCT FROM (old_row -> col) THEN
      RAISE EXCEPTION 'Column "%" cannot be changed directly', col USING ERRCODE = '42501';
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$;
CREATE OR REPLACE TRIGGER protect_profile_billing
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_billing();

-- ── Functions ───────────────────────────────────────────────────────────────

/**
 * Charges p_amount credits. Returns true when the action may go ahead:
 * charged now, already charged for this ref, or the account isn't on credit
 * billing yet (no plan while billing_settings.credits_enforced is false).
 * Returns false (and marks the account out of credits) when the balance is too low.
 */
CREATE OR REPLACE FUNCTION public.spend_credits(p_user_id uuid, p_amount integer, p_reason text, p_ref_type text DEFAULT NULL, p_ref_id text DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_credits integer;
  v_plan text;
  v_enforced boolean;
  v_id bigint;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RETURN true;
  END IF;
  IF p_reason NOT IN ('lead_1', 'lead_2', 'lead_3', 'connection', 'ai_message', 'template_message') THEN
    RAISE EXCEPTION 'not a spend reason: %', p_reason USING ERRCODE = '22023';
  END IF;

  SELECT credits, plan INTO v_credits, v_plan FROM public.profiles WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  SELECT credits_enforced INTO v_enforced FROM public.billing_settings WHERE id;
  IF v_plan IS NULL AND NOT coalesce(v_enforced, false) THEN
    RETURN true;
  END IF;

  -- Already charged for this ref. A lead counts once whatever its fire level.
  IF p_ref_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.credit_ledger
    WHERE user_id = p_user_id AND ref_id = p_ref_id
      AND (reason = p_reason OR (p_reason LIKE 'lead\_%' AND reason IN ('lead_1', 'lead_2', 'lead_3')))
  ) THEN
    RETURN true;
  END IF;

  IF coalesce(v_credits, 0) < p_amount THEN
    UPDATE public.profiles SET credits_exhausted_at = coalesce(credits_exhausted_at, now()) WHERE user_id = p_user_id;
    RETURN false;
  END IF;

  INSERT INTO public.credit_ledger (user_id, delta, reason, ref_type, ref_id, balance_after)
  VALUES (p_user_id, -p_amount, p_reason, p_ref_type, p_ref_id, v_credits - p_amount)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_id;
  IF v_id IS NULL THEN
    RETURN true; -- a concurrent call charged the same ref
  END IF;

  UPDATE public.profiles SET credits = v_credits - p_amount WHERE user_id = p_user_id;
  RETURN true;
END;
$$;

/**
 * Gives back a spend (failed send). Idempotent. The original row's ref_id is
 * renamed so a retry of the same action can be charged again.
 */
CREATE OR REPLACE FUNCTION public.refund_credits(p_user_id uuid, p_reason text, p_ref_id text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.credit_ledger%ROWTYPE;
  v_credits integer;
BEGIN
  IF p_ref_id IS NULL THEN
    RETURN 0;
  END IF;
  SELECT credits INTO v_credits FROM public.profiles WHERE user_id = p_user_id FOR UPDATE;
  SELECT * INTO v_row FROM public.credit_ledger
  WHERE user_id = p_user_id AND reason = p_reason AND ref_id = p_ref_id AND delta < 0;
  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  UPDATE public.credit_ledger SET ref_id = v_row.ref_id || '#refunded:' || v_row.id WHERE id = v_row.id;
  INSERT INTO public.credit_ledger (user_id, delta, reason, ref_type, ref_id, balance_after)
  VALUES (p_user_id, -v_row.delta, 'refund', v_row.ref_type, p_reason || ':' || p_ref_id || '#' || v_row.id, coalesce(v_credits, 0) - v_row.delta);

  UPDATE public.profiles SET credits = coalesce(credits, 0) - v_row.delta WHERE user_id = p_user_id;
  RETURN -v_row.delta;
END;
$$;

/**
 * Adds credits (or, with p_reset, sets the balance to p_amount: renewals don't
 * roll over). Idempotent per ref. When the balance becomes positive, agents and
 * campaigns paused for credits are resumed.
 */
CREATE OR REPLACE FUNCTION public.grant_credits(
  p_user_id uuid, p_amount integer, p_reason text, p_ref_type text DEFAULT NULL, p_ref_id text DEFAULT NULL,
  p_reset boolean DEFAULT false, p_period_end timestamptz DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_credits integer;
  v_delta integer;
BEGIN
  IF p_reason NOT IN ('plan_grant', 'admin_adjust') THEN
    RAISE EXCEPTION 'not a grant reason: %', p_reason USING ERRCODE = '22023';
  END IF;
  SELECT credits INTO v_credits FROM public.profiles WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  IF p_ref_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.credit_ledger WHERE user_id = p_user_id AND reason = p_reason AND ref_id = p_ref_id
  ) THEN
    RETURN v_credits;
  END IF;

  v_delta := CASE WHEN p_reset THEN p_amount - coalesce(v_credits, 0) ELSE p_amount END;
  INSERT INTO public.credit_ledger (user_id, delta, reason, ref_type, ref_id, balance_after)
  VALUES (p_user_id, v_delta, p_reason, p_ref_type, p_ref_id, coalesce(v_credits, 0) + v_delta);

  UPDATE public.profiles
  SET credits = coalesce(credits, 0) + v_delta,
      credits_period_end = coalesce(p_period_end, credits_period_end),
      credits_exhausted_at = CASE WHEN coalesce(credits, 0) + v_delta > 0 THEN NULL ELSE credits_exhausted_at END
  WHERE user_id = p_user_id;

  IF coalesce(v_credits, 0) + v_delta > 0 THEN
    PERFORM public.resume_after_credits(p_user_id);
  END IF;
  RETURN coalesce(v_credits, 0) + v_delta;
END;
$$;

/** Pauses the billing owner's and workspace members' active agents and campaigns (out of credits). */
CREATE OR REPLACE FUNCTION public.pause_for_credits(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  n_agents integer;
  n_campaigns integer;
BEGIN
  UPDATE public.signal_agents SET status = 'paused', paused_reason = 'out_of_credits'
  WHERE user_id IN (
    SELECT p_user_id
    UNION
    SELECT om.user_id
    FROM public.profiles p
    JOIN public.organizations o ON o.id = p.current_organization_id AND o.owner_id = p_user_id
    JOIN public.organization_members om ON om.organization_id = o.id
    WHERE p.user_id = p_user_id
  ) AND status = 'active';
  GET DIAGNOSTICS n_agents = ROW_COUNT;
  UPDATE public.campaigns SET status = 'paused', paused_reason = 'out_of_credits'
  WHERE user_id IN (
    SELECT p_user_id
    UNION
    SELECT om.user_id
    FROM public.profiles p
    JOIN public.organizations o ON o.id = p.current_organization_id AND o.owner_id = p_user_id
    JOIN public.organization_members om ON om.organization_id = o.id
    WHERE p.user_id = p_user_id
  ) AND status = 'active';
  GET DIAGNOSTICS n_campaigns = ROW_COUNT;
  RETURN n_agents + n_campaigns;
END;
$$;

/** Undoes pause_for_credits: only rows it paused, never ones the user paused. */
CREATE OR REPLACE FUNCTION public.resume_after_credits(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  n_agents integer;
  n_campaigns integer;
BEGIN
  UPDATE public.signal_agents SET status = 'active', paused_reason = NULL
  WHERE user_id IN (
    SELECT p_user_id
    UNION
    SELECT om.user_id
    FROM public.profiles p
    JOIN public.organizations o ON o.id = p.current_organization_id AND o.owner_id = p_user_id
    JOIN public.organization_members om ON om.organization_id = o.id
    WHERE p.user_id = p_user_id
  ) AND status = 'paused' AND paused_reason = 'out_of_credits';
  GET DIAGNOSTICS n_agents = ROW_COUNT;
  UPDATE public.campaigns SET status = 'active', paused_reason = NULL
  WHERE user_id IN (
    SELECT p_user_id
    UNION
    SELECT om.user_id
    FROM public.profiles p
    JOIN public.organizations o ON o.id = p.current_organization_id AND o.owner_id = p_user_id
    JOIN public.organization_members om ON om.organization_id = o.id
    WHERE p.user_id = p_user_id
  ) AND status = 'paused' AND paused_reason = 'out_of_credits';
  GET DIAGNOSTICS n_campaigns = ROW_COUNT;
  RETURN n_agents + n_campaigns;
END;
$$;

/** The workspace owner who pays for this user (themselves when not in a workspace). */
CREATE OR REPLACE FUNCTION public.billing_owner_of(p_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(
    (SELECT o.owner_id FROM public.profiles p JOIN public.organizations o ON o.id = p.current_organization_id WHERE p.user_id = p_user_id),
    p_user_id
  );
$$;

/**
 * Out of credits: pause the workspace's agents and campaigns and tell the
 * owner once per exhaustion (in-app notification + app_events).
 */
CREATE OR REPLACE FUNCTION public.credits_exhausted(p_owner uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_since timestamptz;
  v_renewal timestamptz;
BEGIN
  PERFORM public.pause_for_credits(p_owner);
  SELECT credits_exhausted_at, credits_period_end INTO v_since, v_renewal FROM public.profiles WHERE user_id = p_owner;
  IF EXISTS (
    SELECT 1 FROM public.notifications
    WHERE user_id = p_owner AND type = 'credits_exhausted' AND created_at >= coalesce(v_since, now() - interval '1 minute')
  ) THEN
    RETURN;
  END IF;
  -- Telling the owner must never undo the pause (or the insert that triggered it).
  BEGIN
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (
      p_owner, 'credits_exhausted', 'You''re out of credits',
      CASE WHEN v_renewal IS NOT NULL
        THEN 'Your agents and campaigns are paused until ' || to_char(v_renewal, 'FMMonth FMDD') || ', when your credits renew. Upgrade to keep going.'
        ELSE 'Your agents and campaigns are paused. Pick a plan to keep going.' END,
      '/billing'
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'credits_exhausted: notification not saved: %', SQLERRM;
  END;
  BEGIN
    INSERT INTO public.app_events (user_id, event, props) VALUES (p_owner, 'credits_exhausted', '{}'::jsonb);
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'credits_exhausted: event not recorded: %', SQLERRM;
  END;
END;
$$;

/**
 * Every new lead in contacts is charged here, whatever created it (signal
 * agents, post extraction, lookalikes, Sales Nav import, shared leads, AI chat).
 * Fire level = relevance_tier: hot 3, warm 2, cold 1. Charged once per person
 * per billing account. Out of credits: the row is skipped (not inserted) and
 * the account is paused. If the insert fails, the charge rolls back with it.
 */
CREATE OR REPLACE FUNCTION public.charge_new_contact()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner uuid;
  v_reason text;
  v_cost integer;
  v_ref text;
BEGIN
  IF NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;
  v_reason := CASE NEW.relevance_tier WHEN 'hot' THEN 'lead_3' WHEN 'warm' THEN 'lead_2' ELSE 'lead_1' END;
  SELECT credits INTO v_cost FROM public.credit_costs WHERE action = v_reason;
  IF coalesce(v_cost, 0) <= 0 THEN
    RETURN NEW;
  END IF;
  v_owner := public.billing_owner_of(NEW.user_id);
  v_ref := 'lead:' || coalesce(NEW.linkedin_profile_id, lower(rtrim(NEW.linkedin_url, '/')), NEW.id::text);
  IF public.spend_credits(v_owner, v_cost, v_reason, 'contact', v_ref) THEN
    RETURN NEW;
  END IF;
  PERFORM public.credits_exhausted(v_owner);
  RETURN NULL;
END;
$$;
CREATE OR REPLACE TRIGGER charge_new_contact
  BEFORE INSERT ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.charge_new_contact();

/**
 * Plan limits: signal agents per workspace and active campaigns. Applies to
 * accounts on a plan (or everyone once credits_enforced is on). Resuming after
 * a credit pause is never blocked.
 */
CREATE OR REPLACE FUNCTION public.enforce_plan_limits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner uuid;
  v_plan public.billing_plans%ROWTYPE;
  v_enforced boolean;
  v_count integer;
BEGIN
  IF TG_TABLE_NAME = 'campaigns' THEN
    IF NEW.status IS DISTINCT FROM 'active' THEN
      RETURN NEW;
    END IF;
    IF TG_OP = 'UPDATE' AND (OLD.status = 'active' OR OLD.paused_reason = 'out_of_credits') THEN
      RETURN NEW;
    END IF;
  END IF;

  v_owner := public.billing_owner_of(NEW.user_id);
  SELECT bp.* INTO v_plan FROM public.profiles p JOIN public.billing_plans bp ON bp.key = p.plan WHERE p.user_id = v_owner;
  IF NOT FOUND THEN
    SELECT credits_enforced INTO v_enforced FROM public.billing_settings WHERE id;
    IF coalesce(v_enforced, false) THEN
      RAISE EXCEPTION 'Pick a plan to use Intentsly.' USING ERRCODE = 'P0001', HINT = 'plan_required';
    END IF;
    RETURN NEW;
  END IF;

  IF TG_TABLE_NAME = 'signal_agents' THEN
    IF v_plan.max_signal_agents IS NULL THEN
      RETURN NEW;
    END IF;
    SELECT count(*) INTO v_count FROM public.signal_agents a WHERE public.billing_owner_of(a.user_id) = v_owner;
    IF v_count >= v_plan.max_signal_agents THEN
      RAISE EXCEPTION 'Your % plan includes % signal agent%. Upgrade to add more.',
        v_plan.name, v_plan.max_signal_agents, CASE WHEN v_plan.max_signal_agents = 1 THEN '' ELSE 's' END
        USING ERRCODE = 'P0001', HINT = 'plan_limit_agents';
    END IF;
  ELSE
    IF v_plan.max_active_campaigns IS NULL THEN
      RETURN NEW;
    END IF;
    SELECT count(*) INTO v_count FROM public.campaigns c
    WHERE c.status = 'active' AND c.id IS DISTINCT FROM NEW.id AND public.billing_owner_of(c.user_id) = v_owner;
    IF v_count >= v_plan.max_active_campaigns THEN
      RAISE EXCEPTION 'Your % plan includes % active campaign%. Pause one or upgrade.',
        v_plan.name, v_plan.max_active_campaigns, CASE WHEN v_plan.max_active_campaigns = 1 THEN '' ELSE 's' END
        USING ERRCODE = 'P0001', HINT = 'plan_limit_campaigns';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
CREATE OR REPLACE TRIGGER enforce_plan_limits
  BEFORE INSERT ON public.signal_agents
  FOR EACH ROW EXECUTE FUNCTION public.enforce_plan_limits();
CREATE OR REPLACE TRIGGER enforce_plan_limits
  BEFORE INSERT OR UPDATE OF status ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.enforce_plan_limits();

/**
 * Sets an account's plan. Grants are separate (grant_credits), so the caller
 * decides between a renewal reset, an upgrade difference or nothing.
 */
CREATE OR REPLACE FUNCTION public.set_account_plan(p_user_id uuid, p_plan text, p_source text, p_pending_plan text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET plan = p_plan, plan_source = p_source, pending_plan = p_pending_plan
  WHERE user_id = p_user_id;
END;
$$;

/**
 * Monthly reset for accounts whose plan Creem doesn't renew (legacy Stripe
 * customers and hand-granted plans). Run daily by pg_cron.
 */
CREATE OR REPLACE FUNCTION public.reset_unbilled_credits()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r record;
  n integer := 0;
  v_next timestamptz;
BEGIN
  FOR r IN
    SELECT p.user_id, p.plan, p.credits_period_end, bp.monthly_credits
    FROM public.profiles p JOIN public.billing_plans bp ON bp.key = p.plan
    WHERE p.plan_source IN ('legacy', 'manual')
      AND (p.credits_period_end IS NULL OR p.credits_period_end <= now())
  LOOP
    v_next := coalesce(r.credits_period_end, now());
    WHILE v_next <= now() LOOP
      v_next := v_next + interval '1 month';
    END LOOP;
    PERFORM public.grant_credits(r.user_id, r.monthly_credits, 'plan_grant', 'period', r.plan || ':' || to_char(v_next, 'YYYY-MM-DD'), true, v_next);
    n := n + 1;
  END LOOP;
  RETURN n;
END;
$$;

REVOKE ALL ON FUNCTION public.spend_credits(uuid, integer, text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.refund_credits(uuid, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.grant_credits(uuid, integer, text, text, text, boolean, timestamptz) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.pause_for_credits(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.resume_after_credits(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_account_plan(uuid, text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.reset_unbilled_credits() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.credits_exhausted(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.billing_owner_of(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.charge_new_contact() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.enforce_plan_limits() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.spend_credits(uuid, integer, text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.refund_credits(uuid, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.grant_credits(uuid, integer, text, text, text, boolean, timestamptz) TO service_role;
GRANT EXECUTE ON FUNCTION public.pause_for_credits(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.resume_after_credits(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.set_account_plan(uuid, text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.reset_unbilled_credits() TO service_role;
GRANT EXECUTE ON FUNCTION public.credits_exhausted(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.billing_owner_of(uuid) TO service_role;

-- ── In-app notifications ────────────────────────────────────────────────────
-- Every notifications insert has failed since 19 Mar 2026: this trigger reads
-- the project URL and service key from app.settings / vault, neither is set,
-- and net.http_post rejected the NULL url, aborting the insert. Callers don't
-- check the error, so no in-app notification was saved. Now the notification
-- is always saved; the email is queued only when the settings exist.
CREATE OR REPLACE FUNCTION public.notify_email_on_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _supabase_url text;
  _service_role_key text;
BEGIN
  _supabase_url := current_setting('app.settings.supabase_url', true);
  _service_role_key := current_setting('app.settings.service_role_key', true);
  IF _supabase_url IS NULL THEN
    SELECT decrypted_secret INTO _supabase_url FROM vault.decrypted_secrets WHERE name = 'SUPABASE_URL' LIMIT 1;
  END IF;
  IF _service_role_key IS NULL THEN
    SELECT decrypted_secret INTO _service_role_key FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY' LIMIT 1;
  END IF;
  IF _supabase_url IS NULL OR _service_role_key IS NULL THEN
    RETURN NEW;
  END IF;
  BEGIN
    PERFORM net.http_post(
      url := _supabase_url || '/functions/v1/send-notification-email',
      headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || _service_role_key),
      body := jsonb_build_object('record', jsonb_build_object(
        'user_id', NEW.user_id, 'title', NEW.title, 'body', NEW.body, 'link', NEW.link, 'type', NEW.type))
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'notify_email_on_insert: email not queued: %', SQLERRM;
  END;
  RETURN NEW;
END;
$$;

-- ── Hand-granted Creem plans (period end far in the future) become Pro ─────

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT DISTINCT s.user_id FROM public.subscriptions s
    WHERE s.status IN ('active', 'trialing') AND s.current_period_end > now() + interval '5 years'
  LOOP
    PERFORM public.set_account_plan(r.user_id, 'pro', 'manual');
  END LOOP;
END
$$;
SELECT public.reset_unbilled_credits();

-- Daily monthly-reset run for legacy/manual plans.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron')
     AND NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'reset-unbilled-credits') THEN
    PERFORM cron.schedule('reset-unbilled-credits', '17 3 * * *', 'SELECT public.reset_unbilled_credits()');
  END IF;
END
$$;

-- ── Billing events in app_events (content funnel migration) ────────────────

ALTER TABLE public.app_events DROP CONSTRAINT IF EXISTS app_events_event_check;
-- (The only DROP in this file: a CHECK constraint can't be widened in place.)
ALTER TABLE public.app_events ADD CONSTRAINT app_events_event_check CHECK (event IN (
  'content_view', 'guide_cta_view', 'guide_cta_submit', 'tryai_click', 'tryai_run',
  'signup', 'paywall_viewed', 'trial_cta_clicked', 'checkout_started', 'trial_started',
  'plan_picker_viewed', 'upgrade_clicked', 'subscription_active', 'credits_exhausted'
));

-- Browser-side events. subscription_active and credits_exhausted are written by
-- the server (service role) only, like signup.
CREATE OR REPLACE FUNCTION public.log_app_event(p_event text, p_props jsonb DEFAULT '{}'::jsonb, p_anon_id text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_props jsonb := COALESCE(p_props, '{}'::jsonb);
  v_anon text := CASE WHEN p_anon_id ~ '^[A-Za-z0-9-]{8,64}$' THEN p_anon_id END;
BEGIN
  IF p_event IS NULL OR p_event NOT IN (
    'content_view', 'guide_cta_view', 'guide_cta_submit', 'tryai_click', 'tryai_run',
    'paywall_viewed', 'trial_cta_clicked', 'checkout_started', 'trial_started',
    'plan_picker_viewed', 'upgrade_clicked'
  ) THEN
    RAISE EXCEPTION 'unknown event' USING ERRCODE = '22023';
  END IF;
  IF jsonb_typeof(v_props) <> 'object' OR octet_length(v_props::text) > 2048 THEN
    RAISE EXCEPTION 'props must be an object of at most 2 KB' USING ERRCODE = '22023';
  END IF;
  INSERT INTO public.app_events (user_id, anon_id, event, props)
  VALUES (auth.uid(), v_anon, p_event, v_props);
END;
$$;
