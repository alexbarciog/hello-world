
DROP POLICY IF EXISTS "Authenticated can update accepted_at" ON public.invitations;

CREATE POLICY "Anyone can update invitation accepted_at by token"
  ON public.invitations FOR UPDATE
  USING (accepted_at IS NULL AND expires_at > now())
  WITH CHECK (accepted_at IS NOT NULL);
