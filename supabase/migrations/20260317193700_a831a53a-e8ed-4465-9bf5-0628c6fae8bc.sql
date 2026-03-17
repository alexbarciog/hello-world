
ALTER TABLE public.signal_agents
  ADD COLUMN icp_job_titles TEXT[] DEFAULT '{}',
  ADD COLUMN icp_locations TEXT[] DEFAULT '{}',
  ADD COLUMN icp_industries TEXT[] DEFAULT '{}',
  ADD COLUMN icp_company_types TEXT[] DEFAULT '{}',
  ADD COLUMN icp_company_sizes TEXT[] DEFAULT '{}',
  ADD COLUMN icp_exclude_keywords TEXT[] DEFAULT '{}',
  ADD COLUMN precision_mode TEXT DEFAULT 'discovery',
  ADD COLUMN signals_config JSONB DEFAULT '{}',
  ADD COLUMN leads_list_name TEXT DEFAULT NULL;
