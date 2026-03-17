CREATE TABLE IF NOT EXISTS public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  company_size TEXT,
  industry TEXT,
  location TEXT,
  score INTEGER NOT NULL DEFAULT 0,
  precision_tier TEXT NOT NULL DEFAULT 'discovery',
  signal_a_hit BOOLEAN NOT NULL DEFAULT false,
  signal_b_hit BOOLEAN NOT NULL DEFAULT false,
  signal_c_hit BOOLEAN NOT NULL DEFAULT false,
  reason TEXT
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert on leads"
  ON public.leads FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public select on leads"
  ON public.leads FOR SELECT
  TO public
  USING (true);