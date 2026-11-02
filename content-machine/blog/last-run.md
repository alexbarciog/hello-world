# Last run: 2026-11-02 (solutions task; fired 13:57 UTC, 15:57 Bucharest)

- Setup: no PAUSE file. Repository already cloned and in scope; `git pull origin main` was up to date at aa8d8fa.
  `add_repo` was not available as a tool, as on previous runs. Supabase: the lowercase "supabase" connector
  reported a proxy tunnel error at session start again; the "Supabase" connector connected and was used. The only
  draft in blog/drafts/ (outbound-sales-process-for-startups.md) carries a `blocked:` line, so it was not resumed.
- Keyword skipped: "how to find b2b customers on reddit" (solutions, priority 2) was the first in the queue and was
  set to `blocked` without a draft. Reason: a /solutions landing page must map the audience's LinkedIn signals to
  product features and convert, and product.md says Reddit monitoring does not work and must not be pitched; a
  commercial Reddit page for a LinkedIn-only product would mislead the searcher, and the blog already covers the
  manual method (find-b2b-leads-on-reddit, reddit-search-queries-to-find-customers, reddit-keyword-monitoring-for-leads,
  best-subreddits-for-b2b-lead-generation). If Reddit monitoring ships, unblock it and write it then.
- Keyword (published): how to find clients as a fractional cfo (section solutions, cluster find-customers, landing,
  commercial, priority 3, difficulty low).
  "How to Find Clients as a Fractional CFO: Six Signals"
  https://intentsly.com/solutions/find-clients-as-a-fractional-cfo
  Gate: first run failed only on the opening paragraph length (103 words); trimmed to 89, second run passed.
  `blog_cloud.py sql` printed ready: true at 2,509 words by the gate's count (two tables and one code block
  included; the prose is about 1,940 words, inside the 1,100 to 2,000 landing range), 7 H2, 5 FAQ, 13 internal
  links, 4 external source links, no warnings.
- Angle: the seven pages read (Lilach Bullock, ClickUp, Finance Alliance, GTMnow, Futureproof, Upgrow, Decimal;
  AccountingWEB returned a client error) all give the same tactic list (niche, old network, LinkedIn posting,
  accountant and lawyer partnerships, diagnostic before retainer), with unsourced reply rates and day rates. This page
  names six LinkedIn moments that show a company is about to hire a fractional CFO (funding post, controller job
  post, recommendation or how-to request, finance leader leaving or new COO, runway or raise-in-progress post,
  audit or diligence or systems change), gives the Posts-tab or Jobs search and the message for each, a week-one plan
  with the daily time budget and LinkedIn caps (15 a day, 30 max), a funding-post message template, and says when
  partners, the old network and content beat outreach.
- Sources opened and linked: Revelio Labs (Sep 29 2026, via the FT: 24 of every 1,000 new executive postings
  fractional in 2026 vs nine five years earlier; CFO roles 20% of fractional executive postings), Lightcast (Aug 20
  2026: CFO is the occupation with the most fractional leadership postings; finance 46% of US fractional postings; at
  least 34,000 US workers with "fractional" in their title in 2025, up 265% on 2019), Carta (Peter Walker, Mar 2023:
  only 5% of companies valued $1M to $10M have a dedicated finance team member), and Lilach Bullock's own account
  (referrals run dry at about 18 months), labelled as an observation rather than a study.
  Intentsly facts used: LinkedIn signals feature description (keyword posts, post engagement, competitor followers,
  hashtags, ICP scoring, enrichment, export, HubSpot, Cal.com, Google Calendar), AI SDR LinkedIn-only with caps
  30/30 and 15 recommended, 2 accounts per plan, languages, 14 qualified demos in 14 days / zero manual outreach /
  4x reply rate (linked to /case-studies), "around 1,000 leads a month per agent" and "2 to 4 meetings a week on
  average" attributed to "across Intentsly customers in October 2026" as corrections.md directs. No price, no 21%
  figure (its proof row is not accepted by the gate), no Reddit or X feature claims, no Mike Ruiz quote.
- Database: the generated SQL ran unchanged on project uwwajlezgeurnvvrvdvb and returned slug
  find-clients-as-a-fractional-cfo, status published, published_at 2026-11-02 14:05:05 UTC. No other statement was run.
  `blog_cloud.py mark` filed the article and set the keyword to published.
- Queue: after this page only 4 `solutions` keywords were queued, so blog-keywords ran. Eight added, each searched
  today for who ranks: how to get clients for a staffing agency (medium: Ringover, Lightcast, Expandi, Manatal,
  Bullhorn), how to get clients for a software development company (low: WhoAPI, Callbox, Tomba, dev.to),
  how to find clients for an seo agency (medium: AgencyAnalytics, Surfer, Search Engine Land), how to find clients as
  a fractional cmo (low: Bullock, ClickUp, newsletters, podcasts), how to get clients for an it consulting company
  (medium: ClickUp, B12, Upwork), how to get clients for a ppc agency (medium: ClickUp, AgencyAnalytics, WordStream),
  how to get clients for a video production company (low: small production blogs), how to get clients as a b2b
  copywriter (low: ClickUp, AWAI, copywriter blogs). Considered and skipped: business consulting firm (overlaps the
  published consultants page), fintech startup (a16z and Stripe rank; Intentsly is not the obvious answer).
  Now 12 queued (next: how to get clients for an hr consulting firm), 12 published, 1 blocked.
- Daily cap: fourth page of 2 November by Bucharest time (intentsly-vs-11x 00:16, best-subreddits 09:19,
  personalize-cold-outreach 10:38, this one 16:05), cap 7; weekly count well under 45.
- For Alex: (1) a real fractional CFO or consultant customer (even anonymised: "a two-person CFO practice in
  Amsterdam") with one number would let this page's practice section stop leaning on our own launch story;
  (2) the proof.md rows whose status reads "verified: say ..." (21% reply rate) are still not accepted by the gate,
  same note as the guides run; (3) decide whether the Reddit solutions keyword should stay blocked until Reddit
  monitoring ships, or be rewritten as a blog how-to instead; (4) confirm the keyword list above is the direction
  you want for /solutions (agencies and fractional roles) before the next runs write them.
- Live check: see the report for this run; the fetch of intentsly.com has needed a permission nobody is there to
  grant on previous runs.
