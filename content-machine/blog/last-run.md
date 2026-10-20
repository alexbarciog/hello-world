# Last run: 2026-10-20 (Solutions task, solutions section)

- Keyword: how to find b2b clients online (cluster find-customers, landing, commercial, priority 1,
  medium; returned by `blog_next.py --section solutions` directly, no draft was waiting).
- Title: How to Find B2B Clients Online: Signals Before Lists
- Live URL: https://intentsly.com/solutions/find-b2b-clients-online
- Status: published (Supabase upsert returned `status = published`, published_at 2026-10-20 12:58 UTC).
  The SQL file was run once, unchanged. Live check: see the bottom of this file, filled in after the push.
- Gate: blog_gate failed once (meta_description 166 chars; the phrase "research shows" tripped the
  vague-attribution check), fixed in one pass. Then trimmed for length (2,551 to 2,368 words as the gate
  counts them; the /solutions range in page-write.md is 1,100 to 2,000, the config max is 4,000, and
  the previous solutions page shipped at 2,268, so this is in line with it but still above the skill's
  range). 7 H2s, 5 FAQ entries, 9 internal links (/learn/what-is-a-buying-signal,
  /blog/find-b2b-leads-on-reddit, /guides/linkedin-lead-generation-guide, /features/linkedin-signals,
  /case-studies, /solutions/find-customers-for-b2b-saas, /solutions, /try-ai, /signal-playbook),
  3 external links, all opened this run. Both required tables present. blog_cloud.py: `"ready": true`.
- Caps: the gate did not report a daily or weekly cap.
- Queue: 10 solutions keywords remain queued (85 queued overall), so no keywords were added. Next by the
  run's rule: "how to find clients for a marketing agency" (priority 1, medium).

## What the research turned up
- Page one for the keyword is all vendor blogs: Plezi (2022, ten channels), Assembly (Aug 2025, eight
  tactics), Tomba (Jun 2026, ICP plus data accuracy plus 90-day plan), Reply.io (updated Jan 2026, tool
  roundup), Instantly (updated May 2026, eight strategies pointing at its own features), Callbox (updated
  Apr 2026, planning framework plus outsourcing pitch). None sorts channels by whether they reach buyers
  deciding now, none gives message templates or exact searches, and their statistics are unsourced or
  second-hand. Brief: blog/briefs/find-b2b-clients-online.md.
- Angle taken: a channel table sorted by "people deciding now" versus "people who might decide someday",
  a seven-row LinkedIn signal table (Signal | Where | What it means | What to do) with a labelled
  hypothetical bookkeeping firm, a seven-step week-one plan with exact Posts-tab searches, two copy-paste
  message templates, the Intentsly limits stated plainly, and a section on when referrals, communities or
  paid ads beat signals.
- Outside figures, each linked in the same paragraph: 6sense 2025 B2B Buyer Experience Report
  (6sense.com/report/buyer-experience/: first contact at about 61% of the journey, 94% ranked their
  shortlist before engaging sellers, buyers initiated 79% of engagements, 5.1 vendors evaluated, nearly
  4,000 responses); Close's customer acquisition blueprint by Steli Efti (first ten by any means, the
  "just raised" list that produced seven customers in two weeks); the Indie Hackers first-customers
  thread (Reddit most mentioned, then Product Hunt, X, LinkedIn, personal network). All opened 2026-10-20.
- Intentsly facts used: the feature list from brain/wiki/product.md, the 2-account / 30-and-30 / 15
  recommended limits, the four languages, LinkedIn-only AI SDR, 7-day trial, self-serve setup, export of
  leads and signals, the 14 demos / 14 days / 4x story labelled as our own run, ~1,000 leads a month per
  agent and 2 to 4 meetings a week attributed to "across Intentsly customers in October 2026", and the
  12-versus-8 playbook split. No price, no Reddit/X monitoring claim, no customer names. The 21% reply
  rate was not used: its proof row's status cell reads "verified: say ..." rather than "verified", so the
  gate would treat it as unsourced.

## For the founder
- The proof.md rows with a status like `verified: phrase as ...` are not read as verified by the gate
  (gate.py compares the status cell to the exact word "verified"). The 21% reply rate therefore cannot be
  used in any article. If you want it usable, change those status cells to plain `verified` and move the
  phrasing instruction into the Claim cell or corrections.md. (This run did not edit proof.md.)
- A real service-business customer story (agency, consultancy, bookkeeping or similar) would let the
  /solutions pages for non-SaaS business types show something other than our own SaaS dogfooding run.
  The next ten solutions keywords are mostly agencies, consultants and small businesses.
- Confirming whether the free LinkedIn Posts-tab date filter and "past week" option still exist as
  described would let later pages name the exact click path; this page describes it in general terms.
- Gartner's B2B buying-journey page and the 6sense press release could not be opened from this task
  (permission prompt or empty response); the 6sense report page itself opened and is what the article cites.

## Live check (after the push)
- Push at 12:59 UTC (commit 1a428ac, pushed as `HEAD:main`). Checked at 13:04 UTC.
- https://intentsly.com/solutions/find-b2b-clients-online is live: H1 "How to Find B2B Clients Online:
  Signals Before Lists", title tag from meta_title, byline Alex Barciog with 11-minute read time, all
  six named H2s present plus the site's own "Your next step" section, three tables in the source,
  5 FAQ entries.
- https://intentsly.com/solutions lists it first, above the B2B SaaS page.
- https://intentsly.com/sitemap.xml could not be opened from this run: as in the previous runs, WebFetch
  asked for approval for that URL (no page or search result links to it, and the homepage footer has no
  sitemap link) and nobody was present to answer. The prerendered /solutions index includes the page and
  the sitemap is built from the same route list, so it is very likely listed, but that is inferred, not
  confirmed. Alex: a footer or robots.txt link to /sitemap.xml, or opening the sitemap once in a chat
  where this task runs, would let future runs confirm it.
