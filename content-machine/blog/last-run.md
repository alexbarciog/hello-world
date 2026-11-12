# Last run: 2026-11-12 (blog task; fired about 06:50 UTC, 08:50 Bucharest)

- Setup: no PAUSE file. Repository already cloned, in scope and on `main` (`add_repo` is still not available
  as a tool, as on previous runs); `git pull origin main` already up to date at 1f0dd8b. Supabase: the
  lowercase "supabase" connector again reported a proxy tunnel error at session start; the "Supabase"
  connector connected and was used. Web search worked. The only draft in blog/drafts/
  (outbound-sales-process-for-startups.md, guides) carries a `blocked:` line, so it was not resumed.
- Pre-write check: a read of public.blog_posts for the slug returned no row, so nothing was overwritten.
- Keyword (published): ai sdr for founders and small teams (section blog, cluster ai-sdr, how-to,
  commercial, priority 2, difficulty low).
  "AI SDR for Founders and Small Teams: A 14-Day Setup"
  https://intentsly.com/blog/ai-sdr-for-founders-and-small-teams
- Gate: passed on the second run (first: meta description 166 chars; "$80K" in a FAQ paragraph without
  its link; the anchor text "Intentsly vs 11x" read as an unsourced "11x" statistic; and "21%" and a
  "5%" threshold flagged). Fixes: meta description shortened to 160; the Bridge Group link repeated in
  the FAQ paragraph; the compare anchor reworded; the 21% row left out (its proof status reads
  "verified: say ..." rather than plain "verified", so the gate does not accept it, same as on 11
  November); the day-14 threshold rephrased as "fewer than one reply in twenty". Four voice edits after
  that, still passing. 2,743 gate-counted words, 8 H2, 6 FAQ, 8 internal links, 4 external links, no
  warnings. Opening paragraph 90 words (the limit).
- Database: the upsert returned status published, published_at 2026-11-12 06:57:58 UTC.
- Angle: the first page is vendor rankings (Close, Apollo, Instantly, CellCog, Sendio) plus SaaStr's
  large-deployment playbook and one consultant post. None gives a one-person procedure sized to
  LinkedIn's daily caps, a buy / wait / never rule, or a day-14 keep-or-stop rule. The article gives a
  six-row decision table, the three jobs an AI SDR must do, the LinkedIn-or-email choice, a 14-day setup
  (profile from the last ten conversations, do-not-contact list, signals, three self-written messages,
  caps and a three-line handoff rule, calendar and CRM, a week at 15 a day, a day-14 decision), what
  stays with the founder, the cost comparison against hiring, the 14-demos story with the product's
  limits stated, and six FAQ entries.
- Sources opened today and linked: saastr.com "Dear SaaStr: I want to roll out an AI SDR" (11 Mar 2026:
  prove the human playbook, write your own templates, handoff before launch, 30 to 45 min a day tuning
  for 60 to 90 days, replies left for hours lose deals); pravinkumar.co three-person-team post (20 Oct
  2026: tiering, skip cases); instantly.ai AI BDR for small teams (15 Jul 2026: 4 to 6 weeks warmup, 30
  emails per inbox per day); bridgegroupinc.com 2025 SDR report (351 companies: $80K median OTE, 3.0
  month ramp, 1.9 year tenure, 112 activities and 4.1 quality conversations a day). Opened, not linked:
  close.com AI SDR comparison, cellcog.ai, apollo.io insights, sendio.ai, instantly.ai qualification
  guide, saastr.com "10 things" post, bridgegroupinc.com tenure page. Blocked by robots.txt:
  linkedin.com/help invitation-limit page, so no LinkedIn weekly limit is quoted.
  Intentsly facts used: LinkedIn signal sources, ICP scoring, HubSpot / Cal.com / Google Calendar, AI SDR
  on LinkedIn only (no email), 2 accounts, 30/30/15 caps, four languages, 7-day trial, /try-ai,
  14 demos in 14 days, zero manual outreach, 4x reply rate, "2 to 4 meetings a week on average" with
  the October 2026 attribution. No price, no Reddit/X feature, nothing from the NOT LIVE epics. The 21%
  row and the 1,000-leads row unused.
- Queue: 23 `blog` keywords still queued (above the 5 threshold), so blog-keywords was not run. Next up
  per blog_next is "what to say when a prospect likes a competitor's post".
- Caps: first page of 12 November by Bucharest time (cap 7); the weekly count stays under 45.
- For Alex: (1) the 21% reply-rate and ~1,000 leads rows are still unusable by the gate because their
  status cell reads "verified: ..." rather than "verified"; either a plain "verified" status with the
  phrasing rule moved into the claim cell, or a change in scripts/, would let them in; (2) a first-hand
  number for how long a customer's first setup takes (days to first booked meeting) would turn the
  "14 days" framing from a plan into a measured claim; (3) the "outbound sales process for startups"
  guide draft is still blocked by the gate's handling of the word "process"; (4) a price is still
  blocked by the corrections log; (5) a public API yes/no is still open from the HeyReach and Expandi
  pages.
- Push and live check: see the end of this file (appended after the push).
- Push: `git push origin HEAD:refs/heads/main` fast-forwarded the remote from 1f0dd8b to 74db5d6 at
  06:58 UTC; local `main` realigned to HEAD afterwards.
- Live check: PAGE LIVE. WebFetch refused the direct URL on the first try (PROVENANCE_REQUIRED, as on
  5 to 11 November); the check went homepage -> /blog -> page. At about 07:04 UTC (6 minutes after the
  push) the blog index listed the new page first ("AI SDR for Founders and Small Teams: A 14-Day Setup",
  November 12, 2026), and the page loads with that H1, "12 min read", the six-row decision table and
  six FAQ entries, no raw markdown. SITEMAP NOT CHECKED (same provenance block as before); the page is
  reachable from the index.
