# Last run: 2026-11-13 (guides task; fired about 08:20 UTC, 10:20 Bucharest)

- Setup: no PAUSE file. Repository already cloned, in scope and on `main` (`add_repo` is still not
  available as a tool, as on previous runs); `git pull origin main` already up to date at e664f0b.
  Supabase: the lowercase "supabase" connector again reported a proxy tunnel error at session start;
  the "Supabase" connector connected and was used. Web search worked. The only draft in blog/drafts/
  (outbound-sales-process-for-startups.md, guides) carries a `blocked:` line, so it was not resumed.
- Keyword (published): how to track job changes on linkedin for sales (section guides, cluster
  linkedin-signals, guide, commercial, priority 2, difficulty medium).
  "How to Track Job Changes on LinkedIn for Sales: 6 Steps"
  https://intentsly.com/guides/track-job-changes-on-linkedin-for-sales
- ORPHAN ROW FOUND AND RESOLVED (second time; same pattern as the x-twitter article on 9 November).
  A read-only select before writing showed a row for this slug already in public.blog_posts: same
  title, 2,857 words, created and updated 2026-11-06 08:35:21 UTC. The repository had no published
  file, no brief, no log line, and the keyword was still `queued`, so the guides run of 6 November
  inserted the row and never committed (the page has been live for a week, invisible to the pipeline,
  and the keyword would have been re-attempted every guides run until resolved). Decision: the
  6 November text was read back and saved as
  blog/recovered/track-job-changes-on-linkedin-for-sales.2026-11-06.md, then today's article was
  researched from sources opened today and upserted with the generated SQL unchanged; its
  `on conflict (slug) do update` replaced the content and kept the original published_at (Supabase
  returned status = published, published_at 2026-11-06 08:35:21 UTC). A follow-up select confirmed the
  stored content_md md5 (6da43013cf3a5c61066bb3dee44efa27, 20,737 chars) equals the local file. The
  published file's front matter says published_at today; the database says 6 November; the site reads
  the database. Writes: the one generated SQL statement. Reads: three selects (orphan check, read-back,
  hash check).
- Gate: one fail on the first run (meta description 161 chars, cap 160), fixed by one word; then
  "ready": true. Final: 3,189 gate-counted words (published guides run 2,655 to 3,469 by the same
  counter), 12 H2, 6 FAQ, 8 internal links, 10 external links, one warning (the exact keyword phrase
  never appears; the opening and the first H2 use "track job changes on LinkedIn for sales", which the
  gate's loose match accepts). No em dashes, no banned phrases.
- Angle: page one is catchintent.com (22 Jul 2026), keepsync.io (17 Dec 2025), launchleads.com
  (modified 13 Feb 2026), saava.io (21 Jun 2026), useembers.com (17 Jun 2026), joshasbury.com
  (17 Aug 2023) and getcleed.com (5 Apr 2026). All but Asbury are vendor or agency pages; none gives
  both the free click path and the Sales Navigator path; most statistics are unsourced or point at a
  vendor landing page. The guide gives a four-surface routine (free Catch Up tab and job-change
  notification, Sales Navigator saved-lead alert, Job Changes spotlight search, monthly Past company
  and Google sweep) with exact click paths, a coverage table (who each surface sees, misses, how late),
  a watch-list cohort table, a four-question score, two templates, a labelled hypothetical, and the
  plain statement that Intentsly reads posts and engagement and does not keep a job-change database.
- Sources opened today and linked: business.linkedin.com/sell/sales-navigator/how-to-use ("alerts
  when they make a move, like changing jobs"; "Job Changes filter within the Spotlights section";
  Account pages show "which decision-makers have joined or left"; "62% more receptive", no method
  given, labelled as LinkedIn's claim); guideflow.com job-changes notification walkthrough (updated
  20 Mar 2026, click path); techcrunch.com/?p=2661419 (Catch Up tab launch report; the canonical
  dated URL could not be opened, so the month is not stated in the article); evaboot.com alerts guide
  (14 Nov 2023; "Lead Changed Jobs", "Lead Changed Roles", Email Preferences > Alert Preferences);
  evaboot.com filters guide (2022; older "Changed jobs" label, "last 90 days");
  usergems.com/contact-tracking-3x (20% a year, 2% to 4% a month, vendor figures, labelled);
  salesmotion.io champion-tracking guide (updated 25 Oct 2026; 200 to 300 contacts, 2 to 4 hours a
  quarter, six weeks late, "weeks late or not at all"); catchintent.com (alerts "lag 1-4 weeks",
  labelled as its observation); joshasbury.com (44,000 to 156; Past Customers at New Companies);
  getcleed.com (Google Alert idea); useembers.com (ten-point model, 48 hours). Opened, not linked:
  keepsync.io, launchleads.com, saava.io, scommunity.linkedin.com "How to act on alerts" (2020, does
  not cover job changes), the Google Workspace Marketplace add-on listing. Could not be opened:
  linkedin.com/help/sales-navigator and the canonical TechCrunch URL (fetch permission withdrawn).
  Intentsly facts used: LinkedIn-only monitoring (posts and engagement), ICP scoring, /try-ai with no
  account. No price, no Reddit/X, nothing from the NOT LIVE epics, no invented customers or numbers.
- Queue: 6 `guides` keywords still queued (5 or more, so blog-keywords was not run). Next up per
  blog_next is "how to find leads from linkedin events". The blocked guides draft
  (outbound-sales-process-for-startups) still waits on the gate's handling of the word "process".
- Caps: first page of 13 November by Bucharest time (cap 7); weekly count well under 45.
- Live check: see the follow-up commit note below this line if present; otherwise the check had not
  yet run when this file was written.
- For Alex: (1) decide whether to keep today's version or restore the 6 November text from
  blog/recovered/ (say so and the next run can upsert it back); (2) two orphan rows in eight days
  (5 Nov blog, 6 Nov guides) means sessions are dying between the insert and the push. Worth a
  quick scan of public.blog_posts for slugs with no file in blog/published/ (a read-only select of
  slug, section, published_at ordered by date is enough); the next run can do this if you want it as
  a standing step; (3) a first-hand job-change story (one past user who moved and became a customer,
  or one who did not) would turn the worked example from hypothetical into measured; (4) a price is
  still blocked by the corrections log; (5) the 21% reply-rate row is still unused pending a phrasing
  you are happy with.
