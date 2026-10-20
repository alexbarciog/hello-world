# Last run: 2026-10-20 (Guides task, guides section)

- Keyword: how to find decision makers on linkedin (cluster linkedin-prospecting, guide, commercial,
  priority 1; returned by `blog_next.py --section guides` directly, no draft was waiting).
- Title: How to Find Decision Makers on LinkedIn: A 6-Step Method
- Live URL: https://intentsly.com/guides/find-decision-makers-on-linkedin
- Status: published (Supabase upsert returned `status = published`, published_at 2026-10-20 07:30 UTC).
  The SQL file was run once, unchanged. Live check: see the bottom of this file, filled in after the push.
- Gate: blog_gate failed once (meta_description 164 chars, max 160; opening paragraph 92 words, max 90);
  both shortened, then pass with no warnings. 2,699 words as the gate counts them (guide range 1,500 to
  3,000), 11 H2s, 5 FAQ entries, 5 internal links (/guides/linkedin-lead-generation-guide,
  /features/linkedin-signals, /learn/what-is-a-buying-signal, /try-ai, /guides), 3 external links (all
  opened this run). blog_cloud.py: `"ready": true`.
- Caps: no page had been published today before this one (last publish 2026-10-16), 12 in the last 7
  days before this one (weekly cap 45). The gate did not report a cap.
- 10 guides keywords remain queued (87 queued overall), so no keywords were added. Next guides keyword:
  "how to build a b2b prospect list" (cluster outbound).

## What the research turned up
- Page one is all vendor blogs for enrichment and automation tools: Evaboot (2024 post retitled
  "2026"), Surfe, Skylead, Collective Campus, CUFinder, Pintel, ConnectSafely, Instantly. All cover the
  company People tab, People search filters, Boolean operators and Sales Navigator Seniority/Function
  filters, then pitch their tool. None gives a title ladder by company size, a real verification step,
  or a way to order the names found; most numbers on those pages are unsourced vendor claims.
  Brief: blog/briefs/find-decision-makers-on-linkedin.md.
- Angle taken: start from a company, not a post (the published linkedin-lead-generation-guide does the
  opposite and the two link to each other). Title ladder by company size, three copy-paste title
  strings, a filter table for the free People search, five authority checks, a buying-committee table,
  and a final step that ranks the names by their last 30 days of LinkedIn activity. Worked example uses
  a labelled hypothetical company (Harbor Ledger).
- Outside statistics, all opened today and linked in the same paragraph: Forrester press release of 21
  January 2026 (13 internal stakeholders and nine external influencers; procurement are decision makers
  in 53% of cycles); LinkedIn's Sales Navigator filter page (filter names, "50+ filters"); LinkedIn's
  Sales Navigator community post of 14 August 2025 (Changed jobs in last 90 days, 62% more likely to
  respond to InMails).
- Not usable this run: linkedin.com/help pages (commercial use limit, Boolean search) are blocked for
  fetching (robots), so the guide states the commercial use limit without a number. The Gartner "6 to
  10 decision makers" figure quoted by several ranking pages was not opened at the source, so it is not
  in the guide.
- Intentsly facts used: the 30/30/15 sending caps (verified row), the dogfooding story (14 qualified
  demos in 14 days, zero manual outreach, 4x reply rate, leads from real-time signals), and the
  one feature sentence (competitor post engagers, keyword posts, competitor page followers, ICP
  scoring, verified email) from brain/wiki/product.md. No price, no Reddit/X claims, no customer names.

## For the founder
- A real account you mapped this way (company size, which title turned out to own the decision, who
  answered first) would replace the labelled hypothetical Harbor Ledger example.
- Your own rule for the title ladder: at what company size do you stop messaging the founder and
  start with the function leader? The table in Step 1 uses common bands (50, 300, 2,000); your real
  cutoffs from the 70+ agents' data would make it first-hand.
- If Intentsly shows a "last active" or engagement date per lead, say so and Step 6 can name it; the
  guide currently describes the ranking only as "surfaces them sorted".
- The remaining guides queue has four outbound keywords (prospect list, outreach message, qualify
  leads, personalize at scale) that would benefit from one real message you sent and the reply it got.

## Live check (after the push)
- Filled in below once the deploy was checked.
