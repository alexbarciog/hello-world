-- Add manual_approval flag to signal_agents
ALTER TABLE public.signal_agents
ADD COLUMN manual_approval boolean NOT NULL DEFAULT false;

-- Add approval_status to contacts
ALTER TABLE public.contacts
ADD COLUMN approval_status text NOT NULL DEFAULT 'auto_approved';

-- Index for efficient filtering
CREATE INDEX idx_contacts_approval_status ON public.contacts (approval_status);
