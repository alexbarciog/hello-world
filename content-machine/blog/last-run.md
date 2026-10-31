# Last run: 2026-10-31 (solutions task; fired about 13:40 UTC, 15:40 Bucharest)

- Keyword: how to find clients for a web design agency (section solutions, cluster find-customers, type
  landing, intent commercial, priority 2, difficulty medium). `blog_next.py --section solutions` returned it
  directly. No PAUSE file, no draft waiting. Repository already cloned and in scope; `git pull origin main`
  was up to date at cd6fa91. `add_repo` was not available as a tool, as on previous runs. Supabase: the
  lowercase "supabase" connector reported a proxy tunnel error at session start; the "Supabase" connector
  connected and was used. Read-only count before any work: 2 posts published on 31 Oct UTC, 21 in the last
  7 days; caps 7 and 45 not reached; no row for the slug.
- Published: "How to Find Clients for a Web Design Agency Before the RFP"
  https://intentsly.com/solutions/find-clients-for-a-web-design-agency
  Gate run 1 failed on three points (meta description 165 chars, opening 94 words, the outbound-effectiveness
  figures sat in a paragraph without a source link); fixed in two edits, run 2 failed only on the opening
  (92 words), run 3 passed with no fails and no warnings, then `blog_cloud.py sql` printed ready: true.
  7 H2, 5 FAQ, 13 internal links, 2 external sources, 2,350 words by the gate's count (landing min 1,100;
  the other solutions pages count 2,100 to 2,740 the same way). Title decision taken without review:
  "Before the RFP" because every "Signals ..." variant scored above the 0.75 duplicate-title threshold
  against the marketing agency page.
- Research: opened Wix Studio, WebsiteSetup, Shopify Partners, Embroker and Duda (the ranking pages); none
  gives a LinkedIn search string or a buying-moment list. Outside numbers used, both opened this run:
  Clutch's 2025 small-business website release on BusinessWire (83% have a site, 12% launched one in the
  past year, 45% built by outsourced partners) and SparkToro's State of Digital Agencies survey of 612
  agencies (66% referrals as top source, 60% ran outbound, 10% very effective, 34% not effective).
  Intentsly facts only from product.md, verified proof.md rows and the 14-demos story.
- Database: the insert ran on project uwwajlezgeurnvvrvdvb and returned status published, published_at
  2026-10-31 13:52:44 UTC. `blog_cloud.py mark` filed the article and set the keyword to published.
- Queue: 7 `solutions` keywords still queued (next: how to get clients for a saas company), so no keyword
  refresh this run.
- Live check: see the run report (sitemap and page fetched about 4 minutes after the push).

## For the founder
- A first-hand story from an agency customer (web design, marketing or recruitment) would replace the "we
  are not an agency" paragraph that every /solutions agency page now carries. Even one line: niche, which
  signal, what the first reply was.
- Confirm whether "announces a new role" posts and job listings should be presented as monitored; the page
  says job listings are not monitored and keeps that search manual.
- The price question (corrections.md, 2026-10-08) is still open; no price was stated.
