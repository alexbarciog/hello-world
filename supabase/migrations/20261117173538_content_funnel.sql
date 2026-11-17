-- Content funnel: first-party events and signup attribution.
--
-- app_events      one row per tracked action (page view, guide form, /try-ai, signup).
--                 RLS on with no policies: nobody reads it through the API, and
--                 writes only go through log_app_event() / claim_signup_attribution().
-- profiles.signup_*  where a new account first landed (from localStorage ia_first_touch).
-- content_funnel_7d  per-page totals for the last 7 days (service role / SQL only).

CREATE TABLE IF NOT EXISTS public.app_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid NULL,
  anon_id text NULL,
  event text NOT NULL,
  props jsonb,
  CONSTRAINT app_events_event_check CHECK (event IN (
    'content_view', 'guide_cta_view', 'guide_cta_submit', 'tryai_click', 'tryai_run',
    'signup', 'paywall_viewed', 'trial_cta_clicked', 'checkout_started', 'trial_started'
  )),
  CONSTRAINT app_events_props_size CHECK (props IS NULL OR octet_length(props::text) <= 2048),
  CONSTRAINT app_events_anon_id_len CHECK (anon_id IS NULL OR length(anon_id) <= 64)
);

ALTER TABLE public.app_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.app_events FROM anon, authenticated;

CREATE INDEX IF NOT EXISTS app_events_created_at_idx ON public.app_events (created_at);
CREATE INDEX IF NOT EXISTS app_events_anon_id_idx ON public.app_events (anon_id) WHERE anon_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS app_events_user_id_idx ON public.app_events (user_id) WHERE user_id IS NOT NULL;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS signup_landing_path text,
  ADD COLUMN IF NOT EXISTS signup_referrer text,
  ADD COLUMN IF NOT EXISTS signup_utm jsonb;

-- Public write path for events. 'signup' is not accepted here: it is recorded
-- by claim_signup_attribution() for the signed-in user, so it can't be faked.
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
    'paywall_viewed', 'trial_cta_clicked', 'checkout_started', 'trial_started'
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

-- Called once by the browser after an account's first sign-in. Copies the
-- first-touch data onto the profile, records the 'signup' event and links the
-- visitor's earlier anonymous events to the new user. Only works within a day
-- of the account being created, and only once per user.
CREATE OR REPLACE FUNCTION public.claim_signup_attribution(p_first_touch jsonb DEFAULT '{}'::jsonb, p_anon_id text DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_created timestamptz;
  v_ft jsonb := COALESCE(p_first_touch, '{}'::jsonb);
  v_anon text := CASE WHEN p_anon_id ~ '^[A-Za-z0-9-]{8,64}$' THEN p_anon_id END;
  v_utm jsonb;
BEGIN
  IF v_uid IS NULL THEN
    RETURN false;
  END IF;
  PERFORM pg_advisory_xact_lock(hashtext('claim_signup_attribution:' || v_uid::text));
  IF EXISTS (SELECT 1 FROM public.app_events WHERE user_id = v_uid AND event = 'signup') THEN
    RETURN false;
  END IF;
  SELECT created_at INTO v_created FROM auth.users WHERE id = v_uid;
  IF v_created IS NULL OR v_created < now() - interval '1 day' THEN
    RETURN false;
  END IF;
  IF jsonb_typeof(v_ft) <> 'object' OR octet_length(v_ft::text) > 2048 THEN
    v_ft := '{}'::jsonb;
  END IF;

  v_utm := jsonb_strip_nulls(jsonb_build_object(
    'utm_source', left(v_ft->>'utm_source', 120),
    'utm_medium', left(v_ft->>'utm_medium', 120),
    'utm_campaign', left(v_ft->>'utm_campaign', 120),
    'utm_content', left(v_ft->>'utm_content', 120)
  ));

  UPDATE public.profiles
  SET signup_landing_path = left(v_ft->>'landing_path', 300),
      signup_referrer = left(v_ft->>'referrer_host', 255),
      signup_utm = NULLIF(v_utm, '{}'::jsonb)
  WHERE user_id = v_uid
    AND signup_landing_path IS NULL AND signup_referrer IS NULL AND signup_utm IS NULL;

  INSERT INTO public.app_events (user_id, anon_id, event, props)
  VALUES (v_uid, v_anon, 'signup', jsonb_build_object('landing_path', left(v_ft->>'landing_path', 300)));

  IF v_anon IS NOT NULL THEN
    UPDATE public.app_events SET user_id = v_uid WHERE anon_id = v_anon AND user_id IS NULL;
  END IF;
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.log_app_event(text, jsonb, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.claim_signup_attribution(jsonb, text) FROM PUBLIC;
-- Supabase grants new functions to anon directly, not only through PUBLIC.
REVOKE EXECUTE ON FUNCTION public.claim_signup_attribution(jsonb, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.log_app_event(text, jsonb, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_signup_attribution(jsonb, text) TO authenticated;

-- One row per page for the last 7 days. Page events carry {path}; 'signup'
-- and 'tryai_run' carry the visitor's first landing page as {landing_path}.
CREATE OR REPLACE VIEW public.content_funnel_7d
WITH (security_invoker = true) AS
WITH ev AS (
  SELECT event, anon_id, COALESCE(props->>'path', props->>'landing_path') AS landing_path
  FROM public.app_events
  WHERE created_at >= now() - interval '7 days'
)
SELECT
  landing_path,
  count(*) FILTER (WHERE event = 'content_view') AS views,
  count(DISTINCT anon_id) FILTER (WHERE event = 'content_view') AS visitors,
  count(*) FILTER (WHERE event = 'guide_cta_view') AS guide_views,
  count(*) FILTER (WHERE event = 'guide_cta_submit') AS guide_submits,
  count(*) FILTER (WHERE event = 'tryai_click') AS tryai_clicks,
  count(*) FILTER (WHERE event = 'tryai_run') AS tryai_runs,
  count(*) FILTER (WHERE event = 'signup') AS signups
FROM ev
WHERE landing_path IS NOT NULL
GROUP BY landing_path
ORDER BY views DESC, signups DESC;

REVOKE ALL ON public.content_funnel_7d FROM anon, authenticated;
