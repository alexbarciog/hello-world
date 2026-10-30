# Last run: 2026-10-30 (compare task; fired about 21:50 UTC, 23:50 Bucharest)

- Keyword: intentsly vs teamfluence (section compare, cluster intentsly-vs, type comparison, intent commercial,
  priority 2, difficulty medium). `blog_next.py --section compare` returned it directly. No PAUSE file, no draft
  waiting. Repository already cloned and in scope; `git pull origin main` was up to date at 6d0574b. `add_repo`
  was not available as a tool, as on previous runs. Supabase: the lowercase "supabase" connector reported a proxy
  tunnel error at session start; the "Supabase" connector connected and was used. Read-only count before any
  work: 4 posts published on 30 Oct UTC, 22 in the last 7 days; caps 7 and 45 not reached; no row for the slug.
- Published: "Intentsly vs Teamfluence: Whose Network, Who Replies?"
  https://intentsly.com/compare/intentsly-vs-teamfluence
  Gate run 1 passed with no fails and no warnings. Two wording edits after the pass (hosting-region sentence,
  one extra source link on the ICP row), then `blog_cloud.py sql` printed ready: true. 8 H2, 6 FAQ (55 to 60
  words each), 8 internal links, 14 external (all teamfluence.com), 2,885 words by the gate's count against
  page-write.md's 1,300 to 2,500 for a comparison (gate max 4,000). Decision taken without review: kept the
  length; the 14-row table and the two "where X is better" sections are the page's substance.
- Database: the insert ran on project uwwajlezgeurnvvrvdvb and returned status published, published_at
  2026-10-30 21:59:18 UTC. A read-only select afterwards confirmed section compare, article_type comparison,
  word_count 2885, reading_minutes 13, 6 FAQ entries, 5 secondary keywords, content length 20,162 characters and
  an md5 of the stored content_md identical to the content in blog/out/intentsly-vs-teamfluence.sql.
  DEVIATION TO NOTE: when the SQL was pasted into the connector, one line of the ON CONFLICT clause
  (`article_type = excluded.article_type,`) was dropped by transcription error. The slug was new (0 rows before),
  so only the INSERT branch executed and the stored row has article_type = comparison; the ON CONFLICT branch
  never ran and nothing else differed. No second write was made. Future runs should read the file back
  line-for-line before passing it; the sql file on disk is the correct reference.
- Teamfluence facts, all from teamfluence.com opened 30 Oct 2026: pricing page "Starting October 1st, 2026",
  Regular Unlimited Plan 449 EUR/month with 1,000 qualified leads, unlimited seats, 20,000 credits, up to 100,000
  contacts, Small plan with no price shown, credit costs (lead 1, signal 1, job 1, AI job 1, email 4, phone 40);
  Pulse page "Starting at $99/month", native MCP server, API sends requests and DMs, CRM sync to Salesforce,
  HubSpot or Pipedrive; Gojiberry comparison still printing 89/129 EUR per seat and a 7-day trial; help centre:
  60 tracked profiles and 40 tracked posts per user, six influencers per active seat, post tracking 2 months then
  renew, keywords matched against tracked profiles only, signals "currently come from LinkedIn only", Prospect
  Tracker CSV export; networking campaigns send connection requests plus one follow-up after acceptance;
  homepage "Then we tell you who to reach out to. You decide how." and the five-people-125-requests example;
  Trigify comparison: Estonia hosting, HubSpot and Salesforce native. Not reachable: /pro-home, /help/linkedin-api/,
  /help/v2/pulse-linkedin-monitoring (client errors), so no claim rests on them. Third-party pages (getfuzzy,
  connectsafely, salesforge) were opened for SERP context only and nothing was taken from them.
- Angle: no page compares the two tools; the ranking pages are Teamfluence's own comparisons and competitor
  listicles quoting older per-seat prices. This page prints the three different price figures Teamfluence's own
  site shows today, the help-centre limits, and names the two deciding rows (whose network the signals come from,
  and who answers the reply).
- Intentsly facts used: product.md feature list and limits (LinkedIn only, 2 accounts, 30/30 a day, 15
  recommended, 4 languages, HubSpot/Cal.com/Google Calendar/LinkedIn, export, 7-day trial, self-serve, no API
  listed); 14 demos in 14 days, zero manual outreach, 4x reply rate (dogfooding-14-demos.md). No price stated.
  Reddit/X not mentioned. CTA is /try-ai with /features/ai-sdr and /features/linkedin-signals in the body.
- Queue: 11 compare keywords still queued (clay, 11x, heyreach, waalaxy, expandi, dripify, lemlist, la growth
  machine, artisan, aisdr, salesrobot). Above the 5-keyword threshold, so no new keywords were added.
- For the founder:
  1. Hosting region: the page says it cannot state Intentsly's hosting region. If you can confirm where
     Intentsly's data is hosted (and GDPR posture), add it to brain/wiki/product.md and this page can print it
     next to Teamfluence's Estonia line.
  2. Keyword-post scope: the page says Intentsly matches keyword posts "across LinkedIn" rather than inside a
     tracked list, which follows product.md's "keyword posts (pain points, tools, topics)". If the real scope is
     narrower (for example only within followed companies or a search radius), say so and the row will be edited.
  3. An API or Zapier/webhook option, if one exists, would remove a row that currently favours Teamfluence.
  4. The 21% reply-rate, ~1,000 leads and 2 to 4 meetings rows in proof.md still carry "verified:" plus a
     phrasing note, which the gate reads as not verified for figures with a % sign; comparisons cannot cite the
     reply rate until the Status cell reads exactly "verified".
  5. A customer who switched from Teamfluence (or any team-signal tool) to Intentsly, with what they kept and
     what they lost, would be the first-hand story this page lacks.
- Live check (22:04 to 22:23 UTC, 4 to 23 minutes after the push landed at 22:00 UTC): NOT CONFIRMED this run.
  The fetch tool refused https://intentsly.com/sitemap.xml and the page URL for lack of provenance (same as the
  30 Oct learn run), so the check used https://intentsly.com/compare, which is linked from the homepage footer. At
  22:05, 22:13, 22:18 and 22:23 UTC the prerendered compare index still listed the seven previous comparisons and
  not intentsly-vs-teamfluence. The learn index did list the page pushed at 19:31 UTC by the previous run, so the
  deploy path works but had not rebuilt within 23 minutes of this push, or the index is served from a CDN cache.
  The repository has no GitHub Actions runs, so the build cannot be inspected from here. The database row is
  published and the push to main succeeded (6d0574b..9505a3a); if the page is still missing from
  https://intentsly.com/compare an hour after the push, the Cloudflare build needs a look. No other check was
  attempted, as the task rules require.
- Site note for the founder (website code, not touched by this task): the compare index renders each card's
  link text as "Intentsly vs Intentsly vs <Tool>: ..." (the title already starts with "Intentsly vs", and the
  index prepends it again). Seen on 30 Oct at 22:05 UTC.
