# Last run: 2026-11-15 (solutions task; fired about 13:35 UTC, 15:35 Bucharest)

- Setup: no PAUSE file. Repository already cloned, in scope and on `main` (`add_repo` still not available as
  a tool, as on previous runs); `git pull origin main` already up to date at ea8ab27. Supabase: the lowercase
  "supabase" connector again reported a proxy tunnel error at session start; the "Supabase" connector
  connected and was used. Web search worked. The only draft in blog/drafts/ at the start
  (outbound-sales-process-for-startups.md, guides) carries a `blocked:` line, so it was not resumed.
- Keyword 1 (BLOCKED, gate bug): "how to get clients for an ai consulting business" (solutions,
  find-customers, landing, commercial, priority 3). Researched (brief in blog/briefs/, six pages opened,
  three primary sources: Census BTOS, Goldman Sachs 10KSB, McKinsey State of AI) and fully drafted. The gate
  failed on "title / meta_title / meta_description / H2 / first 150 words do not contain the primary
  keyword" even though all five contain it. Cause, confirmed by running `blog_gate.kw_in` directly:
  `kw_in` does `w.rstrip("s")`, which strips BOTH trailing s's from "business" to "busine", and the regex
  `\bbusine(s|es)?\b` can then never match "business" (or "businesses"). Any keyword ending in a double-s
  word is unpublishable until scripts/blog_gate.py is fixed (strip one "s", e.g. `re.sub(r"s$", "", w)`).
  Not editable by this task. Draft left in blog/drafts/ with a `blocked:` line explaining this; keyword set
  to blocked. All other checks on that draft passed (3,000 gate words, 7 H2, 6 FAQ, 15 internal links, 2
  external, no warnings). The same bug will hit "how to get clients for an executive coaching business",
  still queued. Once the gate is fixed: remove the blocked line, set the keyword back to queued, re-run.
- Keyword 2 (published): how to find clients as a fractional cto (solutions, find-customers, landing,
  commercial, priority 3, difficulty low).
  "How to Find Fractional CTO Clients: 6 Signs a Founder Needs You"
  https://intentsly.com/solutions/find-clients-as-a-fractional-cto
  Title shape differs from the CFO/CMO pages because the similarity check (>0.75) rejected "How to Find
  Clients as a Fractional CTO: Six Signals" (0.98 against the CFO title).
- Orphan check: a read-only select for the slug before writing returned no row. Supabase returned
  status = published, published_at 2026-11-15 13:57:34 UTC. Writes: the one generated SQL statement, pasted
  whole from blog/out/find-clients-as-a-fractional-cto.sql (124 lines, 24,566 bytes). Reads: two selects
  (the pre-check and a post-insert md5 comparison). The post-insert check compared md5 and length of
  content_md (8bc0b883..., 19,359 chars) and title, plus word_count (3112), reading_minutes (14), 5
  secondary keywords, 6 FAQ entries, section, type and cluster against the draft: all matched exactly.
- Gate: first run failed on one point (opening 103 words); second run (95 words) still failed; the third
  trim passed with 89 words and "ready": true. Two wording fixes after the pass (softened two unsourced
  "most fractional CTOs" claims), SQL regenerated, still ready. Final: 3,112 gate-counted words (over the
  2,000 landing guideline in page-write.md; the two tables account for most of it; the HR consulting page
  runs 2,830 by the same counter), 7 H2, 6 FAQ, 16 internal links, 3 external links, no warnings, no em
  dashes, no banned phrases.
- Angle: page one is Maxwell Bond (recruiter, Jul 2025), ConsultKit (vendor, Mar 2026), CTO Coach (Mar
  2026), AltexSoft and amazingcto.com (buyer-side "when to hire" pages), TNW (Aug 2026). Supply-side pages
  tell the CTO how to present; buyer-side pages tell founders when to hire; none joins them. The page names
  six founder-side moments visible on LinkedIn (judging developers / technical cofounder question, first
  senior engineering job post with no CTO, seed round with no technical leader, burned-by-agency or rebuild
  post, investor or board pressure including the AI question, CTO leaving or developer promoted into the
  title), with the search and message for each, a week-one plan, the Intentsly mapping table, the 14-demo
  story, and when investors, agencies and fractional CFOs beat outreach.
- Sources opened today and linked: Go Fractional talent map (live table: Engineering 121 jobs, 14% demand
  vs 13% supply, balanced; Finance 15% vs 3%, 4.4x), FractionUS Oct 2025 round-up (92.8% referrals, 30.4%
  social, 19.2% cold outreach; unattributed on the page, so described as a round-up), amazingcto.com
  (Schmidt's seven signs, Jan 2026). Opened, not linked: Go Fractional insights (+28% demand shift, CTO
  hourly rate; not used, no prices), ConsultKit (second-hand stats, pricing tables; not used), CTO Coach,
  AltexSoft, TNW. Fetch failed: Medium (Sergio Pereira), salesso.com, threecus.com.
- Intentsly facts used: the 14-demo story, around 1,000 leads a month per agent and 2 to 4 meetings a week
  (attributed, October 2026), LinkedIn keyword posts, post engagement, competitor followers, ICP scoring,
  enrichment and export, AI SDR on LinkedIn only with Cal.com / Google Calendar and HubSpot, 2 accounts,
  30/30 caps and 15 recommended, four languages. No price, no Reddit/X as features, nothing from the NOT
  LIVE epics, no invented customers or numbers; the 21% reply-rate row again left unused.
- Queue: solutions had 12 queued before this run; now 10 queued, 2 blocked (this run's AI consulting
  keyword and one earlier), 21 published. Above RUN.md's threshold of 5, so no new keywords added. Next up
  per blog_next is "how to find clients for a data analytics consulting firm".
- Caps: first page of 15 November by Bucharest time (cap 7); weekly count under 45 (gate passed).
- Push: see the commit on main (`solutions: publish find-clients-as-a-fractional-cto`), Claude author with
  the session attribution lines.
- Live check: see the appended line below, written after the 4-minute wait.
- For Alex: (1) fix `kw_in` in scripts/blog_gate.py (double-s words such as "business" can never match);
  then unblock the AI consulting draft, which is complete; (2) a real fractional-CTO or consultant customer
  story (how they found the first founder, what the message said) would replace the generic 14-demo
  paragraph on the fractional pages; (3) a way to hand the generated SQL file to the Supabase connector
  without pasting would remove the remaining transcription risk (md5 matched again this run); (4) the
  landing word-count guideline (1,100 to 2,000) is below what every published solutions page runs with
  tables included; confirm whether the guideline should move or tables should be excluded from the count;
  (5) a price is still blocked by the corrections log; (6) the 21% reply-rate row still waits on a phrasing
  you approve; (7) WebFetch of intentsly.com has been refused with PROVENANCE_REQUIRED on the last two
  runs; allowing it for this task would make the live check reliable.
