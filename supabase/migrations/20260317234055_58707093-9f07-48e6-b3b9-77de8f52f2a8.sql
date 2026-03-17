
CREATE TABLE IF NOT EXISTS public.invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  invited_by uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_name text,
  inviter_name text,
  accepted_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create invitations"
  ON public.invitations FOR INSERT
  TO authenticated
  WITH CHECK (invited_by = auth.uid());

CREATE POLICY "Anyone can read invitation by token"
  ON public.invitations FOR SELECT
  USING (true);

CREATE POLICY "Authenticated can update accepted_at"
  ON public.invitations FOR UPDATE
  USING (true)
  WITH CHECK (true);
