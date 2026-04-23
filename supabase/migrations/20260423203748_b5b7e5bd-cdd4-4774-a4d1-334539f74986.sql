-- Create lookalike_runs table
CREATE TABLE public.lookalike_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  organization_id uuid,
  status text NOT NULL DEFAULT 'profiling',
  seed_urls jsonb NOT NULL DEFAULT '[]'::jsonb,
  filters jsonb NOT NULL DEFAULT '{}'::jsonb,
  inserted integer NOT NULL DEFAULT 0,
  duplicates integer NOT NULL DEFAULT 0,
  companies_scanned integer NOT NULL DEFAULT 0,
  decision_makers_found integer NOT NULL DEFAULT 0,
  list_id uuid,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.lookalike_runs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can read own lookalike_runs"
  ON public.lookalike_runs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Org members can read lookalike_runs"
  ON public.lookalike_runs FOR SELECT
  TO authenticated
  USING (organization_id IS NOT NULL AND public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Users can insert own lookalike_runs"
  ON public.lookalike_runs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role full access on lookalike_runs"
  ON public.lookalike_runs FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- Triggers
CREATE TRIGGER lookalike_runs_autofill_org
  BEFORE INSERT ON public.lookalike_runs
  FOR EACH ROW
  EXECUTE FUNCTION public.autofill_organization_id();

CREATE TRIGGER lookalike_runs_updated_at
  BEFORE UPDATE ON public.lookalike_runs
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX idx_lookalike_runs_user_id ON public.lookalike_runs(user_id);
CREATE INDEX idx_lookalike_runs_org_id ON public.lookalike_runs(organization_id);
CREATE INDEX idx_lookalike_runs_status ON public.lookalike_runs(status);