# Last run: 2026-10-27 (guides task, guides section; started 08:15 UTC, 11:15 Bucharest)

- Keyword: how to qualify leads before outreach (cluster outbound, type guide, intent commercial, priority 2,
  difficulty medium). `blog_next.py --section guides` returned it directly. No PAUSE file, no draft waiting.
  Repository already cloned and in scope; `git pull origin main` reported up to date at b0cde34. `add_repo` was
  not available as a tool; the repository was already in scope with push access.
- Published: "How to Qualify Leads Before Outreach: A 5-Minute Check"
  https://intentsly.com/guides/qualify-leads-before-outreach
  `blog_gate.py` failed on the first run (meta_description 164 chars, opening paragraph 101 words), then on
  word trims (94, 91 words) and passed on the fourth run; `blog_cloud.py sql` printed ready on its first run and
  again after one wording fix in the worked example ("associated members"). 3,066 words by the gate's count,
  10 H2, 6 FAQ, 10 internal links, 3 external. The generated SQL ran unchanged on Supabase project
  uwwajlezgeurnvvrvdvb and returned status = published at 08:33:30 UTC; a read-only select confirmed the stored
  content_md matches the local body (md5 64a6d3d7a7e0afc4c59d46faced90d67, 19,132 characters). Second page of
  27 October (daily count 2 of 7; 30 published in the previous 7 days before this one, cap 45).
- Angle: the ranking pages (Nimble, Highspot, Leadfeeder, FullEnrich, Instantly, Cleverly) are framework and
  CRM-scoring guides built for inbound or for a paid data stack. This page is the per-lead, five-minute check
  with a free LinkedIn account: a kill list first, the exact company-page, profile and post-search clicks for
  company fit, person fit and one timing signal, a table separating what is knowable before contact from what
  only a call reveals (mapped to BANT/CHAMP/MEDDIC letters), an A/B/C grade tied to the next touch, a paste-in
  qualification note, a labelled hypothetical example (Brightwater Reports / Kestrel & Lowe) and a mistakes
  section. Brief in blog/briefs/qualify-leads-before-outreach.md. Kept distinct from
  guides/build-b2b-prospect-list (which owns list building and the fit+signal points table) and links to it,
  to the ICP and buying-signal lessons, the decision-makers and outreach-message guides, the guides index,
  /features/linkedin-signals (contextual sentence at Step 4), /case-studies, /try-ai and /signal-playbook.
- Outside statistics, all from primary pages opened today and linked in the same paragraph: Salesforce State of
  Sales 5th edition (7,775 respondents, reps spend 28% of the week selling), Gartner press release 9 March 2026
  (646 buyers, 67% prefer a rep-free experience), LinkedIn Sales Solutions page (decision-makers 62% more
  receptive after a job change). Intentsly facts only from proof rows the gate accepts (14 qualified demos in
  14 days, zero manual outreach; 30/30 daily caps with 15 recommended; 12 signals / 8 to ignore in the Playbook)
  and product.md. No price, no 21% or ~1,000-leads figures, no Reddit/X claim, no email-sending claim.
- Live check: not completed from this run. Pushed at 08:34:56 UTC (b0cde34..7e56e24); at 08:39 UTC the fetch
  tool asked for a permission to open intentsly.com/sitemap.xml and the /guides URL, nobody was there to grant
  it, and the request was withdrawn (earlier runs hit a robots block on the same host). The row is
  `status = published`, so the page goes live when the host finishes the build triggered by the push. Alex
  should open the URL and the sitemap once.
- Queue: 5 guides keywords still queued (56 across all sections), so none added (RUN.md adds only below 5).
  Blocked keywords: none.
- Connector note: as on previous runs, a lowercase `supabase` server was listed as failed (ERR_PROXY_TUNNEL)
  while the capitalised `Supabase` connector worked (a read-only count confirmed it before any write).
- For Alex: (1) the gate rejects the 21% reply rate and ~1,000 leads/agent figures because their proof.md status
  is "verified: ..." rather than exactly "verified"; if those numbers may be used, change the status cell to
  `verified` and move the phrasing note to the Claim column (that file is off-limits to this task); (2) a real
  before/after from a customer who added a pre-outreach check (list size before and after, reply rate change)
  would replace the hypothetical example with a story; (3) confirm whether Intentsly's ICP scoring is shown
  in /try-ai results, so the closing line can say "already scored" instead of "matching your profile";
  (4) the next guides keyword is "how to track hiring signals for sales"; a note on whether Intentsly reads
  LinkedIn job posts or company "Jobs" tabs as a signal would decide how the product is mentioned there.
