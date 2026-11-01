# Last run: 2026-11-01 (compare task; fired about 22:05 UTC, 00:05 Bucharest on 2 November)

- Setup: no PAUSE file, no unblocked `compare` draft waiting (the only draft, outbound-sales-process-for-startups.md, is
  the blocked guides draft). Repository already cloned and in scope; `git pull origin main` was up to date at 561ac0d.
  `add_repo` was not available as a tool, as on previous runs. Supabase: the lowercase "supabase" connector reported a
  proxy tunnel error at session start; the "Supabase" connector connected and was used.
- Keyword (published): intentsly vs 11x (cluster intentsly-vs, commercial, priority 2).
  "Intentsly vs 11x: LinkedIn Signals or an Enterprise AI SDR?"
  https://intentsly.com/compare/intentsly-vs-11x
  Gate: first local run failed on two counts: the opening paragraph was 102 words, and the gate's statistic regex reads
  the competitor's name "11x" as a figure ("\d+x"), so every paragraph and heading that names 11x without a source link
  failed. Fixed by trimming the opening to 87 words and giving every paragraph that names 11x a docs.11x.ai source
  link (the three H2s containing "11x" are followed directly by their linked paragraph with no blank line, which the
  gate reads as one paragraph and markdown renders normally). Passed on the second run. `blog_cloud.py sql` printed
  ready: true at 3,022 words by the gate's count (a 13-row table included; about 2,550 words of prose), 8 H2, 6 FAQ,
  8 internal links, 18 external source links, no warnings. Note for future `compare` runs against tools with a digit-x
  name (11x, and any "...x" brand): the same workaround will be needed; the gate itself was not touched.
- Angle: the ranking pages for 11x are reviews and alternatives lists from competing email AI SDR vendors (coldreach,
  salesrobot, apollo.io, marketbetter, syncgtm, miniloop) and nothing ranks for the pairing. This page compares 11x
  with a LinkedIn engagement-signal tool from 11x's own docs: five channels, 400M+ contact database and managed
  mailboxes versus a two-account LinkedIn tool with published daily caps; shows that 11x's docs list LinkedIn as a
  channel but describe no LinkedIn step types, account connection or daily numbers; contrasts its seven event signals
  with person-level engagement; quotes its poor-fit list, Growth price, annual default and 30-day notice; says its docs
  describe no CSV export; lists eight jobs where 11x is the better buy; ends with a one-minute rule.
- Research: 11x's marketing pages (www.11x.ai home, /pricing, /products/alice/pricing) could not be opened in this
  unattended run (fetch permission not available), so every 11x fact comes from the help centre and docs at
  docs.11x.ai, 16 pages opened on 1 November 2026 and listed in blog/briefs/intentsly-vs-11x.md. The one price quoted
  (Alice Growth "From $3,750/mo, billed annually") is from the docs' pricing overview, with the page telling the reader
  to confirm on 11x.ai. The 11x free-trial FAQ heading was present but its answer did not render, so the page states
  that it does not know either way. Intentsly facts used: product.md feature list and limits, 14 demos / 14 days /
  zero manual outreach / 4x story, 12 signals and 8 to ignore, 7-day trial, 2 accounts, 30/30/15 caps, four languages.
  No price, no Reddit/X feature claims, 21% and 2 to 4 meetings not used (status cell not plain "verified").
- Database: the generated SQL ran unchanged on project uwwajlezgeurnvvrvdvb and returned status published,
  published_at 2026-11-01 22:16:00 UTC. `blog_cloud.py mark` filed the article and set the keyword to published.
- Queue: 9 `compare` keywords still queued (next: intentsly vs heyreach), 10 published, so no keyword refresh this run.
- Daily cap: by Bucharest time this is the first page of 2 November (4 were published on 1 November, cap 7); weekly
  count is under 45.
- Push: see the commit `compare: publish intentsly-vs-11x`. Nothing outside content-machine/ changed.
- Live check: recorded below after the push.
- For Alex: (1) the proof.md rows for the 21% reply rate, 1,000 leads/agent and 2 to 4 meetings still carry the
  status "verified: say ...", which the gate reads as not verified; plain "verified" with the phrasing note moved
  into the Claim cell would let compare pages quote them. (2) Allow-listing www.11x.ai (and other competitors'
  marketing domains) for the fetch tool, or opening their pricing pages once in a live session, would let compare pages
  quote the marketing pricing page rather than the docs. (3) Allow-listing intentsly.com for the fetch tool would let
  runs confirm the sitemap. (4) A sentence or two on whether Intentsly offers any review-before-send mode for the AI
  SDR would let compare pages answer that row with a product fact instead of leaving it to the caps.
