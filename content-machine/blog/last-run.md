# Last run: 2026-11-01 (guides task; fired about 08:25 UTC, 10:25 Bucharest)

- Setup: no PAUSE file, no unblocked draft waiting. Repository already cloned and in scope; `git pull origin main`
  was up to date at 5f98254. `add_repo` was not available as a tool, as on previous runs. Supabase: the lowercase
  "supabase" connector reported a proxy tunnel error at session start; the "Supabase" connector connected and was
  used. No read-only database queries this run; the gate's own local cap check passed (7/day, 45/week).
- Keyword 1: outbound sales process for startups (cluster outbound, commercial, priority 2). Researched (six
  ranking pages opened, brief written, Cognism and FTC pages opened as sources) and fully drafted, then BLOCKED
  without publishing: the gate's `kw_in` strips every trailing "s" from each keyword word, so "process" becomes
  "proce" and the regex `\bproce(s|es)?\b` cannot match the word "process" in any title, meta or H2. The title,
  meta_title, meta_description, H2 and first-150-words checks therefore fail whatever the wording. The complete
  draft stays in `blog/drafts/outbound-sales-process-for-startups.md` with a `blocked:` line; the keyword is set to
  `blocked` in keywords.json. Nothing in `scripts/` was changed.
- Keyword 2 (published): how to find companies that just raised funding (cluster linkedin-prospecting, commercial,
  priority 2). "How to Find Companies That Just Raised Funding: 7 Steps"
  https://intentsly.com/guides/find-companies-that-just-raised-funding
  Gate: first run failed only on meta_description length (170) and opening length (95 words); fixed both, passed on
  the second run with no warnings. `blog_cloud.py sql` printed ready: true at 3,179 words by the gate's count (tables
  included), 12 H2, 6 FAQ, 6 internal links, 6 external sources.
- Research: six ranking pages opened (artisan.co, joinvalley.co, salesrobot.co, cleverly.co, getstealery.com,
  vcbacked.co); all vendor posts, none with exact LinkedIn search strings, EDGAR steps or a worked example, and
  nearly all statistics unsourced. Primary sources opened and linked in the article: SEC "Filing a Form D notice"
  (15 days after first sale, filed on EDGAR), SEC EDGAR full-text search FAQ (filing-type filter, date range,
  quoted phrases, coverage since 2001), SEC Form D PDF (items 1 to 16, no email field), Google "Create an alert"
  help page (steps and options), Crunchbase support "What can I do with Crunchbase Pro" (saved-search notifications,
  2k exports, 7-day trial; price deliberately not quoted), LinkedIn Sales Navigator benefits page ("funding
  updates" mentioned, no filter detail). LinkedIn Help pages block the fetch tool (robots), and the Gartner
  "17% of time with suppliers" page was only reachable on a Gartner mirror host, so neither is cited. The article
  contains no outside statistic; the only numbers are the verified 14 demos / 14 days / 4x story and plain counts
  in a labelled hypothetical example. Intentsly appears once in the body (LinkedIn keyword posts and engagers,
  with "funding databases and EDGAR are not something Intentsly monitors" stated) and once in the closing /try-ai link.
- Database: the generated SQL ran unchanged on project uwwajlezgeurnvvrvdvb and returned status published,
  published_at 2026-11-01 08:40:45 UTC. `blog_cloud.py mark` filed the article and set the keyword to published.
- Queue: 8 `guides` keywords still queued (next: how to personalize cold outreach at scale), 1 blocked, so no
  keyword refresh this run.
- Live check: see the commit that follows the push, or the run report.

## For the founder
- Gate bug worth a one-line fix in `scripts/blog_gate.py` (not touched by this run, per the rules): `kw_in` uses
  `w.rstrip("s")`, which turns "process" into "proce", "business" into "busine", "address" into "addre", so any
  keyword containing a word ending in a double s can never pass. A safe fix is to strip only one trailing "s"
  (`w[:-1] if w.endswith("s") and not w.endswith("ss") else w`). Once fixed, re-queue "outbound sales process for
  startups" (`python3 scripts/blog_next.py set "outbound sales process for startups" queued`); the finished draft
  is waiting and needs only the `blocked:` line removed and `checked_on` refreshed.
- The proof.md status-cell issue from the 31 Oct run still stands: rows whose status cell reads "verified: ..."
  (21% reply rate, ~1,000 leads per agent, 2 to 4 meetings a week, 7-day trial, 30/30/15 caps, the GrowthLab
  quote) are not counted as verified by the gate, so those numbers can only appear in paragraphs that also carry
  an external link. Moving the phrasing note out of the status cell would unblock them.
- A first-hand funding-signal story would lift this page: did any of the 14 demos, or any customer, come from a
  "we raised" post? Add it to brain/stories/ and the worked example can be replaced with the real run.
- If Intentsly ever adds a funding-event source, say so in brain/wiki/product.md; the article currently states
  plainly that funding databases and EDGAR are a manual check.
