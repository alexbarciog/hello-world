# Last run: 2026-11-06 (solutions task; fired about 13:40 UTC, 15:40 Bucharest)

- Setup: no PAUSE file. Repository already cloned and in scope; `git pull origin main` was up to date at db2b355.
  `add_repo` was not available as a tool, as on previous runs. Supabase: the lowercase "supabase" connector reported
  a proxy tunnel error at session start; the "Supabase" connector connected and was used. The only draft in
  blog/drafts/ (outbound-sales-process-for-startups.md, guides) carries a `blocked:` line, so it was not resumed.
- Keyword (published): how to find clients as a fractional cmo (section solutions, cluster find-customers, landing,
  commercial, priority 3, difficulty low).
  "How to Find Clients as a Fractional CMO: Catch the Hiring Week"
  https://intentsly.com/solutions/find-clients-as-a-fractional-cmo
  Gate: first run failed on meta_description length (165, max 160) and the opening paragraph (91 words, max 90);
  after one trim and a reader pass (2,836 to 2,665 words, one FAQ entry and the marketplaces paragraph cut) it
  printed ready: true at 2,665 words, 7 H2, 5 FAQ, 14 internal links, 4 external links, no warnings. Over the
  page-write guide's 2,000-word suggestion for a landing page, in line with the fractional CFO sibling (2,509),
  under the gate's 4,000 cap; the length is the seven-row signal table and the six-row product table.
- Title: 62 characters, two over the guide's soft 60. Every shorter tail tested ("Seven Hiring Moments", "The
  Signal Method", "Where Buyers Post", "The Hiring Week") scored above the gate's 0.75 title-similarity limit
  against the fractional CFO page ("...: Six Signals"); "Catch the Hiring Week" scores 0.72. The meta_title
  ("How to Find Clients as a Fractional CMO (Signal Method)", 55 chars) is what search engines show.
- DATABASE NOTE: the upsert returned published_at 2026-11-05 13:53:20 UTC, almost exactly 24 hours before this
  run. A row for this slug already existed, so yesterday's solutions run (5 Nov, about 13:53 UTC) inserted the
  page into Supabase but never committed or pushed: keywords.json still said queued, there was no brief, draft or
  published file, and log.jsonl had no entry. The same missing-commit pattern was noted on 3 November. Today's
  upsert replaced yesterday's content_md with this run's page (the slug, URL and published_at are unchanged), and
  this run commits the files that were missing. If yesterday's version was preferable, it is gone; nothing of it
  was in the repository to compare. Only the one generated SQL statement was run.
- Angle: page one is Hey CMO (two pages), Fractional Jobs, GrowTal, EverestX, FractionalChiefs and a ClickUp
  template page. All give the same sequence (15 to 25 warm conversations, an announcement post, 3 to 5 posts a
  week, referral swaps with fractional CFOs and agencies, founder communities, marketplaces) and quote rate ranges
  with no source. None names the LinkedIn moments when a company decides it needs a fractional CMO or gives the
  search and the message for each. The page gives seven signals (funding post, head-of-marketing job post,
  "fractional CMO" job post, recommendation request, marketing leader leaving or first sales hire, founder doing
  marketing in public, agency break-up or new market), a week-one plan with LinkedIn's sending caps, the
  Intentsly mapping with the two job-post signals marked as not monitored, and when network, partners and content
  beat signals.
- Outside sources opened today and linked: Lightcast (20 Aug 2026), Go Fractional 2026 State of Fractional Work
  (survey April 2026, n=213), Marketing Week / Slice Network and Robert Half survey of 113 fractional marketing
  leaders (page undated), Fractional Jobs (30 Jan 2026). Also opened, not linked: Hey CMO (31 Aug and 13 Oct
  2026), GrowTal (5 Dec 2025), EverestX (undated), FractionalChiefs (5 Feb 2025), ClickUp. Revelio Labs could not
  be opened (fetch permission withdrawn, nobody to answer), so its fractional-executive figures used on the CFO
  page were left out. Intentsly facts used: 14 qualified demos in 14 days, zero manual outreach, reply rate 4x,
  around 1,000 leads a month per agent, 2 to 4 meetings a week on average (attributed, October 2026), 12 signals
  and 8 to ignore, 2 accounts / 30 / 15 caps, four languages, product.md features only. No price, no Reddit/X
  claims, nothing from the NOT LIVE epics.
- Queue: 9 `solutions` keywords remain queued (next: how to find clients for a lead generation agency, how to get
  clients for an msp, how to find customers for a cybersecurity company, how to get clients for a staffing
  agency, how to find clients for an seo agency, how to get clients for an it consulting company, how to get
  clients for a ppc agency, how to get clients for a video production company, how to get clients as a b2b
  copywriter). Above RUN.md's threshold of 5, so blog-keywords did not run. 15 solutions pages published, 1
  keyword blocked (reddit).
- Caps: second page of 6 November by Bucharest time (cap 7); the gate's weekly count stayed under 45.
- For Alex: (1) check whether the solutions task on 5 November also failed to commit for other reasons: its
  session transcript should show what happened after the Supabase insert; until then, any solutions run may find
  a row already in the database for its slug; (2) a customer example from a consultant or fractional executive
  (which signal, which message, the reply rate) would replace the launch story that every solutions page reuses;
  (3) a price is still blocked by the corrections log; (4) the 21% reply-rate row is still unused pending a
  phrasing you are happy with; (5) the live check for yesterday's learn page (what-is-a-sales-trigger) was never
  performed; see below for whether this run could fetch intentsly.com.
- Live check: see the entry appended after the push.
