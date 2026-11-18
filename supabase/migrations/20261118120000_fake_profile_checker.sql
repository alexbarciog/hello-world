-- Fake LinkedIn Profile Checker (/fake-linkedin-profile-checker).
--
-- fake_profile_checks   one row per check. Written only by the edge functions
--                       (service role). Signed-in users can read their own rows.
--                       No raw scrape is stored: only the scored signals.
-- fpc_* events          added to app_events (content funnel migration).
-- fake_profile_checker_funnel_7d   views → submits → results → unlock clicks → signups → report views.
-- Unclaimed checks are deleted after 30 days (pg_cron).

CREATE TABLE IF NOT EXISTS public.fake_profile_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  linkedin_url text NOT NULL,
  url_hash text NOT NULL,
  ip_hash text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'done', 'failed')),
  risk_score integer CHECK (risk_score IS NULL OR risk_score BETWEEN 0 AND 100),
  risk_level text CHECK (risk_level IS NULL OR risk_level IN ('low', 'medium', 'high')),
  low_confidence boolean,
  signals jsonb,
  top_signal jsonb,
  summary text,
  scrape_ok boolean,
  error text,
  source text,
  -- Set when the result was copied from an earlier check of the same URL (no new scrape).
  cached_from uuid
);

CREATE INDEX IF NOT EXISTS fake_profile_checks_ip_time ON public.fake_profile_checks (ip_hash, created_at DESC);
CREATE INDEX IF NOT EXISTS fake_profile_checks_user_time ON public.fake_profile_checks (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS fake_profile_checks_url_time ON public.fake_profile_checks (url_hash, created_at DESC);
CREATE INDEX IF NOT EXISTS fake_profile_checks_time ON public.fake_profile_checks (created_at DESC);

ALTER TABLE public.fake_profile_checks ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.fake_profile_checks FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.fake_profile_checks FROM authenticated;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'fake_profile_checks' AND policyname = 'Users read their own profile checks'
  ) THEN
    CREATE POLICY "Users read their own profile checks" ON public.fake_profile_checks
      FOR SELECT TO authenticated USING (user_id = auth.uid());
  END IF;
END
$$;

-- ── Events ──────────────────────────────────────────────────────────────────

ALTER TABLE public.app_events DROP CONSTRAINT IF EXISTS app_events_event_check;
ALTER TABLE public.app_events ADD CONSTRAINT app_events_event_check CHECK (event IN (
  'content_view', 'guide_cta_view', 'guide_cta_submit', 'tryai_click', 'tryai_run',
  'signup', 'paywall_viewed', 'trial_cta_clicked', 'checkout_started', 'trial_started',
  'plan_picker_viewed', 'upgrade_clicked', 'subscription_active', 'credits_exhausted',
  'fpc_view', 'fpc_submit', 'fpc_result', 'fpc_unlock_click', 'fpc_report_view', 'fpc_tryai_click'
));

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
    'plan_picker_viewed', 'upgrade_clicked',
    'fpc_view', 'fpc_submit', 'fpc_result', 'fpc_unlock_click', 'fpc_report_view', 'fpc_tryai_click'
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
REVOKE ALL ON FUNCTION public.log_app_event(text, jsonb, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_app_event(text, jsonb, text) TO anon, authenticated, service_role;

-- ── Funnel ──────────────────────────────────────────────────────────────────
-- Signups: accounts created within a day after a check they then claimed
-- (the unlock → register → report path), so it works with or without the
-- content-funnel attribution columns.
CREATE OR REPLACE VIEW public.fake_profile_checker_funnel_7d
WITH (security_invoker = true) AS
WITH ev AS (
  SELECT event FROM public.app_events
  WHERE created_at >= now() - interval '7 days' AND event LIKE 'fpc\_%'
),
signups AS (
  SELECT count(DISTINCT c.user_id) AS n
  FROM public.fake_profile_checks c
  JOIN public.profiles p ON p.user_id = c.user_id
  WHERE c.created_at >= now() - interval '7 days'
    AND p.created_at BETWEEN c.created_at AND c.created_at + interval '1 day'
)
SELECT
  (SELECT count(*) FROM ev WHERE event = 'fpc_view') AS views,
  (SELECT count(*) FROM ev WHERE event = 'fpc_submit') AS submits,
  (SELECT count(*) FROM ev WHERE event = 'fpc_result') AS results,
  (SELECT count(*) FROM ev WHERE event = 'fpc_unlock_click') AS unlock_clicks,
  (SELECT n FROM signups) AS signups,
  (SELECT count(*) FROM ev WHERE event = 'fpc_report_view') AS report_views,
  (SELECT count(*) FROM ev WHERE event = 'fpc_tryai_click') AS tryai_clicks,
  (SELECT count(*) FROM public.fake_profile_checks WHERE created_at >= now() - interval '7 days' AND status = 'done') AS checks_done,
  (SELECT count(*) FROM public.fake_profile_checks WHERE created_at >= now() - interval '7 days' AND cached_from IS NOT NULL) AS checks_from_cache;
REVOKE ALL ON public.fake_profile_checker_funnel_7d FROM anon, authenticated;

-- ── Retention ───────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron')
     AND NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'purge-unclaimed-profile-checks') THEN
    PERFORM cron.schedule(
      'purge-unclaimed-profile-checks', '41 4 * * *',
      $cron$DELETE FROM public.fake_profile_checks WHERE user_id IS NULL AND created_at < now() - interval '30 days'$cron$
    );
  END IF;
END
$$;
