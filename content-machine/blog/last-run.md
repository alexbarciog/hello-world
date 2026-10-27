# Last run: 2026-10-27 (compare task, compare section; started about 21:55 UTC, 23:55 Bucharest)

- Keyword: intentsly vs phantombuster (cluster intentsly-vs, type comparison, intent commercial, priority 1,
  difficulty medium). `blog_next.py --section compare` returned it directly. No PAUSE file, no draft waiting.
  Repository already cloned and in scope with push access; `git pull origin main` was up to date at 537b862.
  `add_repo` was not available as a tool, as on previous runs.
- Published: "Intentsly vs PhantomBuster: Automation Toolkit or AI SDR?"
  https://intentsly.com/compare/intentsly-vs-phantombuster
  `blog_gate.py` failed once on meta_description length (169 chars), fixed by shortening; `blog_cloud.py sql`
  printed ready on its first run. 8 H2, 6 FAQ, 8 internal links, 8 external (all phantombuster.com), 2,592 words by
  the gate's count (the 13-row table holds roughly 450 of them; the Valley and Common Room pages sit in the same
  band). Fifth page of 27 October (daily count 5 of 7); weekly cap not reached.
- Database: a read-only select first confirmed no row existed for this slug (three rows published today before
  this one: scrape-linkedin-post-likers-and-commenters, qualify-leads-before-outreach,
  what-is-a-trigger-event-in-sales; find-customers-on-linkedin keeps its 24 October published_at). The generated
  SQL ran unchanged on project uwwajlezgeurnvvrvdvb and returned status published, published_at
  2026-10-27 22:03:32 UTC.
- Angle: nothing ranks for the pairing; the first page is comparison directories (fullenrich, G2, softwarefinder,
  cbinsights) and vendor listicles (joinvalley, findymail, zoominfo, waalaxy), none naming Intentsly. The page maps
  the two tools job by job from PhantomBuster's own site, names the row that decides (who answers the reply:
  PhantomBuster's own HeyReach post routes it through n8n/Zapier or a manual filter), prints both tools' stated
  LinkedIn limits side by side, lists six cases where PhantomBuster is the better buy (six platforms, custom chains,
  Sales Navigator exports, Sheets/Salesforce/Pipedrive, up to 100 accounts, free tier), and ends with a decision
  rule and a switch list. Brief in blog/briefs/intentsly-vs-phantombuster.md.
- Competitor sources (all phantombuster.com, opened today, linked on each claim): pricing explainer (modified
  21 Jul 2026, "as of July 2026"), prospecting guide (18 Jun 2026), safe-limits post (8 Jul 2026), integrations post
  (8 Jul 2026), vs HeyReach (29 Jul 2026), safety-architecture post (21 Jul 2026), vs Trigify (18 Jun 2026),
  data-extraction guide (16 Jul 2026). Pricing caveat: phantombuster.com/pricing is a client-rendered app that
  returned no text to the fetch tool, and support.phantombuster.com returned a client error, so the prices ($69/$159/
  $439 monthly, $56/$128/$352 annual) are quoted from PhantomBuster's own pricing explainer on its own domain, and
  the page says so and tells readers to open the pricing page. No Playwright or curl was used on those pages. If a
  figure on the live pricing page differs, the pricing section and the pricing FAQ are the only places to edit.
- Intentsly facts only from product.md (LinkedIn-only signals, ICP scoring, verified emails, export, HubSpot/
  Cal.com/Google Calendar/LinkedIn, AI SDR LinkedIn-only, 2 accounts, 30/30/15, four languages, 7-day trial,
  /try-ai) and the verified rows (14 demos in 14 days, 4x reply rate, 12 signals and 8 to ignore). No price, no 21%
  or ~1,000 figures, no Reddit/X claim, no email-sending claim, no API claim.
- Links: /blog/scrape-linkedin-post-likers-and-commenters, /guides/set-up-signal-based-outbound, /compare,
  /features/ai-sdr, /features/linkedin-signals (contextual sentence at the "launch the post-engager automation every
  morning" step), /signal-playbook, /pricing, /try-ai (closing next action).
- Live check: see the note appended below after the push.
- Queue: 6 compare keywords still queued (intentsly vs apollo next, then linkedin sales navigator, teamfluence, clay,
  11x, heyreach), so none added (RUN.md adds only below 5). Blocked keywords: none.
- Connector note: as on previous runs, a lowercase `supabase` server was listed as failed (ERR_PROXY_TUNNEL) and
  marc-lou-brain timed out, while the capitalised `Supabase` connector worked (a read-only select ran before the
  write).
- For Alex: (1) open phantombuster.com/pricing once and confirm the Start/Grow/Scale figures still match the July
  explainer; if not, say so and the next compare run will correct the two paragraphs; (2) confirm whether Intentsly
  has any API or Google Sheets export, since the page says it lists none; (3) a first-hand story of a customer who
  came from PhantomBuster (what they ran there, what changed) would replace the generic switch list with a real one;
  (4) the compare pages are running about 2,600 words by the gate's count against the 1,300 to 2,500 range in
  page-write.md, mostly table text; say if you want the at-a-glance table cut to 8 rows.
