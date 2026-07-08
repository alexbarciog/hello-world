
CREATE TABLE public.crm_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  organization_id uuid,
  provider text NOT NULL,
  api_key text NOT NULL,
  sync_mode text NOT NULL DEFAULT 'interested',
  is_active boolean NOT NULL DEFAULT true,
  hubspot_portal_id text,
  last_sync_at timestamptz,
  last_sync_count integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, provider),
  CHECK (sync_mode IN ('all', 'interested'))
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_integrations TO authenticated;
GRANT ALL ON public.crm_integrations TO service_role;

ALTER TABLE public.crm_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own CRM integrations"
ON public.crm_integrations FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER crm_integrations_updated_at
BEFORE UPDATE ON public.crm_integrations
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
