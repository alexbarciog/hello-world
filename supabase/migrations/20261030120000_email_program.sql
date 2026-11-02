-- Epic 5b/5c: free-tool nurture and the weekly digest.

-- Marketing opt-out. Transactional email (receipts, trial ending) ignores it.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email_opt_out boolean NOT NULL DEFAULT false;

-- The report comes from our own server-side result (tool_cache), never from
-- what the browser sent, so the form can't be used to mail arbitrary text.
ALTER TABLE public.tool_leads
  ADD COLUMN IF NOT EXISTS report jsonb,
  ADD COLUMN IF NOT EXISTS unsubscribed_at timestamptz;

-- One row per nurture email, so a step can never go out twice.
CREATE TABLE IF NOT EXISTS public.tool_nurture_sends (
  lead_id uuid NOT NULL REFERENCES public.tool_leads(id) ON DELETE CASCADE,
  step integer NOT NULL CHECK (step IN (0, 2, 5)),
  resend_id text,
  sent_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (lead_id, step)
);
ALTER TABLE public.tool_nurture_sends ENABLE ROW LEVEL SECURITY;

-- One row per account per week, so a digest can never go out twice.
CREATE TABLE IF NOT EXISTS public.digest (
  account_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week date NOT NULL,
  payload jsonb NOT NULL,
  sent_at timestamptz,
  PRIMARY KEY (account_id, week)
);
ALTER TABLE public.digest ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins read digests" ON public.digest;
CREATE POLICY "Admins read digests" ON public.digest FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Same anonymised stats as Epic 4, with a configurable window ("this week").
DROP FUNCTION IF EXISTS public.buying_signal_stats(text[]);
CREATE OR REPLACE FUNCTION public.buying_signal_stats(_terms text[], _days integer DEFAULT 30)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH patterns AS (
    SELECT '%' || replace(replace(replace(lower(t), '\', '\\'), '%', '\%'), '_', '\_') || '%' AS p
    FROM unnest(_terms) AS t
    WHERE length(trim(t)) >= 3
    LIMIT 10
  ),
  matched AS (
    SELECT c.title
    FROM public.contacts c
    WHERE c.imported_at > now() - make_interval(days => least(greatest(_days, 1), 30))
      AND EXISTS (
        SELECT 1 FROM patterns
        WHERE lower(coalesce(c.signal, '') || ' ' || coalesce(c.signal_post_excerpt, '')) LIKE patterns.p
      )
  ),
  roles AS (
    SELECT initcap(trim(title)) AS role, count(*) AS n
    FROM matched
    WHERE title IS NOT NULL AND length(trim(title)) BETWEEN 2 AND 60
    GROUP BY 1
    HAVING count(*) >= 3
    ORDER BY n DESC
    LIMIT 5
  )
  SELECT jsonb_build_object(
    'count', CASE WHEN (SELECT count(*) FROM matched) >= 10 THEN (SELECT count(*) FROM matched) END,
    'roles', coalesce((SELECT jsonb_agg(role) FROM roles), '[]'::jsonb)
  );
$$;
REVOKE ALL ON FUNCTION public.buying_signal_stats(text[], integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.buying_signal_stats(text[], integer) TO service_role;

-- Runs every 15 minutes. Does nothing until EMAIL_NURTURE_ENABLED /
-- EMAIL_DIGEST_ENABLED are set, so merging can't mass-mail anyone.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'email-scheduler') THEN
    PERFORM cron.unschedule('email-scheduler');
  END IF;
END $$;
SELECT cron.schedule(
  'email-scheduler',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url:='https://uwwajlezgeurnvvrvdvb.supabase.co/functions/v1/email-scheduler',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3d2FqbGV6Z2V1cm52dnJ2ZHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3NjMxMzcsImV4cCI6MjA4OTMzOTEzN30.ceVF9PcMblbGAmAEqCwm9qOdtZfUxy_clBcTAW9VNLw"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);
