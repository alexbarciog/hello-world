-- Founder automation: private config, post-image worker schedule.
create table if not exists public.ops_config (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);
alter table public.ops_config enable row level security;
-- No policies on purpose: only the service role (edge functions, SQL editor) can read or write it.

insert into public.ops_config (key, value) values
  ('ops_secret', replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '')),
  ('owner_user_id', (select id::text from auth.users where email = 'alexbarciog22@gmail.com'))
on conflict (key) do nothing;

-- Generate images for queued founder posts every 3 minutes.
select cron.unschedule('ops-post-images') where exists (select 1 from cron.job where jobname = 'ops-post-images');
select cron.schedule(
  'ops-post-images',
  '*/3 * * * *',
  $$select net.http_post(
      url := 'https://uwwajlezgeurnvvrvdvb.supabase.co/functions/v1/ops-post-images',
      headers := jsonb_build_object('Content-Type', 'application/json',
                                    'x-ops-secret', (select value from public.ops_config where key = 'ops_secret')),
      body := '{}'::jsonb,
      timeout_milliseconds := 150000
  )$$
);
