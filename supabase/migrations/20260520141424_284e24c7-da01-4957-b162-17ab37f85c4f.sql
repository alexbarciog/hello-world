ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS engagement_spikes_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS superscale_enabled boolean NOT NULL DEFAULT false;