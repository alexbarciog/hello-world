## Comments Scheduling — Engagement Spikes

A new dashboard section where the user schedules an "engagement spike" at a target time. Intentsly finds relevant LinkedIn posts via Unipile, drafts human-sounding AI comments, lets the user review/edit, then drops them sequentially in a tight window before the spike time so the post receives a burst of comment activity.

### 1. Concept

A **Spike** = one scheduled burst of N comments on N different posts, all landing inside a short window ending at the user's chosen "spike time".

Defaults (editable per spike):
- Window: comments start dropping `25 min` before spike time
- Spacing: `2–3 min` between each comment (jittered, not fixed)
- Posts per spike: 5–15 (user picks)
- Posts must be recent (last 24–48h) and from the user's 1st/2nd network or matching keywords

### 2. Left nav entry

Add a new nav item to `DashboardLayout.tsx` sidebar:
- Label: **Engagement Spikes**
- Icon: `Flame` (lucide)
- Route: `/dashboard/engagement-spikes`
- Placed under "Unibox" / above "Signals" group (engagement-flavored)

### 3. Pages & UI

**`/dashboard/engagement-spikes` — list page (`EngagementSpikes.tsx`)**
- Header with `+ Schedule a spike` CTA
- Tabs: `Upcoming` · `Live` · `Completed`
- Spike card: target time, countdown, keyword chips, status pill (`drafting` / `ready` / `running` / `done` / `failed`), progress `3/10 comments dropped`, quick actions (Pause, Cancel, View)

**`ScheduleSpikeWizard.tsx` (dialog, 3 steps)**
1. **When & how big** — Date+time picker, comments count (5/10/15), drop window (15/25/40 min), spacing (2–3 / 3–5 min)
2. **What to engage with** — Keywords/topics textarea, optional filters: language, recency (24h/48h/7d), network (1st/2nd/anyone), min reactions, exclude my own posts
3. **Tone & guardrails** — Tone preset (Curious peer / Hot take / Supportive / Playful), 1–2 sentences, max length, optional "personal angle" the AI should weave in (pulled from `organizations.company_description` by default), forbidden phrases (banned list inherited from AI SDR memory: no "leverage", "synergy", etc.). Toggle: `Require my approval before drop` (default ON for first spike, OFF after).

**`SpikeDetail.tsx` (route `/dashboard/engagement-spikes/:id`)**
- Timeline of scheduled comments with: post preview (author, snippet, link), drafted comment (editable until T-2min), planned drop time, status (`scheduled` / `sent` / `failed` / `skipped`)
- Inline regenerate per comment, swap post button
- Live progress bar to spike time

### 4. Data model (new tables)

```text
engagement_spikes
  id, user_id, organization_id
  scheduled_for         timestamptz   -- the spike time
  drop_window_minutes   int default 25
  spacing_min_seconds   int default 120
  spacing_max_seconds   int default 180
  target_count          int default 10
  keywords              text[]
  filters               jsonb         -- recency, network, language, min_reactions, exclude_self
  tone                  text
  custom_angle          text
  require_approval      boolean default true
  status                text          -- draft | discovering | ready | running | completed | failed | cancelled
  error                 text
  created_at, updated_at

engagement_spike_comments
  id, spike_id, user_id
  post_id               text          -- Unipile post id
  post_url              text
  post_author_name      text
  post_author_provider  text
  post_snippet          text
  post_published_at     timestamptz
  comment_text          text
  edited_by_user        boolean
  scheduled_drop_at     timestamptz
  status                text          -- drafted | approved | sent | failed | skipped
  unipile_comment_id    text
  sent_at               timestamptz
  error                 text
  created_at, updated_at
```
RLS: org members can read; only owner can insert/update; service role full access. Triggers: `autofill_organization_id`, `handle_updated_at`.

### 5. Edge functions

| Function | Role |
|---|---|
| `schedule-engagement-spike` (verify_jwt=false, JWT in code) | Creates the spike row, kicks off discovery |
| `discover-spike-posts` | Calls Unipile `POST /api/v1/linkedin/search` with `category: 'posts'`, applies recency/network filters, returns top N candidate posts, stores them as `engagement_spike_comments` rows in `drafted` status |
| `generate-spike-comments` | Batched Lovable AI Gateway call (`google/gemini-2.5-flash`) — prompt enforces: ≤2 sentences, lowercase-friendly, no banned words, weave in `custom_angle`, react to the post's specific point (not generic). Stores `comment_text`. Pre-computes `scheduled_drop_at = scheduled_for - random(120..(window*60)) seconds`, sequenced with `spacing_min/max` jitter so they land between `T-window` and `T-2min`, in random order |
| `process-engagement-spikes` (cron, every minute) | Picks `engagement_spike_comments` where `status in ('approved','drafted-no-approval-required')` and `scheduled_drop_at <= now()`, posts via Unipile `POST /api/v1/posts/{post_id}/comments` with the user's `unipile_account_id`, marks `sent` / `failed`. Updates parent spike status when all done |
| `cancel-engagement-spike` | Marks spike + pending comments cancelled |

Cron (pg_cron + pg_net): `process-engagement-spikes` every minute. Add `[functions.*]` entries with `verify_jwt = false` in `supabase/config.toml`.

### 6. AI prompt rules (human-as-fuck)

System prompt highlights:
- Read the post, react to ONE specific idea in it
- 1–2 sentences, ≤180 chars, no greeting, no sign-off
- Conversational, lowercase ok, contractions, mild imperfections allowed
- Never use: "leverage", "synergy", "tech stack", "great post", "love this", "100%", "🔥", emoji unless tone=Playful
- Never pitch, never link, never @mention
- Inject `custom_angle` only when it fits naturally; otherwise omit

### 7. Safety / limits

- Hard cap: 2 active spikes per org at a time, max 20 comments per spike
- Respects user's `daily_messages_limit` budget (counts comments toward it)
- Refuses to schedule if `unipile_account_id` is missing or LinkedIn shows disconnected
- Skips posts the user has already commented on (checked via Unipile post comments)
- Requires Pay-on-Success billing same as other outbound features (reuse existing gating helper)

### 8. Files to add / touch

| File | Change |
|---|---|
| `src/components/DashboardLayout.tsx` | Add "Engagement Spikes" nav item |
| `src/App.tsx` | Add 2 routes (`/dashboard/engagement-spikes`, `/dashboard/engagement-spikes/:id`) |
| `src/pages/EngagementSpikes.tsx` | List page + tabs |
| `src/pages/SpikeDetail.tsx` | Detail/timeline page |
| `src/components/spikes/ScheduleSpikeWizard.tsx` | 3-step dialog |
| `src/components/spikes/SpikeCommentRow.tsx` | Editable comment row component |
| `supabase/functions/schedule-engagement-spike/index.ts` | Orchestrator entry |
| `supabase/functions/discover-spike-posts/index.ts` | Unipile post search |
| `supabase/functions/generate-spike-comments/index.ts` | AI drafting |
| `supabase/functions/process-engagement-spikes/index.ts` | Cron worker |
| `supabase/functions/cancel-engagement-spike/index.ts` | Cancellation |
| `supabase/config.toml` | Register the 5 functions |
| migration | `engagement_spikes`, `engagement_spike_comments`, RLS, triggers, indexes on `(status, scheduled_drop_at)` |
| pg_cron insert | minute-level trigger for `process-engagement-spikes` |
| `mem://features/engagement-spikes/overview` | New memory + index update |

### 9. Open questions before building

1. Should the spike post comments **as the user's LinkedIn account** (via their existing Unipile connection) — confirming this is the intended posting identity?
2. For the first version, restrict to **LinkedIn only**, or also schedule X/Reddit comment spikes later?
3. Should we surface a **"feed" mode** (engage on posts from a curated list of profiles, e.g. dream prospects) in addition to keyword search? Useful for warming up specific accounts.
