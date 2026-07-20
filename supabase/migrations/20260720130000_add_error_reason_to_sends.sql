-- Surface WHY an invitation failed or was skipped. Previously the Unipile
-- error was only console-logged and rows were written as bare failed/skipped,
-- leaving users (and support) blind.
ALTER TABLE public.daily_scheduled_leads
  ADD COLUMN IF NOT EXISTS error_reason text;
ALTER TABLE public.campaign_connection_requests
  ADD COLUMN IF NOT EXISTS error_reason text;
