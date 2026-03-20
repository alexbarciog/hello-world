
-- X Keywords table (mirrors reddit_keywords)
CREATE TABLE public.x_keywords (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  keyword text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.x_keywords ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own x_keywords" ON public.x_keywords FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own x_keywords" ON public.x_keywords FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own x_keywords" ON public.x_keywords FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own x_keywords" ON public.x_keywords FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- X Mentions table (mirrors reddit_mentions)
CREATE TABLE public.x_mentions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  keyword_id uuid NOT NULL REFERENCES public.x_keywords(id),
  keyword_matched text NOT NULL,
  author text NOT NULL,
  author_name text,
  title text NOT NULL,
  body text,
  url text NOT NULL,
  x_post_id text NOT NULL,
  like_count integer DEFAULT 0,
  retweet_count integer DEFAULT 0,
  reply_count integer DEFAULT 0,
  posted_at timestamptz,
  found_at timestamptz NOT NULL DEFAULT now(),
  dismissed boolean NOT NULL DEFAULT false,
  saved boolean NOT NULL DEFAULT false,
  CONSTRAINT x_mentions_user_id_x_post_id_key UNIQUE (user_id, x_post_id)
);

ALTER TABLE public.x_mentions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own x_mentions" ON public.x_mentions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own x_mentions" ON public.x_mentions FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage x_mentions" ON public.x_mentions FOR ALL TO service_role USING (true) WITH CHECK (true);
