-- Admins can read all signal agent runs
CREATE POLICY "Admins can read all runs"
  ON public.signal_agent_runs
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Admins can read all signal agent tasks
CREATE POLICY "Admins can read all tasks"
  ON public.signal_agent_tasks
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));