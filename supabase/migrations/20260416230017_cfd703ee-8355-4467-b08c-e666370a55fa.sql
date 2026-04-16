ALTER TABLE public.signal_agent_tasks
  ADD COLUMN IF NOT EXISTS payload jsonb,
  ADD COLUMN IF NOT EXISTS available_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS lease_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS attempt_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_heartbeat_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_signal_agent_tasks_queue
  ON public.signal_agent_tasks (status, available_at)
  WHERE status IN ('pending', 'running');

CREATE INDEX IF NOT EXISTS idx_signal_agent_tasks_run_id
  ON public.signal_agent_tasks (run_id);