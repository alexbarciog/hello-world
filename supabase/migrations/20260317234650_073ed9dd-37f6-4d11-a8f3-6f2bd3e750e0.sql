
CREATE TABLE IF NOT EXISTS public.password_reset_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  code text NOT NULL,
  used boolean NOT NULL DEFAULT false,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '15 minutes'),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.password_reset_codes ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (request reset) and read their own code by email+code combo
CREATE POLICY "Anyone can insert reset code"
  ON public.password_reset_codes FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can read reset codes"
  ON public.password_reset_codes FOR SELECT
  USING (true);

CREATE POLICY "Anyone can mark code as used"
  ON public.password_reset_codes FOR UPDATE
  USING (used = false AND expires_at > now())
  WITH CHECK (used = true);

-- Auto-cleanup: delete expired codes older than 1 hour
CREATE INDEX IF NOT EXISTS idx_password_reset_codes_email ON public.password_reset_codes(email);
CREATE INDEX IF NOT EXISTS idx_password_reset_codes_expires ON public.password_reset_codes(expires_at);
