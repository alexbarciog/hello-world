# Last run: 2026-10-16 (guides section)

- Keyword: linkedin lead generation guide (section guides, cluster linkedin-prospecting, guide, commercial, priority 1)
- Title: LinkedIn Lead Generation Guide: Find Buyers Already Asking
- Live URL: https://intentsly.com/guides/linkedin-lead-generation-guide
- Status: published (Supabase row returned `status = published`, published_at 2026-10-16 07:35 UTC).
  Live check: see the section at the bottom, filled in after the push.
- Gate: one fix (opening paragraph was 92 words, trimmed to under 90), then `"ready": true` with no
  warnings. 2,655 words (guide min 1,500), 11 H2s, 6 FAQ entries, 5 internal links
  (/learn/what-is-intent-data, /features/linkedin-signals, /blog/find-b2b-leads-on-reddit,
  /signal-playbook, /try-ai), 4 external links (ligosocial.com Boolean search and advanced search
  pages, overloop.com LinkedIn limits, joinvalley.co invitation limit), all opened this run.
  Third article published today (daily cap 7).
- Shape per skills/page-write.md "/guides": short answer, "What you need" table, Steps 1 to 6 as H2s
  with strings, filters and templates in code blocks, worked example (Northwind Payroll, labelled
  hypothetical, action counts only, no invented results), "Where this goes wrong" with three mistakes,
  "What to do with the list", FAQ. Intentsly named once in the body (Step 3, where it replaces the
  manual engager reading) and once in the closing CTA.
- 11 guides keywords remain queued (92 queued overall), so no keywords were added.

## What the research turned up
- Page one is vendor blogs (Snov, LinkedFusion, Expandi, Fuzzy, GigRadar), all shaped "optimise
  profile, then prospect, then message, then automate". Only one of them gives a single Boolean
  string; none gives Posts-tab search strings, none sources its statistics, none separates
  LinkedIn-documented limits from community-reported ones, none has a worked example or a
  "where this goes wrong" section. The brief is in blog/briefs/linkedin-lead-generation-guide.md.
- linkedin.com/help pages are blocked to the fetch tool (robots), so LinkedIn's Boolean rules and
  Posts-tab filters are cited through ligosocial.com, which quotes the help pages by number. The
  copilotai.com result redirected to yokegtm.com and needed a one-time approval nobody was present
  to grant, so it was not read.
- Outside figures used, each with its link in the same paragraph: "around 100 invitations per
  rolling seven days" (stated as community-reported, not LinkedIn-published), 300-character
  connection note on desktop, 30,000 first-degree connection maximum, undisclosed monthly commercial
  use limit, the restriction triggers list (all Overloop); people searches count toward the
  commercial use limit while post searches are not on the list (LiGo); withdrawing invitations does
  not restore weekly quota (Valley). No percentages from outside sources were used.

## Calls made without review
- The guide opens with a search-first method rather than profile optimisation, on purpose, because
  that is the gap in the ranking pages and it is how the 14-demo run worked.
- Verified numbers used: 14 qualified demos in 14 days, 4x reply rate (labelled "our own run"),
  12 signals to chase and 8 to ignore, 7-day trial, 30 messages and 30 connection requests a day with
  15 recommended (phrased as "our own customers' sender accounts"). The ~1,000 leads per agent, 21%
  reply rate and 2 to 4 meetings rows were not used because their status cell is not exactly
  `verified`.
- Intentsly described only per brain/wiki/product.md: competitor posts, keyword posts, hashtags,
  company-page engagers, scoring against the customer profile, AI SDR sending LinkedIn notes and
  messages inside the daily caps, /try-ai with no account. No price stated. No Reddit or X monitoring
  claimed; the Reddit article is linked as a manual method.
- "Sales Navigator adds company headcount, seniority and years in role" is stated from the ranking
  pages' descriptions of its filters, not from LinkedIn's own page (blocked to the fetch tool).
- Message templates use placeholders ("[a client you can name]") rather than an invented anecdote.

## For the founder
- A real example of a Posts-tab string you run for Intentsly's own prospecting, with one anonymised
  post it surfaced and what the first message said, would replace the hypothetical Northwind example
  with first-hand material. That is the single biggest upgrade available for this page.
- The menu names in the app for adding competitor sources, keyword posts and hashtags would let Step 3
  name the exact clicks instead of describing the feature.
- proof.md: the ~1,000 leads per agent, 21% reply rate and 2 to 4 meetings rows still need their
  status cell to read exactly `verified` to be usable; the 21% figure would strengthen the reply-rate
  FAQ in this guide.
- Confirm whether LinkedIn's "Sort by" label in the Posts filter is "Latest" so the guide can name the
  exact label; it currently says "newest first".
- Next guides keywords in the queue: how to find decision makers on linkedin, how to build a b2b
  prospect list, how to write a linkedin outreach message, how to set up signal-based outbound,
  how to monitor competitors on linkedin, how to qualify leads before outreach, how to track hiring
  signals for sales (note: hiring signals are not an Intentsly feature per product.md, so that guide
  will be manual-only), how to use linkedin search operators for prospecting, outbound sales process
  for startups, how to find companies that just raised funding, how to personalize cold outreach at
  scale.

## Live check (filled in after the push)
- Pending at the time of the commit; see the run report.
