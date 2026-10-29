# Last run: 2026-10-29 (compare task; started about 21:45 UTC, 23:45 Bucharest)

- Keyword: intentsly vs linkedin sales navigator (section compare, cluster intentsly-vs, type comparison,
  intent commercial, priority 2, difficulty medium). `blog_next.py --section compare` returned it directly.
  No PAUSE file, no draft waiting. Repository already cloned and in scope; `git pull origin main` was up to
  date at a5bab33. `add_repo` was not available as a tool, as on previous runs; the repo was already attached.
  Supabase: the lowercase "supabase" connector reported a proxy tunnel error at session start, the "Supabase"
  connector connected and was used. A read-only count before any work: 4 posts published on 29 Oct UTC in
  the database, 24 in the last 7 days; caps 7 and 45 not reached; no row for the slug.
- Published: "Intentsly vs LinkedIn Sales Navigator: Finding or Acting?"
  https://intentsly.com/compare/intentsly-vs-linkedin-sales-navigator
  The gate failed once (meta_description 170 characters, opening paragraph 91 words), both trimmed, passed on
  the second run with no warnings; a truth pass after that (removed an unsourced TeamLink plan claim and the
  word "monthly" about Intentsly billing) passed again. 7 H2, 6 FAQ, 8 internal links, 3 external, 2,884
  words by the gate's count (the 12-row table and the FAQ carry much of it).
- Database: the insert ran on project uwwajlezgeurnvvrvdvb and returned status published, published_at
  2026-10-29 21:58:55 UTC; article_type comparison, word_count 2884, reading_minutes 13, 6 FAQ entries,
  5 secondary keywords confirmed by a read-only select. One discrepancy to record: when pasting the generated
  SQL into the connector, the `article_type = excluded.article_type` line of the ON CONFLICT clause was
  dropped. The slug did not exist, so the plain INSERT ran and the conflict branch never executed; the stored
  row is identical to what the unchanged file would have written. No second write was made.
- Competitor facts: only from business.linkedin.com pages opened this run: /sell/sales-navigator/compare-plans
  (Core US$119.99/month or US$1,079.88/year, Advanced US$159.99/month or US$1,799.88/year, Advanced Plus
  custom; trial eligibility, card, cancellation timing, "if purchased through a sales representative"
  footnote, five Advanced licences online), /sell/sales-navigator (50+ filters, 1+ billion members, 1.5M+
  sellers, Buyer Intent = "which companies are actively showing interest" on Advanced and Advanced Plus,
  Lead IQ / Account IQ, alerts, content-engagement alerts on Advanced Plus, Smart Links, TeamLink, Message
  Assist, seven languages, Forrester citations) and /sell/sales-navigator/premium-versus-sales-navigator
  (50 InMail credits "the most of any LinkedIn product", CRM list Salesforce/HubSpot/Dynamics/Oracle on
  Advanced Plus, Premium Business included). The LinkedIn help centre (account types a104003, Buyer Intent
  FAQ a507435, intent activities a1325209, export a102031), the LinkedIn sales blog and the user agreement
  all refuse automated fetches (robots), so nothing from them is stated; the page says so where it matters
  (export, daily connection limits, automation policy). No "How to switch" section for that reason.
- Angle: the pairing has no ranking page; the SERP is G2/TrustRadius directory pairings and vendor
  "Sales Navigator alternatives" listicles (joinvalley.co, salesmotion.io, pipeline.zoominfo.com) that rank
  themselves first. This page frames finding vs acting, company-level Buyer Intent vs person-level
  engagement, who answers the reply, prices and footnotes beside Intentsly's caps, a long "where Sales
  Navigator wins" list, and a plan for running both on one profile. Brief in
  blog/briefs/intentsly-vs-linkedin-sales-navigator.md.
- Intentsly facts only from proof.md verified rows (14 qualified demos in 14 days, zero manual outreach,
  reply rate 4x, 12 signals / 8 to ignore, 7-day trial, 2 accounts, 30/30 a day, 15 recommended) and
  product.md (signal types, ICP scoring, verified emails, export, HubSpot/Cal.com/Google Calendar/LinkedIn,
  AI SDR LinkedIn-only, four languages, self-serve, cancel anytime). No price, no customer names, no
  Reddit/X claim.
- Links: /learn/what-is-intent-data, /features/ai-sdr, /features/linkedin-signals (contextual sentence at the
  copying-names step), /signal-playbook, /try-ai (closing CTA), /pricing, /guides/set-up-signal-based-outbound,
  /compare (section index).
- Queue: after marking, 4 `compare` keywords remained (under RUN.md's threshold of 5), so 8 were appended
  per skills/blog-keywords.md: intentsly vs waalaxy, expandi, dripify, lemlist, la growth machine, artisan,
  aisdr, salesrobot (all compare / intentsly-vs / comparison / commercial / medium / priority 2; the "X vs"
  SERPs for these are vendor blogs such as lagrowthmachine.com, lemlist.com, 11x.ai, aisdr.com). 12 compare
  keywords now queued; next is "intentsly vs teamfluence". Nothing blocked.
- For the founder: (1) The proof.md rows for 21% reply rate, ~1,000 leads/month per agent and 2 to 4
  meetings a week still carry a "verified: ..." status with a phrasing note; the gate accepts only the exact
  word "verified", so those numbers remain unusable. (2) Does Intentsly connect to a LinkedIn account that
  holds a Sales Navigator subscription without issues? If yes, product.md could say so and the "Can you use
  both?" section would be stronger. (3) A sentence on whether Intentsly's signals include Sales Navigator
  lists or saved searches as an input (import?) would settle the "third option" paragraph. (4) Export
  formats (CSV? API?) are still unnamed in product.md. (5) One customer who moved LinkedIn outreach from
  manual InMail to the AI SDR, with permission to name them, is the proof this pairing lacks.
- Live check: see the report for this run; the deploy took 13 to 18 minutes on the previous run, so a check
  four minutes after the push is usually too early.
