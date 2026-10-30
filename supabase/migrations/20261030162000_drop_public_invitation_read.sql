-- Run AFTER the InviteAccept change is live: every invitation's email and secret
-- token is publicly readable until this runs, but the deployed page needs the
-- policy until it reads through get_org_invitation.
DROP POLICY IF EXISTS "Anyone can read invitation by token" ON public.organization_invitations;
