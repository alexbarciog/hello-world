select cron.schedule(
  'superscale-publish-every-minute',
  '* * * * *',
  $$select net.http_post(
    url:='https://uwwajlezgeurnvvrvdvb.supabase.co/functions/v1/superscale-publish-post',
    headers:='{"Content-Type": "application/json", "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3d2FqbGV6Z2V1cm52dnJ2ZHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3NjMxMzcsImV4cCI6MjA4OTMzOTEzN30.ceVF9PcMblbGAmAEqCwm9qOdtZfUxy_clBcTAW9VNLw"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;$$
);