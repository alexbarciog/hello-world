# Last run: 2026-11-15 (learn task; fired about 19:10 UTC, 21:10 Bucharest)

- Setup: no PAUSE file. Repository already cloned, in scope and on `main` (`add_repo` still not available as
  a tool, as on previous runs); `git pull origin main` already up to date at 7ac569f. Supabase: the lowercase
  "supabase" connector again reported a proxy tunnel error at session start; the "Supabase" connector
  connected and was used. Web search worked. The two drafts in blog/drafts/ at the start
  (get-clients-for-an-ai-consulting-business.md, outbound-sales-process-for-startups.md) both carry a
  `blocked:` line, so neither was resumed.
- Keyword (published, first attempt): what is a warm lead (learn, fundamentals, lesson, informational,
  priority 2, difficulty medium).
  "What Is a Warm Lead? Meaning, Three Sources and a Test"
  https://intentsly.com/learn/what-is-a-warm-lead
- Orphan check: a read-only select for the slug before writing returned no row. Supabase returned
  status = published, published_at 2026-11-15 19:24:29 UTC. Writes: the one generated SQL statement, pasted
  whole from blog/out/what-is-a-warm-lead.sql (108 lines, 16,794 bytes). Reads: two selects (the pre-check
  and a post-insert md5 comparison). The post-insert check compared md5 and length of content_md
  (387b8171..., 12,213 chars), title, word_count (2024), reading_minutes (9), 5 secondary keywords, 5 FAQ
  entries, section, type and cluster against the draft: all matched exactly.
- Gate: first run failed on one point (meta_description 176 chars); shortened to 160 and passed with
  "ready": true. Three wording fixes after the pass during the truth pass (ICP lesson has five parts, not
  four; "a second release from the same survey" for the second Gartner link; removed the unsupported claim
  that the 14-demo founders "had never heard of Intentsly" and replaced it with the story's own line that
  most leads came from signals caught in real time). SQL regenerated, still ready. Final: 2,024 gate-counted
  words (lessons in this series run 1,983 to 2,383 by the same counter; the two tables account for most of
  the excess over the 1,800 guideline), 7 H2, 5 FAQ, 9 internal links, 4 external links, no warnings, no em
  dashes, no banned phrases. Title similarity to existing lessons at most 0.64 (threshold 0.75).
- Angle: page one is all vendors (Warmly Dec 2023, Zeliq Oct 2026, monday.com Dec 2025, HubSpot "hot lead"
  Oct 2025, ZoomInfo Jul 2026, Belkins 2022, Prospeo). Every one defines warmth as engagement with your
  brand and quotes cold 1-3% / warm 5-15% / hot 20-40% with no named source. The lesson splits warm leads
  into three sources (they came to you, someone brought them, they acted in public about the problem),
  treats the public actor who never heard of you as warm, gives a three-question test with the writable
  first line as the pass condition, says plainly that the quoted ranges have no named source, and uses the
  14-demo story as the example of the third source.
- Sources opened today and linked: Gartner press release 9 Mar 2026 (646 buyers, Aug to Sep 2025: 67%
  rep-free), Gartner press release 20 May 2026 (645 buyers: seven information sources, 69% validate with
  reps), ZoomInfo Pipeline (for the "industry benchmarks" attribution), monday.com (same ranges, no source).
  Opened, not linked: Warmly, Zeliq, HubSpot, Belkins, Prospeo, LinkedIn Sales Solutions 2020 post. HBR
  "The Short Life of Online Sales Leads" (2011) is paywalled, abstract only, so none of its response-time
  numbers were used. Surfe glossary URL redirected to the blog index.
- Intentsly facts used: the 14-demo story (14 qualified demos in 14 days, zero manual outreach, reply rate
  4x, most leads from real-time signals), LinkedIn keyword posts, post engagement, competitor followers,
  ICP scoring. No price, no Reddit/X as features, nothing from the NOT LIVE epics, no invented customers or
  numbers; the 21% reply-rate row again left unused. CTA is /signal-playbook as page-write.md requires.
- Queue: learn had 8 queued before this run; now 7 queued, 23 published, 0 blocked. Above RUN.md's
  threshold of 5, so no new keywords added. Next up per blog_next is "what is a sales cadence".
- Caps: second page of 15 November by Bucharest time (cap 7); weekly count under 45 (gate passed).
- Push: see the commit on main (`learn: publish what-is-a-warm-lead`), Claude author with the session
  attribution lines.
- Live check: see the appended line below, written after the 4-minute wait.
- For Alex: (1) scripts/blog_gate.py `kw_in` bug from the 15 Nov solutions run still stands (double-s words
  such as "business" can never match); the AI consulting draft stays blocked until it is fixed; (2) a
  real customer example of a referral or an inbound warm lead that closed (what they did, what the first
  message said) would give the first two warm-lead sources a first-hand example to match the third; (3)
  conversion numbers by lead temperature from the Intentsly database (reply or meeting rate for signal
  leads vs cold lists), if they exist, would let this lesson replace the "measure your own" advice with a
  verified figure; (4) a way to hand the generated SQL file to the Supabase connector without pasting
  would remove the remaining transcription risk (md5 matched again this run); (5) a price is still blocked
  by the corrections log; (6) the 21% reply-rate row still waits on a phrasing you approve; (7) WebFetch of
  intentsly.com has been refused with PROVENANCE_REQUIRED on recent runs; allowing it for this task would
  make the live check reliable.
- Live check (19:31 UTC, four minutes after the 19:26:51 push): NOT CONFIRMED from this run. WebFetch
  refused both https://intentsly.com/sitemap.xml and the lesson URL with PROVENANCE_REQUIRED, as on the
  14 and 15 November runs; a web search for the URL did not surface the page yet (expected minutes after a
  deploy). No other fetch method was used, per the rules. Evidence the page will be live once the push
  deploys: the public.blog_posts row is status = published with content verified by md5, and the push to
  main (7ac569f -> 50d3bd1) is what triggers the prerender that writes the sitemap. Alex: open the URL and
  the sitemap once to confirm, or allow intentsly.com fetches for this task.
- Push note: the first push was rejected as non-fast-forward because the local clone was in detached HEAD
  with a stale local `main` (5e39abf); `git push origin main` was pushing that stale branch. Fixed by moving
  local `main` to the new commit, no history rewritten. Future runs: check `git status -sb` shows `main`
  before pushing.
