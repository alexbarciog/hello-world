-- Daily leads email: one row per account per local day, claimed before
-- sending so overlapping scheduler runs can't double send. Days with 0 leads
-- get a row too (sent_at stays null), so the next email starts where this
-- period ended and no lead is counted twice or skipped.
CREATE TABLE IF NOT EXISTS public.daily_lead_emails (
  account_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day date NOT NULL,
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  total integer NOT NULL DEFAULT 0,
  payload jsonb,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (account_id, day)
);
CREATE INDEX IF NOT EXISTS daily_lead_emails_account_end ON public.daily_lead_emails (account_id, period_end DESC);
ALTER TABLE public.daily_lead_emails ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'daily_lead_emails' AND policyname = 'Admins read daily lead emails') THEN
    CREATE POLICY "Admins read daily lead emails" ON public.daily_lead_emails FOR SELECT TO authenticated
      USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END
$$;
CREATE INDEX IF NOT EXISTS contact_lists_list_added ON public.contact_lists (list_id, added_at);
