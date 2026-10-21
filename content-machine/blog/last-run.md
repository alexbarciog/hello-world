# Last run: 2026-10-22 (Compare task, compare section; started 23:51 Bucharest on 21 October)

- Keyword: intentsly vs valley (cluster intentsly-vs, comparison, commercial, priority 1, medium). No PAUSE
  file. First keyword returned by `blog_next.py --section compare`; no draft was waiting in `blog/drafts/`.
- Title: Intentsly vs Valley: Autonomous AI SDR or Reviewed Drafts?
- Live URL: https://intentsly.com/compare/intentsly-vs-valley
- Status: published (Supabase upsert returned `status = published`, published_at 2026-10-21 21:01 UTC,
  which is 00:01 on 22 October Bucharest). The SQL file `blog/out/intentsly-vs-valley.sql` was run once,
  unchanged, through the `Supabase` connector's execute_sql on project uwwajlezgeurnvvrvdvb. No other
  database statement was run.
- Daily cap: the run started at 23:51 Bucharest on 21 October, when the seventh article of that day had
  already been published (cap 7). Research and drafting took the run past midnight; `blog_cloud.py sql`
  was run at 00:00 Bucharest on 22 October and passed with the cap for the new day free. Nothing was
  changed in config or scripts. This is the first article dated 22 October.
- Gate: `blog_gate.py` run 1 failed on one item (opening paragraph 98 words). Two trims brought it to 88
  words; run 3 passed with no warnings. `blog_cloud.py sql` then printed `"ready": true`. 2,443 gate-words
  (table cells included; about 2,050 words of prose), 8 H2s, 6 FAQ entries, one 12-row table, 6 internal
  links (/blog/joinvalley-alternatives, /try-ai, /features/ai-sdr, /features/linkedin-signals, /pricing,
  /compare), 6 external links, all to joinvalley.co pages opened this run.
- Competitor facts: Valley pricing page (prices updated 19 Oct 2026), product page, API and MCP page,
  "Valley AI pricing explained" (updated 6 Oct 2026), "joinvalley alternatives" (31 Aug 2026), per-seat
  pricing post (24 Aug 2026), "Valley vs 11x" (6 Oct 2026). The ZoomInfo review (12 Aug 2026) was read
  as a ranking page but not used for Valley facts: it quotes an older tier list and says Valley has no
  email, which Valley's own pricing page now contradicts.
- Intentsly facts used: LinkedIn-only signals and the four signal types, ICP scoring, verified emails,
  export, HubSpot/Cal.com/Google Calendar/LinkedIn, AI SDR on LinkedIn only, 2 accounts, 30/30/15, four
  languages, 7-day trial, /try-ai (product.md); 14 qualified demos in 14 days and 4x reply rate
  (dogfooding story, verified). No price stated.
- Queue: 8 compare keywords still queued (intentsly vs common room, phantombuster, apollo, linkedin sales
  navigator, teamfluence, clay, 11x, heyreach). 74 keywords queued overall, so no keywords were added.
- Connectors: lowercase `supabase` server failed (ERR_PROXY_TUNNEL); the separate `Supabase` server's
  execute_sql worked. No `add_repo` tool existed in the session; the repository was already in scope and
  `git pull origin main` was run on the existing clone (d595fa7). Cloud-only run, no computer linked.

## What the research turned up
- No page targets "intentsly vs valley". The results are Valley's own "vs" pages (19 pairings on
  joinvalley.co/compare; Intentsly is not one of them), a ZoomInfo review and dictionary noise.
- Valley's own pages never say who answers a reply. The product page says the sequence stops "so you can
  pick up the conversation" and the pricing FAQ says you review, edit and approve drafts. The article
  makes that the deciding row and attributes it to those two pages.
- Valley prints no LinkedIn daily limit ("inside LinkedIn's recommended limits"); its alternatives post
  caps email at about 30 a day per seat. Intentsly's 30/30/15 is stated next to it.
- Valley's pricing moved again: the pricing page now carries "prices updated 19 Oct 2026" (Starter $199
  or $149 quarterly, Plus $299, Growth $499, Scale custom from five seats, Done-For-You $1,499). The
  joinvalley-alternatives article published 15 October quotes an older Plus quarterly price and a
  "Valley Studios" name; worth a re-check when that article is next updated.

## For the founder
- Valley shows a per-prospect research step with sources, a review-before-send mode and an API. The
  article says Intentsly has none of these because product.md does not list them. If Intentsly has any
  form of message preview or approval before the AI SDR sends, say so in product.md; it would remove
  Valley's strongest row.
- A first-hand transcript of an AI SDR conversation (one real reply and what the AI answered) would let
  the "who answers the reply" section show instead of tell. Nothing like it exists in brain/stories/.
- Export formats: product.md says "export" without naming CSV or API. Confirming the format would let
  the "How to switch" section be specific on the Intentsly side.
- proof.md rows for 21% reply rate, ~1,000 leads/month per agent and 2 to 4 meetings a week still carry
  phrasing notes in the status cell, so the gate does not accept them. Same request as the last runs.

## Live check (after push)
- Pushed at 21:02:18 UTC (15432bf), `git push origin HEAD:main` from the detached clone, fast-forward
  from d595fa7. No other changes were on the remote.
- At 21:06 UTC (four minutes after the push) https://intentsly.com/sitemap.xml and
  https://intentsly.com/compare/intentsly-vs-valley could not be fetched from this run: the fetch tool
  asks for a permission that nobody is present to grant for URLs that did not come from a search
  result, and no search returned an intentsly.com URL. The repository has no GitHub Actions workflow,
  so the Cloudflare deploy is not visible from here either. Same limitation as the 21 October runs.
  The database row is published (status = published, 21:01 UTC), so the page should resolve once the
  deploy for 15432bf completes. Not confirmed by this run.
- Alex: open https://intentsly.com/compare/intentsly-vs-valley and the sitemap once; if the page is
  missing an hour after the push, check the deploy for commit 15432bf.
