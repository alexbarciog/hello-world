
SELECT cron.schedule(
  'process-campaign-followups-run-1',
  '0 9 * * *',
  $$
  SELECT net.http_post(
    url:='https://uwwajlezgeurnvvrvdvb.supabase.co/functions/v1/process-campaign-followups',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3d2FqbGV6Z2V1cm52dnJ2ZHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3NjMxMzcsImV4cCI6MjA4OTMzOTEzN30.ceVF9PcMblbGAmAEqCwm9qOdtZfUxy_clBcTAW9VNLw"}'::jsonb,
    body:='{"time": "run1"}'::jsonb
  ) as request_id;
  $$
);

SELECT cron.schedule(
  'process-campaign-followups-run-2',
  '0 11 * * *',
  $$
  SELECT net.http_post(
    url:='https://uwwajlezgeurnvvrvdvb.supabase.co/functions/v1/process-campaign-followups',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3d2FqbGV6Z2V1cm52dnJ2ZHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3NjMxMzcsImV4cCI6MjA4OTMzOTEzN30.ceVF9PcMblbGAmAEqCwm9qOdtZfUxy_clBcTAW9VNLw"}'::jsonb,
    body:='{"time": "run2"}'::jsonb
  ) as request_id;
  $$
);

SELECT cron.schedule(
  'process-campaign-followups-run-3',
  '0 13 * * *',
  $$
  SELECT net.http_post(
    url:='https://uwwajlezgeurnvvrvdvb.supabase.co/functions/v1/process-campaign-followups',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3d2FqbGV6Z2V1cm52dnJ2ZHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3NjMxMzcsImV4cCI6MjA4OTMzOTEzN30.ceVF9PcMblbGAmAEqCwm9qOdtZfUxy_clBcTAW9VNLw"}'::jsonb,
    body:='{"time": "run3"}'::jsonb
  ) as request_id;
  $$
);

SELECT cron.schedule(
  'process-campaign-followups-run-4',
  '0 15 * * *',
  $$
  SELECT net.http_post(
    url:='https://uwwajlezgeurnvvrvdvb.supabase.co/functions/v1/process-campaign-followups',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3d2FqbGV6Z2V1cm52dnJ2ZHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3NjMxMzcsImV4cCI6MjA4OTMzOTEzN30.ceVF9PcMblbGAmAEqCwm9qOdtZfUxy_clBcTAW9VNLw"}'::jsonb,
    body:='{"time": "run4"}'::jsonb
  ) as request_id;
  $$
);

SELECT cron.schedule(
  'process-campaign-followups-run-5',
  '0 17 * * *',
  $$
  SELECT net.http_post(
    url:='https://uwwajlezgeurnvvrvdvb.supabase.co/functions/v1/process-campaign-followups',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3d2FqbGV6Z2V1cm52dnJ2ZHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3NjMxMzcsImV4cCI6MjA4OTMzOTEzN30.ceVF9PcMblbGAmAEqCwm9qOdtZfUxy_clBcTAW9VNLw"}'::jsonb,
    body:='{"time": "run5"}'::jsonb
  ) as request_id;
  $$
);
