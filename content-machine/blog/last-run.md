# Last run: 2026-10-31 (compare task; fired about 21:50 UTC, 23:50 Bucharest)

- Keyword: intentsly vs clay (section compare, cluster intentsly-vs, type comparison, intent commercial,
  priority 2, difficulty medium). `blog_next.py --section compare` returned it directly. No PAUSE file, no
  draft waiting. Repository already cloned and in scope; `git pull origin main` was up to date at 68a06d6.
  `add_repo` was not available as a tool, as on previous runs. Supabase: the lowercase "supabase" connector
  reported a proxy tunnel error at session start; the "Supabase" connector connected and was used.
  Read-only count before any work: 4 posts published on 31 Oct UTC, 23 in the last 7 days; caps 7 and 45
  not reached; no row for the slug.
- Published: "Intentsly vs Clay: GTM Workbench or LinkedIn AI SDR?"
  https://intentsly.com/compare/intentsly-vs-clay
  Gate run 1 failed on two points (opening paragraph 98 words; "21%" reply rate flagged because the proof
  row's status cell reads "verified: say ..." rather than "verified", so the gate does not count it). Fixed by
  trimming the opening and dropping the 21% sentence (kept "2 to 4 meetings a week" attributed to October
  2026). Run 2 failed only on the opening (93 words); trimmed again, run 3 passed with no fails and no
  warnings, then `blog_cloud.py sql` printed ready: true. 8 H2, 6 FAQ, 9 internal links, 14 external
  sources, 2,885 words by the gate's count (published compare pages count 2,443 to 2,907 the same way).
- Research: the query "intentsly vs clay" returns nothing about the pairing (pottery pages, "clay vs
  instantly", G2 compare pages). Opened aisdr.com/aisdr-vs-clay (vendor page, one Reddit source), warmly.ai
  clay-alternatives (listicle, three G2 reviews, no Clay docs cited), gojiberry clay-pricing (redirects to
  the blog index). Clay facts only from clay.com and university.clay.com opened this run: homepage,
  pricing, plans-and-billing, actions-data-credits, signals, post-engagement-monitoring, professional-posts
  integration, getting-started-with-sequencer, sequencer FAQs, the 1 Sept 2026 Sequencer announcement,
  use-cases/outbound, heyreach-integration-overview, hubspot-integration-overview, download-as-a-csv
  lesson, and the 22 May 2025 signals announcement. Clay's pricing page and its plans doc show different
  "starts at" figures; the page quotes the doc's $185 and $495 with the link and tells the reader to set
  the slider. Intentsly facts only from product.md, verified proof.md rows and the 14-demos story.
- Database: the insert ran on project uwwajlezgeurnvvrvdvb and returned status published, published_at
  2026-10-31 21:58:51 UTC. Honest note: when pasting the generated SQL into the connector, one line of the
  ON CONFLICT update clause (`article_type = excluded.article_type,`) was dropped by mistake. The slug did
  not exist, so the INSERT path ran and the update clause was never evaluated; a read-only check confirms
  article_type = comparison, section = compare, word_count 2885. The row is identical to what the unchanged
  file would have produced. Future runs: copy the file byte for byte. `blog_cloud.py mark` filed the article
  and set the keyword to published.
- Queue: 10 `compare` keywords still queued (next: intentsly vs 11x), so no keyword refresh this run.
- Live check: see the run report (sitemap and page fetched about 4 minutes after the push).

## For the founder
- proof.md: the rows for 21% reply rate, ~1,000 leads per agent, 2 to 4 meetings and the 2-account /
  30-a-day limits have a status cell that starts with "verified:" plus a note. The gate only accepts a cell
  that is exactly "verified", so those numbers fail the statistics check unless the paragraph also has an
  external link. Either move the phrasing note into the Claim column and set the status to "verified", or
  accept that pages drop those numbers.
- A first-hand "we used Clay before" story (what the table looked like, how many credits a month it burned,
  what broke) would let this page say something no vendor page can. Without it the page leans on Clay's docs.
- Any customer who runs Clay and Intentsly together, quotable, would make the "Can you use both?" section
  concrete.
