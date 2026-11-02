-- Epic 4: free tools. Everything here is written by the free-tool edge function
-- (service role). No client access at all: RLS on, no policies.

-- Emails people leave on a tool page; Epic 5b's nurture reads these.
CREATE TABLE IF NOT EXISTS public.tool_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  tool text NOT NULL,
  input_summary text,
  result_summary text,
  consent_marketing boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS tool_leads_email_idx ON public.tool_leads (lower(email));
CREATE INDEX IF NOT EXISTS tool_leads_created_idx ON public.tool_leads (created_at DESC);
ALTER TABLE public.tool_leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins read tool leads" ON public.tool_leads;
CREATE POLICY "Admins read tool leads" ON public.tool_leads FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 20 AI calls per IP per day, per tool. The IP is stored hashed.
CREATE TABLE IF NOT EXISTS public.tool_usage (
  ip_hash text NOT NULL,
  tool text NOT NULL,
  day date NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  calls integer NOT NULL DEFAULT 0,
  PRIMARY KEY (ip_hash, tool, day)
);
ALTER TABLE public.tool_usage ENABLE ROW LEVEL SECURITY;

-- Identical inputs reuse the earlier AI answer.
CREATE TABLE IF NOT EXISTS public.tool_cache (
  key text PRIMARY KEY,
  tool text NOT NULL,
  result jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tool_cache ENABLE ROW LEVEL SECURITY;

-- Atomically counts a call; false once the daily limit is reached.
CREATE OR REPLACE FUNCTION public.tool_rate_limit(_ip_hash text, _tool text, _max integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  used integer;
BEGIN
  INSERT INTO public.tool_usage (ip_hash, tool, calls) VALUES (_ip_hash, _tool, 1)
  ON CONFLICT (ip_hash, tool, day) DO UPDATE SET calls = public.tool_usage.calls + 1
  RETURNING calls INTO used;
  RETURN used <= _max;
END;
$$;
REVOKE ALL ON FUNCTION public.tool_rate_limit(text, text, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.tool_rate_limit(text, text, integer) TO service_role;

-- Anonymised stats for the buying-signal finder: how many signals in the last
-- 30 days mention these terms, and the roles behind them. No names, no post
-- text. The count is only returned at 10+ and a role only at 3+, so nothing
-- can be traced to one person. Service role only: arbitrary-term probing goes
-- through the free-tool function's rate limit.
CREATE OR REPLACE FUNCTION public.buying_signal_stats(_terms text[])
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH patterns AS (
    SELECT '%' || replace(replace(replace(lower(t), '\', '\\'), '%', '\%'), '_', '\_') || '%' AS p
    FROM unnest(_terms) AS t
    WHERE length(trim(t)) >= 3
    LIMIT 10
  ),
  matched AS (
    SELECT c.title
    FROM public.contacts c
    WHERE c.imported_at > now() - interval '30 days'
      AND EXISTS (
        SELECT 1 FROM patterns
        WHERE lower(coalesce(c.signal, '') || ' ' || coalesce(c.signal_post_excerpt, '')) LIKE patterns.p
      )
  ),
  roles AS (
    SELECT initcap(trim(title)) AS role, count(*) AS n
    FROM matched
    WHERE title IS NOT NULL AND length(trim(title)) BETWEEN 2 AND 60
    GROUP BY 1
    HAVING count(*) >= 3
    ORDER BY n DESC
    LIMIT 5
  )
  SELECT jsonb_build_object(
    'count', CASE WHEN (SELECT count(*) FROM matched) >= 10 THEN (SELECT count(*) FROM matched) END,
    'roles', coalesce((SELECT jsonb_agg(role) FROM roles), '[]'::jsonb)
  );
$$;
REVOKE ALL ON FUNCTION public.buying_signal_stats(text[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.buying_signal_stats(text[]) TO service_role;
