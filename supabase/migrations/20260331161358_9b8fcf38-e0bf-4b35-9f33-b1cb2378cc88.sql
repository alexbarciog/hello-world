SELECT cron.unschedule('process-campaign-followups-run-1');
SELECT cron.unschedule('process-campaign-followups-run-2');
SELECT cron.unschedule('process-campaign-followups-run-3');
SELECT cron.unschedule('process-campaign-followups-run-4');
SELECT cron.unschedule('process-campaign-followups-run-5');

SELECT cron.schedule(
  'process-campaign-followups',
  '*/30 * * * *',
  $$
  SELECT net.http_post(
    url:='https://uwwajlezgeurnvvrvdvb.supabase.co/functions/v1/process-campaign-followups',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3d2FqbGV6Z2V1cm52dnJ2ZHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3NjMxMzcsImV4cCI6MjA4OTMzOTEzN30.ceVF9PcMblbGAmAEqCwm9qOdtZfUxy_clBcTAW9VNLw"}'::jsonb,
    body:='{"time": "scheduled"}'::jsonb
  ) as request_id;
  $$
);