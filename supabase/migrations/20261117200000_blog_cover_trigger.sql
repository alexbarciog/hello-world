-- Automatic cover images for content pages (blog, guides, learn, solutions, compare).
-- When a row is published, or the title of a published row changes, ask the blog-cover edge
-- function to render superscale/covers/<slug>.png and set cover_image_url.
-- pg_net queues the request and sends it after the transaction commits, so the function reads
-- the committed row. Any failure here only raises a WARNING: the blog_posts write never fails.
-- Idempotent: safe to re-run.

CREATE OR REPLACE FUNCTION public.blog_cover_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_secret text;
BEGIN
  IF NEW.status = 'published'
     AND (TG_OP = 'INSERT'
          OR NEW.title IS DISTINCT FROM OLD.title
          OR OLD.status IS DISTINCT FROM 'published') THEN
    BEGIN
      SELECT c.value INTO v_secret FROM public.ops_config c WHERE c.key = 'ops_secret';
      IF v_secret IS NOT NULL THEN
        PERFORM net.http_post(
          url := 'https://uwwajlezgeurnvvrvdvb.supabase.co/functions/v1/blog-cover',
          body := jsonb_build_object('slug', NEW.slug),
          headers := jsonb_build_object('Content-Type', 'application/json', 'x-ops-secret', v_secret),
          timeout_milliseconds := 60000
        );
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'blog_cover_request(%): %', NEW.slug, SQLERRM;
    END;
  END IF;
  RETURN NULL;
END
$$;

REVOKE ALL ON FUNCTION public.blog_cover_request() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE TRIGGER blog_posts_cover
AFTER INSERT OR UPDATE OF title, status ON public.blog_posts
FOR EACH ROW EXECUTE FUNCTION public.blog_cover_request();

-- A new cover image is not a content change. Without this, setting cover_image_url (the backfill
-- touches every published row) would bump updated_at, which feeds sitemap <lastmod> and
-- dateModified. updated_at now moves only when some other column actually changes.
CREATE OR REPLACE FUNCTION public.blog_posts_touch()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF (to_jsonb(NEW) - 'cover_image_url' - 'updated_at') = (to_jsonb(OLD) - 'cover_image_url' - 'updated_at') THEN
    RETURN NEW;
  END IF;
  NEW.updated_at = now();
  RETURN NEW;
END
$$;
