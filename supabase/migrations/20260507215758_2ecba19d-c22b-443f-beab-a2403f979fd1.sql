
-- linkedin_posts
CREATE TABLE public.linkedin_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  organization_id uuid,
  content text NOT NULL DEFAULT '',
  image_url text,
  generated_image_prompt text,
  status text NOT NULL DEFAULT 'draft', -- draft|scheduled|posting|posted|failed
  scheduled_for timestamptz,
  posted_at timestamptz,
  unipile_post_id text,
  post_url text,
  comments_spike_enabled boolean NOT NULL DEFAULT false,
  spike_id uuid,
  source_inspiration_id uuid,
  metrics jsonb NOT NULL DEFAULT '{}'::jsonb,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.linkedin_posts ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_linkedin_posts_user ON public.linkedin_posts(user_id);
CREATE INDEX idx_linkedin_posts_sched ON public.linkedin_posts(status, scheduled_for);

CREATE POLICY "Users read own linkedin_posts" ON public.linkedin_posts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Org members read linkedin_posts" ON public.linkedin_posts FOR SELECT TO authenticated USING (organization_id IS NOT NULL AND public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "Users insert own linkedin_posts" ON public.linkedin_posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own linkedin_posts" ON public.linkedin_posts FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own linkedin_posts" ON public.linkedin_posts FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Service role full access linkedin_posts" ON public.linkedin_posts FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE TRIGGER linkedin_posts_updated_at BEFORE UPDATE ON public.linkedin_posts FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER linkedin_posts_org_autofill BEFORE INSERT ON public.linkedin_posts FOR EACH ROW EXECUTE FUNCTION public.autofill_organization_id();

-- design refs
CREATE TABLE public.superscale_design_refs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  organization_id uuid,
  image_url text NOT NULL,
  label text,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.superscale_design_refs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own design_refs" ON public.superscale_design_refs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Org members read design_refs" ON public.superscale_design_refs FOR SELECT TO authenticated USING (organization_id IS NOT NULL AND public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "Users insert own design_refs" ON public.superscale_design_refs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own design_refs" ON public.superscale_design_refs FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own design_refs" ON public.superscale_design_refs FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Service role full access design_refs" ON public.superscale_design_refs FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE TRIGGER design_refs_org_autofill BEFORE INSERT ON public.superscale_design_refs FOR EACH ROW EXECUTE FUNCTION public.autofill_organization_id();

-- inspirations
CREATE TABLE public.superscale_inspirations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  organization_id uuid,
  source_post_url text,
  source_post_id text,
  author_name text,
  author_headline text,
  author_avatar_url text,
  content text,
  likes integer NOT NULL DEFAULT 0,
  comments integer NOT NULL DEFAULT 0,
  reposts integer NOT NULL DEFAULT 0,
  posted_at timestamptz,
  industry text,
  format_tag text,
  discovered_at timestamptz NOT NULL DEFAULT now(),
  dismissed boolean NOT NULL DEFAULT false
);
ALTER TABLE public.superscale_inspirations ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_inspirations_user ON public.superscale_inspirations(user_id, discovered_at DESC);
CREATE POLICY "Users read own inspirations" ON public.superscale_inspirations FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Org members read inspirations" ON public.superscale_inspirations FOR SELECT TO authenticated USING (organization_id IS NOT NULL AND public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "Users update own inspirations" ON public.superscale_inspirations FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Service role full access inspirations" ON public.superscale_inspirations FOR ALL TO service_role USING (true) WITH CHECK (true);

-- metrics daily
CREATE TABLE public.superscale_metrics_daily (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  organization_id uuid,
  date date NOT NULL DEFAULT CURRENT_DATE,
  followers integer NOT NULL DEFAULT 0,
  impressions integer NOT NULL DEFAULT 0,
  engagements integer NOT NULL DEFAULT 0,
  top_post_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);
ALTER TABLE public.superscale_metrics_daily ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own metrics" ON public.superscale_metrics_daily FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Org members read metrics" ON public.superscale_metrics_daily FOR SELECT TO authenticated USING (organization_id IS NOT NULL AND public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "Service role full access metrics" ON public.superscale_metrics_daily FOR ALL TO service_role USING (true) WITH CHECK (true);

-- storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('superscale', 'superscale', true) ON CONFLICT DO NOTHING;

CREATE POLICY "Public read superscale" ON storage.objects FOR SELECT USING (bucket_id = 'superscale');
CREATE POLICY "Users upload superscale own folder" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'superscale' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users update superscale own folder" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'superscale' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete superscale own folder" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'superscale' AND auth.uid()::text = (storage.foldername(name))[1]);
