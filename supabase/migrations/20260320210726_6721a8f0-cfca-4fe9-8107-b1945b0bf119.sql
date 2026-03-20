
-- Schedule X signals polling: 09:00 UTC (1h after Reddit morning)
SELECT cron.schedule(
  'poll-x-signals-morning',
  '0 9 * * *',
  $$
  SELECT net.http_post(
    url := 'https://uwwajlezgeurnvvrvdvb.supabase.co/functions/v1/poll-x-signals',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3d2FqbGV6Z2V1cm52dnJ2ZHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3NjMxMzcsImV4cCI6MjA4OTMzOTEzN30.ceVF9PcMblbGAmAEqCwm9qOdtZfUxy_clBcTAW9VNLw"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- Schedule X signals polling: 19:00 UTC (1h after Reddit evening)
SELECT cron.schedule(
  'poll-x-signals-evening',
  '0 19 * * *',
  $$
  SELECT net.http_post(
    url := 'https://uwwajlezgeurnvvrvdvb.supabase.co/functions/v1/poll-x-signals',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3d2FqbGV6Z2V1cm52dnJ2ZHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3NjMxMzcsImV4cCI6MjA4OTMzOTEzN30.ceVF9PcMblbGAmAEqCwm9qOdtZfUxy_clBcTAW9VNLw"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
