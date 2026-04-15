CREATE TABLE public.platform_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  free_trial_enabled boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Seed single row
INSERT INTO public.platform_settings (free_trial_enabled) VALUES (false);

-- Everyone authenticated can read
CREATE POLICY "Authenticated can read settings"
  ON public.platform_settings FOR SELECT TO authenticated
  USING (true);

-- Only admins can update
CREATE POLICY "Admins can update settings"
  ON public.platform_settings FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));