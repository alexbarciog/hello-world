# Last run: 2026-11-23 (learn task; fired about 19:15 UTC, 21:15 Bucharest)

- Setup: no PAUSE file. Repository already cloned, in scope and on `main`; `add_repo` is not exposed as a tool in this
  session (as on previous runs), `git pull origin main` reported up to date at a369a8c. Supabase: the lowercase "supabase"
  connector failed with a proxy tunnel error at session start; the "Supabase" connector connected and was used. Web search
  worked; pages were opened through the web-fetch agent (no direct WebFetch tool). Both drafts in blog/drafts/ carry a
  `blocked:` line (gate kw_in bug on "business"/"process", unchanged), so the queue's next learn keyword was taken.
  2 articles had been published today (Bucharest) before this run (daily cap 7); 19 in the last 7 days (weekly cap 45).
- Keyword (published, first attempt): what is a sales qualified lead (learn, fundamentals cluster, lesson type,
  informational, priority 3, difficulty high).
  "What Is a Sales Qualified Lead? Definition and a Checklist"
  https://intentsly.com/learn/what-is-a-sales-qualified-lead
- Database: one statement, the generated blog/out/what-is-a-sales-qualified-lead.sql (19,164 bytes,
  md5 073e5e7c09571ae5876223ad6d115b61), run unchanged through the Supabase connector. Returned slug
  what-is-a-sales-qualified-lead, status = published, published_at 2026-11-23 19:31:13 UTC. No other reads or writes.
- Gate: blog_gate.py passed first run (2,172 words, 6 H2, 6 FAQ, 11 internal links, 6 external links, no warnings).
  Two FAQ answers at 73 words trimmed to under 70 before blog_cloud.py sql, which printed "ready": true first time
  (2,163 words). Title similarity to the PQL lesson was checked beforehand: "SQL Meaning and a Test" scored 0.82
  against "What Is a Product Qualified Lead? PQL Meaning and a Rule" and was dropped; the published title scores 0.72
  (limit 0.75). Length is in line with the sibling lessons (PQL 2,326, lead qualification 2,111, warm lead 2,024).
- Angle: page one is Salesforce, HubSpot, Zendesk, LinkedIn, G2, LeadSquared, Shopify, Adobe. All assume an inbound
  funnel (marketing makes MQLs, sales accepts them), none gives a pass/fail checklist, none shows what evidence
  satisfies each BANT letter when the lead came from LinkedIn rather than a form, and benchmarks are unsourced or
  2019-era. This page defines the SQL for a team with no marketing department, names the three different tests
  vendors hide behind the term (rep says so / meeting booked / BANT passed, each attributed), gives a four-line
  fit/need/authority/timing checklist with the public LinkedIn evidence for each line, puts SQL next to MQL, SAL, PQL
  and buying signal in one table, and links every benchmark to its report.
- Outside sources opened today and cited: First Page Sage, MQL to SQL Conversion Rate By Industry: 2026 Report
  (Evan Bailyn, 19 Nov 2026, client data 2019 to Nov 2026: 30-industry average 16.1%, median 15%, B2B SaaS 13%,
  IT & managed services 13%, staffing 12%; SQL defined as an MQL that booked a meeting); Gartner B2B buying journey
  page (buying group six to 10 decision makers); HubSpot average lead response time article (reporting an InsideSales
  audit: median 3h08, average about 61 hours, 47% never responded; secondary source, attributed as such); Salesforce,
  HubSpot and LinkedIn Sales Solutions SQL definitions (opened, linked in the "three tests" table).
  Not cited: HBR 2011 "The Short Life of Online Sales Leads" (only the BYU archive record with the abstract could be
  opened; the 7x/60x figures were not seen, so not used); MarketingSherpa 61%/27% (no link to the study available);
  Optifai benchmark, Zendesk, G2, LeadSquared, Shopify, Adobe (read for the brief only). Direct fetch of hbr.org,
  firstpagesage.com and gartner.com was refused once (provenance) until the URLs came from a web search.
- Intentsly facts used: 14 qualified demos in 14 days, zero manual outreach, 4x reply rate, most leads from real-time
  signals (case study, labelled as our own launch). Product claims limited to LinkedIn signal monitoring, ICP scoring
  and /try-ai showing matching buyers without an account (all in brain/wiki/product.md). No price stated.
- Push: the first `git push origin main` was rejected as non-fast-forward because the clone sat in detached HEAD and the
  stale local `main` ref was what got pushed; `git push origin HEAD:refs/heads/main` then fast-forwarded a369a8c..1b87341
  at 19:33:34 UTC and the local `main` was realigned. Nothing outside content-machine/ changed.
- Verification (19:38 UTC, about 4 minutes after the push): the database row shows status = published. The live page
  and sitemap could NOT be checked from this session: fetches of https://intentsly.com/learn/what-is-a-sales-qualified-lead
  and https://intentsly.com/sitemap.xml were refused twice with a fetch-permission (provenance) error that nobody was
  present to approve, the same limit earlier runs recorded. The repository has no GitHub Actions workflow, so the deploy
  could not be confirmed from there either. Alex: open the URL above once to confirm it rendered.
- Queue: 7 learn keywords still queued (next: "what is an sdr"), so no keywords were added. Blog, guides, solutions and
  compare queues untouched.
- For Alex: (1) the two blocked drafts (AI consulting solutions page, outbound sales process guide) still wait on the
  blog_gate.kw_in plural bug, which this task is not allowed to fix; (2) a real example of the SQL test the Intentsly
  AI applies when it hands a lead to a customer (what it checks, how often a reply turns into a meeting) would let the
  next fundamentals lessons use a first-hand number instead of the launch story; (3) confirm whether "export" formats
  and the self-serve pricing lines in product.md are live, since several lessons would read better with them.
