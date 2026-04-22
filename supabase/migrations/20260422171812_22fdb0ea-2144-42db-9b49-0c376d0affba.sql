ALTER TABLE public.campaigns
ADD COLUMN IF NOT EXISTS services text[] NOT NULL DEFAULT '{}'::text[];