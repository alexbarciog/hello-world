
-- Create daily_scheduled_leads table
CREATE TABLE public.daily_scheduled_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  user_id uuid NOT NULL,
  scheduled_date date NOT NULL DEFAULT CURRENT_DATE,
  action_type text NOT NULL,
  step_index integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'pending',
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, contact_id, scheduled_date, action_type)
);

-- RLS policies
ALTER TABLE public.daily_scheduled_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own scheduled leads"
  ON public.daily_scheduled_leads FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage scheduled leads"
  ON public.daily_scheduled_leads FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
