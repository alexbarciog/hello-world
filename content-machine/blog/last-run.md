# Last run: 2026-11-02 (guides task; fired about 08:20 UTC, 10:20 Bucharest)

- Setup: no PAUSE file. Repository already cloned and in scope; `git pull origin main` was up to date at 7a2b42e.
  `add_repo` was not available as a tool, as on previous runs. Supabase: the lowercase "supabase" connector
  reported a proxy tunnel error at session start again; the "Supabase" connector connected and was used. The only
  draft in blog/drafts/ (outbound-sales-process-for-startups.md) carries a `blocked:` line, so it was not resumed.
- Keyword (published): how to personalize cold outreach at scale (section guides, cluster outbound, guide,
  commercial, priority 2).
  "How to Personalize Cold Outreach at Scale in 3 Tiers"
  https://intentsly.com/guides/personalize-cold-outreach-at-scale
  Gate: first run failed on two points (meta_description 166 chars; the 21% reply-rate figure is in proof.md but
  its status cell reads "verified: say ..." rather than "verified", so the gate does not accept it). Fixed by
  shortening the description and dropping the 21% sentence; second run passed. `blog_cloud.py sql` printed
  ready: true at 3,027 words by the gate's count (two tables and six code blocks included; the prose is under
  3,000), 11 H2, 6 FAQ, 10 internal links, 2 external source links, no warnings.
- Angle: every ranking page (Instantly, QuickMail, Apollo, Salescadia, Woodpecker x2, Coruzant, Daily Sales Rep;
  Sbl.so is the only one that covers LinkedIn and it is a tool pitch) is email-only, gives "levels" of
  personalization without a time budget, shows no research sheet and no full message per level, and quotes
  round-up statistics. This guide gives three tiers with minutes per person and weekly volume, a six-column
  research sheet with rules for the signal cell, a signal-to-first-line rule with templates per signal, full
  LinkedIn and email messages per tier, a worked week for a labelled hypothetical company (Harbourline Analytics;
  Fieldstone, Brightmark and the people are stated as invented), a five-question QA check, the LinkedIn caps
  (15 a day, 30 max) and primary-source numbers.
- Sources opened and linked: LinkedIn's own InMail data (May 2021 to April 2022: under 400 characters +22%, over
  1,200 characters -11%, individual sends about +15%), and Woodpecker's cold email statistics page (18% vs 9%
  replies for advanced vs no personalization; Belkins 16.5 million emails: under 50 contacts 5.8%, 1,000+ 2.1%),
  labelled as vendor data. Google's own sender-guidelines page could not be opened in this unattended run (the
  fetch tool asked for a permission nobody was there to grant), so no Gmail spam-rate threshold is quoted.
  Intentsly facts used: LinkedIn signals feature description (post engagement, keyword posts, ICP scoring), AI SDR
  caps 30/30 with 15 recommended, 14 qualified demos in 14 days / zero manual outreach / 4x reply rate (linked
  to /case-studies). No price. No Reddit or X claims.
- Database: the generated SQL ran unchanged on project uwwajlezgeurnvvrvdvb and returned status published,
  published_at 2026-11-02 08:37:50 UTC. A follow-up read-only select confirmed section guides, article_type guide,
  6 FAQ entries, 5 secondary keywords, and content_md length (20,127 chars) and md5 identical to the local SQL
  file's content_md. `blog_cloud.py mark` filed the article and set the keyword to published.
- Queue: 7 `guides` keywords still queued (next: how to track job changes on linkedin for sales), 13 published,
  1 blocked, so no keyword refresh this run.
- Daily cap: third page of 2 November by Bucharest time (intentsly-vs-11x at 00:16, best-subreddits at 07:18 UTC),
  cap 7; weekly count under 45.
- For Alex: (1) proof.md rows whose status reads "verified: say ..." (21% reply rate, ~1,000 leads/month per
  agent, 2 to 4 meetings a week) are not accepted by the gate because it matches the word "verified" exactly;
  if those numbers should be usable, change the status cell to "verified" and move the phrasing instruction into
  the Claim column or corrections.md. (2) A first-hand number for how long your own tier-1 research takes per
  account, or one real reply to a signal-based first line (anonymised), would let a future update of this guide
  replace the hypothetical example with a real one. (3) Confirm whether `add_repo` should exist in this
  environment; the repository is attached and pushes work without it.
