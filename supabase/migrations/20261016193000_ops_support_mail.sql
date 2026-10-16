-- Support inbox mirror for info@intentsly.com (SpaceMail), filled by the ops-support-mail function.
create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  message_id text unique,
  imap_uid bigint,
  direction text not null check (direction in ('in', 'out')),
  from_email text,
  from_name text,
  reply_to_email text,           -- where an answer must go (ticket-form mails carry the user's address in the body)
  to_email text,
  subject text,
  body_text text,
  in_reply_to text,
  references_header text,
  received_at timestamptz,
  status text not null default 'new'
    check (status in ('new', 'answered', 'escalated', 'ignored', 'sent', 'failed')),
  category text,                 -- set by the support agent: how_to, bug, billing, cancel, refund, sales, spam, ...
  handled_at timestamptz,
  handled_note text,             -- one line: what was done and why
  answer_to uuid references public.support_messages(id),
  created_at timestamptz not null default now()
);
create index if not exists support_messages_status_idx on public.support_messages (status, received_at);
alter table public.support_messages enable row level security;
-- No policies: service role only.

-- Pull new mail every 10 minutes.
select cron.unschedule('ops-support-mail-sync') where exists (select 1 from cron.job where jobname = 'ops-support-mail-sync');
select cron.schedule(
  'ops-support-mail-sync',
  '*/10 * * * *',
  $$select net.http_post(
      url := 'https://uwwajlezgeurnvvrvdvb.supabase.co/functions/v1/ops-support-mail',
      headers := jsonb_build_object('Content-Type', 'application/json',
                                    'x-ops-secret', (select value from public.ops_config where key = 'ops_secret')),
      body := '{"action":"sync"}'::jsonb,
      timeout_milliseconds := 120000
  )$$
);

-- Drafts-first support: replies are prepared by Claude and sent after approval.
alter table public.support_messages drop constraint if exists support_messages_status_check;
alter table public.support_messages add constraint support_messages_status_check
  check (status in ('new', 'drafted', 'answered', 'escalated', 'ignored', 'sent', 'failed'));
alter table public.support_messages add column if not exists draft_reply text;
