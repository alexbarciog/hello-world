
-- Table to track individual connection requests sent per campaign
CREATE TABLE public.campaign_connection_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  unipile_request_id text,
  sent_at timestamp with time zone NOT NULL DEFAULT now(),
  accepted_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, contact_id)
);

-- RLS policies
ALTER TABLE public.campaign_connection_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own connection requests"
  ON public.campaign_connection_requests FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own connection requests"
  ON public.campaign_connection_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own connection requests"
  ON public.campaign_connection_requests FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage connection requests"
  ON public.campaign_connection_requests FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Add daily_connect_limit to campaigns (default 25)
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS daily_connect_limit integer NOT NULL DEFAULT 25;
