
-- Reddit intent keywords table
CREATE TABLE public.reddit_keywords (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  keyword text NOT NULL,
  subreddits text[] NOT NULL DEFAULT '{}',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.reddit_keywords ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own reddit_keywords" ON public.reddit_keywords FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own reddit_keywords" ON public.reddit_keywords FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reddit_keywords" ON public.reddit_keywords FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own reddit_keywords" ON public.reddit_keywords FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Reddit mentions / discovered posts
CREATE TABLE public.reddit_mentions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  keyword_id uuid REFERENCES public.reddit_keywords(id) ON DELETE CASCADE NOT NULL,
  keyword_matched text NOT NULL,
  subreddit text NOT NULL,
  author text NOT NULL,
  title text NOT NULL,
  body text,
  url text NOT NULL,
  reddit_post_id text NOT NULL,
  score integer DEFAULT 0,
  posted_at timestamptz,
  found_at timestamptz NOT NULL DEFAULT now(),
  dismissed boolean NOT NULL DEFAULT false
);

ALTER TABLE public.reddit_mentions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own reddit_mentions" ON public.reddit_mentions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own reddit_mentions" ON public.reddit_mentions FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage reddit_mentions" ON public.reddit_mentions FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Unique constraint to avoid duplicate posts
CREATE UNIQUE INDEX reddit_mentions_unique_post ON public.reddit_mentions (user_id, reddit_post_id);
