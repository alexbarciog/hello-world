# Last run: 2026-10-28 (learn task; started 19:20 UTC, 21:20 Bucharest)

- Keyword: what is lead scoring (section learn, cluster fundamentals, type lesson, intent informational,
  priority 2, difficulty medium). `blog_next.py --section learn` returned it directly. No PAUSE file, no
  draft waiting. Repository already cloned and in scope; `git pull origin main` was up to date at 9bad8c1.
  `add_repo` was not available as a tool, as on previous runs. Supabase connector: one of the two
  configured servers reported a proxy tunnel error at session start, the other connected and ran a
  read-only `select 1` before any work began.
- Published: "What Is Lead Scoring? A Definition and a Model to Copy"
  https://intentsly.com/learn/what-is-lead-scoring
  The gate failed once (opening paragraph 98 words); trimmed to 85 and ready on the second run. 9 H2,
  6 FAQ, 7 internal links, 7 external, 2,248 words by the gate's count (two tables hold a share; the prose
  is about 1,800). Fifth page of 28 October; daily cap 7 and weekly cap 45 not reached.
- Database: a read-only select first confirmed no row existed for the slug. The generated SQL ran unchanged
  on project uwwajlezgeurnvvrvdvb and returned status published, published_at 2026-10-28 19:30:59 UTC. A
  second read-only select confirmed the stored content_md matches the draft body exactly (13,937 chars,
  same md5), 6 FAQ entries, 4 secondary keywords, word_count 2248.
- Angle: page one is vendor glossaries (TechTarget, Oracle, &Open, Streak, Lead Liaison) plus one Forrester
  blog. None gives a complete model with points and a threshold on one page; none says when scoring is not
  worth building; only Forrester says how to test it; none cites a primary-source figure. This lesson gives
  a ten-row model (fit rows plus LinkedIn timing rows, threshold 50, decay after 30 days), a scoring vs
  grading vs qualification table, a predictive-scoring section, rework.com's volume thresholds for skipping
  it, Forrester's test, and the 14-demo story as the first-hand example. Brief in
  blog/briefs/what-is-lead-scoring.md.
- External sources opened today and linked: salesforce.com/news/stories/sales-research-2023 (7,775 reps,
  24 Aug to 30 Sep 2022, 28% of the week selling), businesswire.com 6sense 2024 Buyer Experience Report
  release (nearly 70% through the purchase before engaging sellers, 81% have a preferred vendor),
  techtarget.com definition (five model variants, negative scoring), streak.com examples (email points),
  leadliaison.com scoring vs grading (10 vs 25 for an open; consistency), forrester.com blog (higher-score
  leads must convert to closed/won more often; baseline), resources.rework.com/vi/... "When you don't need
  lead scoring" (English body despite the locale path; under 100 MQLs a month use a checklist). The
  oracle.com lead-management URL returned a client error; the oracle.com/cx/marketing version was used for
  the brief only.
- Intentsly facts only from product.md (every prospect is scored against the ICP and prioritised before
  outreach; LinkedIn signals: post, page, keyword engagement) and the dogfooding story (14 demos in 14 days,
  no manual outreach, 4x reply rate, most leads from real-time intent signals). No price, no Reddit/X claim,
  no reply-rate percentage, no customer names.
- Links: /learn/what-is-an-ideal-customer-profile, /learn/what-is-a-buying-signal,
  /learn/what-is-lead-enrichment, /learn, /guides/qualify-leads-before-outreach,
  /features/linkedin-signals (contextual sentence), /signal-playbook (closing CTA).
- Keyword queue: learn had 4 queued after this publish (fewer than 5), so per RUN.md step 6 eight new learn
  keywords were appended after checking who ranks for each: what is lead qualification (high), what is a
  sales qualified lead (high), what is firmographic data (medium), what is social listening in sales (low),
  what is cold outreach (medium), what is an sdr (high), what is a champion in sales (low), what is dark
  social in b2b (medium). Learn queue is now 12. Next up: what is outbound sales.
- For the founder: (1) a real example of how Intentsly's ICP score is displayed or what it weighs would let
  the next lesson show the product's scoring instead of a generic table; (2) the 21% reply rate and 2 to 4
  meetings a week rows are still marked "verified: say ..." rather than plain `verified`, so the gate does
  not accept those numbers; change the status cell to `verified` if they may be used; (3) one customer
  anecdote about a lead that scored high and closed, or scored low and closed anyway, would make a better
  "does it work" section than the launch story alone.
