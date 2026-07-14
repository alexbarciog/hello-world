
CREATE TABLE public.email_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID,
  provider TEXT NOT NULL CHECK (provider IN ('gmail','smtp')),
  from_email TEXT NOT NULL,
  from_name TEXT,
  is_default BOOLEAN NOT NULL DEFAULT true,
  smtp_host TEXT,
  smtp_port INTEGER,
  smtp_username TEXT,
  smtp_password_encrypted TEXT,
  smtp_password_iv TEXT,
  smtp_secure BOOLEAN DEFAULT true,
  gmail_connection_id TEXT,
  verified_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_accounts TO authenticated;
GRANT ALL ON public.email_accounts TO service_role;

ALTER TABLE public.email_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own email accounts"
ON public.email_accounts FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE UNIQUE INDEX one_default_email_per_user
ON public.email_accounts(user_id) WHERE is_default = true;

CREATE TRIGGER update_email_accounts_updated_at
BEFORE UPDATE ON public.email_accounts
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
