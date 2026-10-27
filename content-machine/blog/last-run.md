# Last run: 2026-10-27 (daily blog task, blog section; started 06:52 UTC, 09:52 Bucharest)

- Keyword: scrape linkedin post likers and commenters (cluster linkedin-signals, type how-to, intent commercial,
  priority 1, difficulty medium). `blog_next.py --section blog` returned it directly. No PAUSE file, no draft
  waiting. Repository already cloned and in scope; `git pull origin main` reported up to date at 9518bc9.
- Published: "How to Scrape LinkedIn Post Likers and Commenters: 4 Methods"
  https://intentsly.com/blog/scrape-linkedin-post-likers-and-commenters
  `blog_gate.py` failed once (meta_description 162 chars, and "21%" flagged because the gate only accepts proof
  rows whose status is exactly `verified`; the 21% and ~1,000-leads sentence was removed, as on earlier runs)
  and passed on the second run. `blog_cloud.py sql` printed ready on its first run; after three truth-pass edits
  (dropped an unverified "older native posts" gloss on the ugcPost URL form, replaced `li_at` with "session
  cookie", stated the george.the.developer price as "$4 to $5 per 1,000" because its page shows both) it was
  re-run and printed ready again. 2,816 words by the gate's count, 11 H2, 6 FAQ, 7 internal links, 12 external.
  The generated SQL ran unchanged on Supabase project uwwajlezgeurnvvrvdvb and returned status = published at
  07:04:52 UTC; a read-only select confirmed the stored content_md matches the local body (md5
  9a5c0e88cbd986f7a70a26c7b32f71e1, 17,585 characters). First page of 27 October (daily count 1 of 7).
- Angle: the ranking pages are single-tool tutorials (Evaboot on Phantombuster, Bardeen, HeyReach help) and
  Apify actor pages. This page sorts four ways to scrape a post's reactors and commenters by whose LinkedIn
  account does the scrolling (by hand, extension or cookie in your session, no-login cloud scraper, continuous
  monitor), gives the three post URL forms that work and the one that fails, a table of five no-login options
  with the cap and price each vendor's page showed today, a six-step CSV clean-up and scoring recipe, LinkedIn's
  own stated position on scraping, a decision table, and where each route including Intentsly is wrong.
  Brief in blog/briefs/scrape-linkedin-post-likers-and-commenters.md. Kept distinct from the 22 October
  "track competitor LinkedIn post engagers" article (which owns the why, the manual volume rule, scoring table
  and message templates; this one links to it for those).
- Competitor and tool facts from their own pages today: apify.com actor pages (george.the.developer,
  scraping_solutions, data-slayer reactions .md, meetmagnet-owner, curious_coder), insightsocial.app,
  help.heyreach.io, vayne.io/en/linkedin-post-scraper, community.make.com (Browserflow), community.clay.com,
  evaboot.com (Phantombuster walkthrough, published 2023), phantombuster.com/blog LinkedIn scraping guide
  (modified 7 July 2026: extension plus connected account, 14-day trial, from $56/month for 20 hours). The
  Phantombuster automation pages (post likers export, post commenters export) need JavaScript and could not be
  read; its pricing page asked for a permission nobody was there to grant; so Phantombuster facts come only
  from its blog page. LinkedIn's position quoted from blog.linkedin.com (4 Nov 2022 hiQ statement); the
  LinkedIn Help "prohibited software and extensions" page is robots-blocked for the tool and is not quoted.
  Intentsly facts only from proof rows the gate accepts (14 demos, 4x reply rate, 7-day trial) and product.md.
  No price, no 21% or ~1,000-leads figures, no Reddit/X claim, no email-sending claim.
- Live check: not performed from this run (previous runs found intentsly.com robots-blocked for the tool and
  the repo has no GitHub Actions). The row is `status = published`, so the page should be live once the host
  finishes the build triggered by the push. Alex should open the URL.
- Queue: 31 blog keywords still queued (57 across all sections), so none added. Blocked keywords: none.
- Connector note: as on previous runs, a lowercase `supabase` server was listed as failed (ERR_PROXY_TUNNEL)
  while the capitalised `Supabase` connector worked (a read-only `select 1` confirmed it before any work).
  `add_repo` was not available as a tool; the repository was already in scope.
- For Alex: (1) the gate rejects the 21% reply rate and ~1,000 leads/agent figures because their proof.md status
  is "verified: ..." rather than exactly "verified"; if those numbers may be used, change the status cell to
  `verified` and move the phrasing note to the Claim column (that file is off-limits to this task); (2) a short
  note on how Intentsly's signal collection works (own data vs the customer's LinkedIn session, how fast a new
  engager appears) would let these how-to pages state it plainly instead of describing the output only;
  (3) a real customer example of a scraped list being replaced by monitoring would strengthen method 4.
