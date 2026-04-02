
create table public.meetings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  campaign_id uuid references public.campaigns(id) on delete set null,
  scheduled_at timestamptz not null,
  notes text,
  prep_research jsonb,
  prep_generated_at timestamptz,
  status text not null default 'scheduled',
  created_at timestamptz not null default now()
);

create policy "Users can read own meetings"
  on public.meetings for select to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert own meetings"
  on public.meetings for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own meetings"
  on public.meetings for update to authenticated
  using (auth.uid() = user_id);

create policy "Users can delete own meetings"
  on public.meetings for delete to authenticated
  using (auth.uid() = user_id);

create policy "Service role can manage meetings"
  on public.meetings for all to service_role
  using (true) with check (true);
