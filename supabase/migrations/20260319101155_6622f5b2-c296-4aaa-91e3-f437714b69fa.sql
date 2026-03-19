
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS daily_messages_limit integer NOT NULL DEFAULT 15,
  ADD COLUMN IF NOT EXISTS daily_connections_limit integer NOT NULL DEFAULT 15;
