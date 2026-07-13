ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS source text,
  ADD COLUMN IF NOT EXISTS x_url text;

CREATE INDEX IF NOT EXISTS contacts_source_idx ON public.contacts(source);