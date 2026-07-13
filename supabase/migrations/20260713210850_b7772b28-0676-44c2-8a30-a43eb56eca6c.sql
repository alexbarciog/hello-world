
ALTER TABLE public.scheduled_messages
  ADD COLUMN IF NOT EXISTS channel text NOT NULL DEFAULT 'linkedin',
  ADD COLUMN IF NOT EXISTS subject text,
  ADD COLUMN IF NOT EXISTS skip_reason text;

CREATE INDEX IF NOT EXISTS idx_scheduled_messages_channel
  ON public.scheduled_messages(channel);
