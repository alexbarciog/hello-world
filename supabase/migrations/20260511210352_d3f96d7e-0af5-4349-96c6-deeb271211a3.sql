ALTER TABLE public.linkedin_posts
  ADD COLUMN IF NOT EXISTS auto_comment_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS auto_comment_text text,
  ADD COLUMN IF NOT EXISTS auto_comment_trigger text,
  ADD COLUMN IF NOT EXISTS auto_comment_threshold integer,
  ADD COLUMN IF NOT EXISTS auto_comment_posted_at timestamp with time zone;