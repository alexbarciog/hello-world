ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS linkedin_headline text,
  ADD COLUMN IF NOT EXISTS linkedin_about text,
  ADD COLUMN IF NOT EXISTS linkedin_experience jsonb,
  ADD COLUMN IF NOT EXISTS linkedin_education jsonb,
  ADD COLUMN IF NOT EXISTS linkedin_location text,
  ADD COLUMN IF NOT EXISTS linkedin_profile_fetched_at timestamptz;