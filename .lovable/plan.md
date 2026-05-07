## SuperScale — LinkedIn growth sub-app

A complete, self-contained mini-app accessible from the main sidebar via a new "SuperScale" tab. SuperX-inspired layout (left mini-nav + main canvas), but every flow optimized for LinkedIn (1300-char limit, professional tone, single-image best practice, weekday business-hour optimal slots).

---

### 1. Navigation & shell

- New top-level item in `DashboardLayout` sidebar: **SuperScale** (Rocket icon, "New" badge), routes to `/superscale`.
- Inside `/superscale`, render a dedicated `SuperScaleLayout` with its own internal mini-sidebar (SuperX-style):
  - **Home** — overview metrics (followers, impressions, top post, engagement) + queue preview + ready-to-post drafts.
  - **Queue / Calendar** — week-view content calendar with day columns × time slots, drag/click to schedule.
  - **Compose** — post composer (text + image + advanced settings: Comments Spike toggle, schedule time).
  - **Inspiration** — discovered viral LinkedIn posts in user's industry, with "Remix for me" button.
  - **Design References** — upload/pin 5+ reference images that define the user's visual style.
  - **Drafts / Scheduled / Sent** — tabbed list view.

Style: white sidebar (SnowUI), black active state `bg-black/[0.04]`, lime accent for "Schedule" CTA matching brand.

---

### 2. Database (new tables)

- `linkedin_posts` — id, user_id, organization_id, content (text), image_url, status (draft|scheduled|posting|posted|failed), scheduled_for (timestamptz), posted_at, unipile_post_id, post_url, comments_spike_enabled (bool), spike_id (fk), source_inspiration_id (fk nullable), generated_image_prompt, metrics jsonb (likes/comments/views/reposts), error.
- `superscale_design_refs` — id, user_id, organization_id, image_url, label, position, created_at. (Min 5 to enable AI image generation.)
- `superscale_inspirations` — id, organization_id, source_post_url, author_name, author_headline, content, likes, comments, reposts, posted_at, industry, format_tag (listicle|story|hot-take|carousel-text|question), discovered_at, dismissed.
- `superscale_metrics_daily` — user_id, date, followers, impressions, engagements, top_post_id (denormalized snapshot for the Home overview).
- Storage bucket `superscale` (public read) for design refs + generated post images.

All tables: RLS = owner write, org-member read, autofill `organization_id` trigger.

---

### 3. Edge functions

- `superscale-discover-inspiration` — daily cron. Uses Unipile `/linkedin/search` with the user's industry keywords (pulled from their campaign/onboarding ICP) + `posts_with > 100 likes, past_week` filter. Stores top 30 in `superscale_inspirations`.
- `superscale-remix-post` — input: `inspiration_id`. Uses Lovable AI (`google/gemini-3-flash-preview`) to rewrite the viral post in the user's voice, preserving format. Returns draft text.
- `superscale-generate-image` — input: `post_id` or `(text, refs)`. Pulls user's `superscale_design_refs` (≥5 enforced), calls Lovable AI Gateway `google/gemini-2.5-flash-image` (Nano Banana) with reference images + text prompt → uploads PNG to `superscale` bucket → updates `linkedin_posts.image_url`.
- `superscale-publish-post` — pg_cron every minute. Picks `linkedin_posts` where `status='scheduled' AND scheduled_for <= now()`. Posts to Unipile `POST /api/v1/users/me/posts` (text + optional image_url). On success: marks `posted`, stores `unipile_post_id` & `post_url`. If `comments_spike_enabled=true`: kicks `schedule-engagement-spike` with the post's URL/keywords, scheduled `now + 5min`.
- `superscale-fetch-metrics` — daily cron. For each posted post in last 30d, calls Unipile post-stats endpoint and updates `metrics` + `superscale_metrics_daily` snapshot.

---

### 4. Front-end pages/components

- `src/pages/SuperScale.tsx` — wrapper with internal route switch.
- `src/components/superscale/SuperScaleSidebar.tsx` — mini-nav.
- `src/components/superscale/SuperScaleHome.tsx` — followers chart + 4 KPI cards + queue preview + ready-to-post grid (mirrors uploaded SuperX home).
- `src/components/superscale/CalendarWeek.tsx` — 7-col week grid, slot cards show time + post preview, click empty slot → opens Compose pre-filled.
- `src/components/superscale/Compose.tsx` — textarea (1300-char counter), image upload OR "Generate image from my style" button, schedule date/time picker, **"Comments Spike"** toggle (expands to show: spike size 5-20, drop window). Tabs: Compose / Drafts / Scheduled / Sent.
- `src/components/superscale/Inspiration.tsx` — grid of viral posts (search bar, time filter, industry tags). Each card: author, content snippet, like/comment counts, "Remix for me →" button creates draft and routes to Compose.
- `src/components/superscale/DesignRefs.tsx` — drag-drop upload zone for 5+ reference images, grid of pinned refs, delete/reorder.

---

### 5. Comments Spike integration

When user toggles "Comments Spike" on a scheduled post:
- Store `comments_spike_enabled=true` on the post.
- At publish time, `superscale-publish-post` extracts 2-3 keywords from the post text via Lovable AI, then calls `schedule-engagement-spike` with `keywords`, `scheduled_for = posted_at + 30min`, `target_count = 8`, `tone = 'curious_peer'`, `require_approval = false`. The spike then runs through the existing pipeline (discover → generate → process).

---

### Technical notes

- LinkedIn posting via Unipile: `POST https://{DSN}/api/v1/posts` with body `{ account_id, text, attachments?: [{ type:'img', url }] }` (verify exact schema in code; current Unipile docs use `/users/me/posts` for some endpoints — function will probe both and log).
- Image generation: Gemini 2.5 Flash Image accepts multiple input images (the design refs) + text instruction → returns base64 PNG. Upload to `superscale` bucket → public URL.
- Calendar: simple 7-day week starting Monday, 4 time slots/day (8am, 12pm, 4pm, 8pm — LinkedIn-optimal). User can also pick custom time.
- Char limit warning at 1300; hard block at 3000.
- Memory file `mem://features/superscale/overview.md` will be created.
- Limits: max 100 scheduled posts/org, design refs capped at 20.

---

### Out of scope (v1)

- Carousel/PDF posts, video posts, polls.
- Auto-DM, auto-plug, auto-retweet (those are X-specific in SuperX).
- Multi-account posting.
- Analytics deeper than the 4 KPI cards + followers sparkline.

After approval I'll create the migration, add Unipile post endpoint logic, build all UI screens, wire the Comments Spike auto-creation, and update the memory index.