# Last run: 2026-11-18 (compare task; fired about 21:50 UTC, 23:50 Bucharest)

- Setup: no PAUSE file. Repository already cloned, in scope and on `main` (`add_repo` still not exposed as a
  tool, as on previous runs); `git pull origin main` reported already up to date at 0917a34. Supabase: the
  lowercase "supabase" connector again failed with a proxy tunnel error at session start; the "Supabase"
  connector connected and was used. Web search worked. The two older drafts in blog/drafts/
  (get-clients-for-an-ai-consulting-business.md, outbound-sales-process-for-startups.md) still carry a
  `blocked:` line, so neither was resumed. 2 articles had been published today (UTC) before this run
  (daily cap 7); the gate reported no weekly-cap problem (cap 45).
- Keyword (published, first attempt): intentsly vs dripify (compare, intentsly-vs, comparison, commercial,
  priority 2, difficulty medium).
  "Intentsly vs Dripify: Evergreen Lists or Live Signals?"
  https://intentsly.com/compare/intentsly-vs-dripify
- Orphan check: a read-only select for the slug before writing returned no row. Supabase returned
  status = published, published_at 2026-11-18 22:14:43 UTC. Writes: the one generated SQL statement, pasted
  whole from blog/out/intentsly-vs-dripify.sql (25,074 bytes). Reads: two selects (the pre-check and a
  post-insert comparison). The post-insert check compared length and md5 of content_md (19,502 chars,
  ed78cf74...), word_count (2739), reading_minutes (12), 8 secondary keywords, 6 FAQ entries, section and
  type against the local file: all matched exactly.
- Gate: first run failed only on meta_description length (164 chars against 160); trimmed it and the gate
  passed with no warnings. Then cut about 40 words so the body outside the table sits at about 2,480 words
  (compare range 1,300 to 2,500); gate-counted 2,739 words including the 15-row table. 8 H2, 6 FAQ (49 to
  69 words each), 8 internal links, 10 external links (all dripify.com / help.dripify.com), no em dashes,
  no banned phrases. Title 54 characters, meta_title 50. Title similarity to the nearest published
  compare title under the 0.75 limit.
- Angle: the SERP for the exact phrase is Capterra/GetApp/Software Advice "X vs Dripify" checkbox grids
  plus Dripify reviews and "alternatives" lists written by competing vendors (Snov.io, Skylead, La Growth
  Machine, Expandi, Waalaxy, SalesRobot). None mention Intentsly, buying signals or AI that answers leads,
  and the reviews still quote a Basic plan that Dripify's own October 2026 update says is closed to new
  subscribers. This page compares job by job from Dripify's own pricing page, FAQ and help centre, credits
  Dripify's post-engagement import and Evergreen mode as a real overlap, prints both daily limits side by
  side (noting the pricing page says 100+ messages a day and the FAQ says 150), lists where Dripify is the
  better buy (list in hand, LinkedIn plus email in one sequence, volume, teams, API/MCP, InMail and A/B
  tests), and builds the switch list on Dripify's own export article. Brief: blog/briefs/intentsly-vs-dripify.md.
- Competitor sources opened 2026-11-18: dripify.com/pricing, dripify.com/faq,
  dripify.com/compare-dripify-with-other-linkedin-automation-tools, help.dripify.com articles 5028652
  (add leads), 12658858 (leads from posts), 4910909 (what is Dripify), 5914465 (resume after reply),
  5030193 (inbox overview), 4914865 (export), 18327954 (October 2026 update). dripify.io redirects to
  dripify.com; dripify.com/features and dripify.io/pricing could not be fetched (permission withheld), so
  features came from the compare page, FAQ and help centre instead.
- Intentsly facts used: product.md confirmed rows (signals, scoring, AI SDR LinkedIn-only, 2 accounts,
  30/30 caps with 15 recommended, HubSpot/Cal.com/Google Calendar/LinkedIn, export, 7-day trial, /try-ai)
  and proof.md verified rows (14 demos in 14 days, 4x reply rate, 21% reply rate "across Intentsly
  customers, October 2026", 2 to 4 meetings a week on average). No Intentsly price stated.
- Compare queue after this run: 5 keywords still queued (intentsly vs lemlist, la growth machine, artisan,
  aisdr, salesrobot), so step 6 (add more when fewer than 5) did not trigger. The next compare run will
  drop below 5 and should add 8 to 12 keywords per skills/blog-keywords.md.
- For the founder: (1) whether Intentsly has a public API or webhooks, so compare pages can state it
  instead of listing integrations only; (2) whether exported formats are CSV, so the Export row can say
  so; (3) a second first-hand story (a customer switch from a sequence tool, with permission) would give
  the compare pages something beyond the launch case; (4) confirm the pricing figure so /compare pages can
  print a number next to competitors' prices.
