-- Epic 2: agent templates per business type.
-- A template is a saved, named copy of everything a customer configures for a
-- signal agent and its outreach campaign. Applying one deep-copies it into the
-- customer's own agent/campaign; later template edits never touch customers.
-- Idempotent so it can be re-run on a branch.

-- Admins: reuse public.user_roles / has_role(). Make the owner an admin.
INSERT INTO public.user_roles (user_id, role)
SELECT value::uuid, 'admin'::public.app_role
FROM public.ops_config
WHERE key = 'owner_user_id'
  AND value ~ '^[0-9a-f-]{36}$'
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles r
    WHERE r.user_id = public.ops_config.value::uuid AND r.role = 'admin'
  );

CREATE TABLE IF NOT EXISTS public.agent_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (length(trim(name)) > 0),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  business_type text NOT NULL,
  description text NOT NULL DEFAULT '',
  icon text NOT NULL DEFAULT 'sparkles',
  is_public boolean NOT NULL DEFAULT false,
  archived_at timestamptz,
  sort_order integer NOT NULL DEFAULT 0,
  schema_version integer NOT NULL DEFAULT 1,
  -- Body validated by the agent-templates edge function against the shared
  -- schema in supabase/functions/_shared/agent-template-schema.ts.
  config jsonb NOT NULL CHECK (jsonb_typeof(config) = 'object'),
  version integer NOT NULL DEFAULT 1,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS agent_templates_public_idx
  ON public.agent_templates (sort_order, name) WHERE is_public AND archived_at IS NULL;

ALTER TABLE public.agent_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Signed-in users read public templates" ON public.agent_templates;
CREATE POLICY "Signed-in users read public templates"
  ON public.agent_templates FOR SELECT TO authenticated
  USING ((is_public AND archived_at IS NULL) OR public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admins write templates" ON public.agent_templates;
CREATE POLICY "Admins write templates"
  ON public.agent_templates FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Bump version and updated_at on every edit (template_applications records
-- which version an account received).
CREATE OR REPLACE FUNCTION public.touch_agent_template()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  IF NEW.config IS DISTINCT FROM OLD.config THEN
    NEW.version := OLD.version + 1;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS touch_agent_template ON public.agent_templates;
CREATE TRIGGER touch_agent_template
  BEFORE UPDATE ON public.agent_templates
  FOR EACH ROW EXECUTE FUNCTION public.touch_agent_template();

CREATE TABLE IF NOT EXISTS public.template_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id uuid NOT NULL REFERENCES public.agent_templates(id) ON DELETE CASCADE,
  version integer NOT NULL,
  agent_id uuid,
  campaign_id uuid,
  applied_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS template_applications_template_idx ON public.template_applications (template_id, applied_at DESC);
CREATE INDEX IF NOT EXISTS template_applications_account_idx ON public.template_applications (account_id, applied_at DESC);

ALTER TABLE public.template_applications ENABLE ROW LEVEL SECURITY;
-- Written by the apply-agent-template function (service role).
DROP POLICY IF EXISTS "Users read own template applications" ON public.template_applications;
CREATE POLICY "Users read own template applications"
  ON public.template_applications FOR SELECT TO authenticated
  USING (account_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- {{demo_link}} in template messages resolves to this (set in campaign settings).
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS demo_link text;

-- One example so the editor has something to open. Not public: Alex supplies
-- the real templates and publishes them.
INSERT INTO public.agent_templates (name, slug, business_type, description, icon, is_public, sort_order, config)
VALUES (
  'Web design agency (example)',
  'web-design-agency-example',
  'Web design agency',
  'Finds founders and marketing leads talking about a new website or a redesign, then opens the conversation on LinkedIn.',
  'palette',
  false,
  100,
  $json${
    "schema_version": 1,
    "agent": {
      "name": "Website redesign signals",
      "icp_job_titles": ["Founder", "Co-Founder", "CEO", "Head of Marketing", "Marketing Director"],
      "icp_locations": [],
      "icp_industries": [],
      "icp_company_types": [],
      "icp_company_sizes": ["1-10", "11-50", "51-200"],
      "icp_exclude_keywords": ["agency", "freelance"],
      "icp_restricted_countries": [],
      "icp_restricted_roles": [],
      "ideal_lead_description": "A founder or marketing lead at a small or mid-size company who is planning a new website, a redesign or a rebrand.",
      "precision_mode": "discovery",
      "signals_config": {
        "enabled": ["keyword_posts", "job_changes"],
        "keywords": { "keyword_posts": ["new website", "website redesign", "rebrand", "looking for a web designer", "webflow developer"] }
      },
      "manual_approval": false
    },
    "campaign": {
      "value_proposition": "",
      "pain_points": ["Outdated website that doesn't convert", "No time to manage a redesign", "Bad experiences with freelancers"],
      "campaign_goal": "conversations",
      "message_tone": "conversational",
      "language": "English",
      "custom_training": "",
      "workflow_steps": [
        { "type": "invitation", "delay_days": 0 },
        { "type": "message", "delay_days": 1, "ai_icebreaker": true, "message": "Hi {{first_name}}, thanks for connecting. I noticed {{signal}}, is a new site on the cards at {{company}} this quarter?" },
        { "type": "message", "delay_days": 3, "message": "Asking because at {{my_company}} we redesign sites for teams like yours without dragging it out for months. Happy to share a couple of recent examples if useful." },
        { "type": "message", "delay_days": 4, "message": "Last note from me, {{first_name}}: if a quick chat would help, here's my calendar: {{demo_link}}" }
      ],
      "daily_connect_limit": 15,
      "timezone": "UTC",
      "exclude_first_degree": true,
      "conversational_ai": true,
      "max_ai_replies": 5
    }
  }$json$::jsonb
)
ON CONFLICT (slug) DO NOTHING;
