-- 1. Backfill missing organization_id on contacts using owner's current org
UPDATE public.contacts c
SET organization_id = p.current_organization_id
FROM public.profiles p
WHERE c.organization_id IS NULL
  AND p.user_id = c.user_id
  AND p.current_organization_id IS NOT NULL;

-- 2. Backfill missing organization_id on lists
UPDATE public.lists l
SET organization_id = p.current_organization_id
FROM public.profiles p
WHERE l.organization_id IS NULL
  AND p.user_id = l.user_id
  AND p.current_organization_id IS NOT NULL;

-- 3. Defensive trigger: auto-fill organization_id on insert if omitted
CREATE OR REPLACE FUNCTION public.autofill_organization_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.organization_id IS NULL AND NEW.user_id IS NOT NULL THEN
    SELECT current_organization_id INTO NEW.organization_id
    FROM public.profiles
    WHERE user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS autofill_org_id_contacts ON public.contacts;
CREATE TRIGGER autofill_org_id_contacts
  BEFORE INSERT ON public.contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.autofill_organization_id();

DROP TRIGGER IF EXISTS autofill_org_id_lists ON public.lists;
CREATE TRIGGER autofill_org_id_lists
  BEFORE INSERT ON public.lists
  FOR EACH ROW
  EXECUTE FUNCTION public.autofill_organization_id();