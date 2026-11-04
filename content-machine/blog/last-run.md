# Last run: 2026-11-04 (solutions task; fired about 13:40 UTC, 15:40 Bucharest)

- Setup: no PAUSE file. Repository already cloned and in scope; `git pull origin main` was up to date at 2476390.
  `add_repo` was not available as a tool, as on previous runs. Supabase: the lowercase "supabase" connector reported
  a proxy tunnel error at session start; the "Supabase" connector connected and was used. The only other draft in
  blog/drafts/ (outbound-sales-process-for-startups.md, guides) carries a `blocked:` line, so it was not resumed.
- Keyword (published): how to get clients for a software development company (section solutions, cluster
  find-customers, landing, commercial, priority 3, difficulty low).
  "Get Clients for a Software Development Company: 7 Signals"
  https://intentsly.com/solutions/get-clients-for-a-software-development-company
  Title note: the "How to Get Clients for a Software Development Company: 7 Signals" form scored 0.74 against the
  SaaS-company page title (limit 0.75) and was 64 characters, so the title drops "How to" (57 characters, similarity
  0.66). The keyword still sits in the first sentence, an H2, the meta title and the meta description.
  Gate: first run failed on meta_description length (170, max 160) and the opening paragraph (95 words, max 90);
  both trimmed, the meta description needed one more trim (166), third run printed ready: true at 3,092 words, 7 H2,
  6 FAQ, 14 internal links, 3 external links, no warnings. Over the page-write guide's 2,000-word suggestion, under
  the gate's 4,000 cap, in line with the other solutions pages.
- Angle: page one is channel round-ups and tip lists from vendors (WhoAPI, Tomba, Prospeo, DesignRush), an agency
  landing page (Callbox) and a Product Hunt thread. Tomba and Prospeo give funnel maths without sources; none gives
  the LinkedIn moment at which a company decides to pay an outside team instead of hiring, the search for it, or
  the message. This page names seven (a direct ask for a recommendation, a raise with no engineers on the team page,
  a technical co-founder search, a non-software company announcing a customer-facing build, a CTO leaving or a first
  CTO arriving, a platform deadline or forced rebuild, an engineering vacancy that will not fill), gives the
  Posts-tab or Jobs-tab search and the message for each, a week-one plan with a daily time budget and LinkedIn's
  sending caps, and says when past clients, partners and directories beat outreach, using Clutch's own figures.
- Outside sources opened today and linked: Clutch "Invest in Tech to Meet Customer Expectations" survey (405 US SMB
  owners, Nov 2025, updated May 2026: 55% increasing tech spend, 5% cutting; web 39%, mobile 38%, software 37%
  priorities; 26% limited internal technical expertise; 45% internal only, 21% hybrid); ManpowerGroup Global Talent
  Shortage release, 26 Feb 2026 (39,063 employers, 41 countries: 72% hiring difficulty, engineering 19%, AI model and
  application development 20%, Information sector 75%); Clutch developers service guide (most projects $10,000 to
  $49,999, most firms $25 to $49 an hour). Not used: Tomba and Prospeo funnel numbers (unsourced or secondary),
  DesignRush market sizes (unsourced), the Deloitte outsourcing survey (its redirect could not be opened this run).
  No competitor is named as a competitor; Clutch and Upwork are named as directories.
  Intentsly facts used: 14 demos in 14 days, zero manual outreach, 4x reply rate, ~1,000 leads a month per agent
  and 2 to 4 meetings a week (attributed, October 2026), 2 accounts, 30/30 with 15 recommended, four languages,
  /try-ai, no price, no email sending, no Reddit/X claims, job-post signal stated as not monitored.
- Database: the generated SQL ran unchanged on project uwwajlezgeurnvvrvdvb and returned slug
  get-clients-for-a-software-development-company, status published, published_at 2026-11-04 13:59:16 UTC. No other
  statement was run. `blog_cloud.py mark` filed the article and set the keyword to published.
- Queue: 10 `solutions` keywords remain queued (next: how to find clients as a fractional cmo), so blog-keywords did
  not run. 14 solutions pages published.
- Daily cap: first page of 4 November by Bucharest time (cap 7); weekly count under 45.
- For Alex: (1) a customer example from a development shop or an agency, with one number, would replace the
  14-demos launch story that every solutions page now reuses; (2) confirm whether the Jobs-tab / hiring signal will
  be monitored, since every solutions page has to say it is not, and it is the highest-volume signal for dev shops;
  (3) a price is still blocked by the corrections log; (4) the 21% reply-rate row in proof.md is still not usable as
  a plain number; (5) yesterday's HR consulting page was never confirmed live from here; please check it and the
  sitemap once.
- Git: the first `git push origin main` was rejected because the clone sat on a detached HEAD and the local `main`
  branch still pointed at the old tip (as on the previous run); `main` was re-attached to the new commit and the
  push went through at 14:05 UTC (cb3448f). This live-check note was added in a second commit touching only this file.
- Live check (about 4 minutes after the push, 14:09 to 14:10 UTC): LIVE. The fetch tool again refused the direct
  URLs for the new page and for /sitemap.xml (a permission request nobody was there to answer), but the homepage
  and the /solutions index could be opened, and the index listed 14 cards with the new page first and yesterday's HR
  consulting page second. Following the index link, the page loaded with the right title tag, H1, first H2 and the
  full seven-row signals table. Sitemap: NOT CONFIRMED from here; Alex should open https://intentsly.com/sitemap.xml
  once and check that /solutions/get-clients-for-a-software-development-company and
  /solutions/get-clients-for-an-hr-consulting-firm are listed.
