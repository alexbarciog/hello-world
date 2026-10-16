# Founder automation (set up 16 Oct 2026)

Claude runs the day-to-day of Intentsly through three edge functions, two pg_cron jobs and
three scheduled Claude tasks. Everything is deployed already; this folder documents it.

## Pieces

| Piece | What it does | Schedule |
|---|---|---|
| `supabase/functions/ops-post-images` | Makes an image with OpenAI (`gpt-image-1`) for each of Alex's posts in `linkedin_posts` with status `awaiting_image`, then sets `scheduled`. The existing `superscale-publish-post` publishes it through Unipile. | pg_cron `ops-post-images`, every 3 min |
| `supabase/functions/ops-support-mail` | Mirrors the info@intentsly.com SpaceMail inbox (IMAP) into `support_messages`; `send` replies from the same mailbox (SMTP, copy saved to Sent). | pg_cron `ops-support-mail-sync`, every 10 min |
| `supabase/functions/ops-metrics` | Read-only snapshot: Stripe MRR and subscriptions, signups, agent runs, meetings, content pages, post and support counts. | called by the weekly review |
| Task "Intentsly support desk (drafts)" | Triages new mail, ignores noise, writes reply drafts into `support_messages.draft_reply`, pushes a summary. Sends nothing. | 08:07–22:07 every 2 h |
| Task "Intentsly LinkedIn week prep" | Every Sunday: takes next week's posts from the library (status `draft`), checks text and numbers against `proof.md`, writes image prompts, releases them to the image worker, waits until every image is made and opens, then reports the week. | Sundays 17:47 |
| Task "Intentsly LinkedIn desk" | Checks what posted, retries temporary failures once, warns when the queue runs low. | daily 20:41 |
| Task "Intentsly weekly CEO review" | Metrics vs last week, plan stage, budget cap vs costs, 5 researched growth opportunities; Google Doc + push. | Mondays 07:52 |

All times Europe/Bucharest.

## Config (`public.ops_config`, service role only)
- `ops_secret` — header `x-ops-secret` required by every ops function.
- `owner_user_id` — Alex's Intentsly user (alexbarciog22@gmail.com, LinkedIn connected).
- `budget_rule` — spend cap = 30% of last month's MRR, floor $50.
- `known_costs` — JSON list `{name, usd_per_month, note}`; fill it so the budget check is real.
- `plan_stages` — revenue gates from the company plan.
- `metrics_history` — weekly snapshots written by the CEO review.

## Edge function secrets to set (Supabase dashboard → Edge Functions → Secrets)
- `OPENAI_API_KEY` — images. Optional: `OPENAI_IMAGE_MODEL`, `OPENAI_IMAGE_SIZE` (default 1024x1024), `OPENAI_IMAGE_QUALITY` (default medium).
- `SPACEMAIL_USER` (info@intentsly.com) and `SPACEMAIL_PASSWORD`.

## LinkedIn post library
All planned posts live in `linkedin_posts` as status `draft` with their `scheduled_for` slot. Nothing
happens to drafts until the Sunday week-prep task releases that week's posts. Image look is set in
`ops_config.image_style`.

## Queue a LinkedIn post by hand
```sql
insert into public.linkedin_posts (user_id, content, generated_image_prompt, status, scheduled_for)
values ((select value::uuid from public.ops_config where key = 'owner_user_id'),
        $p$Post text$p$, $p$Image description$p$, 'awaiting_image', '2026-10-21 15:12+03');
```
Without an image: status `scheduled` and no prompt.

## Send an approved support draft
```sql
select net.http_post(
  url := 'https://uwwajlezgeurnvvrvdvb.supabase.co/functions/v1/ops-support-mail',
  headers := jsonb_build_object('Content-Type','application/json','x-ops-secret',(select value from public.ops_config where key='ops_secret')),
  body := jsonb_build_object('action','send','ticket_id','<id>','body_text',(select draft_reply from public.support_messages where id = '<id>')));
```

## Stop everything
`select cron.unschedule('ops-post-images'); select cron.unschedule('ops-support-mail-sync');` and pause the three tasks in the scheduled tasks list.
