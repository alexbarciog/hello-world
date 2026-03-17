
-- Add draft persistence columns to campaigns table
ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS session_id text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS current_step integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS step_1_data jsonb,
  ADD COLUMN IF NOT EXISTS step_2_data jsonb,
  ADD COLUMN IF NOT EXISTS step_3_data jsonb,
  ADD COLUMN IF NOT EXISTS step_4_data jsonb,
  ADD COLUMN IF NOT EXISTS step_5_data jsonb,
  ADD COLUMN IF NOT EXISTS step_6_data jsonb;

-- Index for fast lookup of draft by session_id
CREATE INDEX IF NOT EXISTS idx_campaigns_session_id ON public.campaigns (session_id);

-- Allow UPDATE on campaigns (needed for auto-save upsert)
CREATE POLICY "Allow public update on campaigns"
  ON public.campaigns
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Trigger to keep updated_at fresh on every update
CREATE OR REPLACE FUNCTION public.update_campaigns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER campaigns_updated_at
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_campaigns_updated_at();
