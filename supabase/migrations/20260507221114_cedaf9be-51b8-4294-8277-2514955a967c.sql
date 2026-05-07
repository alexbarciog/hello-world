
CREATE TABLE public.superscale_cadence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  organization_id uuid,
  day_of_week int NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  enabled boolean NOT NULL DEFAULT false,
  post_count int NOT NULL DEFAULT 1,
  post_types text[] NOT NULL DEFAULT '{}',
  first_slot text NOT NULL DEFAULT '09:00',
  delay_minutes int NOT NULL DEFAULT 240,
  comments_spike_enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, day_of_week)
);

ALTER TABLE public.superscale_cadence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own cadence" ON public.superscale_cadence
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own cadence" ON public.superscale_cadence
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own cadence" ON public.superscale_cadence
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own cadence" ON public.superscale_cadence
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Service role full access cadence" ON public.superscale_cadence
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Org members read cadence" ON public.superscale_cadence
  FOR SELECT TO authenticated USING (organization_id IS NOT NULL AND is_org_member(auth.uid(), organization_id));

CREATE TRIGGER update_superscale_cadence_updated_at
  BEFORE UPDATE ON public.superscale_cadence
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
