alter table public.signal_agent_runs
  add column if not exists rejected_profiles_sample jsonb not null default '[]'::jsonb,
  add column if not exists ai_suggestions jsonb,
  add column if not exists suggestions_generated_at timestamptz;

alter table public.signal_agent_tasks
  add column if not exists rejected_profiles_sample jsonb not null default '[]'::jsonb;