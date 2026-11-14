# Last run: 2026-11-14 (learn task; fired about 19:15 UTC, 21:15 Bucharest)

- Setup: no PAUSE file. Repository already cloned, in scope and on `main` (`add_repo` still not available as
  a tool, as on previous runs); `git pull origin main` already up to date at c9865ea. Supabase: the lowercase
  "supabase" connector again reported a proxy tunnel error at session start; the "Supabase" connector
  connected and was used. Web search worked. The only draft in blog/drafts/
  (outbound-sales-process-for-startups.md, guides) carries a `blocked:` line, so it was not resumed.
- Keyword (published): what is multithreading in sales (section learn, cluster outbound, lesson,
  informational, priority 2, difficulty medium).
  "What Is Multithreading in Sales? Meaning, Example, Size Rule"
  https://intentsly.com/learn/what-is-multithreading-in-sales
- Orphan check: a read-only select for the slug before writing returned no row. Supabase returned
  status = published, published_at 2026-11-14 19:29:08 UTC. Writes: the one generated SQL statement, pasted
  whole from blog/out/what-is-multithreading-in-sales.sql (108 lines, 18,767 bytes). Reads: two selects
  (the pre-check and a post-insert md5 comparison). The post-insert check compared md5 and length of
  content_md, title, meta_description and excerpt plus word_count (2152), reading_minutes (10), 5
  secondary keywords, 6 FAQ entries, section, type and cluster against the draft: all matched exactly, so
  the transcription risk noted on 14 Nov (solutions run) did not recur.
- Gate: first run failed on three points (meta_description 166 chars, no H2 with the keyword, opening 99
  words); fixed, then one more fail (meta_description 161 chars); fixed, then "ready": true. One wording
  fix after the pass, SQL regenerated. Final: 2,152 gate-counted words (over the 1,800 lesson guideline in
  page-write.md; the two tables account for most of it; published lessons run 2,100 to 2,700 by the same
  counter), 7 H2, 6 FAQ, 8 internal links, 3 external links, no warnings, no em dashes, no banned phrases.
- Angle: page one is DealHub (glossary, Apr 2026), Mixmax (Nov 2025, unlinked stats), Highspot (Oct 2026,
  enterprise and AI pitch), Nektar (Jul 2026, vendor research), Common Room (Sep 2026, best of the set),
  Flowla, FoundryCo, ZoomInfo, UserGems. All assume enterprise deals and none says when single-threading
  is fine. The page gives a company-size rule (1 to 2 threads under 20 people, 2 to 3 at 20 to 200, 3 to 5
  at 200 to 2,000, 5+ above), a table separating multithreading from single-threading, multichannel, team
  selling and account-based prospecting, the exact sentence that adds a thread without bypassing the
  champion, a labelled hypothetical (Vollan Systems, 120-person logistics software company), and how two
  names from one company engaging on LinkedIn reveal a buying group before the first call.
- Sources opened today and linked: Gong Labs (28 Apr 2025, modified 27 May 2026; 1.8M deals closed in
  2024; 77% multi-threaded; closed deals twice the buyer contacts; 130% average win-rate lift in deals over
  $50K); Gong 2019 (modified Mar 2026; 10M+ conversations and 500,000 emails; 8 vs 3 email contacts; at
  least 3 buyer-side people in meetings); Gartner press release 7 May 2025 (632 buyers, Aug to Sep 2024;
  groups of 5 to 16 across up to 4 functions; 74% unhealthy conflict; 2.5x high-quality deal). Opened, not
  linked: UserGems (500-opportunity internal model, 5% vs 30%), echai Q&A, DealHub, Mixmax, Highspot,
  Nektar, Common Room. Not used: LinkedIn "78% single-threaded" (primary report not found), Boomerang (no
  sample sizes or date), Gartner b2b-buying-journey page (client error on fetch). The gong.io/blog URL used
  in the champion lesson was refused with PROVENANCE_REQUIRED because it did not come from a search this
  run; the same article at gong.io/resources/labs/ was reached via search and used instead.
- Intentsly facts used: the 14-demo story (two weeks, founders replying, champion and buyer one person),
  LinkedIn keyword posts, post engagement with competitor and industry posts, ICP scoring, LinkedIn as the
  only monitored source. No price, no Reddit/X as features, nothing from the NOT LIVE epics, no invented
  customers or numbers; the 21% reply-rate row again left unused.
- Queue: learn had 9 queued before this run and 8 after marking (above RUN.md's threshold of 5, so no new
  keywords added). Next up per blog_next is "what is a warm lead".
- Caps: second page of 14 November by Bucharest time (cap 7; the solutions page went out at 13:57 UTC);
  weekly count well under 45.
- Push: see the commit on main (`learn: publish what-is-multithreading-in-sales`), Claude author with the
  session attribution lines.
- Live check: see the appended line below, written after the 4-minute wait.
- For Alex: (1) a real multi-stakeholder deal from an Intentsly customer (how many people, who went quiet,
  what happened) would replace the hypothetical Vollan Systems example; (2) the Gartner
  "6 to 10 decision makers" page refused the fetch, so that widely quoted figure stays out until a reachable
  Gartner source is allowed; (3) a way to hand the generated SQL file to the Supabase connector without
  pasting would remove the remaining transcription risk, although this run's md5 check passed; (4) the
  lesson word-count guideline (1,000 to 1,800) is below what every published lesson actually runs with
  tables included; confirm whether the guideline should move or tables should be excluded; (5) a price is
  still blocked by the corrections log; (6) the 21% reply-rate row still waits on a phrasing you approve.
