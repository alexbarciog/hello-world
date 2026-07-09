
CREATE INDEX IF NOT EXISTS idx_contacts_user_lead_status
  ON public.contacts (user_id, lead_status);

CREATE INDEX IF NOT EXISTS idx_contacts_org_lead_status
  ON public.contacts (organization_id, lead_status);

CREATE INDEX IF NOT EXISTS idx_ccr_step_completed
  ON public.campaign_connection_requests (current_step, step_completed_at);

CREATE INDEX IF NOT EXISTS idx_ccr_status_campaign
  ON public.campaign_connection_requests (status, campaign_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON public.notifications (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_signal_agent_runs_status_started
  ON public.signal_agent_runs (status, started_at);

CREATE INDEX IF NOT EXISTS idx_signal_agent_runs_agent_started
  ON public.signal_agent_runs (agent_id, started_at DESC);
