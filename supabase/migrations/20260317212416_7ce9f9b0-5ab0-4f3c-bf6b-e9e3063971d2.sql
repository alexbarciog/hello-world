
-- 1. Profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  onboarding_complete boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 2. Campaigns table
CREATE TABLE public.campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id text,
  company_name text,
  website text,
  description text,
  industry text,
  language text,
  country text,
  linkedin_connection_type text,
  icp_job_titles text[] DEFAULT '{}',
  icp_locations text[] DEFAULT '{}',
  icp_industries text[] DEFAULT '{}',
  icp_company_types text[] DEFAULT '{}',
  icp_company_sizes text[] DEFAULT '{}',
  icp_exclude_keywords text[] DEFAULT '{}',
  precision_mode text DEFAULT 'discovery',
  engagement_keywords text[] DEFAULT '{}',
  trigger_top_active boolean DEFAULT false,
  trigger_job_changes boolean DEFAULT false,
  trigger_funded_companies boolean DEFAULT false,
  influencer_profiles text[] DEFAULT '{}',
  competitor_pages text[] DEFAULT '{}',
  pain_points text[] DEFAULT '{}',
  campaign_goal text,
  message_tone text,
  status text NOT NULL DEFAULT 'draft',
  current_step integer DEFAULT 1,
  step_1_data jsonb,
  step_2_data jsonb,
  step_3_data jsonb,
  step_4_data jsonb,
  step_5_data jsonb,
  step_6_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

-- Allow read/write by session_id (for anonymous onboarding) or by user_id
CREATE POLICY "Anyone can read campaigns by session_id" ON public.campaigns FOR SELECT USING (true);
CREATE POLICY "Anyone can insert campaigns" ON public.campaigns FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update campaigns" ON public.campaigns FOR UPDATE USING (true);

-- 3. Leads table
CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  title text,
  company text,
  company_size text,
  industry text,
  location text,
  score integer DEFAULT 0,
  precision_tier text DEFAULT 'discovery',
  signal_a_hit boolean DEFAULT false,
  signal_b_hit boolean DEFAULT false,
  signal_c_hit boolean DEFAULT false,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read leads" ON public.leads FOR SELECT USING (true);
CREATE POLICY "Anyone can insert leads" ON public.leads FOR INSERT WITH CHECK (true);

-- 4. Contacts table
CREATE TABLE public.contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  first_name text NOT NULL,
  last_name text,
  linkedin_url text,
  title text,
  company text,
  company_icon_color text,
  signal text,
  ai_score integer DEFAULT 0,
  signal_a_hit boolean DEFAULT false,
  signal_b_hit boolean DEFAULT false,
  signal_c_hit boolean DEFAULT false,
  email text,
  email_enriched boolean DEFAULT false,
  list_name text,
  imported_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own contacts" ON public.contacts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own contacts" ON public.contacts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own contacts" ON public.contacts FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own contacts" ON public.contacts FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 5. Signal Agents table
CREATE TABLE public.signal_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL DEFAULT 'My Agent',
  agent_type text NOT NULL DEFAULT 'signals',
  keywords text[] DEFAULT '{}',
  status text NOT NULL DEFAULT 'active',
  results_count integer NOT NULL DEFAULT 0,
  last_launched_at timestamptz,
  next_launch_at timestamptz,
  icp_job_titles text[] DEFAULT '{}',
  icp_locations text[] DEFAULT '{}',
  icp_industries text[] DEFAULT '{}',
  icp_company_types text[] DEFAULT '{}',
  icp_company_sizes text[] DEFAULT '{}',
  icp_exclude_keywords text[] DEFAULT '{}',
  precision_mode text DEFAULT 'discovery',
  signals_config jsonb DEFAULT '{}',
  leads_list_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.signal_agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own agents" ON public.signal_agents FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own agents" ON public.signal_agents FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own agents" ON public.signal_agents FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own agents" ON public.signal_agents FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_campaigns_updated_at BEFORE UPDATE ON public.campaigns FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_signal_agents_updated_at BEFORE UPDATE ON public.signal_agents FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
