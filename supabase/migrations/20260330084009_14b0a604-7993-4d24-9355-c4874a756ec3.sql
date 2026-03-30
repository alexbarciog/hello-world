CREATE TABLE public.scheduled_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  connection_request_id uuid NOT NULL,
  step_index integer NOT NULL,
  message text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'generated',
  scheduled_for date NOT NULL DEFAULT CURRENT_DATE,
  generated_at timestamp with time zone NOT NULL DEFAULT now(),
  sent_at timestamp with time zone,
  edited_by_user boolean NOT NULL DEFAULT false,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(connection_request_id, step_index)
);

ALTER TABLE public.scheduled_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own scheduled_messages"
  ON public.scheduled_messages FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own scheduled_messages"
  ON public.scheduled_messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage scheduled_messages"
  ON public.scheduled_messages FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE INDEX idx_scheduled_messages_campaign ON public.scheduled_messages(campaign_id, scheduled_for);
CREATE INDEX idx_scheduled_messages_status ON public.scheduled_messages(status, scheduled_for);