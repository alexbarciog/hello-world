SELECT cron.unschedule('send-connection-requests-run-1');
SELECT cron.unschedule('send-connection-requests-run-2');
SELECT cron.unschedule('send-connection-requests-run-3');
SELECT cron.unschedule('send-connection-requests-run-4');
SELECT cron.unschedule('send-connection-requests-run-5');

SELECT cron.schedule(
  'send-connection-requests',
  '*/30 * * * *',
  $$
  SELECT net.http_post(
    url:='https://uwwajlezgeurnvvrvdvb.supabase.co/functions/v1/send-connection-requests',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3d2FqbGV6Z2V1cm52dnJ2ZHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3NjMxMzcsImV4cCI6MjA4OTMzOTEzN30.ceVF9PcMblbGAmAEqCwm9qOdtZfUxy_clBcTAW9VNLw"}'::jsonb,
    body:='{"time": "scheduled"}'::jsonb
  ) as request_id;
  $$
);