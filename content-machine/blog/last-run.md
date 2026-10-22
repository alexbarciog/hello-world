# Last run: 2026-10-22 (Blog task, blog section; started about 08:50 Bucharest)

- Keyword: track competitor linkedin post engagers (cluster linkedin-signals, how-to, commercial, priority 1,
  low). No PAUSE file. First keyword returned by `blog_next.py --section blog`; no draft was waiting in
  `blog/drafts/`.
- Title: How to Track Competitor LinkedIn Post Engagers (3 Ways)
- Live URL: https://intentsly.com/blog/track-competitor-linkedin-post-engagers
- Status: published (Supabase upsert returned `status = published`, published_at 2026-10-22 06:06 UTC, 09:06
  Bucharest). The SQL file `blog/out/track-competitor-linkedin-post-engagers.sql` was run once, unchanged
  (diffed byte-for-byte against the text sent), through the `Supabase` connector's execute_sql on project
  uwwajlezgeurnvvrvdvb. No other database statement was run. Second article dated 22 October (the compare
  task published intentsly-vs-valley at 00:01 Bucharest); daily cap 7.
- Gate: `blog_gate.py` run 1 failed on one item (meta_description 169 chars). Shortened to 150; run 2 passed
  with no warnings, `blog_cloud.py sql` printed `"ready": true`. Three small truth-pass edits after that
  (removed "the table we use", "before we sold it", "signals caught the same day" -> "in real time"; moved the
  closing paragraph into a "What to do this week" H2 so it is not folded into the last FAQ answer) and the
  SQL was regenerated; the final file is the one that ran. 2,287 gate-words (about 2,000 prose), 10 H2s,
  6 FAQ entries, three tables, 7 internal links (/learn/what-is-a-buying-signal, /features/linkedin-signals,
  /blog/trigify-replacement-linkedin-engagement-tracking, /case-studies, /guides/find-decision-makers-on-linkedin,
  /try-ai), 5 external links, all opened this run.
- External sources used: Microsoft Learn, LinkedIn Reactions API (permission scopes quoted);
  business.linkedin.com Buyer Intent page (signal list); Apify "LinkedIn Competitor Hijack Leads" listing
  (no-cookie, $0.02 start + $0.04 per scored lead, 1 to 30 posts per source); databar.ai guide (four audience
  pools); linkedpanda.com comparison (set-up vs maintenance trade). Each tool fact comes from that tool's own
  page. LinkedIn Help pages (a1341387, 90586, 81340, 126090) and the User Agreement could not be opened from
  this run (robots / permission prompt with nobody present), so the article attributes nothing to them; the
  "user agreement bars scraping" sentence in the FAQ is stated generally, without a quote or a figure.
- Intentsly facts used: post engagement on competitor and industry-leader posts, ICP scoring, verified
  emails, AI SDR on LinkedIn only with Cal.com / Google Calendar booking, 2 accounts, 30/30/15, 7-day trial,
  /try-ai with no account (product.md); 14 qualified demos in 14 days, zero manual outreach, 4x reply rate,
  signals caught in real time (dogfooding story, verified). No price stated. Reddit/X named only as something
  Intentsly does not monitor.
- Queue: 73 keywords queued overall (39 blog), so no keywords were added. Next blog keyword is "reddit
  keyword monitoring for leads" (reddit-x, listicle): it must stay a manual guide, Intentsly's Reddit
  monitoring is not live.
- Connectors: lowercase `supabase` server failed to connect (ERR_PROXY_TUNNEL); the separate `Supabase`
  server's execute_sql worked. No `add_repo` tool existed in the session; the repository was already in scope
  and `git pull origin main` ran on the existing clone (ca0e178, already up to date). Cloud-only run.

## What the research turned up
- Every ranking page is vendor-written and ends in the vendor (Databar, Linked Panda, Embers, Sbl, ConnectSafely,
  traxy) or is an Apify listing. Our Trigify-replacement article sits at position 7 for the keyword.
- No ranking page says what LinkedIn itself gives you before sending the reader to a scraper. The article
  opens with that: Reactions API scopes are admin-only or "select developers only"; Buyer Intent lists only
  first-party signals; Page analytics compares numbers, not people.
- Embers' tool list (updated 1 Oct 2026) still presents Trigify as a current option while its own sidebar says
  Trigify shuts on 22 October. Useful for the next Trigify-cluster update.
- Linked Panda's blog quotes plans at $74 / $144 / $229; Embers' September table has Linked Panda at $49 / $99 /
  $199. Prices from third-party lists were not used; none were needed for this article.

## For the founder
- A real example of a competitor post and what Intentsly captured from it (how many engagers, how many passed
  ICP scoring, how many replied) would give this article a first-hand number no competitor can copy. Nothing
  like it is in brain/stories/.
- proof.md rows for 21% reply rate, ~1,000 leads/month per agent and 2 to 4 meetings a week still carry
  phrasing notes in the status cell, so the gate does not accept them. Same request as previous runs.
- Confirm whether Intentsly captures "shares" as well as likes and comments on competitor posts; product.md
  says "like, comment or share" and the article repeats it.
- The reddit-x cluster is next in the blog queue. If Reddit monitoring ships, update product.md and
  corrections.md first; until then those articles stay manual methods with a LinkedIn-only mention.

## Live check (after push)
- See the commit for the push hash. As in previous runs, intentsly.com could not be fetched from this run
  (permission prompt with nobody present), so the page and sitemap were not confirmed live; the database row
  is published, so the page should resolve once the deploy for this commit completes.
