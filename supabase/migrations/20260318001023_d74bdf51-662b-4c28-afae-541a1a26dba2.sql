
-- Allow the inviter (owner) to delete their own invitations
CREATE POLICY "Users can delete own invitations"
ON public.invitations
FOR DELETE
TO authenticated
USING (invited_by = auth.uid());
