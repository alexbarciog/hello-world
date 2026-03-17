
CREATE TABLE public.contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT,
  linkedin_url TEXT,
  title TEXT,
  company TEXT,
  company_icon_color TEXT DEFAULT 'gray',
  signal TEXT,
  ai_score INTEGER NOT NULL DEFAULT 0,
  signal_a_hit BOOLEAN NOT NULL DEFAULT false,
  signal_b_hit BOOLEAN NOT NULL DEFAULT false,
  signal_c_hit BOOLEAN NOT NULL DEFAULT false,
  email TEXT,
  email_enriched BOOLEAN NOT NULL DEFAULT false,
  list_name TEXT DEFAULT 'My List',
  imported_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own contacts" ON public.contacts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own contacts" ON public.contacts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own contacts" ON public.contacts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own contacts" ON public.contacts FOR DELETE USING (auth.uid() = user_id);
