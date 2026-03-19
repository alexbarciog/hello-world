
-- Lists table
CREATE TABLE public.lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  source_agent_id uuid REFERENCES public.signal_agents(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own lists" ON public.lists FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own lists" ON public.lists FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own lists" ON public.lists FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own lists" ON public.lists FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Service role can also insert (for edge functions)
CREATE POLICY "Service role can manage lists" ON public.lists FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Junction table: contact_lists (many-to-many)
CREATE TABLE public.contact_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  list_id uuid NOT NULL REFERENCES public.lists(id) ON DELETE CASCADE,
  added_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(contact_id, list_id)
);

ALTER TABLE public.contact_lists ENABLE ROW LEVEL SECURITY;

-- RLS for contact_lists: user must own the contact
CREATE POLICY "Users can read own contact_lists" ON public.contact_lists FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.contacts c WHERE c.id = contact_id AND c.user_id = auth.uid()));

CREATE POLICY "Users can insert own contact_lists" ON public.contact_lists FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.contacts c WHERE c.id = contact_id AND c.user_id = auth.uid()));

CREATE POLICY "Users can delete own contact_lists" ON public.contact_lists FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.contacts c WHERE c.id = contact_id AND c.user_id = auth.uid()));

CREATE POLICY "Service role can manage contact_lists" ON public.contact_lists FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Migrate existing list_name data into lists table and create associations
INSERT INTO public.lists (user_id, name)
SELECT DISTINCT c.user_id, c.list_name
FROM public.contacts c
WHERE c.list_name IS NOT NULL AND c.list_name != '';

INSERT INTO public.contact_lists (contact_id, list_id)
SELECT c.id, l.id
FROM public.contacts c
JOIN public.lists l ON l.user_id = c.user_id AND l.name = c.list_name
WHERE c.list_name IS NOT NULL AND c.list_name != '';
