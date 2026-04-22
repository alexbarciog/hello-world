CREATE POLICY "Admins can read all signal_agents"
  ON public.signal_agents
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can read all organizations"
  ON public.organizations
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));