# Last run: 2026-10-28 (guides task; started 08:20 UTC, 10:20 Bucharest)

- Keyword: how to track hiring signals for sales (section guides, cluster linkedin-prospecting, type guide,
  intent commercial, priority 2, difficulty medium). `blog_next.py --section guides` returned it directly.
  No PAUSE file, no draft waiting. Repository already cloned and in scope with push access; `git pull origin
  main` was up to date at 62a2066. `add_repo` was not available as a tool, as on previous runs.
- Published: "How to Track Hiring Signals for Sales: A Free Weekly Routine"
  https://intentsly.com/guides/track-hiring-signals-for-sales
  `blog_cloud.py sql` failed once (meta_description 163 chars, no H2 with the keyword, opening 94 words);
  fixed by shortening the description and opening and renaming "What you need" to "What you need to track
  hiring signals for sales". Ready on the second run. 11 H2, 6 FAQ, 8 internal links, 6 external, 3,163
  words by the gate's count (two tables and four code blocks hold a share). Second page of 28 October
  (the blog task published linkedin-buying-signals at 07:11 UTC); daily cap 7 and weekly cap 45 not reached.
- Database: a read-only select first confirmed no row existed for the slug. The generated SQL ran on project
  uwwajlezgeurnvvrvdvb and returned status published, published_at 2026-10-28 08:39:05 UTC. A second
  read-only select confirmed the stored content_md matches the draft body exactly (19,711 chars, same md5),
  6 FAQ entries, 5 secondary keywords, word_count 3163. Note for honesty: when pasting the SQL into the
  connector, two assignment lines in the `on conflict ... do update set` clause (author_name, article_type)
  were transposed relative to the file; the statement is semantically identical (same set of assignments,
  order has no effect) and the clause did not fire because the row was new. Values were unchanged.
- Angle: page one is vendor playbooks and tool round-ups (Valley, Unify, HubSpot/Clay, PredictLeads, Tamtam,
  FirstSales, Cleverly, Amplemarket), each with unsourced reply-rate figures and no free step-by-step. This
  guide is a free weekly routine: a tell-role table, the LinkedIn Jobs click path with saved-search alerts,
  Google `site:` queries for Greenhouse and Lever boards, a scoring table (backfill 0, first hire 2, leader
  above team 2, surge 3, tool named +1, ghost posting -1), a sheet layout, the recruiter trap, the
  LinkedIn-post side of hiring (Step 6, where the Intentsly sentence sits), a labelled hypothetical
  (Northwind Payroll), and no reply-rate claims. Brief in blog/briefs/track-hiring-signals-for-sales.md.
- External sources opened today and linked: bls.gov/news.release/jolts.htm (7.1 million openings, August
  2026), predictleads.com/blog/hiring-as-a-buying-signal (weak "is hiring" flag, five patterns, remove
  staffing firms), joinvalley.co/blog/hiring-signals-for-sales-prospecting (free playbook, Sales Navigator
  alerts on saved accounts expiring after 60 days), support.greenhouse.io article 360020776251
  (boards.greenhouse.io/<token>), support.google.com/websearch/answer/2466433 (site:, quotes, minus),
  amplemarket.com/blog/how-to-find-purchase-intent-linkedin (Sales Navigator filter names). LinkedIn's own
  help pages on job alerts refused automated readers (robots) and business.linkedin.com needed a permission
  nobody was there to grant, so LinkedIn filter labels are given with a "if a label differs in your account"
  caveat and attributed to vendor walkthroughs. The Lever help page returned a CSS error; jobs.lever.co is
  cited from Lever-hosted postings seen in search results, not from Lever docs.
- Intentsly facts only from product.md and the plain-`verified` proof rows: keyword post monitoring (hiring
  phrases are keywords), competitor and industry post engagers, ICP scoring, verified email, /try-ai with no
  account, 14 demos in 14 days, 4x reply rate. The FAQ states plainly that Intentsly does not track job
  boards. No price, no Reddit/X claim, no email-sending claim, no reply-rate percentage.
- Links: /learn/what-is-an-ideal-customer-profile, /learn/what-is-a-trigger-event-in-sales,
  /guides/find-decision-makers-on-linkedin, /features/linkedin-signals (contextual sentence at Step 6),
  /guides/set-up-signal-based-outbound, /blog/linkedin-message-templates-for-buying-signals, /try-ai and
  /signal-playbook (closing).
- Keywords: 4 guides keywords were left queued after this one, so per RUN.md step 6 nine were added
  (difficulty from today's first page): how to track job changes on linkedin for sales (medium), how to find
  leads from linkedin events (medium), how to find prospects in linkedin groups (medium), how to write a
  linkedin connection request that gets accepted (medium), how to warm up a linkedin account for outreach
  (low), how to set up linkedin sales navigator alerts (low), how to find companies using a competitor's
  product (medium), how to build a linkedin follow-up sequence (medium), how to research a prospect before
  outreach (high, priority 3). 13 guides keywords now queued. Blocked keywords: none.
- Live check: not possible from this run, as before. Four minutes after the push (08:45 UTC) the fetches of
  intentsly.com/sitemap.xml and the guide URL both asked for a permission on intentsly.com that nobody was
  there to grant. The row is `status = published` and the push landed on main at 1f208c0, so the page goes
  live when the host finishes the build. Push note: the first push was rejected as non-fast-forward from
  the depth-1 clone; `git fetch --unshallow` fixed it and the push went through at 08:41 UTC.
- Connector note: a lowercase `supabase` server was listed as failed (ERR_PROXY_TUNNEL) while the capitalised
  `Supabase` connector worked, as on previous runs.
- For Alex: (1) a real hiring-signal win (which posting you saw, what you sent, how long to the meeting) would
  replace the hypothetical Northwind example with a measured one; (2) confirm whether "keyword posts" in the
  product can be configured with hiring phrases such as "we're hiring" so the Step 6 sentence stays accurate
  as the product changes; (3) the proof.md rows whose Status cell reads "verified: <note>" are still not
  accepted by the gate (it matches the cell exactly), so the 21% and the 2 to 4 meetings figures remain
  unusable where the statistic check fires; (4) open https://intentsly.com/guides/track-hiring-signals-for-sales
  once after the deploy and check the two tables and four code blocks render.
