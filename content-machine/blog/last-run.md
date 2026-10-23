# Last run: 2026-10-23 (Trigify campaign task, blog section; started 15:16 UTC, 18:16 Bucharest)

- Keyword: life after trigify: signal-based selling playbook (cluster trigify, how-to, informational, priority 1,
  difficulty low). `blog_next.py` returned a `templates` keyword, so per the campaign rule the first queued trigify
  keyword by priority (both remaining are 1) and then difficulty (low beats medium) was taken. No PAUSE file, no
  draft waiting. Date logic: 23 October, so past tense throughout; export steps kept only as a note for customers on
  longer notice periods.
- Published: "Life After Trigify: The Signal-Based Selling Playbook"
  https://intentsly.com/blog/life-after-trigify-signal-based-selling-playbook
  Gate passed on the third run (fix 1: meta description shortened and the 21% reply-rate figure removed because the
  gate only accepts proof rows whose status is exactly `verified`, and that row is marked "verified: say ..."; fix 2:
  meta description shortened again to 159 characters). 3,109 words, 13 H2, 6 FAQ, 10 internal links, 11 external.
  The generated SQL ran unchanged on Supabase project uwwajlezgeurnvvrvdvb and returned status = published at
  15:30:40 UTC; a read-only md5 check confirmed content_md in the database matches the generated file. Fifth article
  of the day (cap 7 in config/blog.json; blog 06:11 UTC, guides 07:43 UTC, trigify campaign 10:48 UTC, solutions
  12:53 UTC).
- Angle: the ranking pages (Abmatic, Findymail, Pocus, MarketBetter) are vendor playbooks with unsourced percentages
  and no message copy; the Trigify-alternatives pages (Octolens, Getcleed) are ranked tool lists. This page is a
  six-play table mapping each Trigify job (named from its help docs) to where the signal lives now, by hand and with
  which tool, with "Not Intentsly" stated for job changes/hiring and non-LinkedIn listening; two labelled message
  templates for the exported list; a response-window rule stated as our rule, not a benchmark; a 14-day restart plan;
  a "wrong fit" section. Brief in blog/briefs/life-after-trigify-signal-based-selling-playbook.md.
- Facts: Trigify from trigify.io and three help.trigify.io articles opened today (no price shown anywhere on
  trigify.io; none stated). Competitors from their own pages opened today: PhantomBuster support article, Teamfluence
  help page, clay.com/signals, octolens.com, business.linkedin.com Sales Navigator page. Statistics: Gartner press
  release 25 June 2025 (632 buyers, 73% avoid suppliers sending irrelevant outreach; the gartner.com URL without www
  opened) and news.linkedin.com/about-us (93 people add a new role every minute). Intentsly facts from proof.md
  verified rows (14 demos in 14 days, 4x reply rate, 2 to 4 meetings a week stated as typical, 30/30 caps with 15
  recommended, 12 signals / 8 to ignore) and product.md (four LinkedIn signal types, HubSpot only, 2 accounts, four
  languages, /try-ai with no account). No Intentsly price. No em dashes, no banned phrases, no "this week".
- Hub step: blog/published/trigify-alternatives.md has no "Related" list, so the post-publish hub edit was skipped
  as the brief allows.
- Queue: 1 trigify keyword still queued ("linkedin profile monitoring tool", priority 1, medium); 63 queued overall,
  so none added. Blocked keywords: none. Judgement call recorded: this keyword was not treated as a duplicate of
  the migration guide or the signal-based outbound guide because it covers the method (plays, templates, restart
  plan) rather than the tool move or the by-hand setup, and links to both.
- Connector note: the session listed a lowercase `supabase` server as failed (ERR_PROXY_TUNNEL); the capitalised
  `Supabase` connector worked. `add_repo` was not available as a tool; the repository was already in scope and
  `git pull` succeeded. WebFetch needed each URL to appear in a search result first (trigify.io and the help docs
  were reached through a domain-restricted search). phantombuster.com's automation page returned only a JavaScript
  notice; its support article was used instead.
- For the founder, carried over: (1) a customer story from a team that moved off Trigify would let the campaign
  stop reusing our own launch; (2) export formats (CSV? API?) still unstated in product.md; (3) the Intentsly price
  is still not citable; (4) the 21% reply-rate row in proof.md cannot be used until its status cell reads exactly
  `verified` (the phrasing note can move into the Claim cell); (5) the remaining trigify keyword, "linkedin profile
  monitoring tool", is a listicle that would need competitor pages checked on the day; nothing else blocks it.
- Live check: see the run report (sitemap and page fetched about 4 minutes after the push).
