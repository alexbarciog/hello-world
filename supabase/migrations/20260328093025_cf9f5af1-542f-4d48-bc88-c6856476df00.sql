-- Add step tracking columns to campaign_connection_requests
ALTER TABLE public.campaign_connection_requests
  ADD COLUMN IF NOT EXISTS current_step integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS step_completed_at timestamp with time zone DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS chat_id text DEFAULT NULL;