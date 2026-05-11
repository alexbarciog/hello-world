ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS default_spike_keywords text[] NOT NULL DEFAULT '{}';