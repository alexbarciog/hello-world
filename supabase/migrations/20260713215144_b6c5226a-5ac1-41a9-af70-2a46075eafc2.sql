
CREATE TABLE public.linkedin_profile_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  linkedin_url TEXT NOT NULL,
  service_description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  report JSONB,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.linkedin_profile_analyses TO authenticated;
GRANT ALL ON public.linkedin_profile_analyses TO service_role;
ALTER TABLE public.linkedin_profile_analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own analyses" ON public.linkedin_profile_analyses
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_lpa_updated_at BEFORE UPDATE ON public.linkedin_profile_analyses
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE INDEX idx_lpa_user ON public.linkedin_profile_analyses(user_id, created_at DESC);

CREATE TABLE public.profile_analyzer_subscribers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  email TEXT NOT NULL,
  first_name TEXT,
  linkedin_url TEXT,
  service_description TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  unsubscribe_token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  last_sent_at TIMESTAMPTZ,
  send_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profile_analyzer_subscribers TO authenticated;
GRANT ALL ON public.profile_analyzer_subscribers TO service_role;
-- Allow anon to unsubscribe via token (edge function will use service role anyway, but keep RLS safe)
ALTER TABLE public.profile_analyzer_subscribers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own subscription" ON public.profile_analyzer_subscribers
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_pas_updated_at BEFORE UPDATE ON public.profile_analyzer_subscribers
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
