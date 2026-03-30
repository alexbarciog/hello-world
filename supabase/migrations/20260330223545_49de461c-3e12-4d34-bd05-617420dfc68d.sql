ALTER TABLE public.campaign_connection_requests
  ADD COLUMN IF NOT EXISTS last_ai_reply_at timestamp with time zone DEFAULT NULL;