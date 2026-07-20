-- Cache the AI-generated business context once per account so keyword and
-- hashtag generation reuse it instead of re-scraping and re-analysing the
-- user's website on every "generate" click.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS business_context jsonb,
  ADD COLUMN IF NOT EXISTS business_context_updated_at timestamp with time zone;
