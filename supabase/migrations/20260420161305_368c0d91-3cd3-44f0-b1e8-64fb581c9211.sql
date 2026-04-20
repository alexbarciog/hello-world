ALTER TABLE public.signal_agents
  ADD COLUMN IF NOT EXISTS icp_restricted_countries text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS icp_restricted_roles text[] DEFAULT '{}'::text[];

ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS icp_restricted_countries text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS icp_restricted_roles text[] DEFAULT '{}'::text[];