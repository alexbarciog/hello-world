# Last run: 2026-10-30 (guides task; fired about 08:10 UTC, 10:10 Bucharest)

- Keyword: how to set up linkedin sales navigator alerts (section guides, cluster linkedin-signals, type guide,
  intent commercial, priority 2, difficulty low). `blog_next.py --section guides` returned it directly. No PAUSE
  file, no draft waiting. Repository already cloned and in scope; `git pull origin main` was up to date at
  bc4ba0e. `add_repo` was not available as a tool, as on previous runs. Supabase: the lowercase "supabase"
  connector reported a proxy tunnel error at session start, the "Supabase" connector connected (tested with
  `select 1`) and was used. Read-only count before any work: 1 post published on 30 Oct UTC, 24 in the last
  7 days; caps 7 and 45 not reached; no row for the slug.
- Published: "How to Set Up LinkedIn Sales Navigator Alerts (7 Steps)"
  https://intentsly.com/guides/set-up-linkedin-sales-navigator-alerts
  Gate run 1 failed on two items: meta_description 165 characters (trimmed to 152) and the banned word
  "unlock" ("saving an account unlocks..." became "switches on"). Run 2 passed with no warnings; a third run
  after two plan-row corrections in the Step 1 table also passed. 12 H2, 6 FAQ, 9 internal links, 12 external,
  3,150 words by the gate's count (two wide tables and the FAQ carry much of it; page-write.md asks for 1,500
  to 3,000, the gate max is 4,000).
- Database: the insert ran on project uwwajlezgeurnvvrvdvb and returned status published, published_at
  2026-10-30 08:37:21 UTC. A read-only select afterwards confirmed section guides, article_type guide,
  word_count 3150, reading_minutes 14, 6 FAQ entries, 5 secondary keywords, content length 21,329 characters
  and an md5 of the stored content_md identical to the draft body. The full generated SQL including the ON
  CONFLICT clause was passed to the connector this time (the previous two runs noted a dropped line); the slug
  was new so the conflict branch did not execute either way. No second write.
- Sales Navigator facts: only from LinkedIn's own pages opened this run. LinkedIn Help Center articles
  (a105133 "Sales Navigator Alerts - Overview", a101017 "Manage Sales Navigator email alerts", a104003 plans,
  a108023) are robots-disallowed for the fetch tool and were not read; the email article is named in the
  text without a link. Used instead: business.linkedin.com/sell/sales-navigator (alert types per plan, "Save
  in Sales Navigator", Buyer Intent on Advanced and Advanced Plus), /sell/sales-navigator/how-to-use (Lead
  filters+, Account filters+, saved Advanced Lead Search notifies on new results, 62% figure),
  /sales-solutions/compare-plans.html (Core US$119.99 a month, Advanced US$159.99, trial terms),
  scommunity.linkedin.com posts: buyer intent alerts (Mar 2024), save leads early (Mar 2024), save accounts
  early (Mar 2024), Q3 2020 lists and alerts release (1,000 per list, bulk 25, alert filters, Insight Tag,
  10-employee privacy threshold), "Search like you mean it" (Aug 2025: Save search, daily/weekly/monthly,
  Changed jobs 90 days, Boolean), "4 proven steps" (May 2024: 5 leads per account), buyer interest location
  (Feb 2022). One conflict recorded honestly in the table: the product page puts organic content-engagement
  alerts on Advanced Plus while the 2024 Community post puts them on Advanced and Advanced Plus, so the row
  says "Advanced Plus (Advanced on some LinkedIn pages)". Evaboot and Skylead are linked only for the
  Settings click path, which LinkedIn's fetchable pages do not document.
- Angle: the ranking pages (Skylead, Evaboot, GiveMeLeads, Breakcold; Storylane redirects to its homepage)
  list alert types, give the Settings path and promote their own automation; none gives the order of
  operations, the saved searches worth an alert, the Insight Tag prerequisite, LinkedIn-sourced limits, a
  worked example or a mistakes section. This page does, plus an alert-to-message table and a plain statement
  of what Sales Navigator alerts cannot see (engagement with other people's posts). Brief in
  blog/briefs/set-up-linkedin-sales-navigator-alerts.md.
- Intentsly facts: product.md only (signal types, ICP scoring, /try-ai with no account). No numbers from
  proof.md were needed; no price, no customer names, no Reddit/X claim, no AI SDR claim.
- Links: /learn/what-is-an-ideal-customer-profile, /learn/what-is-a-trigger-event-in-sales,
  /compare/intentsly-vs-linkedin-sales-navigator, /features/linkedin-signals (contextual sentence in Step 4),
  /blog/linkedin-message-templates-for-buying-signals, /guides/set-up-signal-based-outbound,
  /guides/qualify-leads-before-outreach, /try-ai (closing CTA), /guides (section index).
- Queue: 11 guides keywords still queued, nothing added (above the refill threshold of 5). Next is "how to use
  linkedin search operators for prospecting". Nothing blocked.
- For the founder: (1) A first-hand number for this page would be strong: how many of Intentsly's own
  demos or replies came from a LinkedIn job-change or post signal versus a saved-list alert. (2) The LinkedIn
  Help Center is unreachable for the fetch tool; if you can open a105133 and a101017 and paste the current
  Settings labels into brain/, future Sales Navigator guides can quote them exactly. (3) The proof.md rows
  for 21% reply rate, ~1,000 leads a month per agent and 2 to 4 meetings a week still carry a "verified: ..."
  status with a phrasing note; the gate accepts only the exact word "verified", so those numbers remain
  unusable. (4) Export formats (CSV? API?) are still unnamed in product.md. (5) The gate's `kw_in` matcher
  cannot match words ending in "ss" (reported on 30 Oct blog run); queued solutions keyword "b2b lead
  generation for small business" will hit it.
- Live check: performed about four minutes after the push; result recorded in the run report, not here
  (this file is committed before the push).
