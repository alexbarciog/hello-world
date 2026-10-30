-- Epic 5a: every send-email attempt is logged. Written by the send-email
-- function (service role); readable by platform admins only.
CREATE TABLE IF NOT EXISTS public.email_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "to" text NOT NULL,
  "from" text NOT NULL,
  template text,
  subject text NOT NULL,
  resend_id text,
  status text NOT NULL CHECK (status IN ('sent', 'failed')),
  error text,
  caller text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS email_log_created_at_idx ON public.email_log (created_at DESC);
CREATE INDEX IF NOT EXISTS email_log_template_idx ON public.email_log (template, created_at DESC);

ALTER TABLE public.email_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins read email log" ON public.email_log;
CREATE POLICY "Admins read email log"
  ON public.email_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
