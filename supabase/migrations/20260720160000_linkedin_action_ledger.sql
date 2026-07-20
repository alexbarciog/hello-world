-- Central LinkedIn action ledger + per-account safety state.
-- Every invite/message/like/comment is recorded here; all actors consult it
-- before acting (see supabase/functions/_shared/linkedin-budget.ts).
CREATE TABLE IF NOT EXISTS public.linkedin_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  account_id text,
  action_type text NOT NULL, -- invite | message | like | comment
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_linkedin_actions_user_time
  ON public.linkedin_actions (user_id, created_at DESC);

ALTER TABLE public.linkedin_actions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "linkedin_actions_select_own" ON public.linkedin_actions;
CREATE POLICY "linkedin_actions_select_own" ON public.linkedin_actions
  FOR SELECT USING (auth.uid() = user_id);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS daily_engagement_limit integer DEFAULT 40,
  ADD COLUMN IF NOT EXISTS weekly_invites_limit integer DEFAULT 80,
  ADD COLUMN IF NOT EXISTS linkedin_cooldown_until timestamptz,
  ADD COLUMN IF NOT EXISTS linkedin_ramp_started_at timestamptz;
