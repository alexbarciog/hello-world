SELECT cron.unschedule(9);

SELECT cron.schedule(
  'poll-reddit-signals-morning',
  '0 8 * * *',
  $$
  SELECT net.http_post(
    url:='https://uwwajlezgeurnvvrvdvb.supabase.co/functions/v1/poll-reddit-signals',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3d2FqbGV6Z2V1cm52dnJ2ZHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3NjMxMzcsImV4cCI6MjA4OTMzOTEzN30.ceVF9PcMblbGAmAEqCwm9qOdtZfUxy_clBcTAW9VNLw"}'::jsonb,
    body:='{"cron": true}'::jsonb
  ) as request_id;
  $$
);

SELECT cron.schedule(
  'poll-reddit-signals-evening',
  '0 18 * * *',
  $$
  SELECT net.http_post(
    url:='https://uwwajlezgeurnvvrvdvb.supabase.co/functions/v1/poll-reddit-signals',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3d2FqbGV6Z2V1cm52dnJ2ZHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3NjMxMzcsImV4cCI6MjA4OTMzOTEzN30.ceVF9PcMblbGAmAEqCwm9qOdtZfUxy_clBcTAW9VNLw"}'::jsonb,
    body:='{"cron": true}'::jsonb
  ) as request_id;
  $$
);