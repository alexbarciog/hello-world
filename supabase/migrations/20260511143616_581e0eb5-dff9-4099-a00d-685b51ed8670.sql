
CREATE TABLE IF NOT EXISTS public.superscale_queue_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  organization_id uuid,
  day_of_week int NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sun .. 6=Sat
  time text NOT NULL, -- 'HH:MM'
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, day_of_week, time)
);

ALTER TABLE public.superscale_queue_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "queue_slots_select_own" ON public.superscale_queue_slots
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "queue_slots_insert_own" ON public.superscale_queue_slots
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "queue_slots_update_own" ON public.superscale_queue_slots
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "queue_slots_delete_own" ON public.superscale_queue_slots
  FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.superscale_queue_prefs (
  user_id uuid PRIMARY KEY,
  natural_jitter_minutes int NOT NULL DEFAULT 0,
  timezone text NOT NULL DEFAULT 'UTC',
  comments_spike_default boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.superscale_queue_prefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "queue_prefs_select_own" ON public.superscale_queue_prefs
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "queue_prefs_insert_own" ON public.superscale_queue_prefs
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "queue_prefs_update_own" ON public.superscale_queue_prefs
  FOR UPDATE USING (auth.uid() = user_id);
