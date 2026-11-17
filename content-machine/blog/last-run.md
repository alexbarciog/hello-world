# Last run: 2026-11-17 (solutions task; fired about 13:40 UTC, 15:40 Bucharest)

- Setup: no PAUSE file. Repository already cloned, in scope and on `main` (`add_repo` still not exposed as a
  tool, as on previous runs); `git pull origin main` fast-forwarded to b9dc82e. Supabase: the lowercase
  "supabase" connector again reported a proxy tunnel error at session start; the "Supabase" connector connected
  and was used. Web search worked. The two drafts in blog/drafts/ at the start
  (get-clients-for-an-ai-consulting-business.md, outbound-sales-process-for-startups.md) both still carry a
  `blocked:` line (gate kw_in strips every trailing "s"), so neither was resumed. 0 articles had been published
  today before this run (daily cap 7); 17 in the last 7 days (weekly cap 45).
- Keyword (published, first attempt): how to get clients for a staffing agency (solutions, find-customers,
  landing, commercial, priority 3, difficulty medium).
  "How to Get Clients for a Staffing Agency: Spot Surge Demand"
  https://intentsly.com/solutions/get-clients-for-a-staffing-agency
- Orphan check: a read-only select for the slug before writing returned no row. Supabase returned
  status = published, published_at 2026-11-17 13:55:50 UTC. Writes: the one generated SQL statement, pasted whole
  from blog/out/get-clients-for-a-staffing-agency.sql (118 lines, 21,365 bytes). Reads: two selects (the
  pre-check and a post-insert comparison). The post-insert check compared length and md5 of content_md
  (16,656 chars, 8992d263...), word_count (2619), reading_minutes (12), 4 secondary keywords, 5 FAQ entries,
  section and type against the local draft: all matched exactly.
- Gate: first run failed on one point (opening paragraph 106 words, max 90); passed on the second run after
  trimming it to 89. Final: 2,619 gate-counted words (the two tables account for a large share; landing range
  1,100 to 2,000 outside tables), 7 H2, 5 FAQ, 12 internal links, 4 external links, no warnings, no em dashes,
  no banned phrases. Title similarity to the sibling recruitment-agency page checked at 0.70 (gate limit 0.75).
- Angle: page one is vendor listicles (Bullhorn, Manatal, ZoomInfo, Recruit CRM, Pin, Ringover, Saleshandy,
  Leonar, Recruiterflow). All give the same channel list (niche, job boards, referrals, candidate relationships,
  networking, cold outreach, content) and none separates temp/contract staffing from permanent recruitment,
  names the operations buyer, or gives a LinkedIn search string. This page treats staffing as surge demand:
  five signals (overtime and surge posts, new site or second shift, permanent hiring freeze with growing work,
  aged contract or temp-to-hire posts, complaints about the incumbent agency), the Posts-tab search and message
  for each, a week-one plan with 15/15 sending caps, who signs (operations vs HR vs procurement), and when
  referrals, job boards and VMS/MSP programs beat signals. Brief: blog/briefs/get-clients-for-a-staffing-agency.md.
- Sources opened today and linked: ASA Q2 2026 Staffing Employment and Sales Survey release (employment up 0.6%
  YoY and 5.0% QoQ; first YoY growth in employment, sales and payroll since late 2022), Bullhorn GRID 2026
  Industry Trends Report (nearly 2,300 respondents; 56% reported revenue growth vs 40% the year before; hiring
  freezes and budget constraints the biggest obstacle to new business, competition second), StaffingHub 2025
  State of Staffing coverage (finding new clients top challenge for 23% of agencies, up from 16% in 2024), and
  Bullhorn's own "how to get clients" post for the competitor-job-post tactic. Not used: StaffingHub's referral
  percentages (behind the membership wall today), Pin's second-hand reply-rate figures, ZoomInfo's unsourced
  figures. Intentsly facts used: 14 demos in 14 days, 4x reply rate, zero manual outreach (story + proof),
  around 1,000 leads a month per agent, 2 to 4 meetings a week, the 30/30/15 caps and 2 accounts per plan,
  the Mike Ruiz quote (proof), LinkedIn signal types, languages, integrations and ICP scoring (product.md).
- Push: the first `git push origin main` was rejected because the clone's local `main` ref was stale
  (detached HEAD); `git push origin HEAD:main` succeeded (b9dc82e..5d48ba4), nothing was rebased or forced.
- Live check (about 13 minutes after the push, 14:10 UTC): https://intentsly.com/solutions/get-clients-for-a-staffing-agency
  is live (H1, byline dated 17 November 2026, 12 min read, 5 FAQ entries, both tables) and the /solutions index
  lists it first among 24 pages. At the 4-minute mark the index still showed 23 pages, so the redeploy takes
  longer than 4 minutes. The sitemap could not be checked: WebFetch refused https://intentsly.com/sitemap.xml
  with a permission prompt nobody was there to answer (same as the previous run), and the run was not allowed
  to fetch it another way. The index listing shows the redeploy ran, so the sitemap is very likely updated.
- Solutions queue after this run: 8 keywords queued (seo agency, it consulting company, ppc agency, branding
  agency, pr agency, executive coaching business, cloud consulting company, fintech startup), so no top-up was
  needed (threshold 5). Note: "how to get clients for an executive coaching business" contains "business" and
  will hit the same kw_in bug as the two blocked drafts unless the gate is fixed first.
- For the founder:
  - Two drafts remain blocked by the gate's kw_in bug (scripts/blog_gate.py line 40 strips every trailing "s";
    any keyword containing "business" or "process" cannot pass). Changing `w.rstrip("s")` to strip one "s" and
    re-running both drafts would publish them. The content task is not allowed to edit scripts/.
  - A real staffing or recruitment customer story (desk, signals used, replies, first order) would let the
    staffing and recruitment pages replace the generic "we are not a staffing agency" paragraph with a
    like-for-like example.
  - If you want the 21% reply rate usable without an external link, set that proof.md row's status cell to
    exactly "verified" and move the phrasing note into the Claim column.
  - brain/voice.md is still "untrained"; drop 15+ real posts into brain/posts/ when convenient.
