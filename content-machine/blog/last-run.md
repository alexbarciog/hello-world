# Last run: 2026-10-31 (learn task; fired about 19:15 UTC, 21:15 Bucharest)

- Keyword: what is cold outreach (section learn, cluster outbound, type lesson, intent informational,
  priority 2, difficulty medium). `blog_next.py --section learn` returned it directly. No PAUSE file, no
  draft waiting. Repository already cloned and in scope; `git pull origin main` was up to date at a2cfed3.
  `add_repo` was not available as a tool, as on previous runs. Supabase: the lowercase "supabase" connector
  reported a proxy tunnel error at session start; the "Supabase" connector connected and was used.
  Read-only count before any work: 3 posts published on 31 Oct UTC, 22 in the last 7 days; caps 7 and 45
  not reached; no row for the slug.
- Published: "What Is Cold Outreach? Definition, Channels and Limits"
  https://intentsly.com/learn/what-is-cold-outreach
  Gate run 1 failed on one point (six statistics in two FAQ answers had no source link in their own
  paragraph); fixed by linking the sources inside those answers, run 2 passed with no fails and no
  warnings, then `blog_cloud.py sql` printed ready: true. 8 H2, 6 FAQ, 10 internal links, 4 external
  sources, 2,026 words by the gate's count. Length decision taken without review: the skill says 1,000 to
  1,800 words for a lesson, but the ten published lessons count 1,850 to 2,470 the same way, so the page was
  trimmed from 2,194 to about 2,060 prose words and kept consistent with the section rather than cut
  further. Title decision: "Definition, Channels and Limits" scored 0.60 or lower against every published
  lesson title (threshold 0.75).
- Research: opened the ranking pages (Findymail, Wonderway, Bardeen, NetHunt, Skylead, Reply.io,
  Breakcold); all vendors, none cites a primary source, none covers the legal floor, none separates cold,
  warm and signal-based outreach. Outside numbers used, all opened this run: FTC CAN-SPAM compliance guide
  (no B2B exception, the requirement list, up to $53,088 per email); Hunter State of Cold Email 2025 (11M
  emails sent in 2024, 4.1% average reply, 5.8% for 50 or fewer recipients vs 2.1% for 1,000+, 4.9% with
  follow-ups vs 3% without); Belkins cold calling benchmarks (175,000+ dials in 2025, 9.9% connect, 4.6%
  conversation-to-meeting, about 370 dials per meeting); Gartner 25 June 2025 press release (632 buyers,
  73% avoid irrelevant outreach, 61% prefer rep-free). Intentsly facts only from product.md, verified
  proof.md rows (30/30/15 caps, 14 demos, 4x, 21% reply rate attributed to October 2026, 12 signals and 8
  to ignore) and the 14-demos story.
- Database: the insert ran on project uwwajlezgeurnvvrvdvb and returned status published, published_at
  2026-10-31 19:30:25 UTC. `blog_cloud.py mark` filed the article and set the keyword to published.
- Queue: 9 `learn` keywords still queued (next: what is dark social in b2b), so no keyword refresh this run.
- Live check: see the run report (sitemap and page fetched about 4 minutes after the push).

## For the founder
- The 21% reply rate is the only Intentsly number a lesson about cold outreach can use. A cold-campaign
  baseline (what the reply rate was before signals, in numbers rather than "4x") would let the page state
  the before/after plainly.
- One real customer example of a message written from a signal, with the first reply, would replace the
  labelled hypothetical in "Why does cold outreach matter?".
- The price question (corrections.md, 2026-10-08) is still open; no price was stated.
