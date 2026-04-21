
-- Allow org members to read run history for any agent in their workspace
CREATE POLICY "Org members can read runs"
ON public.signal_agent_runs
FOR SELECT
TO authenticated
USING (
  organization_id IS NOT NULL
  AND public.is_org_member(auth.uid(), organization_id)
);

-- Allow org members to read tasks for runs they can see
CREATE POLICY "Org members can read tasks"
ON public.signal_agent_tasks
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.signal_agent_runs r
    WHERE r.id = signal_agent_tasks.run_id
      AND r.organization_id IS NOT NULL
      AND public.is_org_member(auth.uid(), r.organization_id)
  )
);
