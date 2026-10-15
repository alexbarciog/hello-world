# Last run: 2026-10-15 (compare section, evening)

- Keyword: trigify vs intentsly (section compare, cluster trigify, comparison, priority 0)
- Title: Trigify vs Intentsly: Which Trigify Jobs Does It Cover?
- Live URL: https://intentsly.com/compare/trigify-vs-intentsly
- Status: published (Supabase row returned `status = published`, published_at 2026-10-15 21:08 UTC).
  Pushed to main at 21:10 UTC. Live check not possible this run: the page fetch tool required a
  one-time approval for intentsly.com that nobody was present to grant, so whether the page and the
  sitemap entry are live was not confirmed. Check https://intentsly.com/compare/trigify-vs-intentsly
  and https://intentsly.com/sitemap.xml by hand.
- Gate: passed on the first run, 2,351 words (comparison range 1,300 to 2,500), 8 H2s, 6 FAQ entries,
  internal links to /blog/trigify-alternatives (hub, "Trigify alternatives" anchor in the first 300 words),
  /blog/trigify-shutting-down, /features/linkedin-signals, /features/ai-sdr, /signal-playbook, /pricing,
  /try-ai, /compare; 8 external links, all to trigify.io or Trigify's help centre. No warnings.
  Fourth new article published today (daily cap 7).
- Keywords blocked or skipped: none. 10 compare keywords (all cluster intentsly-vs) and 96 keywords in
  total remain queued, so no new keywords were added. First /compare page.
- Date logic: run on 15 October 2026, before the 22 October cutoff, so present tense and deadline first.
  From 23 October this page needs the past-tense edit described in blog/briefs/trigify-campaign.md
  (verdict paragraph, "while you still have it" H2, "Can you use both?", checklist intro, FAQ 2).
- Hub "Related" link: blog/published/trigify-alternatives.md has no "Related" list, and this run's
  rules allow one database write only, so the hub was not touched. The hub already links the compare
  index; a one-line link to this page could be added in a later update of the hub.

## What the research turned up
- No page targets "trigify vs intentsly". The neighbourhood is vendor "vs Trigify" and "Trigify
  alternatives" pages (Valley, SyncGTM, Embers, Overloop, Teamfluence, SignalRaven, Deberli, Revexa,
  Getcleed, Reactin, Easeclaw). None mention Intentsly. Several still omit the retirement; SyncGTM quotes
  prices "from user reports" ($49/$99/$199) that do not match Trigify's own help centre.
- trigify.io (opened today) shows only the 23 September 2026 retirement notice and FAQ; no features, no
  pricing. The pricing page could not be opened directly (no search result pointed at it). Trigify's help
  centre (trigifyio.featurebase.app, canonical help.trigify.io) still publishes a Plans & Pricing article:
  Starter $40/mo (4,000 credits, 25 saved searches, 1 workspace), Max $199/mo (40,000 credits, unlimited
  searches, 3 workspaces, BYOK, free Jarvis), Enterprise custom, overage $0.012/credit, legacy Essential
  $149, Growth $270, Scale $549. Quoted with the link and the date; the article says plainly that what
  applies to a given account depends on the customer's invoice and notice.
- Trigify features used, all from help-centre articles opened today: Social Signals (tracked profiles and
  companies, 16 signal types incl. role change, hiring, expansion; fires within 24 to 72 hours, first run
  looks back 30 days; early access, free during beta), Listening (Business Network, Reddit, X, YouTube,
  podcasts; "only finds posts"), Workflows (AI Agent nodes, General and Sentiment agents, enrichment for
  email and phone, destinations HubSpot, Salesforce, Attio, Slack), Output tab Export CSV (current page,
  25/50/100 rows, nested sub-tables export separately), help-centre sidebar listing API docs, CLI and MCP.
  Trigify's docs say "Business Network" rather than naming LinkedIn; the page keeps that wording for
  Trigify and says "LinkedIn" only for Intentsly.
- No outside statistics were used, so no third-party stat links were needed.

## Calls made without review
- Verdict reframed: since Trigify retires on 22 October, "choose Trigify" is not an option, so the page
  maps Trigify jobs to Intentsly coverage instead of pretending to be a neutral pick between two live
  tools. "Where Trigify is the better choice" is kept, as page-write.md requires, with the qualifier
  "(while you still have it)" and real items (multi-platform listening, workflow nodes, job-change
  signals, credit-based pricing).
- Intentsly limits stated: LinkedIn only, 2 sender accounts, 30/30 daily caps with 15 recommended, four
  languages, HubSpot as the only CRM, no email sending, no job-change signals, no node editor, phone data
  not listed. "Export exists; format not promised" per product.md. No API claim either way.
- Verified numbers used: 14 qualified demos in 14 days, zero manual outreach, 4x reply rate (labelled "one
  team and one campaign, not a benchmark"); around 1,000 leads a month per agent and 2 to 4 meetings a
  week, attributed "across Intentsly customers" and "typical, on average and not guaranteed"; 7-day trial;
  12 signals / 8 to ignore. The 21% reply rate was left out: the gate only whitelists proof rows whose
  status cell is exactly "verified", and that row's cell carries phrasing guidance, so a 21% figure would
  have needed a workaround to pass. Same for the "Mike Ruiz" quote: not used.
- "Can I import my Trigify data into Intentsly?" is answered as "plan to recreate rather than upload",
  without asserting that no import exists, because product.md does not say either way.

## For the founder
- Confirm whether Intentsly has a CSV import and a public API; both questions come up on every "vs" page
  and the compare section has 10 more of them queued.
- Confirm the export formats (CSV? HubSpot only?) so compare pages can name them.
- proof.md: if the 21% reply rate and the GrowthLab quote are to be usable, their status cell needs to
  read exactly `verified` (move the phrasing guidance into the claim column or a note); the gate script
  only reads rows whose status cell is exactly that word.
- The next compare keywords are "intentsly vs gojiberry", "intentsly vs valley", "intentsly vs common
  room", "intentsly vs phantombuster". A short list of which competitors you have actually been evaluated
  against by prospects, and any real switching story, would make those pages stronger than the Trigify
  one, which had no first-hand switching material.
- From 23 October: this page, trigify-alternatives and trigify-shutting-down all need the past-tense edit.
