
-- =============================================
-- 1. ORGANIZATIONS TABLES
-- =============================================

CREATE TABLE public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE,
  owner_id uuid NOT NULL,
  plan text NOT NULL DEFAULT 'free',
  unipile_account_id text,
  calendar_integration_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

CREATE INDEX idx_org_members_user ON public.organization_members(user_id);
CREATE INDEX idx_org_members_org ON public.organization_members(organization_id);

CREATE TABLE public.organization_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  invited_by uuid NOT NULL,
  email text NOT NULL,
  token text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days')
);

CREATE INDEX idx_org_invitations_token ON public.organization_invitations(token);
CREATE INDEX idx_org_invitations_email ON public.organization_invitations(email);

CREATE TABLE public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id uuid NOT NULL,
  referred_user_id uuid,
  referred_email text,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  source text NOT NULL DEFAULT 'url' CHECK (source IN ('url', 'invitation')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  reward_amount numeric NOT NULL DEFAULT 50,
  created_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz
);

CREATE INDEX idx_referrals_referrer ON public.referrals(referrer_user_id);

-- =============================================
-- 2. PROFILE ADDITIONS
-- =============================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS current_organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code text UNIQUE DEFAULT substring(encode(gen_random_bytes(8), 'hex'), 1, 8);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_balance numeric NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referred_by_code text;

-- Backfill referral_code for existing rows
UPDATE public.profiles
SET referral_code = substring(encode(gen_random_bytes(8), 'hex'), 1, 8)
WHERE referral_code IS NULL;

-- =============================================
-- 3. ADD organization_id TO DATA TABLES
-- =============================================

ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.lists ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.signal_agents ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.signal_agent_runs ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.meetings ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_campaigns_org ON public.campaigns(organization_id);
CREATE INDEX IF NOT EXISTS idx_contacts_org ON public.contacts(organization_id);
CREATE INDEX IF NOT EXISTS idx_lists_org ON public.lists(organization_id);
CREATE INDEX IF NOT EXISTS idx_signal_agents_org ON public.signal_agents(organization_id);

-- =============================================
-- 4. SECURITY DEFINER HELPERS (avoid RLS recursion)
-- =============================================

CREATE OR REPLACE FUNCTION public.is_org_member(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE user_id = _user_id AND organization_id = _org_id
  )
$$;

CREATE OR REPLACE FUNCTION public.is_org_admin(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE user_id = _user_id AND organization_id = _org_id AND role IN ('owner', 'admin')
  )
$$;

CREATE OR REPLACE FUNCTION public.user_org_ids(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM public.organization_members WHERE user_id = _user_id
$$;

-- =============================================
-- 5. RLS POLICIES — new tables
-- =============================================

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- organizations
CREATE POLICY "Members can view their organizations"
  ON public.organizations FOR SELECT TO authenticated
  USING (public.is_org_member(auth.uid(), id));

CREATE POLICY "Authenticated can create organizations"
  ON public.organizations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners and admins can update org"
  ON public.organizations FOR UPDATE TO authenticated
  USING (public.is_org_admin(auth.uid(), id));

CREATE POLICY "Owner can delete org"
  ON public.organizations FOR DELETE TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "Service role full access on organizations"
  ON public.organizations FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- organization_members
CREATE POLICY "Members can view org membership"
  ON public.organization_members FOR SELECT TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Admins can manage members"
  ON public.organization_members FOR INSERT TO authenticated
  WITH CHECK (public.is_org_admin(auth.uid(), organization_id) OR user_id = auth.uid());

CREATE POLICY "Admins can update members"
  ON public.organization_members FOR UPDATE TO authenticated
  USING (public.is_org_admin(auth.uid(), organization_id));

CREATE POLICY "Admins or self can remove members"
  ON public.organization_members FOR DELETE TO authenticated
  USING (public.is_org_admin(auth.uid(), organization_id) OR user_id = auth.uid());

CREATE POLICY "Service role full access on members"
  ON public.organization_members FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- organization_invitations
CREATE POLICY "Members can view org invitations"
  ON public.organization_invitations FOR SELECT TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Anyone can read invitation by token"
  ON public.organization_invitations FOR SELECT TO public
  USING (true);

CREATE POLICY "Admins can create invitations"
  ON public.organization_invitations FOR INSERT TO authenticated
  WITH CHECK (public.is_org_admin(auth.uid(), organization_id) AND invited_by = auth.uid());

CREATE POLICY "Admins can delete invitations"
  ON public.organization_invitations FOR DELETE TO authenticated
  USING (public.is_org_admin(auth.uid(), organization_id));

CREATE POLICY "Service role full access on invitations"
  ON public.organization_invitations FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- referrals
CREATE POLICY "Users see their own referrals"
  ON public.referrals FOR SELECT TO authenticated
  USING (referrer_user_id = auth.uid());

CREATE POLICY "Service role full access on referrals"
  ON public.referrals FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- =============================================
-- 6. RLS POLICIES — extend org access on data tables
-- (keep existing user-based policies, ADD org-member policies)
-- =============================================

CREATE POLICY "Org members can read campaigns"
  ON public.campaigns FOR SELECT TO authenticated
  USING (organization_id IS NOT NULL AND public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org members can read contacts"
  ON public.contacts FOR SELECT TO authenticated
  USING (organization_id IS NOT NULL AND public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org members can read lists"
  ON public.lists FOR SELECT TO authenticated
  USING (organization_id IS NOT NULL AND public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org members can read signal_agents"
  ON public.signal_agents FOR SELECT TO authenticated
  USING (organization_id IS NOT NULL AND public.is_org_member(auth.uid(), organization_id));

-- =============================================
-- 7. BACKFILL — create personal org for each user
-- =============================================

DO $$
DECLARE
  prof RECORD;
  new_org_id uuid;
  display_name text;
BEGIN
  FOR prof IN
    SELECT p.user_id, p.unipile_account_id, p.linkedin_display_name, u.email
    FROM public.profiles p
    LEFT JOIN auth.users u ON u.id = p.user_id
    WHERE p.current_organization_id IS NULL
  LOOP
    display_name := COALESCE(
      NULLIF(prof.linkedin_display_name, ''),
      split_part(COALESCE(prof.email, 'user'), '@', 1)
    );

    INSERT INTO public.organizations (name, owner_id, plan, unipile_account_id)
    VALUES (display_name || '''s Workspace', prof.user_id, 'free', prof.unipile_account_id)
    RETURNING id INTO new_org_id;

    INSERT INTO public.organization_members (organization_id, user_id, role)
    VALUES (new_org_id, prof.user_id, 'owner');

    UPDATE public.profiles
    SET current_organization_id = new_org_id
    WHERE user_id = prof.user_id;

    -- Backfill org_id on user-owned data
    UPDATE public.campaigns SET organization_id = new_org_id WHERE user_id = prof.user_id AND organization_id IS NULL;
    UPDATE public.contacts SET organization_id = new_org_id WHERE user_id = prof.user_id AND organization_id IS NULL;
    UPDATE public.lists SET organization_id = new_org_id WHERE user_id = prof.user_id AND organization_id IS NULL;
    UPDATE public.signal_agents SET organization_id = new_org_id WHERE user_id = prof.user_id AND organization_id IS NULL;
    UPDATE public.signal_agent_runs SET organization_id = new_org_id WHERE user_id = prof.user_id AND organization_id IS NULL;
    UPDATE public.meetings SET organization_id = new_org_id WHERE user_id = prof.user_id AND organization_id IS NULL;
  END LOOP;
END $$;

-- =============================================
-- 8. AUTO-CREATE PERSONAL ORG ON SIGNUP
-- =============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_org_id uuid;
  display_name text;
BEGIN
  INSERT INTO public.profiles (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  display_name := split_part(COALESCE(NEW.email, 'user'), '@', 1);

  INSERT INTO public.organizations (name, owner_id, plan)
  VALUES (display_name || '''s Workspace', NEW.id, 'free')
  RETURNING id INTO new_org_id;

  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (new_org_id, NEW.id, 'owner');

  UPDATE public.profiles
  SET current_organization_id = new_org_id
  WHERE user_id = NEW.id;

  RETURN NEW;
END;
$$;

-- =============================================
-- 9. UPDATE LIMITS — per-organization instead of per-user
-- =============================================

CREATE OR REPLACE FUNCTION public.check_campaigns_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.organization_id IS NOT NULL AND (
    SELECT COUNT(*) FROM public.campaigns
    WHERE organization_id = NEW.organization_id
  ) >= 2 THEN
    RAISE EXCEPTION 'LIMIT_REACHED: This workspace has reached the maximum of 2 campaigns.';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_signal_agents_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.organization_id IS NOT NULL AND (
    SELECT COUNT(*) FROM public.signal_agents
    WHERE organization_id = NEW.organization_id
  ) >= 2 THEN
    RAISE EXCEPTION 'LIMIT_REACHED: This workspace has reached the maximum of 2 signal agents.';
  END IF;
  RETURN NEW;
END;
$$;

-- =============================================
-- 10. updated_at trigger for organizations
-- =============================================

CREATE TRIGGER update_organizations_updated_at
BEFORE UPDATE ON public.organizations
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
