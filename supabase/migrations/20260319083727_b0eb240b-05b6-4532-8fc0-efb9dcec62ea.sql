
ALTER TABLE public.campaigns 
  ADD COLUMN IF NOT EXISTS source_type text DEFAULT 'agent',
  ADD COLUMN IF NOT EXISTS source_agent_id uuid REFERENCES public.signal_agents(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS source_list_id uuid REFERENCES public.lists(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS value_proposition text,
  ADD COLUMN IF NOT EXISTS workflow_steps jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS invitations_sent integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS invitations_accepted integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS messages_sent integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS messages_replied integer DEFAULT 0;
