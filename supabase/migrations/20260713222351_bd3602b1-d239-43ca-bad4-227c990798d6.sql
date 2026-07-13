GRANT SELECT, INSERT, UPDATE, DELETE ON public.contact_lists TO authenticated;
GRANT ALL ON public.contact_lists TO service_role;

DROP POLICY IF EXISTS "Users can read own contact_lists" ON public.contact_lists;
DROP POLICY IF EXISTS "Users can insert own contact_lists" ON public.contact_lists;
DROP POLICY IF EXISTS "Users can delete own contact_lists" ON public.contact_lists;

CREATE POLICY "Org members can read contact_lists"
ON public.contact_lists
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.contacts c
    JOIN public.lists l ON l.id = contact_lists.list_id
    WHERE c.id = contact_lists.contact_id
      AND c.organization_id IS NOT NULL
      AND l.organization_id = c.organization_id
      AND public.is_org_member(auth.uid(), c.organization_id)
  )
  OR EXISTS (
    SELECT 1
    FROM public.contacts c
    WHERE c.id = contact_lists.contact_id
      AND c.user_id = auth.uid()
  )
);

CREATE POLICY "Org members can insert contact_lists"
ON public.contact_lists
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.contacts c
    JOIN public.lists l ON l.id = contact_lists.list_id
    WHERE c.id = contact_lists.contact_id
      AND c.organization_id IS NOT NULL
      AND l.organization_id = c.organization_id
      AND public.is_org_member(auth.uid(), c.organization_id)
  )
  OR EXISTS (
    SELECT 1
    FROM public.contacts c
    WHERE c.id = contact_lists.contact_id
      AND c.user_id = auth.uid()
  )
);

CREATE POLICY "Org members can delete contact_lists"
ON public.contact_lists
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.contacts c
    JOIN public.lists l ON l.id = contact_lists.list_id
    WHERE c.id = contact_lists.contact_id
      AND c.organization_id IS NOT NULL
      AND l.organization_id = c.organization_id
      AND public.is_org_member(auth.uid(), c.organization_id)
  )
  OR EXISTS (
    SELECT 1
    FROM public.contacts c
    WHERE c.id = contact_lists.contact_id
      AND c.user_id = auth.uid()
  )
);