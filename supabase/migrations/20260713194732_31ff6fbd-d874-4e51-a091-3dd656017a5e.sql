CREATE OR REPLACE FUNCTION public.check_signal_agents_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _is_exempt boolean := false;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM auth.users u
    WHERE u.id = NEW.user_id
      AND lower(u.email) = 'alex123@gmail.com'
  ) INTO _is_exempt;

  IF NOT _is_exempt AND NEW.organization_id IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1
      FROM public.organizations o
      JOIN auth.users u ON u.id = o.owner_id
      WHERE o.id = NEW.organization_id
        AND lower(u.email) = 'alex123@gmail.com'
    ) INTO _is_exempt;
  END IF;

  IF NEW.organization_id IS NOT NULL THEN
    IF NOT _is_exempt AND (
      SELECT COUNT(*) FROM public.signal_agents
      WHERE organization_id = NEW.organization_id
    ) >= 2 THEN
      RAISE EXCEPTION 'LIMIT_REACHED: This workspace has reached the maximum of 2 signal agents.';
    END IF;
  ELSE
    IF NOT _is_exempt AND (
      SELECT COUNT(*) FROM public.signal_agents
      WHERE user_id = NEW.user_id
    ) >= 2 THEN
      RAISE EXCEPTION 'LIMIT_REACHED: This account has reached the maximum of 2 signal agents.';
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;