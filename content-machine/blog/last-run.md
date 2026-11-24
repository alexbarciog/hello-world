# Last run: 2026-11-24 (solutions task; fired about 13:40 UTC, 15:40 Bucharest)

- Setup: no PAUSE file. Repository already cloned, in scope and on `main`; `add_repo` is not exposed as a tool in this
  session (as on previous runs), `git pull origin main` reported up to date at fdf23c1 and `git push --dry-run` succeeded.
  Supabase: the lowercase "supabase" connector failed with a proxy tunnel error at session start; the "Supabase"
  connector connected and was used. Web search worked; pages were opened through the web-fetch agent (no direct
  WebFetch tool). Both drafts in blog/drafts/ still carry a `blocked:` line (gate kw_in bug on "business"/"process",
  unchanged), so the queue's next solutions keyword was taken. 0 articles had been published today (Bucharest) before
  this run (daily cap 7); 18 in the last 7 days (weekly cap 45).
- Keyword (published, first attempt): how to find clients as a fractional coo (solutions, find-customers cluster,
  landing type, commercial, priority 3, difficulty low).
  "How to Find Clients as a Fractional COO When Founders Hit the Wall"
  https://intentsly.com/solutions/find-clients-as-a-fractional-coo
- Database: one statement, the generated blog/out/find-clients-as-a-fractional-coo.sql (24,140 bytes,
  md5 cd2366d981696cd25e8f9a0d3ac553fe), run unchanged through the Supabase connector. Returned slug
  find-clients-as-a-fractional-coo, status = published, published_at 2026-11-24 13:49:03 UTC. No other reads or writes.
- Gate: first blog_cloud.py sql run failed on three points (meta_description 165 chars, opening paragraph 97 words,
  "21%" reply rate not in a row whose status is exactly `verified`, since that proof row reads "verified: say ..."
  and gate.py only accepts the bare word). Fixed by shortening the description and opening and dropping the 21%
  sentence (the CFO/CMO/CTO sibling pages do the same). Second run failed only on the opening (93 words); third run
  printed "ready": true (2,947 words, 7 H2, 6 FAQ, 14 internal links, 6 external links, no warnings). Two later
  voice edits inside the message template (a "not X, it is Y" contrast, line reflow) re-ran the gate, still ready.
  Title similarity checked beforehand: "How to Find Clients as a Fractional COO: <anything>" scores 0.76 to 0.84
  against the CFO and CMO sibling titles (limit 0.75), so the colon pattern from page-write.md was dropped for a
  "When Founders Hit the Wall" tail (0.72). Length is in line with the siblings (CFO 2,509, CMO 2,665, CTO 3,112).
- Angle: page one is marketplaces and their resource pages (Fractional Jobs, ExecRoster, Go Fractional), a ClickUp
  template page that is a product blurb, consultants' blogs (Lilach Bullock, Asamby, Kamyar Shah), substacks and
  podcasts. All say network first, announce, post, referrals, marketplace; none gives a LinkedIn search or a message;
  the COO-specific pages are written for buyers. This page turns the buyer-side symptoms (founder bottleneck, hiring
  ahead of onboarding, ops job post, funding, recommendation request, ops lead leaving, systems rollout) into seven
  signals with the Posts-tab/Jobs-tab search and the message for each, a week-one plan with LinkedIn caps, and an
  honest "network, marketplaces, content" section with survey figures linked.
- Outside sources opened today and cited: Go Fractional, 2026 State of Fractional Work PDF (213 practitioners, April
  2026: 90% client acquisition top challenge, 92% personal network, 54% LinkedIn, 29% platforms; operations among the
  strongest-demand functions); Fractional Jobs help article (84% first client from network, its own survey, method
  not stated, attributed as such); Lightcast, The Rise of Fractional Leadership (Aug 2026: 677 US fractional postings
  in 2025, nearly 1,000 in the first seven months of 2026, 97% from SMBs, business management 12%); Revelio Labs on
  the FT story (Sep 2026: 24 of every 1,000 new executive postings fractional, up from nine; CFO 20%, then marketing
  and operations); Umbrex company-readiness chapter (Series A band 30 to 100 employees, checklist items); Lilach
  Bullock (referrals dry up at about 18 months, labelled an observation).
  Not cited: ExecRoster, Pilot and Kamyar Shah rate ranges and cost claims (unsourced on their pages); Kamyar Shah's
  Gartner/Gallup/HBR figures (the primary pages were not opened); Lightcast 34,000/265% and Revelio figures already
  used on the CFO page were not repeated; ClickUp page (no content); Fractional Fridays (paywalled, Upwork-only story);
  Asamby (buyer-side sourcing only).
- Intentsly facts used: 14 qualified demos in 14 days, zero manual outreach, 4x reply rate (case study, labelled as
  our own launch); around 1,000 leads a month per agent and 2 to 4 meetings a week, attributed to October 2026 and
  called typical. Product claims limited to product.md (keyword posts, post engagement, competitor followers/engagers,
  hashtags, ICP scoring, verified emails, export, AI SDR on LinkedIn only with Cal.com/Google Calendar, HubSpot,
  2 accounts, 30/30 caps with 15 recommended, four languages). Jobs-tab signals stated as not monitored. No price.
- Push: see the commit `solutions: publish find-clients-as-a-fractional-coo` on main. Nothing outside content-machine/
  changed. The `blog/out/` SQL file is not tracked.
- Verification: recorded in the run report (sitemap and live URL fetched about 4 minutes after the push).
- Queue: 9 solutions keywords still queued (next: "how to get clients for a pr agency"), so none were added.
  Blog, guides, learn and compare queues untouched.
- For Alex: (1) the "21% reply rate" and "~1,000 leads/month" proof rows are marked "verified: phrase as ..." rather
  than the bare word `verified`, so gate.py does not accept the 21% figure; a row that reads exactly `verified` (with
  the phrasing rule moved into corrections.md) would let pages use it. (2) The two blocked drafts (AI consulting
  solutions page, outbound sales process guide) still wait on the blog_gate.kw_in plural bug, which this task is not
  allowed to fix. (3) A real customer story from a fractional or consulting business (what signals it set, how many
  conversations in month one) would let these solutions pages stop reusing the launch case study. (4) The
  page-write.md title pattern "How to Find Clients as a Fractional X: <promise>" now collides with the gate's 0.75
  title-similarity check for every further fractional role; either relax the pattern in the skill or expect each new
  one to need a different tail.
