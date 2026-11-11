# Last run: 2026-11-11 (learn task; fired about 19:15 UTC, 21:15 Bucharest)

- Setup: no PAUSE file. Repository already cloned, in scope and on `main` (`add_repo` not available as a
  tool, as on previous runs); `git pull origin main` already up to date at ee57e05. Supabase: the
  lowercase "supabase" connector again reported a proxy tunnel error at session start; the "Supabase"
  connector connected and was used. Web search worked. The only draft in blog/drafts/
  (outbound-sales-process-for-startups.md, guides) carries a `blocked:` line, so it was not resumed.
- Pre-write check: a read of public.blog_posts for the slug (and any slug containing "first-party")
  returned no row, so nothing was overwritten.
- Keyword (published): what is first-party intent data (section learn, cluster signal-selling, lesson,
  informational, priority 2, difficulty low).
  "What Is First-Party Intent Data? Meaning, Sources, Limits"
  https://intentsly.com/learn/what-is-first-party-intent-data
- Gate: passed on the second run (first run: meta description 163 chars). Then trimmed from 2,050 to
  1,925 gate-counted words, which is still above the 1,800 lesson guideline but below every published
  lesson (1,847 to 2,473 body words). 7 H2, 5 FAQ, 8 internal links, 3 external links, no warnings.
  Title chosen as "Meaning, Sources, Limits" because "Definition and ..." variants scored 0.72 to 0.74
  against the what-is-intent-data title (gate limit 0.75).
- Database: the upsert returned status published, published_at 2026-11-11 19:27:13 UTC.
- Angle: a one-question ownership test (did it happen on something you own, under your privacy
  notice), an eight-row source table with a "what it proves / does not prove" column, the coverage gap
  put in sourced numbers, an answer to "is a LinkedIn comment first-party data", the public-signals
  category that the first/third-party split leaves out, and the first-hand point that our own launch
  pipeline (14 demos in 14 days, 4x reply rate) came from public LinkedIn signals because a new
  company has no first-party data yet.
- Sources opened today and linked: 6sense 2025 Buyer Experience Report release on Business Wire
  (4,000+ buyers; research-to-seller balance 60/40; 94% of buying groups ranked preferred vendors
  before first contact; bought the preliminary favourite 77% of the time), Gartner press release
  9 March 2026 (646 buyers, Aug to Sep 2025; 67% prefer rep-free; 45% used AI in a recent purchase),
  gdpr-info.eu Art. 6 (points (a) and (f)). Opened, not linked: Leadinfo, UserGems, TrustRadius,
  intentdata.io, Lusha, Rover Insights, Knowlee (their only figures were unsourced or vendor claims,
  e.g. "10-15% of visitors", "decays 30% per year", "1.8 billion websites"); Bombora's page returned
  generic copy only. The first Gartner fetch was refused (provenance) until the URL came back from a
  search, then it opened.
  Intentsly facts used: LinkedIn signals (post engagers, keyword posts, competitor followers), ICP
  scoring, AI SDR on LinkedIn, 14 demos in 14 days, zero manual outreach, 4x reply rate, the
  Playbook's 12 and 8. No price, no Reddit/X feature, nothing from the NOT LIVE epics; the 21% and
  2 to 4 meetings rows unused. Did not link /features/reddit-x-signals (the older intent-data lesson
  still does; see the note for Alex).
- Queue: 11 `learn` keywords still queued (above the 5 threshold), so blog-keywords was not run.
  Next up per blog_next is "what is technographic data" (lesson, priority 2).
- Caps: second page of 11 November by Bucharest time (the solutions page at 15:53 was the first;
  cap 7); the weekly count stays under 45.
- For Alex: (1) the published lesson /learn/what-is-intent-data (15 October) links
  /features/reddit-x-signals as a working feature in its "How to use it this week" section, which
  the 2026-10-15 correction forbids; an edit to that article would fix it (the learn task does not
  update existing pages); (2) a first-hand line on what first-party data Intentsly itself watches
  today (for example, which pages or trial events you treat as a buying sign) would turn the
  hypothetical agency example into a real one; (3) the "outbound sales process for startups" guide
  draft is still blocked by the gate's handling of the word "process" (see its blocked: line); it
  needs a change in scripts/, which the content tasks may not touch; (4) a price is still blocked by
  the corrections log; (5) the 21% reply-rate row is still unused pending a phrasing you are happy
  with.
- Push and live check: see the end of this file (appended after the push).
