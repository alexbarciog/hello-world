# Last run: 2026-11-10 (learn task; fired 19:17 UTC, 21:17 Bucharest)

- Setup: no PAUSE file. Repository already cloned and in scope (`add_repo` not available as a tool, as on
  previous runs); `git pull origin main` already up to date at 03f8c8c. The working copy was on a detached
  HEAD at that same commit, so local `main` was checked out and reset to origin/main before any work.
  Supabase: the lowercase "supabase" connector again reported a proxy tunnel error at session start; the
  "Supabase" connector connected and was used. Web search worked. The only draft in blog/drafts/
  (outbound-sales-process-for-startups.md, guides) carries a `blocked:` line, so it was not resumed.
- Keyword (published): what is a buying committee in b2b sales (section learn, cluster fundamentals, lesson,
  informational, priority 2, difficulty low).
  "What Is a Buying Committee in B2B Sales? Roles and Size"
  https://intentsly.com/learn/what-is-a-buying-committee-in-b2b-sales
- Gate: passed on the third run (first run: meta description 167 chars and opening 91 words; trimmed both).
  2,359 words, 8 H2, 6 FAQ, 7 internal links, 7 external links, no warnings. Above the 1,800-word
  guideline for a lesson (the gate allows up to 4,000; the champion lesson is 2,440); the two tables and
  the size section are what the ranking pages lack, so they were kept.
- DATABASE NOTE: before the upsert, a read of public.blog_posts showed the slug ALREADY PRESENT, status
  published, published_at 2026-11-09 19:30 UTC, title "What Is a Buying Committee in B2B Sales? Roles and a
  Map", 2,402 words. That is the learn run of 9 November, which inserted the row and died before committing
  (no published file, no brief, no log line, keyword still queued). Third occurrence of this pattern (5 Nov
  blog, 9 Nov solutions, 9 Nov learn). Yesterday's text was read back and saved as
  blog/recovered/what-is-a-buying-committee-in-b2b-sales.2026-11-09.md before today's upsert replaced it; the
  upsert kept the 9 November published_at. Today's version was written from sources opened today (the 9
  November version cited a Gartner press release, a Forrester press page, Gong Labs and Influ2, none of which
  were re-opened today, and Gong and gartner.com were not fetchable from this session).
- Angle: why the committee-size figures disagree (Forrester 13 counts influence, Gartner 6 to 7 counts the
  working team, Belkins 4.6 to 6.0 counts titles sellers target), each role as the question it asks and the
  sentence it says before killing a deal, a committee vs buying center vs buying group vs decision maker vs
  champion table, a rule by company size (under about 50 people the founder is the committee, which is what
  the 14-demo run showed), and how members show up on LinkedIn before the first call.
- Sources opened today and linked: Forrester State of Business Buying 2026 blog (nearly 18,000 buyers: 13
  internal + 9 external), Forrester 2024 blog (16,000+ buyers: 91% of purchases stall), Gartner "Help your
  tech buying team work more effectively" (6 to 7 members; 15 for IT services deals over $5M), Gartner 2026
  Tech Buying Behavior Study article (68% unhealthy conflict, 7x regret, 3x delays, +75% when the sponsor
  leaves), Belkins buying committee study (1,871 ICP submissions: 4.6 / 5.6 / 6.0 titles; CTO 65.4%, CEO
  33.8% for sub-200 targets), Baylor Keller Center buying-center roles, HBR Store listing for Bonoma 1982.
  Opened, not linked: abmatic.ai, flowla.com, callboxinc.com, bullseye.so, 6sense buyer experience report
  (no usable group-size figure on the page). Not fetchable: gartner.com/en/sales/insights/b2b-buying-journey
  (client error), gong.io (provenance block), ceros Gartner infographic (empty body).
  Intentsly facts used: LinkedIn keyword posts and competitor-post engagers, ICP scoring, LinkedIn-only
  monitoring, 14 qualified demos in two weeks with LinkedIn signals and AI SDR, founders complaining about
  cold outreach burnout, Playbook's 12 and 8. No price, no Reddit/X feature, nothing from the NOT LIVE epics.
- Queue: 12 `learn` keywords still queued (above the 5 threshold), so blog-keywords was not run. Next up per
  blog_next is "what is first-party intent data" (lesson, priority 2).
- Caps: second page of 10 November by Bucharest time (cap 7); 11 published in the last 7 days (cap 45).
- For Alex: (1) three runs in six days have inserted a row and died before committing (5 Nov blog, 9 Nov
  solutions, 9 Nov learn at 19:30 UTC); those sessions' logs are worth a look, and a pre-write check of
  public.blog_posts for the slug in scripts/ would stop the silent overwrite (scripts/ is off-limits to the
  content tasks, so this needs you); (2) decide whether to keep today's version or restore the 9 November
  text from blog/recovered/ (say so and the next run can upsert it back); (3) a first-hand story of a deal
  with a real multi-person committee (who was on it, which seat nearly killed it) would replace the labelled
  hypothetical in this lesson; (4) a price is still blocked by the corrections log; (5) the 21% reply-rate
  row is still unused pending a phrasing you are happy with; (6) the stray live page
  /solutions/find-clients-for-your-agency noted on 8 November still has no file in this repository; (7)
  gartner.com and gong.io cannot be fetched by the content tasks, so Gartner and Gong figures can only be
  used when a fetchable Gartner-owned page (gcom.pdo.aws.gartner.com worked today) carries them.
- Push and live check: see the end of this file (appended after the push).
- Push: `git push origin main` fast-forwarded the remote from 03f8c8c to f1885d2 at 19:31 UTC, committed as
  "Claude <noreply@anthropic.com>".
- Live check (19:36 to 19:38 UTC, about 5 minutes after the push): PAGE LIVE. WebFetch refused the direct page
  URL and the sitemap with the same PROVENANCE_REQUIRED prompt as on 5 to 10 November, so the check went
  homepage -> /learn -> page. The Learn index lists the article as its first card of 18 ("What Is a Buying
  Committee in B2B Sales? Roles and Size", dated November 9, 2026, because the database kept yesterday's
  published_at), and the page itself loads with that H1, the bold definition first, six FAQ entries, "11 min
  read", "Published November 9, 2026" and "updated November 10, 2026". SITEMAP NOT CHECKED:
  https://intentsly.com/sitemap.xml could not be fetched from this session (provenance block); the page is
  reachable from the index, which is what the sitemap is built from.
