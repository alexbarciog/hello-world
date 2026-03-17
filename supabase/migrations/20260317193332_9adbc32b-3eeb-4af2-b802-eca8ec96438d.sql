
CREATE TABLE public.signal_agents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'My Agent',
  status TEXT NOT NULL DEFAULT 'active',
  agent_type TEXT NOT NULL DEFAULT 'recently_changed_jobs',
  keywords TEXT[] DEFAULT '{}',
  results_count INTEGER NOT NULL DEFAULT 0,
  last_launched_at TIMESTAMP WITH TIME ZONE,
  next_launch_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.signal_agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own agents" ON public.signal_agents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own agents" ON public.signal_agents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own agents" ON public.signal_agents FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own agents" ON public.signal_agents FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_signal_agents_updated_at
BEFORE UPDATE ON public.signal_agents
FOR EACH ROW
EXECUTE FUNCTION public.update_campaigns_updated_at();
