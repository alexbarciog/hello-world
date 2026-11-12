# Last run: 2026-11-12 (learn task; fired about 19:10 UTC, 21:10 Bucharest)

- Setup: no PAUSE file. Repository already cloned, in scope and on `main` (`add_repo` is still not
  available as a tool, as on previous runs); `git pull origin main` already up to date at ff647e9.
  Supabase: the lowercase "supabase" connector again reported a proxy tunnel error at session start;
  the "Supabase" connector connected and was used. Web search worked. The only draft in blog/drafts/
  (outbound-sales-process-for-startups.md, guides) carries a `blocked:` line, so it was not resumed.
- Pre-write check: a read of public.blog_posts for the slug returned no row, so nothing was overwritten.
- Keyword (published): what is technographic data (section learn, cluster fundamentals, lesson,
  informational, priority 2, difficulty medium).
  "What Is Technographic Data? Sources, Limits, Free Checks"
  https://intentsly.com/learn/what-is-technographic-data
- Gate: passed on the third run. Fails on the first two: meta description 162 chars (cap 160) and
  title similarity above 0.75 to the firmographic lesson ("... Definition, Examples, Limits" vs
  "... Definition, Sources, Limits"); retitled to "Sources, Limits, Free Checks" (ratio 0.61). No fact,
  link or phrase fails. Final: 2,017 gate-counted words (three tables and the code block inflate the
  count; the firmographic lesson sits at 1,862 and the intent-data lesson at 1,776 by the same
  counter), 6 H2, 6 FAQ, 9 internal links, 6 external links, no warnings, no em dashes.
  blog_cloud.py sql printed "ready": true.
- Database: the upsert returned status published, published_at 2026-11-12 19:26:40 UTC.
- Angle: the first page is vendor glossaries (Cognism, Pipedrive, HubSpot, Demandbase, TheirStack,
  PredictLeads, Datarade). All define the term, contrast it with firmographics, list surveys / scraping /
  providers, and sell their dataset. None gives a free by-hand method, none separates "they run X"
  (a state) from "they posted about X" (a moment), and most numbers are vendor-claimed lifts. The page
  gives a one-sentence bold definition, a four-source table with each source's blind spot as stated by
  the sources themselves, a three-row state-versus-moment rule, a copy-paste job-ad search, three
  segments with a message angle each, and states plainly that Intentsly does not sell or detect
  technographic data (it watches who talks about a tool on LinkedIn).
- Sources opened today and linked: bettercloud.com 2026 State of SaaS report (15 Jul 2026, survey of 525
  IT and security professionals; mid-market average 164 apps, up from 116; 56% of apps carry IT
  approval); vertice.one "saas-apps-per-business" (updated Oct 2026; 144 applications for the average
  business in June 2026, from Vertice's own spend data); predictleads.com/blog/technographic-data
  (updated 13 Oct 2026; "no longer detected, not removed"; job-description caveat; five evidence
  sources); cognism.com/blog/what-are-technographics (26 May 2026; website detection "may miss CRMs,
  finance systems, data warehouses, sales tools and security platforms"; "technology usage alone does
  not always mean buying readiness"); blog.hubspot.com/marketing/technographics (updated 16 Oct 2023;
  "Most companies won't respond to cold-call surveys"); joinvalley.co/blog/technographic-data-guide-2026
  (8 Sep 2026; long-tail crawls refresh "at least quarterly", job-postings method "lags actual adoption
  by months"). Opened, not linked: pipedrive.com/en/blog/technographics, demandbase.com/faq/technographics,
  theirstack.com/en/blog/what-is-technographic-data. builtwith.com could not be opened (fetch blocked by
  the provenance rule), so the page names no BuiltWith figures or prices.
  Intentsly facts used: LinkedIn keyword posts, competitor page followers and engagers, ICP scoring,
  14 demos in 14 days, zero manual outreach, 4x reply rate. No price, no Reddit/X feature, nothing
  from the NOT LIVE epics. The page says Intentsly does not sell technographic data and does not detect
  what a company runs, matching product.md (enrichment is verified emails only).
- Queue: 10 `learn` keywords still queued (not fewer than 5, so blog-keywords was not run). Next up per
  blog_next is "what is a buyer persona in b2b", then multithreading in sales, warm lead, sales cadence,
  hiring signal in sales, sales prospecting, marketing qualified lead, lead qualification, sales
  qualified lead, SDR.
- Caps: third page of 12 November by Bucharest time (blog at 08:58, solutions at 15:48); cap 7 a day,
  and 13 in the last 7 days against the weekly cap of 45.
- For Alex: (1) if Intentsly ever adds a tech-stack or "uses tool X" filter, say so in product.md and
  this lesson's "to be clear about the limit" sentence should be rewritten; (2) a one-line customer
  story where a competitor-page engager or a tool complaint post became a meeting would give the
  state-versus-moment rule a first-hand example instead of the launch story; (3) the 21% reply-rate row
  is still unusable by the gate because its status cell reads "verified: ..." rather than "verified";
  (4) a price is still blocked by the corrections log.
- Push and live check: see the end of this file (appended after the push).
- Push: `git push origin HEAD:refs/heads/main` fast-forwarded the remote from ff647e9 to b1239bd at
  19:27 UTC, authored as "Claude (content run) <noreply@anthropic.com>".
- Live check: NOT CONFIRMED. At 19:31 UTC (4 minutes after the push) WebFetch refused the page URL,
  the sitemap and the homepage (PROVENANCE_REQUIRED, as on 5 to 12 November), and web search returns
  no intentsly.com URLs to fetch through, so neither the page nor the sitemap could be read this run.
  The database row is published (19:26:40 UTC) and the push went through, so the page should appear
  once the deploy's prerender runs; the 12 November solutions page needed a second push before it
  showed. This live-check commit triggers another deploy. Next run: confirm
  https://intentsly.com/learn/what-is-technographic-data and its sitemap entry.
