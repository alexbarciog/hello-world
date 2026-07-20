-- schedule-daily-leads previously ran ONCE per day (00:05 UTC). If that single
-- run errored, raced a deploy, or leads arrived later in the day, campaigns sat
-- with an empty queue all day ("0 sent · 0 pending") with no retry.
--
-- The function is idempotent (counts what is already scheduled today and
-- upserts on conflict), so extra runs are safe. Add top-up runs 30 minutes
-- before each send window (send runs fire at 8, 10, 12, 14, 16 UTC).
DO $do$
BEGIN
  PERFORM cron.unschedule('schedule-daily-leads-topup');
EXCEPTION WHEN OTHERS THEN
  NULL; -- job didn't exist yet
END
$do$;

SELECT cron.schedule(
  'schedule-daily-leads-topup',
  '30 7,9,11,13,15 * * *',
  $$
  SELECT net.http_post(
    url:='https://uwwajlezgeurnvvrvdvb.supabase.co/functions/v1/schedule-daily-leads',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3d2FqbGV6Z2V1cm52dnJ2ZHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3NjMxMzcsImV4cCI6MjA4OTMzOTEzN30.ceVF9PcMblbGAmAEqCwm9qOdtZfUxy_clBcTAW9VNLw"}'::jsonb,
    body:='{"time": "topup"}'::jsonb
  ) as request_id;
  $$
);
