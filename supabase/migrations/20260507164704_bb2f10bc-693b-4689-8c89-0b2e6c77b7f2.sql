
-- engagement_spikes
CREATE TABLE public.engagement_spikes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  organization_id uuid,
  scheduled_for timestamptz NOT NULL,
  drop_window_minutes int NOT NULL DEFAULT 25,
  spacing_min_seconds int NOT NULL DEFAULT 120,
  spacing_max_seconds int NOT NULL DEFAULT 180,
  target_count int NOT NULL DEFAULT 10,
  keywords text[] NOT NULL DEFAULT '{}',
  filters jsonb NOT NULL DEFAULT '{}'::jsonb,
  tone text NOT NULL DEFAULT 'curious_peer',
  custom_angle text,
  require_approval boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'draft',
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.engagement_spikes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on engagement_spikes"
  ON public.engagement_spikes FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Users can read own engagement_spikes"
  ON public.engagement_spikes FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Org members can read engagement_spikes"
  ON public.engagement_spikes FOR SELECT TO authenticated
  USING (organization_id IS NOT NULL AND public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Users can insert own engagement_spikes"
  ON public.engagement_spikes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own engagement_spikes"
  ON public.engagement_spikes FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own engagement_spikes"
  ON public.engagement_spikes FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER engagement_spikes_autofill_org
  BEFORE INSERT ON public.engagement_spikes
  FOR EACH ROW EXECUTE FUNCTION public.autofill_organization_id();

CREATE TRIGGER engagement_spikes_updated_at
  BEFORE UPDATE ON public.engagement_spikes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX idx_engagement_spikes_user ON public.engagement_spikes(user_id);
CREATE INDEX idx_engagement_spikes_org ON public.engagement_spikes(organization_id);
CREATE INDEX idx_engagement_spikes_status_time ON public.engagement_spikes(status, scheduled_for);

-- engagement_spike_comments
CREATE TABLE public.engagement_spike_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  spike_id uuid NOT NULL REFERENCES public.engagement_spikes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  post_id text,
  post_url text,
  post_author_name text,
  post_author_provider text,
  post_snippet text,
  post_published_at timestamptz,
  comment_text text,
  edited_by_user boolean NOT NULL DEFAULT false,
  scheduled_drop_at timestamptz,
  status text NOT NULL DEFAULT 'drafted',
  unipile_comment_id text,
  sent_at timestamptz,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.engagement_spike_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on engagement_spike_comments"
  ON public.engagement_spike_comments FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Users can read own spike_comments"
  ON public.engagement_spike_comments FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Org members can read spike_comments"
  ON public.engagement_spike_comments FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.engagement_spikes s
    WHERE s.id = engagement_spike_comments.spike_id
      AND s.organization_id IS NOT NULL
      AND public.is_org_member(auth.uid(), s.organization_id)
  ));

CREATE POLICY "Users can update own spike_comments"
  ON public.engagement_spike_comments FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own spike_comments"
  ON public.engagement_spike_comments FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER engagement_spike_comments_updated_at
  BEFORE UPDATE ON public.engagement_spike_comments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX idx_spike_comments_spike ON public.engagement_spike_comments(spike_id);
CREATE INDEX idx_spike_comments_due ON public.engagement_spike_comments(status, scheduled_drop_at);
