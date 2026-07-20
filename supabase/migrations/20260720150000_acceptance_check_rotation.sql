-- Acceptance checking was capped at 30 rows per run: ~20 for invitations sent
-- in the last 24h plus the SAME oldest rows every run (oldest-first order, no
-- cursor). With a large pending backlog (440+ on some campaigns), invitations
-- in the middle were never checked — accepted connections went undetected and
-- follow-up messages never scheduled. This cursor lets each run pick the
-- least-recently-checked rows so the whole backlog rotates.
ALTER TABLE public.campaign_connection_requests
  ADD COLUMN IF NOT EXISTS last_acceptance_check_at timestamptz;
