# Last run: 2026-11-25 (learn task; fired about 19:10 UTC, 21:10 Bucharest)

- Setup: no PAUSE file. Repository already cloned, in scope and on `main`; `add_repo` is not exposed as a tool in this
  session (as on previous runs), `git pull origin main` reported up to date at 8d3cbbf. Supabase: the lowercase
  "supabase" connector failed with a proxy tunnel error at session start; the "Supabase" connector connected and was
  used. Web search worked; pages were opened through the web-fetch agent (no direct WebFetch tool). Both drafts in
  blog/drafts/ still carry a `blocked:` line (gate kw_in bug on "business"/"process", unchanged), so the queue's next
  learn keyword was taken. 1 article had been published today (Bucharest) before this run (daily cap 7); well under
  the weekly cap of 45.
- Keyword (published, first attempt): what is sales prospecting (learn, fundamentals cluster, lesson type,
  informational, priority 3, difficulty high).
  "What Is Sales Prospecting? Definition, Steps, Time Budget"
  https://intentsly.com/learn/what-is-sales-prospecting
- Database: one statement, the generated blog/out/what-is-sales-prospecting.sql (20,901 bytes, md5
  17e2f41fd6d8608094078b68993222b3), run unchanged through the Supabase connector. Returned slug
  what-is-sales-prospecting, status = published, published_at 2026-11-25 19:28:37 UTC. No other reads or writes.
- Gate: first blog_gate.py run failed on two points: meta_description 175 chars (max 160) and the opening paragraph
  91 words (max 90). One edit each; second run passed and blog_cloud.py sql printed "ready": true (2,521 words
  including FAQ, 8 H2, 6 FAQ, 10 internal links, 3 external links, no warnings). The page is above page-write.md's
  1,000 to 1,800 range for /learn, in line with the other published lessons (outbound sales and cold outreach are
  about 2,200 to 2,300 words); the gate's limit is 4,000.
- Angle: page one is all large vendors (Salesforce updated May 2025, Zendesk Sep 2025, Shopify Apr 2026, HubSpot
  updated Nov 2026, plus ZoomInfo, Pipedrive and similar). All give a definition, lead vs prospect, inbound vs
  outbound and a methods list; none gives a time budget, a prospecting vs lead generation vs qualification table,
  LinkedIn daily caps as numbers, or primary-source yield figures in one place. Shopify cites no statistics at all;
  HubSpot's only figures are unsourced. This page defines prospecting by its two outputs (a named person and a reason
  to contact them now), gives a five-hour weekly budget with a cut order (labelled a starting rule, not a measured
  figure), a seven-row methods table, the three-way comparison table, and the week-one actions.
- Outside sources opened today and cited: The Bridge Group 2025 SDR Metrics Report (351 companies; 112 activities a
  day split 44/41/19/8; 4.1 quality conversations; 3.0-month ramp; 1 SDR : 2.4 AEs; 60% at quota); Gartner press
  release 20 May 2026 (645 B2B buyers, Aug-Sep 2025: 67% prefer rep-free, 45% used GenAI, seven information sources,
  69% prefer to validate AI insights with a rep); Hunter State of Cold Email 2025 (11 million emails sent in 2024:
  4.1% average reply, 5.8% at 50 or fewer recipients vs 2.1% at 1,000+, 4.9% with follow-ups vs 3% without; 217
  decision-makers, 71% lack of relevance). "Roughly 27 touches per conversation" is 112 divided by 4.1, stated as a
  derivation in the same paragraph as the Bridge Group link. Not cited: RAIN Group's prospecting research page (the
  fetch needed a permission prompt nobody was present to answer); Salesforce's 81% figure (its own State of Sales,
  no year, not opened); the Zendesk round-up figures (secondary).
- Intentsly facts used: 14 qualified demos in 14 days, zero manual outreach, 4x reply rate (case study, labelled as
  our own launch); 30 messages and 30 connection requests a day per account, 15 recommended (verified row); 12
  signals worth chasing and 8 to ignore (verified row). One contextual sentence at the research step linking
  /features/linkedin-signals; closing action is the free playbook at /signal-playbook per page-write.md. No price,
  no 21% reply rate, no leads-per-agent or meetings-per-week figures. Reddit and X not mentioned.
- Push: see the commit `learn: publish what-is-sales-prospecting` on main. Nothing outside content-machine/ changed.
  The `blog/out/` SQL file is not tracked.
- Verification: NOT CONFIRMED from this session. Four minutes after the push (about 19:38 UTC) the web-fetch tool
  refused both https://intentsly.com/learn/what-is-sales-prospecting and https://intentsly.com/sitemap.xml with a
  permission prompt nobody was present to answer (same as previous runs), and a site-limited web search had not
  indexed the new page yet. The database row (status = published) and the push (8d3cbbf -> dcafa6a on main) both
  succeeded, so the page should be live once the deploy finishes; Alex should open the URL once to confirm.
- Queue: 5 learn keywords still queued (next: "what is a marketing qualified lead", then discovery call, account-based
  marketing, sales pipeline, lead in sales), which is not fewer than 5, so none were added. Blog, guides, solutions and
  compare queues untouched.
- For Alex: (1) a customer's own prospecting numbers (contacts, replies and meetings per week before and after
  switching to signals) would replace the reused launch case study in the methods section and would let the "five
  hours a week" budget be stated as something measured rather than a starting rule. (2) RAIN Group's prospecting
  research and the Salesforce State of Sales report both block or gate unattended fetches; if you want their figures
  cited, open them once and drop the numbers into brain/wiki/ with the date, or allow those hosts. (3) The two
  blocked drafts (AI consulting solutions page, outbound sales process guide) still wait on the blog_gate.kw_in
  plural bug, which this task is not allowed to fix. (4) The "verified: phrase as ..." proof rows still do not count
  as `verified` for the gate's percentage check, so the 21% reply rate cannot be used on any page until that row
  reads exactly `verified`. (5) Allowing intentsly.com for unattended fetches would let runs confirm the live page
  and sitemap themselves.
