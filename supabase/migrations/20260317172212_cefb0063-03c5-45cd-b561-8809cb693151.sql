
CREATE TABLE public.campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  website text,
  company_name text,
  description text,
  industry text,
  language text,
  country text,
  linkedin_connection_type text,
  icp_job_titles text[],
  icp_locations text[],
  icp_industries text[],
  icp_company_types text[],
  icp_company_sizes text[],
  icp_exclude_keywords text[],
  precision_mode text,
  engagement_keywords text[],
  trigger_top_active boolean DEFAULT true,
  trigger_job_changes boolean DEFAULT true,
  trigger_funded_companies boolean DEFAULT false,
  influencer_profiles text[],
  competitor_pages text[],
  pain_points text,
  campaign_goal text,
  message_tone text
);

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert" ON public.campaigns FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select" ON public.campaigns FOR SELECT USING (true);
