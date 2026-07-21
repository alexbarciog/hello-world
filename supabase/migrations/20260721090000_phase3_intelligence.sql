-- Phase 3 intelligence: reply-outcome learning columns + weekly keyword review.
ALTER TABLE public.campaign_connection_requests
  ADD COLUMN IF NOT EXISTS reply_sentiment text,
  ADD COLUMN IF NOT EXISTS last_reply_excerpt text;

-- Weekly keyword performance review (Monday 06:00 UTC): notifies agent owners
-- about keywords that produce only rejected leads. Non-destructive.
DO $do$
BEGIN
  PERFORM cron.unschedule('keyword-performance-review-weekly');
EXCEPTION WHEN OTHERS THEN
  NULL;
END
$do$;

SELECT cron.schedule(
  'keyword-performance-review-weekly',
  '0 6 * * 1',
  $$
  SELECT net.http_post(
    url:='https://uwwajlezgeurnvvrvdvb.supabase.co/functions/v1/keyword-performance-review',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3d2FqbGV6Z2V1cm52dnJ2ZHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3NjMxMzcsImV4cCI6MjA4OTMzOTEzN30.ceVF9PcMblbGAmAEqCwm9qOdtZfUxy_clBcTAW9VNLw"}'::jsonb,
    body:='{"time": "weekly"}'::jsonb
  ) as request_id;
  $$
);
