-- Restore chris@omgcommerce.com's Unipile account (mistakenly cleared) and reactivate his automations.
UPDATE public.profiles
SET unipile_account_id = 'SNamBBZtThuUiWrXUYpRHw'
WHERE user_id = 'fdb36f1b-07d0-4e36-bfb0-71ad4625b7b2';

UPDATE public.campaigns
SET status = 'active'
WHERE user_id = 'fdb36f1b-07d0-4e36-bfb0-71ad4625b7b2'
  AND status = 'paused'
  AND updated_at >= now() - interval '2 hours';

UPDATE public.signal_agents
SET status = 'active'
WHERE user_id = 'fdb36f1b-07d0-4e36-bfb0-71ad4625b7b2'
  AND status = 'paused'
  AND updated_at >= now() - interval '2 hours';

-- Remove the false-positive disconnection notification we sent to chris.
DELETE FROM public.notifications
WHERE user_id = 'fdb36f1b-07d0-4e36-bfb0-71ad4625b7b2'
  AND title = '⚠️ LinkedIn Disconnected'
  AND created_at >= now() - interval '2 hours';