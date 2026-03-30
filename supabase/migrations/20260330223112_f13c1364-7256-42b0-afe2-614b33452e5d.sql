ALTER TABLE public.campaigns 
  ADD COLUMN IF NOT EXISTS conversational_ai boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS max_ai_replies integer NOT NULL DEFAULT 5;

-- Track AI replies count per connection request  
ALTER TABLE public.campaign_connection_requests
  ADD COLUMN IF NOT EXISTS ai_replies_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_incoming_message_at timestamp with time zone DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS conversation_stopped boolean NOT NULL DEFAULT false;