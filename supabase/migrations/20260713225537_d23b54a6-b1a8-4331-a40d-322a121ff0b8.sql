CREATE OR REPLACE FUNCTION public.trigger_schedule_on_contact_list_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _has_active_campaign boolean;
  _supabase_url text;
  _service_role_key text;
BEGIN
  -- Only fire if the list feeds an active campaign
  SELECT EXISTS (
    SELECT 1 FROM public.campaigns
    WHERE source_list_id = NEW.list_id AND status = 'active'
  ) INTO _has_active_campaign;

  IF NOT _has_active_campaign THEN
    RETURN NEW;
  END IF;

  SELECT decrypted_secret INTO _supabase_url FROM vault.decrypted_secrets WHERE name = 'SUPABASE_URL' LIMIT 1;
  SELECT decrypted_secret INTO _service_role_key FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY' LIMIT 1;

  IF _supabase_url IS NULL OR _service_role_key IS NULL THEN
    RETURN NEW;
  END IF;

  PERFORM net.http_post(
    url := _supabase_url || '/functions/v1/schedule-daily-leads',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || _service_role_key
    ),
    body := '{}'::jsonb
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_contact_list_insert_schedule ON public.contact_lists;
CREATE TRIGGER on_contact_list_insert_schedule
AFTER INSERT ON public.contact_lists
FOR EACH ROW EXECUTE FUNCTION public.trigger_schedule_on_contact_list_insert();