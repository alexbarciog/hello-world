# Last run: 2026-10-30 (blog task; fired 06:52 UTC, 08:52 Bucharest)

- Keyword: intent data tools for small business (section blog, cluster intent-tools, type listicle, intent
  commercial, priority 1, difficulty medium). `blog_next.py --section blog` returned it directly. No PAUSE
  file, no draft waiting. Repository already cloned and in scope; `git pull origin main` was up to date at
  7c95389. `add_repo` was not available as a tool, as on previous runs. Supabase: the lowercase "supabase"
  connector reported a proxy tunnel error at session start, the "Supabase" connector connected and was used.
  Read-only count before any work: 0 posts published on 30 Oct UTC, 24 in the last 7 days; caps 7 and 45
  not reached; no row for the slug.
- Published: "Intent Data Tools for Small Businesses: 8 Priced and Compared"
  https://intentsly.com/blog/intent-data-tools-for-small-business
  The gate failed on the first run with seven items, five of them "title / meta_title / meta_description /
  H2 / first 150 words do not contain the primary keyword" even though all five contained the exact phrase.
  Cause, in `scripts/blog_gate.py` `kw_in`: `w.rstrip("s")` strips both trailing s from "business", so the
  matcher looks for "busine(s|es)" and can never match "business". Any keyword ending in a double s
  (business, process, access) cannot pass as written. Not edited (scripts are off limits). The article's
  primary keyword was set to the plural "intent data tools for small businesses" (which the matcher does
  match, and which is how the ranking pages phrase it too); the singular stays as the first secondary
  keyword and the slug is unchanged. After `mark`, the queue entry for the singular was set to published
  with the slug via `blog_next.py set`, so it is not picked again. Second gate run: meta_description 162
  characters and opening 97 words, both trimmed; third run passed with no warnings, then one wording fix
  and a final pass to regenerate the SQL. 7 H2, 6 FAQ, 9 internal links, 9 external, 3,423 words by the
  gate's count (the 8-row table and the FAQ carry much of it).
- Database: the insert ran on project uwwajlezgeurnvvrvdvb and returned status published, published_at
  2026-10-30 07:20:20 UTC; article_type listicle, word_count 3423, reading_minutes 16, 6 FAQ entries,
  6 secondary keywords and content length 21,371 characters confirmed by a read-only select, equal to the
  draft body. Same discrepancy as on 29 Oct: when pasting the generated SQL into the connector, the
  `article_type = excluded.article_type` line of the ON CONFLICT clause was dropped. The slug did not
  exist, so the plain INSERT ran and the conflict branch never executed; the stored row is identical to
  what the unchanged file would have written. No second write was made. Worth noting for Alex: this has
  now happened twice in a row, so a future UPDATE of an existing slug through this route should be
  double-checked against the file.
- Competitor facts: only from pages opened this run. apollo.io/insights/apollo-vs-6sense (Free $0 / 900
  credits a year; Basic $49 per user a month annual with 6 intent topics; Professional $79; Organization
  $119, 3-user minimum; "15K+ buying intent topics"). leadfeeder.com/pricing (Lite free forever, last 100
  companies a month, 7-day history; Discover €79 a month annual for up to 50 companies, €113 monthly;
  Activate from €369 annual; 14-day trial). RB2B help centre article "Plans: Pro and Pro+" dated 1 May 2026
  (Pro $149 / 600 credits, $249 / 1,250, $349 / 2,500; contact-level "primarily for U.S. visitors"; the
  article says rb2b.com takes precedence). visualping.io/business/pricing (Free 150 checks a month on 5
  pages; Personal 1K $14 a month or $120 a year; Business 20K $140 a month or $1,200 a year, 200 pages,
  5 users). sell.g2.com/data and the G2 External Pricing Guide PDF (updated August 2025: Free $0, Starter
  $2,999 year one then $5,999 a year, Professional and Enterprise "Contact Sales", Buyer Intent an add-on
  on Professional and Enterprise). bombora.com/intent ("25,300+ topics", "86% ... shared exclusively",
  three-week vs 12-week scoring, no price). business.linkedin.com/sales-solutions/compare-plans (Core
  US$119.99 / US$1,079.88, Advanced US$159.99 / US$1,799.88, Advanced Plus custom, trial eligibility) and
  /sales-solutions/sales-navigator-b (Buyer Intent "Available only on Advanced and Advanced Plus plans").
  Not opened: 6sense, Lusha, UserGems, Warmly, Demandbase, ZoomInfo, Cognism. The search tool never
  surfaced their own pricing pages and the fetch tool refuses URLs that were not surfaced (apollo.io/pricing,
  usergems.com/pricing and lusha.com were refused), so they are named in the article as not priced and
  left out of the table rather than described from third-party listicles.
- Angle: the SERP is vendor listicles (Sona, Guideflow, Default, Visualping, Coldreach) that rank
  themselves first, give no dollar figures or quote five-figure ranges, and never say when not to buy.
  This page prices 8 tools from the vendors' own pages on a named date, sorts by signal type (LinkedIn
  engagement, website visitor by company and by person, G2 comparisons, page changes, LinkedIn Buyer
  Intent, publisher topic scores), gives a decision rule by situation, a "wrong buy" section, a weekly
  routine for one person, and where each tool including Intentsly is the wrong choice. Brief in
  blog/briefs/intent-data-tools-for-small-business.md.
- Intentsly facts only from proof.md verified rows (14 qualified demos in 14 days, zero manual outreach,
  reply rate 4x, 12 signals, 7-day trial, 2 accounts, 30/30 a day, 15 recommended) and product.md
  (signal types, ICP scoring, verified emails, HubSpot/Cal.com/Google Calendar, AI SDR LinkedIn-only,
  four languages, /try-ai with no account). No price, no customer names, no Reddit/X claim, no 21% / 1,000
  / 2-to-4 figures.
- Links: /learn/what-is-intent-data, /blog/linkedin-buying-signals, /guides/track-hiring-signals-for-sales,
  /compare/intentsly-vs-apollo, /compare/intentsly-vs-linkedin-sales-navigator,
  /guides/set-up-signal-based-outbound, /features/linkedin-signals (contextual sentence in the weekly
  routine), /signal-playbook, /try-ai (closing CTA).
- Queue: 28 blog keywords still queued, nothing added. Next is "linkedin keyword monitoring for leads".
  Nothing blocked.
- For the founder: (1) The gate's keyword matcher cannot match words ending in "ss" (see above). Queued
  keywords that will hit it: "b2b lead generation for small business" (solutions) and any future
  "...process" or "...access" keyword. Either rephrase them in keywords.json as plurals, or change
  `w.rstrip("s")` to strip one trailing s in scripts/blog_gate.py; this run did not touch the script.
  (2) The proof.md rows for 21% reply rate, ~1,000 leads/month per agent and 2 to 4 meetings a week still
  carry a "verified: ..." status with a phrasing note; the gate accepts only the exact word "verified", so
  those numbers remain unusable. (3) An Intentsly price or price range on the page would let the table
  show a real figure for Intentsly instead of "not stated here"; the corrections log still says do not
  quote one. (4) One customer under 50 people who replaced a website-visitor or topic-score tool with
  LinkedIn signals, with permission to name them, is the proof this article lacks. (5) Export formats
  (CSV? API?) are still unnamed in product.md. (6) The SQL-paste discrepancy (ON CONFLICT line dropped)
  has now happened on two consecutive runs; if the pipeline is expected to update existing slugs through
  the connector, consider having the script print the statement without the ON CONFLICT clause for new
  slugs, or verifying the row after every write as this run did.
- Live check: not performed yet at the time of writing; the push follows this file. The previous run saw
  the deploy take 16 to 37 minutes.
