CREATE TABLE public.processed_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  social_id TEXT NOT NULL,
  agent_id UUID NOT NULL REFERENCES public.signal_agents(id) ON DELETE CASCADE,
  processed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (social_id, agent_id)
);

ALTER TABLE public.processed_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage processed_posts"
  ON public.processed_posts FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE INDEX idx_processed_posts_agent_id ON public.processed_posts(agent_id);