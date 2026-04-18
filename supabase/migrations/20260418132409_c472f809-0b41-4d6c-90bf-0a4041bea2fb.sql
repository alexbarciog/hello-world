-- AI Chat messages table for single-session conversational lead finder
CREATE TABLE public.ai_chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role text not null check (role in ('user','assistant','system')),
  content text not null,
  quick_replies jsonb,
  attachment jsonb,
  criteria_snapshot jsonb,
  created_at timestamptz not null default now()
);

CREATE INDEX idx_ai_chat_messages_user_created ON public.ai_chat_messages (user_id, created_at);

ALTER TABLE public.ai_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own ai_chat_messages"
  ON public.ai_chat_messages FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ai_chat_messages"
  ON public.ai_chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own ai_chat_messages"
  ON public.ai_chat_messages FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access on ai_chat_messages"
  ON public.ai_chat_messages FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- Add accumulated AI chat criteria column to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS ai_chat_criteria jsonb;