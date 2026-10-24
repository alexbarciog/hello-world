# Last run: 2026-10-24 (Blog task, blog section; started 05:50 UTC, 08:50 Bucharest)

- Keyword: linkedin message templates for buying signals (section blog, cluster templates, type templates,
  informational, priority 1, difficulty low), returned by `blog_next.py`. No PAUSE file, no draft waiting.
- Published: "LinkedIn Message Templates for Buying Signals: 7 Sequences"
  https://intentsly.com/blog/linkedin-message-templates-for-buying-signals
  Gate passed on the second blog_gate run (fix 1: meta description trimmed from 171 to 158 characters).
  `blog_cloud.py sql` printed ready on its first run. 3,234 words by the gate's count (table, bold labels and
  blockquote templates included; body prose about 2,200), 13 H2, 6 FAQ, 9 internal links, 2 external. The
  generated SQL ran unchanged on Supabase project uwwajlezgeurnvvrvdvb and returned status = published at
  06:02:24 UTC. A read-only check afterwards confirmed the stored content_md matches the local body
  (md5 7581540fc5065cd2ed8b9d17e6b91688, 18,799 characters). First article of 24 October in both UTC and
  Bucharest time, so the daily count is at 1 of 7.
- Angle: the ranking pages (Valley "10 templates", Coffee "25 templates" which are actually 14, Hublead 4
  openers, Salesforge 5 openers, Expandi and RevBoss trigger guides) sort templates by stage or by intent and
  stop at the opener. This page gives one complete sequence per signal (connection note, first message,
  follow-up) for seven LinkedIn signals, prints the character count next to each template (counted by script
  and corrected before publishing), adds a do-not-send rule and a timing window per signal, names the signals
  too weak to message at all (page follows, unrelated funding, profile views), and sources its two numbers to
  LinkedIn's own InMail data and Expandi's 13.2-million-request benchmark instead of vendor reply-rate claims.
  Brief in blog/briefs/linkedin-message-templates-for-buying-signals.md.
- Facts: outside statistics only from two pages opened today: Expandi "LinkedIn Outreach Benchmarks 2026"
  (13,218,869 requests, 6,730,447 messages, 13,302 accounts, May 2025 to April 2026: 28.5% acceptance, 3.0%
  note reply, 10.4% message reply) and LinkedIn Talent Blog InMail data (May 2021 to April 2022, recruiter
  InMails: under 400 characters 22% above average, over 1,200 11% below, individual 15% above bulk), labelled
  as recruiting data. Vendor claims (Valley 15-45% vs 2%, RevBoss "7x"/"400%", Tyler Willis 18%) were NOT
  used. Intentsly facts from proof.md rows marked exactly `verified` (14 demos in 14 days, 4x reply rate,
  12 signals / 8 to ignore, 7-day trial, 2 accounts, 30/30 caps with 15 recommended) and product.md (signal
  types: post engagement, keyword posts, competitor page followers and engagers; scoring; /try-ai with no
  account). No Intentsly price, no 21% figure, no ~1,000 leads figure, no Reddit/X claim, no email claim.
  Job-change and hiring signals are described as manual LinkedIn searches, not as Intentsly features.
  All templates are labelled as hypothetical examples. No em dashes, no banned phrases.
- LinkedIn Help (answer/46662, connection-note character limit) is still robots-blocked for WebFetch, so the
  article again tells the reader to trust the counter in the invite box and keeps every note under 200
  characters. Note: the published guide set-up-signal-based-outbound says the note is "limited to 300
  characters" while write-linkedin-outreach-message says under 200; this article avoids stating a limit.
- Queue: 60 keywords still queued (33 blog, 7 guides, 7 solutions, 7 compare, 6 learn), so none added.
  Blocked keywords: none. Skipped: 3 (pre-existing).
- Connector note: as on the previous runs, the session listed a lowercase `supabase` server as failed
  (ERR_PROXY_TUNNEL) while the capitalised `Supabase` connector worked after a `select 1` check. `add_repo` was
  not available as a tool; the repository was already in scope and cloned, and `git pull` succeeded.
- For the founder, carried over and new: (1) the 21% reply-rate, ~1,000 leads/month and 2 to 4 meetings rows
  in proof.md still cannot be used until their status cell reads exactly `verified` (the gate matches the
  word exactly; the "verified: phrase as ..." notes make the rows unusable); (2) a per-signal reply-rate
  number from Intentsly's own data (even "pain-point posts reply at N times the rate of competitor-post likes")
  would make this templates page and the signal guides far stronger; this page had to say "we have not run a
  controlled test"; (3) if Intentsly ever tracks job changes or hiring posts, say so and two sets in this
  article can be linked to the feature; (4) confirm the connection-note limit the product sees (200 on free,
  300 on paid?) so the three articles stop disagreeing; (5) the Intentsly price is still not citable.
- Live check: not possible from this run (intentsly.com is robots-disallowed for WebFetch and there is no
  GitHub Actions workflow to read). The database row returned status = published and the push landed on
  main, so the page should appear once the site redeploys; Alex should open the URL to confirm.
