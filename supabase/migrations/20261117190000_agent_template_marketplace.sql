-- Agent template marketplace: gallery metadata on agent_templates, "Request a
-- template" (template_requests), a usage count the apply functions keep, and
-- the public templates themselves.
-- Idempotent; uses guarded CREATE POLICY and CREATE OR REPLACE only.

-- ── Gallery columns ─────────────────────────────────────────────────────────
ALTER TABLE public.agent_templates ADD COLUMN IF NOT EXISTS tagline text;
ALTER TABLE public.agent_templates ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE public.agent_templates ADD COLUMN IF NOT EXISTS featured boolean DEFAULT false;
ALTER TABLE public.agent_templates ADD COLUMN IF NOT EXISTS color text;
-- Distinct accounts that applied the template ("Used by N teams", shown from 5).
ALTER TABLE public.agent_templates ADD COLUMN IF NOT EXISTS uses_count integer DEFAULT 0;

-- A usage recount isn't an edit: keep updated_at for real changes only.
CREATE OR REPLACE FUNCTION public.touch_agent_template()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF (to_jsonb(NEW) - 'uses_count' - 'updated_at') IS DISTINCT FROM (to_jsonb(OLD) - 'uses_count' - 'updated_at') THEN
    NEW.updated_at := now();
  END IF;
  IF NEW.config IS DISTINCT FROM OLD.config THEN
    NEW.version := OLD.version + 1;
  END IF;
  RETURN NEW;
END;
$$;

-- ── Usage count ─────────────────────────────────────────────────────────────
-- Called by supabase/functions/_shared/apply-template.ts (service role) after
-- each successful apply. Recounts instead of +1 so a team applying twice, or
-- "Switch template" back and forth, still counts once.
CREATE OR REPLACE FUNCTION public.refresh_template_uses(p_template_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.agent_templates t
  SET uses_count = (
    SELECT count(DISTINCT a.account_id)::int
    FROM public.template_applications a
    WHERE a.template_id = p_template_id
  )
  WHERE t.id = p_template_id;
$$;
REVOKE ALL ON FUNCTION public.refresh_template_uses(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.refresh_template_uses(uuid) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_template_uses(uuid) TO service_role;

UPDATE public.agent_templates t
SET uses_count = coalesce((
  SELECT count(DISTINCT a.account_id)::int FROM public.template_applications a WHERE a.template_id = t.id
), 0);

-- ── Request a template ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.template_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  text text NOT NULL CHECK (length(trim(text)) BETWEEN 1 AND 1000),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS template_requests_created_idx ON public.template_requests (created_at DESC);
ALTER TABLE public.template_requests ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'template_requests' AND policyname = 'Users add their own template requests'
  ) THEN
    CREATE POLICY "Users add their own template requests"
      ON public.template_requests FOR INSERT TO authenticated
      WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'template_requests' AND policyname = 'Admins read template requests'
  ) THEN
    CREATE POLICY "Admins read template requests"
      ON public.template_requests FOR SELECT TO authenticated
      USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END
$$;

-- ── Templates ───────────────────────────────────────────────────────────────
-- Every config passes validateTemplateConfig (src/test/agent-template-marketplace.test.ts).
-- Signals: keyword posts (written the way a buyer asks) and people engaging
-- with the customer's own posts. Job changes is left out: the agent runner
-- has no handler for it yet. Messages: the first is written by the AI from the
-- signal; the follow-up only uses {{first_name}}. 15 connection requests a day.

UPDATE public.agent_templates SET
  name = 'Software development agency',
  business_type = 'Software development agency',
  tagline = 'Finds founders and teams asking for an app, an MVP or a dev partner.',
  description = 'Watches LinkedIn for founders, product leads and small-business owners who say they need an app, an MVP, an internal tool or a new development team, then starts a LinkedIn conversation about their project.',
  category = 'software-it',
  icon = 'code',
  color = 'blue',
  featured = true,
  is_public = true,
  sort_order = 10,
  config = $json${
  "schema_version": 1,
  "agent": {
    "name": "Software development buyers",
    "icp_job_titles": [
      "Founder",
      "Co-Founder",
      "CEO",
      "CTO",
      "COO",
      "Owner",
      "Managing Director",
      "Head of Product",
      "Product Manager",
      "Head of Operations"
    ],
    "icp_locations": [],
    "icp_industries": [
      "SaaS",
      "Fintech",
      "AI & Machine Learning",
      "Cybersecurity",
      "Data Analytics",
      "Aerospace",
      "Agriculture",
      "Automotive",
      "Banking",
      "Education",
      "Healthcare",
      "Hospitality & Tourism",
      "Logistics & Supply Chain",
      "Manufacturing",
      "Transportation",
      "Travel"
    ],
    "icp_company_types": [
      "Startup",
      "SMB",
      "Mid-Market"
    ],
    "icp_company_sizes": [
      "1-10",
      "11-50",
      "51-200"
    ],
    "icp_exclude_keywords": [
      "Looking for new opportunities",
      "Open to work",
      "Intern",
      "Student",
      "Freelance",
      "Career transition"
    ],
    "icp_restricted_countries": [],
    "icp_restricted_roles": [],
    "ideal_lead_description": "The ideal lead is a person actively looking to have a website, web application, or mobile app built for them — either explicitly asking for help or showing clear pre-purchase signals. They are typically one of the following: a non-technical founder or aspiring founder with a validated idea seeking a development partner; a small business owner (local services, e-commerce, clinics, restaurants, real estate, coaches/consultants) whose business needs a new or rebuilt website; a startup that has outgrown a no-code MVP (Bubble, Webflow, Glide, FlutterFlow, Lovable) and needs custom development; or a marketing/ops lead at an SMB tasked with commissioning a site or app.",
    "precision_mode": "discovery",
    "signals_config": {
      "enabled": [
        "keyword_posts",
        "post_engagers"
      ],
      "keywords": {
        "keyword_posts": [
          "looking for a software agency",
          "software agency recommendations",
          "Does anyone know a good software agency",
          "Seeking recommendations for app development",
          "looking to build our app",
          "looking for a software developer to build our app",
          "building our MVP",
          "MVP development agency",
          "Looking for a dedicated team",
          "Remote dev team recommendations",
          "build internal tool",
          "we're building our own internal tool",
          "we're seeking a software developer",
          "we're evaluating software agencies",
          "we're looking to hire a developer in USA",
          "can anyone recommend a web developer",
          "rebuild our website",
          "redesign our website",
          "cost to build a website",
          "cost to build a mobile app",
          "cross-platform mobile app costs",
          "hiring a shopify developer"
        ]
      }
    },
    "manual_approval": false
  },
  "campaign": {
    "value_proposition": "",
    "pain_points": [
      "Idea or MVP with no one to build it",
      "Outgrown a no-code tool",
      "Bad experiences with freelancers"
    ],
    "campaign_goal": "conversations",
    "message_tone": "conversational",
    "language": "English",
    "custom_training": "",
    "workflow_steps": [
      {
        "type": "invitation",
        "delay_days": 0
      },
      {
        "type": "message",
        "delay_days": 1,
        "ai_icebreaker": true,
        "message": "",
        "step_instructions": "Open with the signal that found this lead: the app, MVP or tool they want built, or the post of ours they engaged with. Refer to it in your own words. Don't pitch, don't name our company, no links. One short question at most. Under 300 characters."
      },
      {
        "type": "message",
        "delay_days": 4,
        "message": "Hi {{first_name}}, coming back to this in case it's useful. We're a software development team and build web apps, mobile apps and internal tools, from a first version to ongoing work. If you're still choosing who to build with, happy to talk through scope and options. No pressure either way."
      }
    ],
    "daily_connect_limit": 15,
    "timezone": "UTC",
    "exclude_first_degree": true,
    "conversational_ai": true,
    "max_ai_replies": 10
  }
}$json$::jsonb
WHERE slug = 'software-development';

UPDATE public.agent_templates SET
  name = 'Web design agency',
  business_type = 'Web design agency',
  tagline = 'Finds teams planning a new website, a redesign or a rebrand.',
  description = 'Watches LinkedIn for founders and marketing leads who ask for a web designer, a Webflow, WordPress or Shopify developer, or help with a redesign, then opens a conversation about their site.',
  category = 'agencies',
  icon = 'palette',
  color = 'violet',
  featured = true,
  is_public = true,
  sort_order = 20,
  config = $json${
  "schema_version": 1,
  "agent": {
    "name": "Website redesign buyers",
    "icp_job_titles": [
      "Founder",
      "Co-Founder",
      "CEO",
      "Owner",
      "Head of Marketing",
      "Marketing Director",
      "Marketing Manager",
      "Brand Manager"
    ],
    "icp_locations": [],
    "icp_industries": [],
    "icp_company_types": [
      "Startup",
      "SMB"
    ],
    "icp_company_sizes": [
      "1-10",
      "11-50",
      "51-200"
    ],
    "icp_exclude_keywords": [
      "agency",
      "freelance",
      "Open to work",
      "Student"
    ],
    "icp_restricted_countries": [],
    "icp_restricted_roles": [],
    "ideal_lead_description": "A founder or marketing lead at a small or mid-size company who is planning a new website, a redesign or a rebrand.",
    "precision_mode": "discovery",
    "signals_config": {
      "enabled": [
        "keyword_posts",
        "post_engagers"
      ],
      "keywords": {
        "keyword_posts": [
          "looking for a web designer",
          "can anyone recommend a web designer",
          "recommend a web design agency",
          "need a new website",
          "website redesign",
          "redesigning our website",
          "need help with our website",
          "looking for a webflow developer",
          "looking for a wordpress developer",
          "looking for a shopify developer",
          "who built your website",
          "rebrand and new website"
        ]
      }
    },
    "manual_approval": false
  },
  "campaign": {
    "value_proposition": "",
    "pain_points": [
      "Outdated website that doesn't convert",
      "No time to manage a redesign",
      "Bad experiences with freelancers"
    ],
    "campaign_goal": "conversations",
    "message_tone": "conversational",
    "language": "English",
    "custom_training": "",
    "workflow_steps": [
      {
        "type": "invitation",
        "delay_days": 0
      },
      {
        "type": "message",
        "delay_days": 1,
        "ai_icebreaker": true,
        "message": "",
        "step_instructions": "Open with the signal that found this lead: the website, redesign or rebrand they posted about, or the post of ours they engaged with. Refer to it in your own words. Don't pitch, don't name our company, no links. One short question at most. Under 300 characters."
      },
      {
        "type": "message",
        "delay_days": 4,
        "message": "Hi {{first_name}}, following up in case it's useful. We design and build websites for small and mid-size teams, from a quick refresh to a full rebuild. If you're still comparing options, happy to share how we'd approach yours. No pressure either way."
      }
    ],
    "daily_connect_limit": 15,
    "timezone": "UTC",
    "exclude_first_degree": true,
    "conversational_ai": true,
    "max_ai_replies": 5
  }
}$json$::jsonb
WHERE slug = 'web-design-agency-example';

INSERT INTO public.agent_templates (slug, name, business_type, tagline, description, category, icon, color, featured, is_public, sort_order, config)
VALUES (
  'marketing-agency', 'Marketing agency', 'Marketing agency',
  'Finds teams asking for a marketing agency, a fractional CMO or help with ads and SEO.',
  'Watches LinkedIn for founders and marketing leads who ask for a marketing agency, a fractional CMO, or help with paid ads or SEO, then opens a conversation about what they need.',
  'agencies', 'megaphone', 'violet', true, true, 30,
  $json${
  "schema_version": 1,
  "agent": {
    "name": "Marketing help buyers",
    "icp_job_titles": [
      "Founder",
      "Co-Founder",
      "CEO",
      "Owner",
      "Head of Marketing",
      "Marketing Director",
      "VP of Marketing",
      "Head of Growth",
      "Marketing Manager"
    ],
    "icp_locations": [],
    "icp_industries": [],
    "icp_company_types": [
      "Startup",
      "SMB"
    ],
    "icp_company_sizes": [
      "1-10",
      "11-50",
      "51-200"
    ],
    "icp_exclude_keywords": [
      "Marketing Agency",
      "Freelance",
      "Open to work",
      "Student",
      "Intern"
    ],
    "icp_restricted_countries": [],
    "icp_restricted_roles": [],
    "ideal_lead_description": "A founder or marketing lead at a small or mid-size company who has posted that they need outside marketing help: an agency, a fractional CMO, or someone to run paid ads or SEO.",
    "precision_mode": "discovery",
    "signals_config": {
      "enabled": [
        "keyword_posts",
        "post_engagers"
      ],
      "keywords": {
        "keyword_posts": [
          "looking for a marketing agency",
          "can anyone recommend a marketing agency",
          "recommend a digital marketing agency",
          "looking for a fractional CMO",
          "anyone recommend a fractional CMO",
          "need help with paid ads",
          "looking for a google ads agency",
          "looking for someone to run our facebook ads",
          "need help with SEO",
          "can anyone recommend an SEO agency",
          "looking for a growth marketer",
          "we need help with marketing"
        ]
      }
    },
    "manual_approval": false
  },
  "campaign": {
    "value_proposition": "",
    "pain_points": [
      "Marketing that doesn't bring in leads",
      "No one in-house to run ads or SEO",
      "Bad experiences with agencies before"
    ],
    "campaign_goal": "conversations",
    "message_tone": "conversational",
    "language": "English",
    "custom_training": "",
    "workflow_steps": [
      {
        "type": "invitation",
        "delay_days": 0
      },
      {
        "type": "message",
        "delay_days": 1,
        "ai_icebreaker": true,
        "message": "",
        "step_instructions": "Open with the signal that found this lead: the marketing help they asked for (agency, fractional CMO, paid ads or SEO), or the post of ours they engaged with. Refer to it in your own words. Don't pitch, don't name our company, no links. One short question at most. Under 300 characters."
      },
      {
        "type": "message",
        "delay_days": 4,
        "message": "Hi {{first_name}}, following up in case it's useful. We're a marketing agency and work with teams on paid ads, SEO and content. If you're still deciding who to bring in, happy to share how we'd look at your situation. No pressure either way."
      }
    ],
    "daily_connect_limit": 15,
    "timezone": "UTC",
    "exclude_first_degree": true,
    "conversational_ai": false,
    "max_ai_replies": 5
  }
}$json$::jsonb
)
ON CONFLICT (slug) DO NOTHING;

UPDATE public.agent_templates SET
  name = 'Sales & lead-gen agency',
  business_type = 'Sales & lead-gen agency',
  tagline = 'Finds companies asking for help with lead generation or booking sales meetings.',
  description = 'Watches LinkedIn for founders and sales leaders who say they need more leads, an outbound partner or SDR help, then starts a LinkedIn conversation about their pipeline.',
  category = 'sales-lead-gen',
  icon = 'target',
  color = 'teal',
  featured = false,
  is_public = true,
  sort_order = 40,
  config = $json${
  "schema_version": 1,
  "agent": {
    "name": "Lead generation buyers",
    "icp_job_titles": [
      "Founder",
      "Co-Founder",
      "CEO",
      "Head of Sales",
      "VP of Sales",
      "Sales Director",
      "Head of Growth",
      "Head of Business Development",
      "Chief Revenue Officer (CRO)",
      "VP of Revenue Operations"
    ],
    "icp_locations": [
      "United States",
      "United Kingdom",
      "Germany",
      "France",
      "Canada",
      "Australia"
    ],
    "icp_industries": [
      "SaaS",
      "Technology",
      "Data Analytics",
      "AI & Machine Learning",
      "Fintech",
      "Marketing"
    ],
    "icp_company_types": [
      "Startup",
      "SMB",
      "Mid-Market"
    ],
    "icp_company_sizes": [
      "11-50",
      "51-200",
      "201-500"
    ],
    "icp_exclude_keywords": [
      "Intern",
      "Student",
      "Customer Support Representative",
      "Open to work"
    ],
    "icp_restricted_countries": [
      "India",
      "Pakistan",
      "Nigeria",
      "South Africa"
    ],
    "icp_restricted_roles": [],
    "ideal_lead_description": "A founder or sales leader at a B2B company who has posted that they need more leads, more sales meetings, an outbound or lead generation partner, or help hiring SDRs.",
    "precision_mode": "discovery",
    "signals_config": {
      "enabled": [
        "keyword_posts",
        "post_engagers"
      ],
      "keywords": {
        "keyword_posts": [
          "looking for a lead generation agency",
          "can anyone recommend a lead generation agency",
          "need help with lead generation",
          "looking for a lead generation partner",
          "looking for an outbound agency",
          "recommend an appointment setting agency",
          "looking for outsourced SDRs",
          "need more sales meetings",
          "i need to find some clients",
          "i need a few customers",
          "how do you get your first customers",
          "hiring our first SDR"
        ]
      }
    },
    "manual_approval": false
  },
  "campaign": {
    "value_proposition": "",
    "pain_points": [
      "Not enough qualified meetings",
      "No time or team for outbound",
      "Inbound has slowed down"
    ],
    "campaign_goal": "conversations",
    "message_tone": "conversational",
    "language": "English",
    "custom_training": "",
    "workflow_steps": [
      {
        "type": "invitation",
        "delay_days": 0
      },
      {
        "type": "message",
        "delay_days": 1,
        "ai_icebreaker": true,
        "message": "",
        "step_instructions": "Open with the signal that found this lead: the lead generation or pipeline problem they posted about, or the post of ours they engaged with. Refer to it in your own words. Don't pitch, don't name our company, no links. One short question at most. Under 300 characters."
      },
      {
        "type": "message",
        "delay_days": 4,
        "message": "Hi {{first_name}}, coming back to this in case it's useful. We run outbound for B2B teams: finding the right accounts, writing the outreach and booking meetings. If you're still working out how to fill the pipeline, happy to share how we'd approach it. No pressure either way."
      }
    ],
    "daily_connect_limit": 15,
    "timezone": "UTC",
    "exclude_first_degree": true,
    "conversational_ai": true,
    "max_ai_replies": 10
  }
}$json$::jsonb
WHERE slug = 'sales-agency-outreach';

INSERT INTO public.agent_templates (slug, name, business_type, tagline, description, category, icon, color, featured, is_public, sort_order, config)
VALUES (
  'recruitment-staffing-agency', 'Recruitment & staffing agency', 'Recruitment or staffing agency',
  'Finds founders hiring their first people or struggling to fill open roles.',
  'Watches LinkedIn for founders and hiring managers who post about hiring their first people, several open roles at once, or how hard hiring is, then starts a conversation about their hiring plans.',
  'recruiting', 'users', 'emerald', false, true, 50,
  $json${
  "schema_version": 1,
  "agent": {
    "name": "Hiring buyers",
    "icp_job_titles": [
      "Founder",
      "Co-Founder",
      "CEO",
      "COO",
      "CTO",
      "VP of Engineering",
      "Head of People",
      "HR Director",
      "Head of Talent",
      "Hiring Manager"
    ],
    "icp_locations": [],
    "icp_industries": [],
    "icp_company_types": [
      "Startup",
      "SMB",
      "Mid-Market"
    ],
    "icp_company_sizes": [
      "1-10",
      "11-50",
      "51-200",
      "201-500"
    ],
    "icp_exclude_keywords": [
      "Recruitment Agency",
      "Staffing",
      "Open to work",
      "Student"
    ],
    "icp_restricted_countries": [],
    "icp_restricted_roles": [],
    "ideal_lead_description": "A founder or hiring manager at a growing company who has posted about hiring their first people, several open roles at once, or struggling to find good candidates.",
    "precision_mode": "discovery",
    "signals_config": {
      "enabled": [
        "keyword_posts",
        "post_engagers"
      ],
      "keywords": {
        "keyword_posts": [
          "hiring our first",
          "we're hiring our first engineer",
          "looking to hire our first salesperson",
          "we have several open roles",
          "we're hiring for multiple roles",
          "hiring is so hard",
          "struggling to hire",
          "we can't find good candidates",
          "need help hiring",
          "can anyone recommend a recruiter",
          "looking for a recruitment agency",
          "recommend a tech recruiter"
        ]
      }
    },
    "manual_approval": false
  },
  "campaign": {
    "value_proposition": "",
    "pain_points": [
      "Roles open for months",
      "No in-house recruiter",
      "Founders spending their time on hiring"
    ],
    "campaign_goal": "conversations",
    "message_tone": "conversational",
    "language": "English",
    "custom_training": "",
    "workflow_steps": [
      {
        "type": "invitation",
        "delay_days": 0
      },
      {
        "type": "message",
        "delay_days": 1,
        "ai_icebreaker": true,
        "message": "",
        "step_instructions": "Open with the signal that found this lead: the roles they're hiring for or the hiring problem they posted about, or the post of ours they engaged with. Refer to it in your own words. Don't pitch, don't name our company, no links. One short question at most. Under 300 characters."
      },
      {
        "type": "message",
        "delay_days": 4,
        "message": "Hi {{first_name}}, following up in case it's useful. We're a recruitment agency and help growing teams fill the roles they're struggling to hire for. If you're still working through your open roles, happy to talk through what you're looking for. No pressure either way."
      }
    ],
    "daily_connect_limit": 15,
    "timezone": "UTC",
    "exclude_first_degree": true,
    "conversational_ai": false,
    "max_ai_replies": 5
  }
}$json$::jsonb
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.agent_templates (slug, name, business_type, tagline, description, category, icon, color, featured, is_public, sort_order, config)
VALUES (
  'it-consultancy-msp', 'IT consultancy / MSP', 'IT consultancy or MSP',
  'Finds companies asking for IT support, a cloud migration or security help.',
  'Watches LinkedIn for business owners and operations leads who ask for managed IT, help moving to the cloud or a security review, then starts a conversation about their setup.',
  'software-it', 'server', 'blue', false, true, 60,
  $json${
  "schema_version": 1,
  "agent": {
    "name": "IT support buyers",
    "icp_job_titles": [
      "Founder",
      "CEO",
      "Owner",
      "Managing Director",
      "COO",
      "Operations Director",
      "Head of Operations",
      "Office Manager",
      "CTO",
      "IT Manager"
    ],
    "icp_locations": [],
    "icp_industries": [],
    "icp_company_types": [
      "SMB",
      "Mid-Market"
    ],
    "icp_company_sizes": [
      "11-50",
      "51-200",
      "201-500"
    ],
    "icp_exclude_keywords": [
      "MSP",
      "Managed Services",
      "Open to work",
      "Student"
    ],
    "icp_restricted_countries": [],
    "icp_restricted_roles": [],
    "ideal_lead_description": "An owner or operations lead at a small or mid-size company who has posted that they need IT support, a managed IT provider, help moving to the cloud or help with security.",
    "precision_mode": "discovery",
    "signals_config": {
      "enabled": [
        "keyword_posts",
        "post_engagers"
      ],
      "keywords": {
        "keyword_posts": [
          "looking for an IT support company",
          "can anyone recommend a managed IT provider",
          "recommend an MSP",
          "need help with IT support",
          "looking for outsourced IT",
          "our IT provider is not responsive",
          "need help with cloud migration",
          "moving to Azure",
          "migrating to AWS help",
          "looking for a Microsoft 365 partner",
          "need help with cyber security",
          "recommend an IT consultant"
        ]
      }
    },
    "manual_approval": false
  },
  "campaign": {
    "value_proposition": "",
    "pain_points": [
      "Slow or unresponsive IT support",
      "Cloud migration without in-house skills",
      "Security worries and no one owning them"
    ],
    "campaign_goal": "conversations",
    "message_tone": "conversational",
    "language": "English",
    "custom_training": "",
    "workflow_steps": [
      {
        "type": "invitation",
        "delay_days": 0
      },
      {
        "type": "message",
        "delay_days": 1,
        "ai_icebreaker": true,
        "message": "",
        "step_instructions": "Open with the signal that found this lead: the IT, cloud or security help they asked for, or the post of ours they engaged with. Refer to it in your own words. Don't pitch, don't name our company, no links. One short question at most. Under 300 characters."
      },
      {
        "type": "message",
        "delay_days": 4,
        "message": "Hi {{first_name}}, following up in case it's useful. We provide IT support plus cloud and security projects for small and mid-size companies. If you're still looking for help, happy to ask a few questions about your setup and suggest a next step. No pressure either way."
      }
    ],
    "daily_connect_limit": 15,
    "timezone": "UTC",
    "exclude_first_degree": true,
    "conversational_ai": false,
    "max_ai_replies": 5
  }
}$json$::jsonb
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.agent_templates (slug, name, business_type, tagline, description, category, icon, color, featured, is_public, sort_order, config)
VALUES (
  'video-production-studio', 'Video production studio', 'Video production studio',
  'Finds teams asking for product videos, brand films or event filming.',
  'Watches LinkedIn for marketing and brand leads who ask for a video production company, a product video, a brand film or someone to film an event, then opens a conversation about the project.',
  'creative-content', 'video', 'rose', false, true, 70,
  $json${
  "schema_version": 1,
  "agent": {
    "name": "Video project buyers",
    "icp_job_titles": [
      "Founder",
      "CEO",
      "Head of Marketing",
      "Marketing Director",
      "VP of Marketing",
      "Brand Manager",
      "Content Marketing Manager",
      "Communications Director",
      "Event Manager"
    ],
    "icp_locations": [],
    "icp_industries": [],
    "icp_company_types": [
      "Startup",
      "SMB",
      "Mid-Market",
      "Enterprise"
    ],
    "icp_company_sizes": [
      "11-50",
      "51-200",
      "201-500",
      "501-1000"
    ],
    "icp_exclude_keywords": [
      "Videographer",
      "Freelance",
      "Open to work",
      "Student"
    ],
    "icp_restricted_countries": [],
    "icp_restricted_roles": [],
    "ideal_lead_description": "A marketing, brand or events lead who has posted that they need a video made: a product or explainer video, a brand film, or filming at an event.",
    "precision_mode": "discovery",
    "signals_config": {
      "enabled": [
        "keyword_posts",
        "post_engagers"
      ],
      "keywords": {
        "keyword_posts": [
          "looking for a video production company",
          "can anyone recommend a videographer",
          "recommend a video production agency",
          "need a product video",
          "looking for someone to make an explainer video",
          "need a brand video",
          "need a promo video",
          "looking for a videographer for our event",
          "need event filming",
          "recommend a corporate video company",
          "looking for help with video content",
          "who made your product video"
        ]
      }
    },
    "manual_approval": false
  },
  "campaign": {
    "value_proposition": "",
    "pain_points": [
      "No in-house video skills",
      "Tight deadline for a launch or event",
      "Past videos that didn't look professional"
    ],
    "campaign_goal": "conversations",
    "message_tone": "conversational",
    "language": "English",
    "custom_training": "",
    "workflow_steps": [
      {
        "type": "invitation",
        "delay_days": 0
      },
      {
        "type": "message",
        "delay_days": 1,
        "ai_icebreaker": true,
        "message": "",
        "step_instructions": "Open with the signal that found this lead: the video they need (product video, brand film or event), or the post of ours they engaged with. Refer to it in your own words. Don't pitch, don't name our company, no links. One short question at most. Under 300 characters."
      },
      {
        "type": "message",
        "delay_days": 4,
        "message": "Hi {{first_name}}, following up in case it's useful. We're a video production studio and make product videos, brand films and event videos. If you're still looking for someone for the project, happy to talk through ideas and rough options. No pressure either way."
      }
    ],
    "daily_connect_limit": 15,
    "timezone": "UTC",
    "exclude_first_degree": true,
    "conversational_ai": false,
    "max_ai_replies": 5
  }
}$json$::jsonb
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.agent_templates (slug, name, business_type, tagline, description, category, icon, color, featured, is_public, sort_order, config)
VALUES (
  'b2b-copywriting-studio', 'B2B copywriter & content studio', 'B2B copywriter or content studio',
  'Finds teams asking for a copywriter, website copy or a content writer.',
  'Watches LinkedIn for founders and marketing leads who ask for a B2B copywriter, help with website copy or a regular content writer, then starts a conversation about what they need written.',
  'creative-content', 'pen', 'rose', false, true, 80,
  $json${
  "schema_version": 1,
  "agent": {
    "name": "Copy and content buyers",
    "icp_job_titles": [
      "Founder",
      "Co-Founder",
      "CEO",
      "Head of Marketing",
      "Marketing Director",
      "Marketing Manager",
      "Content Marketing Manager",
      "Head of Content",
      "Product Marketing Manager"
    ],
    "icp_locations": [],
    "icp_industries": [],
    "icp_company_types": [
      "Startup",
      "SMB"
    ],
    "icp_company_sizes": [
      "1-10",
      "11-50",
      "51-200"
    ],
    "icp_exclude_keywords": [
      "Copywriter",
      "Freelance Writer",
      "Open to work",
      "Student"
    ],
    "icp_restricted_countries": [],
    "icp_restricted_roles": [],
    "ideal_lead_description": "A founder or marketing lead at a B2B company who has posted that they need a copywriter, new website copy, case studies or a regular content writer.",
    "precision_mode": "discovery",
    "signals_config": {
      "enabled": [
        "keyword_posts",
        "post_engagers"
      ],
      "keywords": {
        "keyword_posts": [
          "looking for a copywriter",
          "can anyone recommend a B2B copywriter",
          "recommend a SaaS copywriter",
          "need help with website copy",
          "looking for someone to rewrite our website",
          "our website copy is not converting",
          "looking for a content writer",
          "need a writer for our blog",
          "looking for a content agency",
          "need help with case studies",
          "recommend a ghostwriter for LinkedIn",
          "looking for a freelance writer"
        ]
      }
    },
    "manual_approval": false
  },
  "campaign": {
    "value_proposition": "",
    "pain_points": [
      "Website copy that doesn't explain the product",
      "No time to write content",
      "Publishing is inconsistent"
    ],
    "campaign_goal": "conversations",
    "message_tone": "conversational",
    "language": "English",
    "custom_training": "",
    "workflow_steps": [
      {
        "type": "invitation",
        "delay_days": 0
      },
      {
        "type": "message",
        "delay_days": 1,
        "ai_icebreaker": true,
        "message": "",
        "step_instructions": "Open with the signal that found this lead: the writing help they asked for (copy, content or case studies), or the post of ours they engaged with. Refer to it in your own words. Don't pitch, don't name our company, no links. One short question at most. Under 300 characters."
      },
      {
        "type": "message",
        "delay_days": 4,
        "message": "Hi {{first_name}}, following up in case it's useful. We write website copy and content for B2B companies, from homepage rewrites to regular articles. If you're still looking for a writer, happy to talk through what you need. No pressure either way."
      }
    ],
    "daily_connect_limit": 15,
    "timezone": "UTC",
    "exclude_first_degree": true,
    "conversational_ai": false,
    "max_ai_replies": 5
  }
}$json$::jsonb
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.agent_templates (slug, name, business_type, tagline, description, category, icon, color, featured, is_public, sort_order, config)
VALUES (
  'fractional-cfo-bookkeeping', 'Fractional CFO & bookkeeping firm', 'Fractional CFO or bookkeeping firm',
  'Finds founders asking for a bookkeeper, a fractional CFO or a fundraising model.',
  'Watches LinkedIn for founders and operators who ask for a bookkeeper, a fractional CFO or help with a financial model before fundraising, then starts a conversation about their finances.',
  'consulting', 'calculator', 'amber', false, true, 90,
  $json${
  "schema_version": 1,
  "agent": {
    "name": "Finance help buyers",
    "icp_job_titles": [
      "Founder",
      "Co-Founder",
      "CEO",
      "COO",
      "Owner",
      "Managing Director",
      "Head of Operations",
      "Head of Finance"
    ],
    "icp_locations": [],
    "icp_industries": [],
    "icp_company_types": [
      "Startup",
      "SMB"
    ],
    "icp_company_sizes": [
      "1-10",
      "11-50",
      "51-200"
    ],
    "icp_exclude_keywords": [
      "Accountant",
      "Bookkeeper",
      "Open to work",
      "Student"
    ],
    "icp_restricted_countries": [],
    "icp_restricted_roles": [],
    "ideal_lead_description": "A founder or operator at a startup or small company who has posted that they need a bookkeeper, a fractional CFO, or a financial model for a fundraise.",
    "precision_mode": "discovery",
    "signals_config": {
      "enabled": [
        "keyword_posts",
        "post_engagers"
      ],
      "keywords": {
        "keyword_posts": [
          "looking for a bookkeeper",
          "can anyone recommend a bookkeeper",
          "recommend an accountant for startups",
          "looking for a fractional CFO",
          "anyone recommend a fractional CFO",
          "looking for an outsourced finance team",
          "need help with a financial model",
          "need a fundraising model",
          "need help with financial projections",
          "preparing for our seed round",
          "our books are a mess",
          "need help with month end close"
        ]
      }
    },
    "manual_approval": false
  },
  "campaign": {
    "value_proposition": "",
    "pain_points": [
      "Books behind and messy",
      "No finance lead before a fundraise",
      "Investors asking for a model"
    ],
    "campaign_goal": "conversations",
    "message_tone": "conversational",
    "language": "English",
    "custom_training": "",
    "workflow_steps": [
      {
        "type": "invitation",
        "delay_days": 0
      },
      {
        "type": "message",
        "delay_days": 1,
        "ai_icebreaker": true,
        "message": "",
        "step_instructions": "Open with the signal that found this lead: the bookkeeping, CFO or fundraising help they asked for, or the post of ours they engaged with. Refer to it in your own words. Don't pitch, don't name our company, no links. One short question at most. Under 300 characters."
      },
      {
        "type": "message",
        "delay_days": 4,
        "message": "Hi {{first_name}}, following up in case it's useful. We do bookkeeping and part-time CFO work for startups and small companies, including models for fundraising. If you're still looking for help, happy to ask a few questions and suggest a next step. No pressure either way."
      }
    ],
    "daily_connect_limit": 15,
    "timezone": "UTC",
    "exclude_first_degree": true,
    "conversational_ai": false,
    "max_ai_replies": 5
  }
}$json$::jsonb
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.agent_templates (slug, name, business_type, tagline, description, category, icon, color, featured, is_public, sort_order, config)
VALUES (
  'cybersecurity-consultancy', 'Cybersecurity consultancy', 'Cybersecurity consultancy',
  'Finds teams asking about SOC 2, ISO 27001, a pentest or a security review.',
  'Watches LinkedIn for founders and tech leads who ask about SOC 2 or ISO 27001, look for a penetration test or need a security review for a customer, then opens a conversation about their requirements.',
  'consulting', 'shield', 'amber', false, true, 100,
  $json${
  "schema_version": 1,
  "agent": {
    "name": "Security and compliance buyers",
    "icp_job_titles": [
      "Founder",
      "CEO",
      "CTO",
      "COO",
      "VP of Engineering",
      "Head of Engineering",
      "Head of IT",
      "IT Director",
      "Head of Compliance"
    ],
    "icp_locations": [],
    "icp_industries": [],
    "icp_company_types": [
      "Startup",
      "SMB",
      "Mid-Market"
    ],
    "icp_company_sizes": [
      "11-50",
      "51-200",
      "201-500"
    ],
    "icp_exclude_keywords": [
      "Penetration Tester",
      "Security Consultant",
      "Open to work",
      "Student"
    ],
    "icp_restricted_countries": [],
    "icp_restricted_roles": [],
    "ideal_lead_description": "A founder or technical lead at a growing company who has posted about SOC 2, ISO 27001, a penetration test, a customer security review or finding a security consultant.",
    "precision_mode": "discovery",
    "signals_config": {
      "enabled": [
        "keyword_posts",
        "post_engagers"
      ],
      "keywords": {
        "keyword_posts": [
          "need help with SOC 2",
          "looking for a SOC 2 auditor",
          "how long does SOC 2 take",
          "customer asked for SOC 2",
          "starting ISO 27001",
          "need help with ISO 27001",
          "looking for a penetration test",
          "can anyone recommend a pentest company",
          "need a security review",
          "security questionnaire help",
          "looking for a vCISO",
          "recommend a cybersecurity consultant"
        ]
      }
    },
    "manual_approval": false
  },
  "campaign": {
    "value_proposition": "",
    "pain_points": [
      "Deals blocked by security reviews",
      "No one in-house who owns compliance",
      "Unsure where to start with SOC 2 or ISO 27001"
    ],
    "campaign_goal": "conversations",
    "message_tone": "conversational",
    "language": "English",
    "custom_training": "",
    "workflow_steps": [
      {
        "type": "invitation",
        "delay_days": 0
      },
      {
        "type": "message",
        "delay_days": 1,
        "ai_icebreaker": true,
        "message": "",
        "step_instructions": "Open with the signal that found this lead: the compliance or security need they posted about (SOC 2, ISO 27001, a pentest or a review), or the post of ours they engaged with. Refer to it in your own words. Don't pitch, don't name our company, no links. One short question at most. Under 300 characters."
      },
      {
        "type": "message",
        "delay_days": 4,
        "message": "Hi {{first_name}}, following up in case it's useful. We help companies with security reviews, penetration tests and getting ready for SOC 2 or ISO 27001. If you're still working out the next step, happy to talk through where you are. No pressure either way."
      }
    ],
    "daily_connect_limit": 15,
    "timezone": "UTC",
    "exclude_first_degree": true,
    "conversational_ai": false,
    "max_ai_replies": 5
  }
}$json$::jsonb
)
ON CONFLICT (slug) DO NOTHING;
