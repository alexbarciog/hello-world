# Last run: 2026-10-27 (solutions task, solutions section; started 13:44 UTC, 15:44 Bucharest)

- Keyword: how to find customers on linkedin (cluster find-customers, type landing, intent commercial, priority 2,
  difficulty medium). `blog_next.py --section solutions` returned it directly. No PAUSE file, no draft waiting.
  Repository already cloned and in scope with push access; `git pull origin main` was up to date at a2a84a1.
  `add_repo` was not available as a tool, as on previous runs.
- Published: "How to Find Customers on LinkedIn Without a Cold List"
  https://intentsly.com/solutions/find-customers-on-linkedin
  `blog_gate.py` passed on the first run; the draft was then trimmed twice for length (2,568 to 2,256 words by the
  gate's count, of which roughly 500 sit in the three tables; the prose is inside the 1,100 to 2,000 range in
  page-write.md). `blog_cloud.py sql` printed ready on its first run. 8 H2, 5 FAQ, 13 internal links, 2 external.
  Third page of 27 October (daily count 3 of 7); weekly cap not reached.
- Database: before the upsert, `public.blog_posts` already held a row for this slug (status published,
  published_at 2026-10-24 12:52 UTC, title "How to Find Customers on LinkedIn: Watch Signals, Not Lists", 2,356
  words) that no commit, published file, log entry or keyword status recorded: a run on 24 October wrote the
  database and then did not finish, so the keyword was still queued. The generated SQL ran unchanged on project
  uwwajlezgeurnvvrvdvb and, as an upsert on slug, replaced that row's content with today's gate-passing version
  and kept the 24 October published_at. A read-only select confirmed the stored content_md matches the local body
  (md5 b16f59a84d059e8b320316624ada6506, 14,292 characters). The earlier version is summarised in
  blog/briefs/find-customers-on-linkedin.md; it used the ~1,000 leads/agent and 2 to 4 meetings/week figures the
  gate now rejects and a third-party source for LinkedIn's invitation cap, both gone from the new version.
- Angle: the ranking pages (Dripify, SalesRobot, Octopus CRM, ClientVenue, SalesBread; LinkedIn's own guide ranks
  but blocks fetching) are 13 to 24 profile and posting tips that end in a tool or agency pitch, with reply rates
  that are unsourced vendor claims. This page is organised around what the buyer does: six public LinkedIn
  behaviours with the exact Posts-tab search strings, a table comparing LinkedIn methods on time to first
  conversation and cost, a week-one plan with the sending caps stated, a labelled hypothetical example
  (Harbourline Bookkeeping), a route to the business-type pages, and honest alternatives. Brief in
  blog/briefs/find-customers-on-linkedin.md. Links to the buying-signal lesson, the decision-makers and prospect
  list guides, the Reddit article, the four business-type solution pages, the solutions index,
  /features/linkedin-signals (contextual sentence after the plan), /features/ai-sdr, /case-studies and /try-ai.
- Outside statistics, both from primary pages opened today and linked in the same paragraph: 6sense 2024 Buyer
  Experience Report via BusinessWire (nearly 70% through the purchase before engaging sellers, 81% with a preferred
  vendor at first contact, buyers initiate contact more than 80% of the time) and Gartner press release 9 March 2026
  (646 buyers, 67% prefer a rep-free experience). Intentsly facts only from proof rows the gate accepts (14 demos in
  14 days, zero manual outreach, 4x reply rate; 2 accounts, 30/30 caps, 15 recommended; languages) and product.md.
  No price, no 21% or ~1,000-leads figures, no Reddit/X claim, no email-sending claim. The page says job postings
  are not a monitored source, which follows from product.md's list of signal types.
- Live check: see the note appended below after the push.
- Queue: 6 solutions keywords still queued (55 across all sections), so none added (RUN.md adds only below 5).
  Blocked keywords: none.
- Connector note: as on previous runs, a lowercase `supabase` server was listed as failed (ERR_PROXY_TUNNEL)
  while the capitalised `Supabase` connector worked (a read-only count confirmed it before any write).
- For Alex: (1) the 24 October run left the database ahead of the repository; if another orphan row appears, a
  read-only `select slug from public.blog_posts` compared with blog/published/ would show it, and a short note in
  RUN.md telling runs to check for an existing row before writing would avoid surprises; (2) the gate rejects the
  21% reply rate and ~1,000 leads/agent figures because their proof.md status is "verified: ..." rather than exactly
  "verified"; change the status cell to `verified` and move the phrasing note into the Claim column if they may be
  used; (3) a real customer story for a service business (agency or consultancy) found through a recommendation
  request would replace the hypothetical example; (4) confirm whether LinkedIn job postings or company "Jobs" tabs
  are, or will be, a monitored signal, since this page and the SaaS page currently tell readers to run that search
  by hand; (5) the next solutions keyword is "how to find leads for a software company", which overlaps the B2B SaaS
  page; a note on whether to treat it as a separate page or an update would help.
