# Last run: 2026-11-17 (learn task; fired about 19:15 UTC, 21:15 Bucharest)

- Setup: no PAUSE file. Repository already cloned, in scope and on `main` (`add_repo` still not exposed as a
  tool, as on previous runs); `git pull origin main` reported already up to date at dc2e8c0. Supabase: the
  lowercase "supabase" connector again failed with a proxy tunnel error at session start; the "Supabase"
  connector connected and was used. Web search worked. The two drafts in blog/drafts/ at the start
  (get-clients-for-an-ai-consulting-business.md, outbound-sales-process-for-startups.md) both still carry a
  `blocked:` line, so neither was resumed. 1 article had been published today before this run (the staffing
  agency solutions page, daily cap 7); 18 in the last 7 days (weekly cap 45).
- Keyword (published, first attempt): what is a hiring signal in sales (learn, signal-selling, lesson,
  informational, priority 2, difficulty medium).
  "What Is a Hiring Signal in Sales? Meaning, Types, a Test"
  https://intentsly.com/learn/what-is-a-hiring-signal-in-sales
- Orphan check: a read-only select for the slug before writing returned no row. Supabase returned
  status = published, published_at 2026-11-17 19:28:10 UTC. Writes: the one generated SQL statement, pasted
  whole from blog/out/what-is-a-hiring-signal-in-sales.sql (127 lines, 18,766 bytes). Reads: two selects
  (the pre-check and a post-insert comparison). The post-insert check compared length and md5 of content_md
  (13,690 chars, 5930bf08...), word_count (2252), reading_minutes (10), 5 secondary keywords, 6 FAQ entries,
  section and type against the local draft: all matched exactly.
- Gate: passed on the first run. The draft was then trimmed by hand from 2,090 to about 1,870 non-table words
  (lesson range 1,000 to 1,800 outside tables; the FAQ alone is 457 of those, in line with the other published
  lessons at 1,670 to 1,920) and re-gated twice more, passing each time. Final: 2,252 gate-counted words
  (three tables), 8 H2, 6 FAQ (64 to 70 words each), 8 internal links, 8 external links, no warnings, no em
  dashes, no banned phrases, exact keyword phrase used twice. Title similarity to the nearest published title
  ("What Is a Buying Signal? Definition, Examples and a Test") checked at 0.68 (gate limit 0.75); the first
  candidate titles scored 0.78 to 0.79 against the social-listening and champion lessons and were dropped.
- Angle: page one is vendor glossaries and vendor blogs (Komo, Autobound, Crustdata, FirstSales, Valley). All
  define a hiring signal as "data from job postings, headcount and recruiting activity", list the same types,
  and quote vendor-attributed statistics (Komo: 73% of openings posted within 30 days of budget approval,
  2 to 3x purchase intent, 18% response rate; Autobound: 2.4x more likely to buy software, which Autobound
  itself labels as having no identifiable primary source; Valley admits no independent study links postings
  to win rates). None separates what a posting proves from what it suggests, none gives a ghost-job test,
  and none sources its timing windows. This lesson splits the evidence into three kinds (posting, hiring post
  by a person, headcount change) with a proves/suggests table, ranks six types, gives a four-question test
  (new role, cluster, named person, fresh) with a three-yes rule, a four-way vs table (job posting, hiring
  signal, trigger event, buying signal), three actions for the week, and states that it quotes none of the
  vendor multipliers. Brief: blog/briefs/what-is-a-hiring-signal-in-sales.md.
- Sources opened today and linked: Greenhouse 2024 State of Job Hunting post (18 to 22% of jobs posted on the
  Greenhouse platform classified as ghost jobs in any quarter), BLS JOLTS release for September 2026 dated
  3 November 2026 (7.5 million openings, 5.4 million hires; the lesson says the two measure different things
  and the gap is not proof of ghost jobs), SHRM 2026 recruiting benchmarking page (median time to fill 39
  calendar days for non-executive positions, 4,600+ organisations), plus the five ranking pages for their own
  definitions (Komo, Autobound, Crustdata, FirstSales, Valley). Not used: every vendor-attributed multiplier
  and response rate above, Crustdata's ResumeBuilder/CNBC/DemandGen/HubSpot figures (second-hand, not opened),
  Valley's Apollo-database ratio (no method published). Intentsly facts used: LinkedIn keyword-post monitoring
  and ICP scoring (product.md), with the honest note that Intentsly does not read job boards; the Buying Signal
  Playbook "12 worth chasing and 8 to ignore" (proof.md). No price stated. No first_hand story used: the
  dogfooding story's trigger was a complaint signal, not a hiring signal, so it was left out rather than forced.
- Live check (about 5 minutes after the push, 19:35 UTC): https://intentsly.com/learn/what-is-a-hiring-signal-in-sales
  is live (H1, byline dated 17 November 2026, 10 min read, 6 FAQ entries, all three tables) and the /learn
  index lists it first among 25 lessons, so the redeploy ran inside 5 minutes this time. The sitemap could not
  be checked: WebFetch refused https://intentsly.com/sitemap.xml with a permission prompt nobody was there to
  answer (third run in a row), and the run was not allowed to fetch it another way. The direct page URL was
  also refused until the /learn index had been opened first and linked to it. The index listing shows the
  redeploy ran, so the sitemap is very likely updated.
- Learn queue after this run: 5 keywords queued (what is lead qualification, what is a sales qualified lead,
  what is an sdr, what is sales prospecting, what is a marketing qualified lead), all priority 3. RUN.md tops
  up at fewer than 5, so no top-up this run; the next learn run will publish one and then need to add 8 to 12.
- For the founder:
  - Two drafts remain blocked by the gate's kw_in bug (scripts/blog_gate.py line 40 strips every trailing "s";
    keywords containing "business" or "process" cannot pass). Changing `w.rstrip("s")` to strip one "s" and
    re-running both drafts would publish them. The content task is not allowed to edit scripts/. Note also that
    the queued learn keyword "what is sales prospecting" is safe ("sale" + s), but "what is lead qualification"
    and the two "qualified lead" keywords are fine too; none of the five hits the bug.
  - A real customer example built on a hiring post (which tell-role, the message sent, the reply) would let
    this lesson and the hiring-signals guide replace the labelled hypothetical with a first-hand case.
  - If you want the 21% reply rate usable without an external link, set that proof.md row's status cell to
    exactly "verified" and move the phrasing note into the Claim column.
  - brain/voice.md is still "untrained"; drop 15+ real posts into brain/posts/ when convenient.
  - WebFetch has refused https://intentsly.com/sitemap.xml with a permission prompt on the last two runs; if
    that repeats, the sitemap check will keep relying on the section index as a proxy.
