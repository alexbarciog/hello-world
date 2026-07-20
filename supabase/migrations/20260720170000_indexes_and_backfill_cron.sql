-- Performance indexes for the per-account LinkedIn budget checks that now run
-- on every send cycle, plus followups/scheduling hot paths.
CREATE INDEX IF NOT EXISTS idx_ccr_user_sent
  ON public.campaign_connection_requests (user_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_ccr_campaign_status_step
  ON public.campaign_connection_requests (campaign_id, status, current_step);
CREATE INDEX IF NOT EXISTS idx_sm_user_sent
  ON public.scheduled_messages (user_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_dsl_campaign_date_action
  ON public.daily_scheduled_leads (campaign_id, scheduled_date, action_type, status);

-- Nightly repair of contacts stored with internal-id LinkedIn URLs
-- (ACoAA…) — resolves them to public /in/{vanity} URLs via Unipile.
DO $do$
BEGIN
  PERFORM cron.unschedule('backfill-linkedin-urls-nightly');
EXCEPTION WHEN OTHERS THEN
  NULL;
END
$do$;

SELECT cron.schedule(
  'backfill-linkedin-urls-nightly',
  '0 3 * * *',
  $$
  SELECT net.http_post(
    url:='https://uwwajlezgeurnvvrvdvb.supabase.co/functions/v1/backfill-linkedin-urls',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3d2FqbGV6Z2V1cm52dnJ2ZHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3NjMxMzcsImV4cCI6MjA4OTMzOTEzN30.ceVF9PcMblbGAmAEqCwm9qOdtZfUxy_clBcTAW9VNLw"}'::jsonb,
    body:='{"time": "nightly"}'::jsonb
  ) as request_id;
  $$
);
