-- Persist LinkedIn network distance on contacts so "Exclude 1st degree
-- connections" can filter at SCHEDULING time (not only at send time), and so
-- already-connected leads stop being rescheduled day after day.
-- Populated at discovery (signal pipeline) and refreshed whenever
-- send-connection-requests resolves the profile via Unipile.
ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS network_distance text;
