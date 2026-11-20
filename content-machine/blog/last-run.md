# Last run: 2026-11-20 (guides task; fired about 08:20 UTC, 10:20 Bucharest)

- Setup: no PAUSE file. Repository already cloned, in scope and on `main`; `add_repo` is still not exposed as a
  tool in this session (as on previous runs), `git pull origin main` reported up to date at fc4b882. Supabase: the
  lowercase "supabase" connector again failed with a proxy tunnel error at session start; the "Supabase"
  connector connected and was used. Web search worked; pages were opened through the web-fetch agent (no direct
  WebFetch tool). No unblocked draft was waiting in blog/drafts/, so the queue's next keyword was taken. 0
  articles had been published today (UTC) before this run (daily cap 7); 16 in the last 7 days (weekly cap 45).
- Keyword (published, first attempt): how to find leads from linkedin events (guides, linkedin-prospecting,
  guide, commercial, priority 2, difficulty medium).
  "How to Find Leads From LinkedIn Events in 7 Steps"
  https://intentsly.com/guides/find-leads-from-linkedin-events
- Database: a read-only select before writing returned no row for the slug. The insert returned
  status = published, published_at 2026-11-20 08:38:23 UTC. Writes: one statement, the generated
  blog/out/find-leads-from-linkedin-events.sql (26,644 bytes). Honesty note: when pasting the file into the
  connector one line of the ON CONFLICT clause (`article_type = excluded.article_type,`) was dropped by
  mistake. The slug did not exist, so the INSERT branch ran and the UPDATE branch was never evaluated; the
  stored row is therefore identical to what the unchanged file would have produced. Post-insert check against
  the local file: content_md length 21,482 and md5 c6f952b1..., word_count 3369, reading_minutes 15,
  article_type guide, section guides, 6 FAQ entries, 5 secondary keywords: all matched exactly. Reads: two
  selects (the pre-check and the post-insert comparison).
- Gate: first local run failed on one point (opening paragraph 96 words, max 90). Shortened it to 83 words and
  trimmed the body; second run passed with no warnings; blog_cloud.py sql printed "ready": true, no warnings.
  12 H2, 6 FAQ, 8 internal links, 8 external links (all opened today), no em dashes, no banned phrases. Gate
  word count 3,369 (prose without tables and code blocks about 3,200), in line with the other published guides
  (3,003 to 3,649).
- Angle: page one is vendor how-tos (Linkyfy, GTM Bud, Leadin, Linkwheelie) that stop at "click Attend, filter,
  send a connection note" and end on their own scraper or automation. This guide treats the attendee list as a
  filter problem: a buyer-event vs peer-event test before joining, the exact list filters as a table, the event
  feed (commenters and reactors) as a second higher-intent list, a four-question scoring sheet, the
  message-request-before / connection-request-after split with every limit sourced, three message templates, a
  labelled hypothetical example (Harbor Analytics) with counts, the three failure modes and the outbound step.
  Brief: blog/briefs/find-leads-from-linkedin-events.md.
- Outside sources opened 2026-11-20 and linked: support.phantombuster.com LinkedIn Event Guests Export (must be
  an attendee; export capped at the first 1,000 attendees, "the maximum LinkedIn displays"); evaboot.com
  export-linkedin-event-attendees (must join to see the full list; attendees can hide from non-attending 1st
  degree; cannot bulk-message attendees); coldiq.com extract-people-linkedin-event-phantombuster (only
  displayed to people who joined; pick 100+ events); getcontrast.io mini-guide (organiser-side export from
  analytics); expandi.io state-of-li-outreach-h1-2026 (70,130+ campaigns; event campaigns 14.21% reply vs
  10.3% average; LinkedIn caps requests at 80 to 100 a week; cannot message the entire event audience);
  expandi.io linkedin-outreach-benchmarks-2026 (13.2M requests May 2025 to Apr 2026; 28.5% acceptance; 3.0%
  note reply); gtmbud.com (ToS warning; message requests; 48-hour and two-week windows); linkyfy.ai (ToS
  warning). Not opened: all six LinkedIn Help pages on events (robots-disallowed for the fetch tool), so the
  attendee-list rule is attributed to the vendor pages and the guide says so; commentrocket.com
  (robots-disallowed); overloop.com/blog/linkedin-limits (permission prompt an unattended run cannot answer);
  expandi H2 2026 report opened but had no event segment and was not cited.
- Intentsly facts used: none beyond product.md confirmed rows (LinkedIn signals: post engagement on posts of
  industry leaders; ICP scoring) at the Step 4 sentence and the /try-ai closing. No Intentsly numbers, no
  price, no Reddit/X claim. first_hand points at brain/stories/dogfooding-14-demos.md but the story is not
  quoted in this page. CTA /try-ai; /features/linkedin-signals linked once at the step it replaces.
- Guides queue after this run: 5 keywords still queued (linkedin groups, connection request that gets
  accepted, companies using a competitor's product, linkedin follow-up sequence, research a prospect before
  outreach); 48 queued across all sections. Step 6 (add more when fewer than 5 are queued) did not trigger;
  it will trigger on the next guides run, which should follow skills/blog-keywords.md and add 8 to 12
  guides keywords.
- Verification: database row confirmed published and content-identical to the local file; commit pushed to
  origin/main (hash in git log, message `guides: publish find-leads-from-linkedin-events`). The live-page and
  sitemap check about 4 minutes after the push is recorded in the run report (intentsly.com fetches were
  blocked by a permission prompt on the previous run, so it may again be unconfirmed by this run).
- For the founder: (1) a first-hand event story would make this guide much stronger: has Alex ever joined a
  LinkedIn event to prospect, how many names survived the filters, what replied; (2) confirm whether the
  attendee list on LinkedIn really stops at about 1,000 names and whether the Message button appears for
  non-connected attendees on the current UI, since LinkedIn's help pages cannot be opened by this pipeline;
  (3) the 21% reply-rate row in proof.md is still marked "verified: say ..." rather than plain `verified`, so
  pages cannot quote it; (4) the two blocked drafts (AI consulting clients; startup outbound process) still
  wait on first-hand material; (5) confirm the pricing figure so pages can print a number.
