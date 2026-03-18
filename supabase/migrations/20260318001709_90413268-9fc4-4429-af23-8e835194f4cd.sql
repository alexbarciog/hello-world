-- ============================================================
-- Enforce limits: 2 campaigns, 2 signal agents, 2 invitations
-- ============================================================

-- 1. Campaigns limit (max 2 per user)
CREATE OR REPLACE FUNCTION public.check_campaigns_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (
    SELECT COUNT(*) FROM public.campaigns
    WHERE user_id = NEW.user_id
  ) >= 2 THEN
    RAISE EXCEPTION 'LIMIT_REACHED: You have reached the maximum of 2 campaigns.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS enforce_campaigns_limit ON public.campaigns;
CREATE TRIGGER enforce_campaigns_limit
  BEFORE INSERT ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.check_campaigns_limit();

-- 2. Signal agents limit (max 2 per user)
CREATE OR REPLACE FUNCTION public.check_signal_agents_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (
    SELECT COUNT(*) FROM public.signal_agents
    WHERE user_id = NEW.user_id
  ) >= 2 THEN
    RAISE EXCEPTION 'LIMIT_REACHED: You have reached the maximum of 2 signal agents.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS enforce_signal_agents_limit ON public.signal_agents;
CREATE TRIGGER enforce_signal_agents_limit
  BEFORE INSERT ON public.signal_agents
  FOR EACH ROW EXECUTE FUNCTION public.check_signal_agents_limit();

-- 3. Invitations limit (max 2 total per inviter)
CREATE OR REPLACE FUNCTION public.check_invitations_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (
    SELECT COUNT(*) FROM public.invitations
    WHERE invited_by = NEW.invited_by
  ) >= 2 THEN
    RAISE EXCEPTION 'LIMIT_REACHED: You have reached the maximum of 2 team member invitations.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS enforce_invitations_limit ON public.invitations;
CREATE TRIGGER enforce_invitations_limit
  BEFORE INSERT ON public.invitations
  FOR EACH ROW EXECUTE FUNCTION public.check_invitations_limit();