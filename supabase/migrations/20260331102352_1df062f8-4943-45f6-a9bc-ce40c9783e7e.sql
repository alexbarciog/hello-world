
-- Add lead_status to contacts table (interested, not_interested, unknown)
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS lead_status text NOT NULL DEFAULT 'unknown';

-- Add lead_status to campaign_connection_requests table
ALTER TABLE public.campaign_connection_requests ADD COLUMN IF NOT EXISTS lead_status text NOT NULL DEFAULT 'unknown';
