# Last run: 2026-11-16 (blog task; fired 06:52 UTC, 08:52 Bucharest)

- Setup: no PAUSE file. Repository already cloned, in scope and on `main` (`add_repo` still not available as
  a tool, as on previous runs); `git pull origin main` already up to date at bd418de. Supabase: the lowercase
  "supabase" connector again reported a proxy tunnel error at session start; the "Supabase" connector
  connected and was used. Web search worked. The two drafts in blog/drafts/ at the start
  (get-clients-for-an-ai-consulting-business.md, outbound-sales-process-for-startups.md) both carry a
  `blocked:` line (the kw_in trailing-"s" gate bug), so neither was resumed.
- Keyword (published, first attempt): signal-based outbound for small teams (blog, signal-selling, how-to,
  informational, priority 2, difficulty low).
  "Signal-Based Outbound for Small Teams: A 2-to-5 Person Model"
  https://intentsly.com/blog/signal-based-outbound-for-small-teams
- Orphan check: a read-only select for the slug before writing returned no row. Supabase returned
  status = published, published_at 2026-11-16 07:07:38 UTC. Writes: the one generated SQL statement, pasted
  whole from blog/out/signal-based-outbound-for-small-teams.sql (162 lines, 20,428 bytes). Reads: two selects
  (the pre-check and a post-insert md5 comparison). The post-insert check compared md5 and length of
  content_md (91f79405..., 15,516 chars), title, word_count (2634), reading_minutes (12), 5 secondary
  keywords, 6 FAQ entries, section, type and cluster against the draft: all matched exactly.
- Gate: first run failed on three points (meta_description 170 chars; opening 106 words; "21%" not in the
  parser's verified set because that proof row's status cell reads "verified: say ..." rather than the bare
  word "verified", so gate.verified_text skips it). Fixes: meta shortened to 155, opening cut to 86 words, and
  the customer reply-rate sentence moved into the paragraph that already links Woodpecker, the same placement
  earlier articles used. Passed on the second run with "ready": true; the truth and voice passes after that
  (removed an unsupported "two plans" reading of the 2-accounts limit, labelled the per-signal hit counts as
  planning assumptions, attributed Woodpecker's figures to the sources it names, cut six "X, not Y" contrasts)
  kept it passing. Final: 2,634 gate-counted words (how-to minimum 1,200; the four tables account for most
  of the length), 10 H2, 6 FAQ, 9 internal links, 4 external links, no warnings, no em dashes, no banned
  phrases. Title similarity to the existing "How to Set Up Signal-Based Outbound in 7 Steps" is under the
  0.75 threshold; that guide covers the solo by-hand setup and this page links to it for those steps.
- Angle: page one is all vendors (Autotouch Sep 2026, Valley updated Oct 2026, Bounce Watch Mar 2026, Fuzzy
  Feb 2026, AI Ropeway Jul 2026, Growleads updated Oct 2026, SpurIQ Jun 2026, Sbl.so Jun 2026). Every one
  explains signal tiers and response windows and treats small teams in one FAQ answer; none converts LinkedIn
  sending caps into how many signals a team can watch, splits roles for 2 to 5 people, handles two people
  messaging the same buyer, or gives a stop rule. This page gives a capacity rule (accounts x 15 x 5), a role
  table for one / two / three-to-five people, a nine-column shared log with a claim rule, a weekly rhythm, a
  day-30 keep/fix/stop table and four "do not do this" cases.
- Sources opened today and linked: Woodpecker cold email statistics (updated 23 Jun 2026: 5.8% under 50
  recipients vs 2.1% at 500 to 1,000+, attributed to Belkins/Cleverly; 3.43% average attributed to Instantly),
  Ehrenberg-Bass / Marketing Science "95:5 rule" page (Professor John Dawes: only 5% of B2B buyers in-market),
  Bounce Watch (15 to 25 signal emails a day), Growleads (20 to 40 accounts a week solo, 60 to 100 small team).
  Opened, not linked: Autotouch, Valley, Fuzzy, AI Ropeway, SpurIQ, Sbl.so. LinkedIn help page on invitation
  limits blocked by robots.txt again, so Intentsly's verified caps were used instead of LinkedIn's wording.
- Intentsly facts used: 30 messages / 30 connection requests per account per day, 15 recommended; up to 2
  LinkedIn accounts per plan; 14 demos in 14 days, zero manual outreach, 4x reply rate (story); 21% reply rate
  and 2 to 4 meetings a week per account across customers, Oct 2026; AI SDR LinkedIn-only; languages EN, RO,
  DE, NL; signal agents watch keyword posts, competitor-post engagers and hashtags and score against the ICP;
  /try-ai shows matching buyers without an account. No price stated. Reddit/X not presented as features.
- Keywords: 51 still queued (22 blog, 10 solutions, 7 learn, 6 guides, 6 compare), so no new keywords added.
  Nothing blocked this run.
- For the founder:
  1. The gate bug in scripts/blog_gate.py kw_in (w.rstrip("s") strips every trailing s) still blocks the two
     complete drafts whose keywords contain "business" and "process". The run is not allowed to edit scripts/;
     changing rstrip("s") to removing one trailing "s" would release both drafts.
  2. In brain/wiki/proof.md the rows for ~1,000 leads/agent, 21% reply rate and 2 to 4 meetings a week have a
     status cell of "verified: say ..." which gate.verified_text() does not recognise as verified, so those
     numbers can only be used in paragraphs that also carry an external link. Moving the phrasing note into
     the Claim column and leaving the status as the bare word "verified" would let them be used anywhere.
  3. Real team-level numbers would make this article stronger: how many signals a typical two-account
     customer watches, how many qualified signals an agent surfaces per day, and any customer with a 2 to 5
     person team willing to be named. The per-signal hit counts in the article are labelled as planning
     assumptions because no first-hand figure exists.
  4. The founder-only details requested in brain/stories/dogfooding-14-demos.md (the first reply, what you
     turned off) are still missing; every signal-selling article reuses the same four lines of that story.
