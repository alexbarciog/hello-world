## Goal

Let the user paste an X (Twitter) post URL. We scrape everyone who **liked** or **commented** on that post, filter out the post author and the user's competitors, import them into `contacts` with a dedicated agent-like source ("Extracted from post"), tint them soft blue in the Contacts table, tag the signal as `Liked X post` / `Commented on X post` with the post URL saved, then run the normal scoring + campaign enrollment pipeline.

## UX

**Entry point:** On `/contacts`, next to the existing "Find Lookalikes" / "Import from Sales Nav" buttons, add a third button **"Get leads from X post"** with an X icon.

**Modal (`ExtractFromXPostDialog`):**
1. Input: X post URL (validated: matches `x.com/{user}/status/{id}` or `twitter.com/...`).
2. Optional target list dropdown (defaults to auto-created list `Extracted from X post · {date}`).
3. Optional campaign dropdown to enroll into (defaults to none — same behavior as Lookalikes).
4. Which engagements to pull: checkboxes **Likers** (default on) and **Commenters** (default on).
5. CTA: **Extract leads**. Shows a progress state ("Fetching post…", "Pulling engagers…", "Enriching…", "Scoring…"), then closes with a toast: "Imported N leads".

**Contacts table styling:** Rows whose `source` is `x_post_extraction` (or list_name starts with `Extracted from X post`) get a soft blue tint — `bg-sky-50/60 hover:bg-sky-50` on the row and a small sky pill next to the name reading "From X post".

**Signal cell:** shows `Liked X post` or `Commented on X post`; clicking opens the post URL (reuses existing `signal_post_url` render path).

**Agent label:** In the "Source Agent" column we display **"Extracted from post"** for these leads. Implemented as a virtual agent label (no real row in `signal_agents`) via the existing agent-resolution fallback in `Contacts.tsx` (list_name → agent name map), so we don't hit the 2-agent limit.

## Backend

**New edge function `extract-x-post-leads`** (`verify_jwt` handled in code via the caller's JWT):

Inputs: `{ post_url, list_id?, campaign_id?, include_likers, include_commenters }`.

Flow:
1. Auth: read user from JWT, resolve `organization_id` from `profiles`.
2. Parse URL → `{ author_handle, tweet_id }`. Reject if malformed.
3. Fetch post metadata + author via Apify `apidojo~tweet-scraper` (`startUrls: [post_url]`, `maxItems: 1`). Store `post_author_handle`, `post_author_name`, `post_author_id`.
4. Pull **commenters** via Apify `apidojo~tweet-scraper` with `searchTerms: ["conversation_id:{tweet_id}"]`, `sort: "Latest"`, `maxItems: 200`. Extract each reply's `user` object.
5. Pull **likers** via Apify actor `kaitoeasyapi/premium-x-tweet-liker-scraper` (or equivalent liker actor — final actor chosen at build time from Apify's public catalog; fallback to skipping likers with a warning if unavailable). Input: `{ tweet_url: post_url, maxItems: 200 }`.
6. Dedupe by X handle. Drop:
   - The post author.
   - Anyone whose profile URL / handle matches an entry in `campaigns.competitor_pages` (best-effort domain + handle match across the user's campaigns; competitors from any of the user's campaigns count).
   - Protected/suspended accounts with no useful profile.
7. For each remaining engager, upsert into `public.contacts`:
   - `first_name` / `last_name` split from display name; `title = x_bio`; `company = null`; `linkedin_url = null`; `x_url = https://x.com/{handle}` (see schema note below).
   - `signal = 'Liked X post' | 'Commented on X post'`
   - `signal_post_url = post_url`
   - `list_name = 'Extracted from X post · {date}'` (or the passed list)
   - `source = 'x_post_extraction'`
   - `approval_status = 'auto_approved'`, `lead_status = 'unknown'`, `relevance_tier = 'cold'` (updated after scoring).
   - Add row to `contact_lists`.
8. If `campaign_id` provided, insert the contacts into that campaign's list (same pattern used by Lookalikes) so the normal enrollment/scheduler/scoring picks them up.
9. Kick `score-leads` for the target campaign (only when `campaign_id` provided). Without a campaign, leads land in Contacts un-scored (matches Lookalikes behavior).
10. Return `{ inserted, skipped_author, skipped_competitor, skipped_duplicate }`.

**Secrets:** `APIFY_TOKEN` already configured. No new secrets.

## Database

Migration adds two columns to `public.contacts`:
- `source text` — freeform tag (`'x_post_extraction'`, `'lookalike'`, `'agent'`, etc.). Nullable, no default.
- `x_url text` — X profile URL for imported engagers. Nullable.

Both columns are additive; existing RLS policies already cover new columns. No new tables.

## Frontend files touched

- `src/pages/Contacts.tsx` — add "Get leads from X post" button, mount new dialog, add soft-blue row tint + "From X post" pill when `source === 'x_post_extraction'`, add virtual "Extracted from post" agent label mapping.
- `src/components/contacts/ExtractFromXPostDialog.tsx` (new) — modal UI, URL validation, invokes `extract-x-post-leads`, toast + refetch.
- `src/components/contacts/types.ts` — extend `Contact` with `source?: string | null`, `x_url?: string | null`.

## Edge function files

- `supabase/functions/extract-x-post-leads/index.ts` (new).

## Out of scope

- No new signal-agent row, no 2-agent-limit impact.
- No polling/cron — this is a one-shot user-triggered extraction.
- No LinkedIn enrichment of X-imported leads (they stay X-only unless a later feature adds it).
- No changes to `poll-x-signals`, campaign wizard, or existing scoring logic.
