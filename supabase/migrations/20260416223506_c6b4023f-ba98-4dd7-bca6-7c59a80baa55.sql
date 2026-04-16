-- Ensure pg_cron and pg_net are enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Drop existing reaper schedule if any
DO $$
DECLARE
  jid bigint;
BEGIN
  SELECT jobid INTO jid FROM cron.job WHERE jobname = 'reap-stuck-signal-runs';
  IF jid IS NOT NULL THEN PERFORM cron.unschedule(jid); END IF;
END $$;

-- Schedule reaper every minute
SELECT cron.schedule(
  'reap-stuck-signal-runs',
  '* * * * *',
  $cron$
  SELECT net.http_post(
    url := 'https://uwwajlezgeurnvvrvdvb.supabase.co/functions/v1/reap-stuck-runs',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3d2FqbGV6Z2V1cm52dnJ2ZHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3NjMxMzcsImV4cCI6MjA4OTMzOTEzN30.ceVF9PcMblbGAmAEqCwm9qOdtZfUxy_clBcTAW9VNLw"}'::jsonb,
    body := '{"trigger":"cron"}'::jsonb
  ) AS request_id;
  $cron$
);

-- Manually clean up the runs that are currently stuck
WITH stuck AS (
  SELECT id FROM signal_agent_runs
  WHERE status IN ('running','queued')
    AND started_at < now() - interval '5 minutes'
)
UPDATE signal_agent_tasks
SET status = 'failed',
    error = 'Reaped: stuck > 5min',
    completed_at = now()
WHERE run_id IN (SELECT id FROM stuck)
  AND status IN ('pending','running');

UPDATE signal_agent_runs r
SET status = CASE
      WHEN sub.done_count = sub.total_count AND sub.total_count > 0 THEN 'done'
      WHEN sub.done_count > 0 THEN 'partial'
      ELSE 'failed'
    END,
    total_leads = COALESCE(sub.total_leads, 0),
    completed_tasks = COALESCE(sub.done_count, 0),
    completed_at = now()
FROM (
  SELECT run_id,
         COUNT(*) FILTER (WHERE status = 'done') AS done_count,
         COUNT(*) AS total_count,
         SUM(COALESCE(leads_found, 0)) AS total_leads
  FROM signal_agent_tasks
  GROUP BY run_id
) sub
WHERE r.id = sub.run_id
  AND r.status IN ('running','queued')
  AND r.started_at < now() - interval '5 minutes';