
-- Agency clients table: links an agency partner (owner) to a client user account they created
CREATE TABLE public.agency_clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_user_id UUID NOT NULL,
  client_user_id UUID,
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  monthly_commission NUMERIC NOT NULL DEFAULT 29,
  activated_at TIMESTAMPTZ,
  removed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (agency_user_id, client_email)
);

ALTER TABLE public.agency_clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agency owner can read own clients"
  ON public.agency_clients FOR SELECT
  TO authenticated
  USING (auth.uid() = agency_user_id);

CREATE POLICY "Agency owner can insert own clients"
  ON public.agency_clients FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = agency_user_id);

CREATE POLICY "Agency owner can update own clients"
  ON public.agency_clients FOR UPDATE
  TO authenticated
  USING (auth.uid() = agency_user_id);

CREATE POLICY "Agency owner can delete own clients"
  ON public.agency_clients FOR DELETE
  TO authenticated
  USING (auth.uid() = agency_user_id);

CREATE POLICY "Service role full access on agency_clients"
  ON public.agency_clients FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE INDEX idx_agency_clients_agency ON public.agency_clients(agency_user_id);
CREATE INDEX idx_agency_clients_client ON public.agency_clients(client_user_id);

CREATE TRIGGER trg_agency_clients_updated_at
  BEFORE UPDATE ON public.agency_clients
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
