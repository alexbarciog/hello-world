-- Two holes open on the live database today. Idempotent.

-- 1. Any signed-in user could add themselves to any workspace, as owner. Self-
--    insert is only for the workspace's owner (creating it); everyone else joins
--    through accept-organization-invitation, which uses the service role.
--    A SECURITY DEFINER helper, because a brand-new workspace isn't visible to
--    its owner through RLS until the membership row exists.
CREATE OR REPLACE FUNCTION public.is_org_owner(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.organizations WHERE id = _org_id AND owner_id = _user_id);
$$;

ALTER POLICY "Admins can manage members"
  ON public.organization_members
  WITH CHECK (
    public.is_org_admin(auth.uid(), organization_id)
    OR (user_id = auth.uid() AND public.is_org_owner(auth.uid(), organization_id))
  );

-- 2. Users could edit every column of their own profile, including credits,
--    trial flags, feature flags, their LinkedIn cooldown and another user's
--    LinkedIn account id. Edge functions (service role), SECURITY DEFINER
--    functions and platform admins are unaffected.
CREATE OR REPLACE FUNCTION public.guard_profile_privileged_columns()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  col text;
  old_row jsonb := to_jsonb(OLD);
  new_row jsonb := to_jsonb(NEW);
BEGIN
  IF current_user NOT IN ('authenticated', 'anon') THEN
    RETURN NEW;
  END IF;
  IF public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RETURN NEW;
  END IF;
  FOREACH col IN ARRAY ARRAY[
    'user_id', 'credits', 'free_trial_enabled', 'free_trial_limit', 'referral_balance',
    'current_organization_id', 'weekly_invites_limit', 'daily_engagement_limit',
    'linkedin_cooldown_until', 'linkedin_ramp_started_at',
    'engagement_spikes_enabled', 'superscale_enabled'
  ] LOOP
    IF (new_row -> col) IS DISTINCT FROM (old_row -> col) THEN
      RAISE EXCEPTION 'Column "%" cannot be changed directly', col USING ERRCODE = '42501';
    END IF;
  END LOOP;
  -- Disconnecting LinkedIn (NULL) is allowed; binding an account is connect-linkedin's job.
  IF NEW.unipile_account_id IS NOT NULL AND NEW.unipile_account_id IS DISTINCT FROM OLD.unipile_account_id THEN
    RAISE EXCEPTION 'Column "unipile_account_id" cannot be changed directly' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;
CREATE OR REPLACE TRIGGER guard_profile_privileged_columns
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_profile_privileged_columns();

-- 3. Lookup by token, so the page below can stop reading the table directly.
CREATE OR REPLACE FUNCTION public.get_org_invitation(_token text)
RETURNS TABLE (id uuid, organization_id uuid, email text, status text, expires_at timestamptz, organization_name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT i.id, i.organization_id, i.email, i.status, i.expires_at, o.name
  FROM public.organization_invitations i
  JOIN public.organizations o ON o.id = i.organization_id
  WHERE _token IS NOT NULL AND length(_token) >= 32 AND i.token = _token
  LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.get_org_invitation(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_org_invitation(text) TO anon, authenticated;
