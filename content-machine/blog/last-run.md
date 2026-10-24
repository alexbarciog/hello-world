# Last run: 2026-10-24 (Guides task, guides section; started 07:20 UTC, 10:20 Bucharest)

- Keyword: how to monitor competitors on linkedin (section guides, cluster linkedin-prospecting, type guide,
  commercial, priority 2, difficulty medium), returned by `blog_next.py --section guides`. No PAUSE file, no
  draft waiting. Repository was already cloned; `git pull origin main` brought it to c6646b6.
- Published: "How to Monitor Competitors on LinkedIn in 60 Minutes a Week"
  https://intentsly.com/guides/monitor-competitors-on-linkedin
  `blog_gate.py` passed on its first run; `blog_cloud.py sql` printed ready on its first run after a voice
  pass (six "not X, Y" contrasts rewritten). 3,239 words by the gate's count (tables and code blocks
  included; prose about 2,940, inside the 1,500 to 3,000 guide range), 12 H2, 6 FAQ, 7 internal links,
  3 external. The generated SQL ran unchanged on Supabase project uwwajlezgeurnvvrvdvb and returned
  status = published at 07:35:43 UTC. Third page of 24 October (daily count 3 of 7; 28 pages in the last
  7 days against the weekly cap of 45).
- Angle: the ranking pages are either marketing benchmark guides (Socialinsider, Rival IQ, Social Media
  Examiner, SocialHP/Stack Rank) or vendor posts that route every step through the vendor's watchlist
  (OutX, ConnectSafely, CAM). This page is the sales team's version: six things to watch (page, posts and
  engagers, people, hiring, ads, mentions) with the click path or search string for each, a fixed
  60-minute weekly budget split per step, what LinkedIn will not show (follower list, engagement rate in
  Competitor analytics, non-EU ad targeting), a two-tab tracking sheet, a job-post-pattern table and a
  route-is-wrong table that includes Intentsly, plus a labelled hypothetical (Northline Payroll). It links
  the existing blog post on competitor post engagers for the deep version of Step 2 rather than repeating it.
  Brief in blog/briefs/monitor-competitors-on-linkedin.md.
- Facts: outside claims only from pages opened today: Social Media Examiner (Competitor analytics: Analytics
  > Competitors, up to nine other pages, follower and organic content metrics, 30-day default, no engagement
  rate shown), Lunio (Ad Library: advertiser/keyword/country/date filters, ads since 1 June 2023, kept one
  year after last impression, impressions/targeting/run dates for EU-targeted ads only, 24 to 48 hours to
  appear), business.linkedin.com Sales Navigator Q4 release (lead and account alerts on job or role change;
  content-engagement alerts on Advanced plans). No vendor statistics used (OutX, ConnectSafely close-rate
  and benchmark numbers, CAM reach figures, SocialHP "2x" all left out). Intentsly facts from proof.md rows
  marked exactly `verified` (14 demos in 14 days, 4x reply rate, 7-day trial, 2 accounts, 30/30 caps with
  15 recommended) and product.md (post engagement from named competitor pages and people, ICP scoring,
  verified email, LinkedIn-only sending, /try-ai with no account). No price, no 21% or ~1,000-leads figures,
  no Reddit/X or email claim. Hiring and job-change signals are described as manual LinkedIn steps, not as
  Intentsly features. No em dashes, no banned phrases.
- LinkedIn Help pages (answer/126090 competitor analytics, learning/answer/69626 Premium insights) and
  linkedin.com/ad-library are robots-blocked or need approval for WebFetch, so the page cites Social Media
  Examiner and Lunio for those features instead of LinkedIn's own help text.
- Queue: 59 keywords still queued (33 blog, 6 guides, 7 solutions, 7 compare, 6 learn), so none added.
  Blocked keywords: none. Skipped: 3 (pre-existing). Next guides keyword: "how to qualify leads before
  outreach".
- Connector note: as on previous runs, the session listed a lowercase `supabase` server as failed
  (ERR_PROXY_TUNNEL) while the capitalised `Supabase` connector worked. `add_repo` was not available as a
  tool, but the repository was already in scope and pushable.
- For Alex: (1) a real customer story about catching a competitor move (a hire, a launch, an ad) and what
  it turned into would replace the hypothetical in this guide and the next ones; (2) confirm whether
  Intentsly's competitor page monitoring captures page followers who never engage, so the "followers" wording
  can be made precise; (3) the hiring-signals and funding keywords queued next both need first-hand numbers
  (how many job-change or hiring signals a typical account sees a week) or they will ship as manual guides.
