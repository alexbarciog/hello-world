
ALTER TABLE public.linkedin_posts
  ADD COLUMN IF NOT EXISTS auto_dm_commenters_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS auto_dm_message text,
  ADD COLUMN IF NOT EXISTS auto_reply_comments_enabled boolean NOT NULL DEFAULT false;
