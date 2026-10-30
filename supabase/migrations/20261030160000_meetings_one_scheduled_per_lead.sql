-- process-ai-replies booked a meeting before sending its reply, so whenever the
-- reply failed the next run booked (and emailed about) the same lead again.
-- Duplicates move to a backup table, nothing is lost, and a unique index makes
-- a repeat booking impossible. The live code already skips billing and emails
-- when the insert fails, so this stops the loop without a deploy.
CREATE TABLE IF NOT EXISTS public.meetings_duplicates_backup (
  LIKE public.meetings INCLUDING DEFAULTS,
  moved_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.meetings_duplicates_backup ENABLE ROW LEVEL SECURITY;

WITH ranked AS (
  SELECT id, row_number() OVER (PARTITION BY contact_id, campaign_id ORDER BY created_at ASC, id ASC) AS rn
  FROM public.meetings
  WHERE status = 'scheduled' AND contact_id IS NOT NULL AND campaign_id IS NOT NULL
),
moved AS (
  DELETE FROM public.meetings m
  USING ranked r
  WHERE m.id = r.id AND r.rn > 1
  RETURNING m.*
)
INSERT INTO public.meetings_duplicates_backup (id, user_id, contact_id, campaign_id, scheduled_at, notes, prep_research, prep_generated_at, status, created_at, organization_id)
SELECT id, user_id, contact_id, campaign_id, scheduled_at, notes, prep_research, prep_generated_at, status, created_at, organization_id
FROM moved;

CREATE UNIQUE INDEX IF NOT EXISTS meetings_one_scheduled_per_lead
  ON public.meetings (contact_id, campaign_id)
  WHERE status = 'scheduled' AND contact_id IS NOT NULL AND campaign_id IS NOT NULL;
