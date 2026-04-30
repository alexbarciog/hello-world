-- Backfill missing profiles.unipile_account_id from the user's current organization,
-- and resume the OMG Commerce campaign that was paused during the Unipile outage.

-- 1) Backfill: copy the org's unipile_account_id onto the profile when the profile lacks one.
UPDATE public.profiles p
SET unipile_account_id = o.unipile_account_id,
    updated_at = now()
FROM public.organizations o
WHERE p.unipile_account_id IS NULL
  AND p.current_organization_id = o.id
  AND o.unipile_account_id IS NOT NULL;

-- 2) Resume the OMG Commerce campaign so the 6 overdue Step-2 follow-ups
--    (status='generated', scheduled 2026-04-25/26) get picked up on the next cron tick.
UPDATE public.campaigns
SET status = 'active', updated_at = now()
WHERE id = 'e7845d19-511d-44b5-9cec-ccde9fb6d8de'
  AND status = 'paused';