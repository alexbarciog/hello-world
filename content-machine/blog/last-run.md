# Last run: 2026-11-16 (learn task; fired about 19:15 UTC, 21:15 Bucharest)

- Setup: no PAUSE file. Repository already cloned, in scope and on `main` (`add_repo` still not exposed as a
  tool, as on previous runs); `git pull origin main` fast-forwarded to the latest main. Supabase: the lowercase
  "supabase" connector again reported a proxy tunnel error at session start; the "Supabase" connector connected
  and was used. Web search worked. The two drafts in blog/drafts/ at the start
  (get-clients-for-an-ai-consulting-business.md, outbound-sales-process-for-startups.md) both still carry a
  `blocked:` line (gate kw_in strips every trailing "s", so "business" and "process" can never match), so neither
  was resumed. 2 articles had been published today before this run (daily cap 7).
- Keyword (published, first attempt): what is a sales cadence (learn, outbound, lesson, informational, priority 2,
  difficulty medium).
  "What Is a Sales Cadence? Definition, Example and Stop Rules"
  https://intentsly.com/learn/what-is-a-sales-cadence
- Orphan check: a read-only select for the slug before writing returned no row. Supabase returned
  status = published, published_at 2026-11-16 19:26:44 UTC. Writes: the one generated SQL statement, pasted whole
  from blog/out/what-is-a-sales-cadence.sql (124 lines, 17,845 bytes). Reads: two selects (the pre-check and a
  post-insert comparison). The post-insert check compared length and md5 of content_md (13,294 chars,
  5e1bbcfe...), word_count (2094), reading_minutes (10), 4 secondary keywords, 5 FAQ entries, section and type
  against the local draft: all matched exactly.
- Gate: first run failed on one point (meta_description 185 chars); passed on the second run after shortening it
  to 156. Final: 2,094 gate-counted words (1,734 outside the four tables; lesson range 1,000 to 1,800), 7 H2,
  5 FAQ, 10 internal links, 7 external links, no warnings, no em dashes, no banned phrases.
- Angle: page one is vendor blogs (HubSpot, Pipedrive, Cognism, Zendesk, Woodpecker, Apollo) and glossaries
  (DealHub, PhoneBurner). All define the term in a sentence, list components and give 5 to 14 touch day-by-day
  templates; every template starts day 1 on the seller's calendar and none asks what starts the clock. This page
  defines a cadence as five decisions (entry, channels, spacing, progression, exit), puts a calendar-started
  cadence next to a signal-started one for a labelled hypothetical company (Marlowe Freight Software), states what
  the three most-quoted touch-count sources actually measured, designs around the 30/15 LinkedIn caps, gives four
  stop rules and a "run it on 15 and count" test.
- Sources opened today and linked: Yesware "Best Sales Cadence Based on 33 Million Emails" (6 touches over about
  two weeks; 33 million tracked email activities from eight tech companies; phone and email only; first six touches
  analysed), Woodpecker follow-up statistics (9% vs 13% reply rate without/with a follow-up, 16% vs 27% for
  experienced senders; 2 to 3 follow-ups; no sample size stated), RAIN Group (489 sellers surveyed; 8 touches
  average, 5 for top performers), plus Pipedrive, Cognism, HubSpot and Woodpecker's cadence posts for the template
  shapes. Intentsly facts used: 14 demos in 14 days, 4x reply rate, zero manual outreach (story + proof), the
  30/30/15 caps and 2 accounts per plan (proof), LinkedIn signal types and ICP scoring (product.md). The 21% reply
  rate was not used: its proof row status is "verified: say..." rather than exactly "verified", so the gate does
  not accept the number without an external link.
- Live check (about 4 minutes after the push, 19:32 UTC): https://intentsly.com/learn/what-is-a-sales-cadence is live
  (H1, byline dated 16 November 2026, 5 FAQ entries) and the /learn index lists it first among 24 lessons.
  The sitemap could not be checked: WebFetch refused https://intentsly.com/sitemap.xml with a permission prompt
  that nobody was there to answer (the URL has to appear in a user message or a search result first), and the
  run was not allowed to fetch it another way. The index listing shows the redeploy ran, so the sitemap is very
  likely updated too; next run should confirm.
- Learn queue after this run: 6 keywords queued (what is lead qualification, what is a sales qualified lead,
  what is an sdr, what is a hiring signal in sales, what is sales prospecting, what is a marketing qualified lead),
  so no top-up was needed (threshold 5).
- For the founder:
  - Two drafts remain blocked by the gate's kw_in bug (scripts/blog_gate.py line 40 strips every trailing "s";
    any keyword containing "business" or "process" cannot pass). Changing `w.rstrip("s")` to strip one "s" and
    re-running both drafts would publish them. The content task is not allowed to edit scripts/.
  - If you want the 21% reply rate usable without an external link, set that proof.md row's status cell to exactly
    "verified" and move the phrasing note into the Claim column.
  - A real cadence from an Intentsly customer (steps, days, reply by step) would let the lessons replace the
    hypothetical Marlowe Freight example with measured data.
  - brain/voice.md is still "untrained"; drop 15+ real posts into brain/posts/ when convenient.
