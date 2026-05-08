
CREATE TABLE public.superscale_style_profile (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  organization_id uuid,
  style_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  refs_hash text,
  refs_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.superscale_style_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own style profile"
  ON public.superscale_style_profile FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users insert own style profile"
  ON public.superscale_style_profile FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own style profile"
  ON public.superscale_style_profile FOR UPDATE
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users delete own style profile"
  ON public.superscale_style_profile FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Service role full access style profile"
  ON public.superscale_style_profile FOR ALL
  TO service_role USING (true) WITH CHECK (true);

CREATE TRIGGER trg_superscale_style_profile_updated
  BEFORE UPDATE ON public.superscale_style_profile
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
