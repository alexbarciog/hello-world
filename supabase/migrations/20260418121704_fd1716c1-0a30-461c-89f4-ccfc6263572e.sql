ALTER TABLE public.contacts 
  ADD COLUMN IF NOT EXISTS personality_prediction jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS personality_generated_at timestamp with time zone DEFAULT NULL;