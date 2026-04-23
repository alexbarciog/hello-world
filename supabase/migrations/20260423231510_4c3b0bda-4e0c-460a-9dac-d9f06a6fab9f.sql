
CREATE TABLE IF NOT EXISTS public.discount40_email_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  email TEXT NOT NULL,
  first_name TEXT,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.discount40_email_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on discount40_email_log"
ON public.discount40_email_log
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_discount40_email_log_user ON public.discount40_email_log(user_id);
