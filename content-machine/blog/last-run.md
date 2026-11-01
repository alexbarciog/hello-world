# Last run: 2026-11-01 (blog task; fired about 06:50 UTC, 08:50 Bucharest)

- Keyword: reddit search queries to find customers (section blog, cluster reddit-x, type templates, intent
  informational, priority 2, difficulty low). `blog_next.py` returned it directly. No PAUSE file, no draft
  waiting. Repository already cloned and in scope; `git pull origin main` was up to date at 501c31e. `add_repo`
  was not available as a tool, as on previous runs. Supabase: the lowercase "supabase" connector reported a
  proxy tunnel error at session start; the "Supabase" connector connected and was used. Read-only count before
  any work: 0 posts published on 1 Nov UTC, 24 in the last 7 days; caps 7 and 45 not reached; no row for the slug.
- Published: "Reddit Search Queries to Find Customers: 20 Copy-Paste Templates"
  https://intentsly.com/blog/reddit-search-queries-to-find-customers
  Gate passed on the first run (no fails, no warnings): 1,951 words by the gate's count, 8 H2, 6 FAQ, 5 internal
  links, 4 external sources. Two wording edits after the pass (softened two unsourced claims about Google
  indexing, "five paid options" to "five tools"), then `blog_cloud.py sql` printed ready: true at 1,951 words.
- Research: the query returns small vendor blogs only (dev.to/watershow, leadsrover, subhunt, usealertly,
  replygain, buska, f5bot, redreplier, okara). All opened this run; most give three to five intent phrases and no
  operator syntax, none cites Reddit's documentation for the matching rules, none gives a negative-term block.
  Primary sources opened and linked: Reddit Help "Available search features" (eight field filters, case-sensitive
  AND/OR/NOT, parentheses, quotes, no space after colon, comments need every word), Reddit Help "What filters and
  sorts are available?", Google Search Help "Refine Google searches" (quotes, site:, minus, before:, after:),
  Google Search Central operators page (site: accepts a URL prefix). Reddit's spam-policy page
  (support.reddithelp.com/.../360043504051) returned a client error twice this run, so the article points the
  reader to /blog/find-b2b-leads-on-reddit for the rules instead of citing it directly. No competitor facts and
  no outside statistics in the article; no Intentsly numbers used. Intentsly appears in one body sentence
  (LinkedIn signals, with "Intentsly does not monitor Reddit" stated) and the closing links /signal-playbook.
  The queries are built from Reddit's documented syntax; the article does not claim they were run live.
- Database: the generated SQL ran unchanged on project uwwajlezgeurnvvrvdvb and returned status published,
  published_at 2026-11-01 07:03:04 UTC. Read-only check afterwards: md5 of content_md and of title in the row
  match the local file exactly, word_count 1951, reading_minutes 9, 6 FAQ entries, 4 secondary keywords.
  `blog_cloud.py mark` filed the article and set the keyword to published.
- Queue: 26 `blog` keywords still queued (next: phantombuster alternatives for linkedin), so no keyword refresh.
- Push: fe748e8 amended to 7e01623 (author set to the same identity as the 31 Oct commits), pushed as
  `HEAD:main` at about 07:06 UTC; origin/main confirmed at 7e01623. Nothing outside content-machine/ changed.
- Live check: attempted 4 minutes after the push, but the fetch tool asked for a permission nobody was there to
  grant for https://intentsly.com/blog/reddit-search-queries-to-find-customers, so "live" is unconfirmed this
  run. The database row is in place and the push went through, which is what the deploy reads from.

## For the founder
- Another Reddit article where Intentsly can only appear as "the LinkedIn side": the reddit-x cluster still has
  queued keywords (e.g. best subreddits for b2b lead generation). If Reddit monitoring ships, say so in
  brain/wiki/product.md and these pages can be updated to mention it; until then they stay manual guides.
- A first-hand story would lift this page above the vendor blogs: which Reddit queries you actually ran before
  or during the 14-demos period, how many posts they returned a week, and one reply that turned into a
  conversation. Add it to brain/stories/ and the article can cite it.
- The proof.md status-cell issue from the 31 Oct run still stands (cells reading "verified: ..." are not
  counted as verified by the gate). Not needed for this article, but it blocks the reply-rate and
  leads-per-agent numbers elsewhere.
- Reddit's spam-policy help page was unreachable from the fetch tool today; if it stays unreachable, future
  Reddit articles will keep linking the existing site article for the rules rather than Reddit directly.
