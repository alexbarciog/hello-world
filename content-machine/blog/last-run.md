# Last run: 2026-10-23 (Guides task, guides section; started 07:22 UTC, 10:22 Bucharest)

- Keyword: how to set up signal-based outbound (cluster outbound, guide, commercial, priority 2, medium). Returned by
  `blog_next.py --section guides`. No PAUSE file, no draft waiting.
- Published: "How to Set Up Signal-Based Outbound in 7 Steps"
  https://intentsly.com/guides/set-up-signal-based-outbound
  Gate passed on the second run (one fix: the `# ...` labels inside the message-template code block were read as an
  H1; relabelled as `[...]`). 2,916 words, 12 H2, 6 FAQ, 7 internal links, 2 external. The generated SQL ran
  unchanged on Supabase project uwwajlezgeurnvvrvdvb and returned status = published at 07:43:15 UTC. Second
  article of the day (cap 7; the blog task published one at 06:11 UTC).
- Angle: the free, by-hand LinkedIn setup (Posts search strings with the Date posted filter, the reactions list,
  follow + bell notifications, company People and Jobs tabs), a nine-column signal-log layout, one LinkedIn message
  per signal type, the daily routine with the 30/30 (15 recommended) caps, a weekly review table, and a labelled
  hypothetical worked example (Ridgeline Payroll). Ranking pages (Unify, Outboundish, Autotouch, Growleads,
  Demandbase, PlusClouds) all assume a paid data stack and give no by-hand mechanics; brief in
  blog/briefs/set-up-signal-based-outbound.md.
- Facts: Intentsly facts from proof.md verified rows (14 demos in 14 days, 4x reply rate, 12/8 playbook, 30/30/15
  caps, 21% AI SDR reply rate attributed "across Intentsly customers, October 2026") and the dogfooding story.
  Product features named (post engagement, keyword posts, competitor page followers, hashtag engagement, ICP
  scoring, export, /try-ai) are all in product.md. No price. Outside statistics: Hunter State of Cold Email 2025
  (hunter.io, opened today: 11M emails, 4.1% average, 5.8% for <=50 recipients vs 2.1% for 1,000+) and Forrester's
  21 Jan 2026 release (forrester.com press newsroom, opened today: 13 internal stakeholders, 9 external
  influencers, procurement decides in 53%). LinkedIn Help pages are robots-blocked to the fetcher, so LinkedIn
  mechanics are described from the product UI without a Help link and without statistics.
- Left out: a link to the published /blog/track-competitor-linkedin-post-engagers article (kept the internal link
  count near the skill's 2 to 5); worth adding in an update.
- Queue: 7 guides keywords still queued (above the 5 threshold, none added). Next: "how to monitor competitors on
  linkedin".
- Blocked keywords: none.
- Connector note: the session again listed a lowercase `supabase` server as failed (ERR_PROXY_TUNNEL); the
  capitalised `Supabase` connector worked (`select 1` test, then the insert). `add_repo` was not available as a
  tool; the repository was already attached and `git pull` succeeded.
- For the founder, carried over: (1) a second customer story so guides can vary the first-hand section, which still
  always points at the launch story; (2) export formats (CSV? API?) are unstated in `brain/wiki/product.md`, so the
  guide says "export" only; (3) the Intentsly price is still not citable; (4) any first-hand numbers from running the
  by-hand routine (hits per week per signal, time per day) would let this guide replace the hypothetical example
  with a real one.
- Live check: see the run report (sitemap and page fetched about 4 minutes after the push).
