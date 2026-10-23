# Last run: 2026-10-23 (Trigify campaign task, blog section; started 10:12 UTC, 13:12 Bucharest)

- Keyword: trigify vs teamfluence (cluster trigify, comparison, commercial, priority 1, low). `blog_next.py` returned
  "linkedin message templates for buying signals" (cluster templates), so per the campaign task's rule the first queued
  trigify keyword by priority then difficulty was taken instead. No PAUSE file, no draft waiting. Date logic: 23 October,
  so past tense ("Trigify closed for standard customers at 11:59pm BST on 22 October 2026"); export steps kept only as a
  note for longer notice periods.
- Published: "Trigify vs Teamfluence: What Moves Over and What Does Not"
  https://intentsly.com/blog/trigify-vs-teamfluence
  Gate passed on the third run (two fixes, both trimming the opening paragraph from 94 to 91 to 89 words). 3,578 words,
  10 H2, 6 FAQ, 8 internal links, 16 external. The generated SQL ran unchanged on Supabase project uwwajlezgeurnvvrvdvb
  and returned status = published at 10:48:18 UTC. Third article of the day (cap 7; blog at 06:11 UTC, guides at 07:43 UTC).
- Angle: the only direct comparison ranking is Teamfluence's own page; round-ups quote Teamfluence prices without linking
  the vendor page. This article maps Trigify's Social Signals, Listening and Workflows to Teamfluence from both help
  centres, prints the 60-tracked-contacts-per-user limit and the 2-month post-tracking window, states that Teamfluence's
  keyword monitoring covers posts from tracked profiles only (its own migration page says so), gives a settings map and a
  decision rule, and places Intentsly as the option for one or two profiles with its limits printed. Brief in
  blog/briefs/trigify-vs-teamfluence.md.
- Facts: Trigify from trigify.io (notice and FAQs) and help.trigify.io (Social Signals, setup, Listening vs Workflows,
  Clay/CRM article, Plans & Pricing, profile caps) opened today; the help centre was still reachable and still lists
  Starter $40 / Max $199. Teamfluence from teamfluence.com (homepage, pricing, /trigify migration page,
  /teamfluence-vs-trigify, signals page, workflows page) and its help centre (post tracking, social tracking, help index)
  opened today. Pricing page showed only Regular Unlimited at 449 EUR/month; the Small Unlimited plan had no visible price,
  so the article says so and attributes the lower third-party figure to Octolens as unconfirmed. Intentsly facts from
  proof.md verified rows (14 demos in 14 days, 4x reply rate, 30/30/15 caps, 2 accounts, 7-day trial) and the dogfooding
  story; features from product.md. No Intentsly price. No em dashes, no banned phrases.
- Hub update: blog/published/trigify-alternatives.md has no "Related" list, so the campaign brief's hub-link step was
  skipped, as the brief allows. Worth adding the Teamfluence, Valley and Gojiberry comparisons to the hub in a manual
  update.
- Queue: 2 trigify keywords still queued ("linkedin profile monitoring tool", "life after trigify: signal-based selling
  playbook"); 65 keywords queued overall, so none added.
- Blocked keywords: none.
- Connector note: the session again listed a lowercase `supabase` server as failed (ERR_PROXY_TUNNEL); the capitalised
  `Supabase` connector worked (`select 1`, then the insert). `add_repo` was not available as a tool; the repository was
  already attached and `git pull` succeeded. Several help-centre URLs needed a web search first before the fetcher would
  open them (provenance rule); Teamfluence's "How to Track Keywords" article could not be opened at all, so keyword
  scope is cited from Teamfluence's migration page instead.
- For the founder, carried over: (1) a second customer story so comparisons can vary the first-hand section; (2) export
  formats (CSV? API?) are unstated in product.md; (3) the Intentsly price is still not citable; (4) a Salesforce or
  general webhook integration would remove the biggest gap this comparison had to print against Teamfluence.
- Live check: see the run report (sitemap and page fetched about 4 minutes after the push).
