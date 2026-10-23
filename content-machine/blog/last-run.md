# Last run: 2026-10-23 (Blog task, blog section; started 05:52 UTC, 08:52 Bucharest)

- Keyword: reddit keyword monitoring for leads (cluster reddit-x, listicle, commercial, priority 1, low). Returned by
  `blog_next.py --section blog`. No PAUSE file, no draft waiting.
- Published: "Reddit Keyword Monitoring for Leads: 5 Tools, 1 Free Method"
  https://intentsly.com/blog/reddit-keyword-monitoring-for-leads
  Gate passed on the third run (two fixes, both to the opening paragraph length: 98 and 94 words, max 90).
  2,699 words, 12 H2, 6 FAQ, 5 internal links, 13 external. The generated SQL ran unchanged on Supabase project
  uwwajlezgeurnvvrvdvb and returned status = published at 06:11:50 UTC. First article of the day (cap 7).
- Facts: every price and feature claim is from the vendor's own page opened today (f5bot.com, syften.com,
  awario.com/pricing, octolens.com/pricing, brand24.com/prices, gummysearch.com/closing-time); the RSS method cites
  feeder.co and pagecrawl.io guides and Reddit's own search-operator page. Intentsly facts: 14 demos in 14 days
  story and the 12/8 playbook figures, both verified in proof.md. Intentsly is stated plainly as not monitoring
  Reddit (corrections.md, 2026-10-15). No price for Intentsly.
- Left out: Reddit Pro (redditforbusiness.com/pro failed to load twice; press coverage would not meet the
  "competitor's own site" rule). Worth a sentence in a future update if the page loads.
- Note: Awario's own pages disagree on the Starter monthly price ($49 on the pricing page, $39 in a blog post);
  the article uses the pricing page.
- Queue: 36 blog keywords still queued, none added. Next in the reddit-x cluster: "reddit search queries to find
  customers" (templates, priority 2).
- Blocked keywords: none.
- Connector note: the session listed a lowercase `supabase` server as failed (ERR_PROXY_TUNNEL); the capitalised
  `Supabase` connector worked. `add_repo` was not available as a tool; the repository was already attached and
  `git pull` succeeded.
- For the founder, carried over: (1) a second customer story would let Reddit/X articles vary the first-hand
  section, which currently always points at the launch story; (2) export formats (CSV? API?) are still unstated in
  `brain/wiki/product.md`; (3) the Intentsly price is still not citable; (4) if Reddit or X monitoring ever ships,
  update `brain/corrections.md` so the reddit-x cluster can mention it.
