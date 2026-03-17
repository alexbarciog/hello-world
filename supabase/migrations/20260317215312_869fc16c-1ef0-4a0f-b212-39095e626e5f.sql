
-- Add discovery_keywords to campaigns
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS discovery_keywords text[] DEFAULT '{}'::text[];

-- Add unipile_account_id to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS unipile_account_id text;

-- Add source_campaign_id and linkedin_profile_id to contacts
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS source_campaign_id uuid;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS linkedin_profile_id text;

-- Add unique constraint for deduplication
CREATE UNIQUE INDEX IF NOT EXISTS contacts_user_linkedin_unique ON public.contacts (user_id, linkedin_profile_id) WHERE linkedin_profile_id IS NOT NULL;
