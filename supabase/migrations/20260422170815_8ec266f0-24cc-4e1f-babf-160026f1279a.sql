-- Table: shared_lead_links
CREATE TABLE public.shared_lead_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  created_by uuid NOT NULL,
  organization_id uuid NOT NULL,
  name text,
  lead_count integer NOT NULL DEFAULT 0,
  expires_at timestamptz DEFAULT (now() + interval '30 days'),
  revoked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_shared_lead_links_token ON public.shared_lead_links(token);
CREATE INDEX idx_shared_lead_links_created_by ON public.shared_lead_links(created_by);

ALTER TABLE public.shared_lead_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on shared_lead_links"
  ON public.shared_lead_links FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Users can read own shared_lead_links"
  ON public.shared_lead_links FOR SELECT
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Users can update own shared_lead_links"
  ON public.shared_lead_links FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete own shared_lead_links"
  ON public.shared_lead_links FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- Table: shared_lead_link_contacts
CREATE TABLE public.shared_lead_link_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id uuid NOT NULL REFERENCES public.shared_lead_links(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (link_id, contact_id)
);

CREATE INDEX idx_shared_lead_link_contacts_link ON public.shared_lead_link_contacts(link_id);

ALTER TABLE public.shared_lead_link_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on shared_lead_link_contacts"
  ON public.shared_lead_link_contacts FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- RPC: get_shared_leads — returns masked leads for public viewing
CREATE OR REPLACE FUNCTION public.get_shared_leads(_token text)
RETURNS TABLE (
  id uuid,
  first_name text,
  last_name text,
  title text,
  company text,
  industry text,
  linkedin_url text,
  signal text,
  signal_post_url text,
  ai_score integer,
  signal_a_hit boolean,
  signal_b_hit boolean,
  signal_c_hit boolean,
  relevance_tier text,
  lead_status text,
  imported_at timestamptz,
  list_name text,
  share_name text,
  shared_count integer
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _link_id uuid;
  _share_name text;
  _lead_count integer;
BEGIN
  SELECT sll.id, sll.name, sll.lead_count
  INTO _link_id, _share_name, _lead_count
  FROM public.shared_lead_links sll
  WHERE sll.token = _token
    AND sll.revoked = false
    AND (sll.expires_at IS NULL OR sll.expires_at > now())
  LIMIT 1;

  IF _link_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    c.id,
    c.first_name,
    c.last_name,
    c.title,
    c.company,
    c.industry,
    c.linkedin_url,
    c.signal,
    c.signal_post_url,
    c.ai_score,
    c.signal_a_hit,
    c.signal_b_hit,
    c.signal_c_hit,
    c.relevance_tier,
    c.lead_status,
    c.imported_at,
    c.list_name,
    _share_name AS share_name,
    _lead_count AS shared_count
  FROM public.shared_lead_link_contacts sllc
  JOIN public.contacts c ON c.id = sllc.contact_id
  WHERE sllc.link_id = _link_id
  ORDER BY c.imported_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_shared_leads(text) TO anon, authenticated;

-- RPC: claim_shared_leads — copies the shared leads into the caller's organization
CREATE OR REPLACE FUNCTION public.claim_shared_leads(_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _link_id uuid;
  _caller_id uuid := auth.uid();
  _org_id uuid;
  _list_id uuid;
  _list_name text;
  _inserted integer := 0;
  _row record;
  _new_contact_id uuid;
BEGIN
  IF _caller_id IS NULL THEN
    RAISE EXCEPTION 'NOT_AUTHENTICATED';
  END IF;

  SELECT id INTO _link_id
  FROM public.shared_lead_links
  WHERE token = _token
    AND revoked = false
    AND (expires_at IS NULL OR expires_at > now())
  LIMIT 1;

  IF _link_id IS NULL THEN
    RAISE EXCEPTION 'INVALID_TOKEN';
  END IF;

  SELECT current_organization_id INTO _org_id
  FROM public.profiles
  WHERE user_id = _caller_id;

  IF _org_id IS NULL THEN
    RAISE EXCEPTION 'NO_ORGANIZATION';
  END IF;

  _list_name := 'Shared with me · ' || to_char(now(), 'Mon DD, YYYY');

  INSERT INTO public.lists (user_id, organization_id, name, description)
  VALUES (_caller_id, _org_id, _list_name, 'Leads shared with you via link')
  RETURNING id INTO _list_id;

  FOR _row IN
    SELECT c.*
    FROM public.shared_lead_link_contacts sllc
    JOIN public.contacts c ON c.id = sllc.contact_id
    WHERE sllc.link_id = _link_id
  LOOP
    -- Skip if a contact with the same linkedin_url already exists in caller's org
    IF _row.linkedin_url IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.contacts
      WHERE organization_id = _org_id
        AND linkedin_url = _row.linkedin_url
    ) THEN
      CONTINUE;
    END IF;

    INSERT INTO public.contacts (
      user_id, organization_id, first_name, last_name, title, company,
      industry, linkedin_url, signal, signal_post_url, signal_a_hit,
      signal_b_hit, signal_c_hit, relevance_tier, lead_status,
      approval_status, ai_score, list_name
    )
    VALUES (
      _caller_id, _org_id, _row.first_name, _row.last_name, _row.title, _row.company,
      _row.industry, _row.linkedin_url, _row.signal, _row.signal_post_url, _row.signal_a_hit,
      _row.signal_b_hit, _row.signal_c_hit, COALESCE(_row.relevance_tier, 'cold'), 'unknown',
      'auto_approved', COALESCE(_row.ai_score, 1), _list_name
    )
    RETURNING id INTO _new_contact_id;

    INSERT INTO public.contact_lists (contact_id, list_id)
    VALUES (_new_contact_id, _list_id);

    _inserted := _inserted + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'inserted', _inserted,
    'list_id', _list_id,
    'list_name', _list_name
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_shared_leads(text) TO authenticated;