
create table public.signal_agent_runs (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null,
  user_id uuid not null,
  status text not null default 'running',
  total_tasks integer not null default 0,
  completed_tasks integer not null default 0,
  total_leads integer not null default 0,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  error text
);

create table public.signal_agent_tasks (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.signal_agent_runs(id) on delete cascade,
  agent_id uuid not null,
  signal_type text not null,
  task_key text not null default '',
  status text not null default 'pending',
  leads_found integer not null default 0,
  started_at timestamptz,
  completed_at timestamptz,
  error text
);

alter table public.signal_agent_runs enable row level security;
alter table public.signal_agent_tasks enable row level security;

create policy "Service role manages runs" on public.signal_agent_runs for all to service_role using (true) with check (true);
create policy "Users read own runs" on public.signal_agent_runs for select to authenticated using (auth.uid() = user_id);

create policy "Service role manages tasks" on public.signal_agent_tasks for all to service_role using (true) with check (true);
create policy "Users read own tasks" on public.signal_agent_tasks for select to authenticated
  using (exists (select 1 from public.signal_agent_runs r where r.id = signal_agent_tasks.run_id and r.user_id = auth.uid()));
