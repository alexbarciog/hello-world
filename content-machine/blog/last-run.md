# Last run: 2026-10-22 (Solutions task, solutions section; started about 12:40 UTC, 15:40 Bucharest)

- Keyword: how to get clients for a recruitment agency (cluster find-customers, landing, commercial, priority 1,
  medium). Returned by `blog_next.py --section solutions`; no PAUSE file, no draft waiting.
- Title: How to Get Clients for a Recruitment Agency: Hiring Signals
- Live URL: https://intentsly.com/solutions/get-clients-for-a-recruitment-agency
- Status: published (Supabase upsert returned `status = published`, published_at 2026-10-22 12:50 UTC). The SQL
  file `blog/out/get-clients-for-a-recruitment-agency.sql` was run once, unchanged, through the `Supabase`
  connector's execute_sql on project uwwajlezgeurnvvrvdvb. The only other statement run was a `select 1` at the
  start to confirm the connector worked (the session again listed a lowercase `supabase` server as failed with
  ERR_PROXY_TUNNEL; the capitalised `Supabase` connector answered). Fifth page dated 22 October; daily cap 7.
- Gate: run 1 failed on two items (opening paragraph 100 words; 21%, 60%, 71%, 86% flagged as unsourced). The
  21% reply-rate row in proof.md carries a qualified status ("verified: say ...") which the gate does not read
  as `verified`, so the figure was removed rather than the proof file edited. The referral figures got the
  StaffingHub link in their own paragraph. Runs 2 to 4 only trimmed the opening to 90 words; run 5 passed with
  no warnings. `blog_cloud.py sql` printed `"ready": true` (2,357 gate-words, 7 H2s, 5 FAQ entries, two tables,
  11 internal links, 2 external links). Length is above the page-write range of 1,100 to 2,000 because the two
  tables and the week plan count as words; same shape and length as the marketing agency page.
- Outside statistics (both pages opened this run): Top Echelon 2026 State of the Recruiting Industry Report
  (60.7% name new clients and search assignments as the #1 priority; 46.7% name fewer search assignments as the
  top client pain) and StaffingHub's 2025 State of Staffing coverage (finding new clients top challenge for 23%,
  up from 16% in 2024; 86% of fast-growth agencies have formal referral programs vs 60%; 71% rate referrals
  extremely important). A StaffingHub June 2026 article claiming "31% named winning clients their top 2026
  challenge" was blocked at fetch time, so that figure was not used.
- Intentsly facts used: LinkedIn-only signal list, ICP scoring, verified emails, export, AI SDR on LinkedIn with
  Cal.com/Google Calendar booking, HubSpot, 4 languages, 2 accounts, 30/30 cap with 15 recommended, 14 demos in
  14 days and 4x reply rate (story), ~1,000 leads a month per agent and 2 to 4 meetings a week (attributed to
  October 2026 customers), Mike Ruiz quote, 12 signals / 8 to ignore. No price. Reposted-job signal explicitly
  stated as not monitored.
- Queue: 8 solutions keywords still queued (next: lead generation for consultants), so none were added.
- Connectors: no `add_repo` tool existed in the session; the repository was already in scope and
  `git pull origin main` ran on the existing clone (788b906). Cloud-only run.

## What the research turned up
- All eight ranking pages are ATS/CRM or outreach vendor listicles (Vincere, Bullhorn, Top Echelon, Saleshandy,
  eGrabber, RecruitBPM, Pin, Leonar). Every one says "use LinkedIn" and "watch job boards"; none names the
  specific LinkedIn posts that precede an agency hire or gives the search string and message. None has a week
  plan. Vincere, Bullhorn and eGrabber cite no numbers; Top Echelon's blog uses 2021 Pew social-media data.
- The strongest recruiter-specific signal, a reposted or 30-day-old job post, is the one Intentsly does not
  monitor; the page says so and keeps it as a manual step.

## For the founder
- A recruitment or staffing agency customer story (even one line: desk, signal used, first job order) would
  replace the "we are not a recruitment agency" framing in the practice section on this page.
- The 21% reply-rate row in `brain/wiki/proof.md` has status `verified: say "across our customers" and the
  date`; the gate only accepts rows whose status is exactly `verified`, so that figure cannot be used until the
  row's status cell is `verified` and the phrasing rule moves to the Claim column or corrections.md. Same for
  the ~1,000 leads and 2 to 4 meetings rows if they are ever written with a % or x.
- A confirmed price is still blocked by corrections.md ($41 vs $97).

## Live check (after push)
- Done about four minutes after the push by fetching the sitemap and the page URL; the result is in the task's
  run report, not in this file, so that the run makes a single commit.
