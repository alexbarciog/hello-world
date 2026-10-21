# Last run: 2026-10-21 (Solutions task, solutions section)

- Keyword: how to find clients for a marketing agency (cluster find-customers, landing, commercial,
  priority 1, medium). No PAUSE file. First keyword returned by `blog_next.py --section solutions`;
  no draft was waiting in `blog/drafts/`.
- Title: How to Find Clients for a Marketing Agency: Signals First
- Live URL: https://intentsly.com/solutions/find-clients-for-a-marketing-agency
- Status: published (Supabase upsert returned `status = published`, published_at 2026-10-21 12:58 UTC).
  The SQL file `blog/out/find-clients-for-a-marketing-agency.sql` was run once, unchanged, through the
  `Supabase` connector's execute_sql on project uwwajlezgeurnvvrvdvb. No other database statement was run.
- Gate: run 1 failed on one item (opening paragraph 93 words by the gate's tokenizer). Fix 1 shortened
  the opening and trimmed about 150 words elsewhere (the first draft was 2,263 gate-words, above the
  2,000 upper bound page-write.md gives for /solutions). Run 2 passed; a second trim brought it to 2,106
  gate-words, which includes every table cell; the prose is under 2,000. `blog_cloud.py sql` printed
  `"ready": true` with no warnings. 7 H2s, 5 FAQ entries, two tables (the required Signal | Where | What
  it means | What to do table and the feature-mapping table), a copy-paste message template, 11 internal
  links (/learn/what-is-a-buying-signal, /blog/find-b2b-leads-on-reddit,
  /learn/what-is-an-ideal-customer-profile, /guides/find-decision-makers-on-linkedin,
  /features/linkedin-signals, /features/ai-sdr, /case-studies, /solutions/find-b2b-clients-online,
  /solutions, /try-ai, /signal-playbook), 2 external links, both opened this run.
- Caps: config/blog.json reads max_posts_per_day 7 and max_posts_per_week 45. The gate reported no cap.
  This is the fifth article dated 21 October (Bucharest): intentsly-vs-gojiberry 00:07,
  trigify-api-alternative 09:12, build-b2b-prospect-list 10:48, free-trigify-alternatives 13:39, this
  one 15:58. The run did not touch config.
- Queue: 9 solutions keywords still queued (next: how to get clients for a recruitment agency, lead
  generation for consultants, how to find customers on linkedin, how to find leads for a software
  company, how to find customers for a startup, b2b lead generation for small business, how to find
  clients for a web design agency, how to get clients for a saas company, how to find b2b customers on
  reddit). Above the 5-keyword threshold, so no keywords were added.
- Connectors: as in previous runs, a lowercase `supabase` server showed as failed (ERR_PROXY_TUNNEL)
  and a separate `Supabase` server's execute_sql worked. No `add_repo` tool existed in the session; the
  repository was already in scope and `git pull origin main` was run on the existing clone (already up
  to date at 7dc8ade). Cloud-only run, no computer linked.

## What the research turned up
- Page one for the keyword is vendor tactic lists: ClickUp (10 tactics, no stats), Sembly (15
  strategies, secondary stats), Belkins (outbound method with a trigger map, updated 2026-03-10, no
  searches or plan), Promethean Research (survey-based channel ranking, 2026-08-02), CazaLead (niche +
  Google Maps lists + Mon-to-Fri cadence, 2026-06-01), Saleshandy (12 strategies with templates), plus
  Leadowl, Slam, Salesforge, Vendasta, AgencyAnalytics, Bonsai, Martal, Snov.io, Assembly. None names
  the LinkedIn behaviours that precede an agency hire with the exact search and message, none states
  sending limits, none gives a week plan with a time budget (CazaLead has a cadence table without one).
  Brief: blog/briefs/find-clients-for-a-marketing-agency.md.
- External sources opened 2026-10-21 and linked: prometheanresearch.com/how-marketing-agencies-get-clients
  (survey of 91 agency leaders: client referrals 3.7/5, growing current accounts 3.6, partner referrals
  3.0, website optimization and social content 2.0 at 42% and 41% effort; referred clients stayed about
  twice as long as clients from events or outbound) and prometheanresearch.com/digital-agency-industry-report
  (1,452 agency leaders; average agency puts 7% of revenue into sales and marketing; most agencies
  generate the bulk of leads through referrals).
- Could not open (fetch permission prompt withdrawn, unattended run): the 6sense Buyer Experience Report
  on businesswire.com and close.com's first-10-customers post. Neither was cited.
- Intentsly facts used: LinkedIn-only monitoring (keyword posts, post engagement, competitor page
  followers/engagers, hashtags), ICP scoring, verified emails, export without a format, AI SDR on
  LinkedIn only with Cal.com or Google Calendar booking, HubSpot, 2 accounts, 30/30/15, four languages,
  /try-ai with no account, 12 signals / 8 to ignore, 14 demos in 14 days, 4x reply rate, "around 1,000
  leads a month per agent" and "2 to 4 meetings a week on average" attributed to "across Intentsly
  customers in October 2026", and the GrowthLab quote ("Our reply rates tripled", Mike Ruiz, CEO). No
  price. The 21% figure was not used. The page says plainly that Intentsly is not an agency and that the
  job-post signal is not monitored.

## What the founder should supply
- One real agency customer story (even anonymised: agency type, niche, what signal produced the first
  call) so the /solutions pages for agencies, recruiters and consultants can have a "What this looks like
  in practice" section that is not the Intentsly launch story. Every solutions page currently leans on
  the same 14-demos story.
- Whether GrowthLab (Mike Ruiz) is an agency; if so, the quote can be presented as an agency customer
  on this and the web-design-agency page.
- The export format(s) Intentsly offers, and whether proof.md rows marked `verified: say ...` should be
  split into plain `verified` rows so the gate accepts the 21% figure (same as earlier runs).
- A decision on the daily cap: config/blog.json says 7 a day; five articles were published today across
  the tasks.

## Live check (after push)
- Pushed at 12:59:09 UTC (commit f2e4ebe, `git push origin HEAD:main`; detached-HEAD clone as in previous
  runs). At 13:04 UTC (5 minutes) https://intentsly.com/solutions still listed only the two older pages.
- CONFIRMED at 13:14 UTC: https://intentsly.com/solutions lists the new page first (October 21, 2026,
  10 min read), and https://intentsly.com/solutions/find-clients-for-a-marketing-agency renders the H1,
  the author line "Alex Barciog, CEO & Founder, Intentsly", the date, all seven H2s plus the site's
  "Your next step" and "Keep reading" boxes, both tables and the five FAQ entries. The deploy took
  between 5 and 15 minutes; a future run should wait longer than 4 minutes before checking.
- Sitemap: https://intentsly.com/sitemap.xml could not be fetched from this run (the fetch tool's
  permission prompt was withdrawn in the unattended session), same as previous runs. Not confirmed in
  the sitemap; the page is live and on the /solutions index, which the same deploy produces.
- The repository has no GitHub Actions workflows (actions list returned 0 runs), so the deploy could
  not be watched from GitHub.
