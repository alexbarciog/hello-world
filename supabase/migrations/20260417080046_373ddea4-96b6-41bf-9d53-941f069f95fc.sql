ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS last_signal_at  timestamptz,
  ADD COLUMN IF NOT EXISTS signal_count    integer NOT NULL DEFAULT 1;

CREATE INDEX IF NOT EXISTS contacts_last_signal_at_idx
  ON public.contacts (user_id, last_signal_at DESC NULLS LAST);