-- Add per-user free trial columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN free_trial_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN free_trial_limit integer NOT NULL DEFAULT 1;

-- Allow admins to update any user's profile (for managing free trial settings)
CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));