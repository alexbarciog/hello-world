ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS intent_insights jsonb,
  ADD COLUMN IF NOT EXISTS intent_insights_generated_at timestamptz;