
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL DEFAULT 'info',
  title text NOT NULL,
  body text,
  link text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='notifications' AND policyname='Users can read own notifications') THEN
    CREATE POLICY "Users can read own notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='notifications' AND policyname='Users can update own notifications') THEN
    CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='notifications' AND policyname='Users can delete own notifications') THEN
    CREATE POLICY "Users can delete own notifications" ON public.notifications FOR DELETE TO authenticated USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='notifications' AND policyname='Service role can insert notifications') THEN
    CREATE POLICY "Service role can insert notifications" ON public.notifications FOR INSERT TO service_role WITH CHECK (true);
  END IF;
END $$;

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

INSERT INTO public.notifications (user_id, type, title, body, link)
SELECT user_id, 'lead', '5 new leads discovered', 'Your campaign found 5 high-intent leads matching your ICP.', '/contacts'
FROM public.profiles;

INSERT INTO public.notifications (user_id, type, title, body, link)
SELECT user_id, 'signal', 'Intent signal detected', 'A prospect just changed jobs and matches your ICP criteria.', '/signals'
FROM public.profiles;

INSERT INTO public.notifications (user_id, type, title, body, link)
SELECT user_id, 'info', 'Welcome to Intentsly 🎉', 'Your account is set up. Connect LinkedIn to start discovering leads.', '/settings?tab=linkedin'
FROM public.profiles;
