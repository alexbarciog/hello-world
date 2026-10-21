# Last run: 2026-10-21 (Guides task, guides section)

- Keyword: how to build a b2b prospect list (cluster outbound, guide, commercial, priority 1, medium;
  returned by `blog_next.py --section guides`, no draft was waiting). No PAUSE file.
- Title: How to Build a B2B Prospect List: 7 Steps and a Template
- Live URL: https://intentsly.com/guides/build-b2b-prospect-list
- Status: published (Supabase upsert returned `status = published`, published_at 2026-10-21 07:48 UTC,
  10:48 Europe/Bucharest). The SQL file was run once, unchanged. Live check at the bottom.
- Gate: first run failed on two items (meta_description 163 chars; opening paragraph 99 words). Fixed by
  shortening the description to 155 chars and trimming the opening to 89 words (two attempts: 96 words
  after the first trim). Third run passed. After passing, four truth-pass edits were made (dropped the
  Sales Navigator "Industry" filter name because LinkedIn's page opened this run does not list it,
  softened the Intentsly sentence so it does not imply the product fills the reader's spreadsheet,
  removed a pointer to guides that are not published yet, "other vendors" -> "other buyers") and the
  gate was re-run: still `"ready": true`, no warnings. Final 2,782 words (guide min 1,500), 11 H2s,
  6 FAQ entries, 7 internal links (/learn/what-is-an-ideal-customer-profile,
  /guides/linkedin-lead-generation-guide, /features/linkedin-signals,
  /guides/find-decision-makers-on-linkedin, /case-studies, /try-ai, /guides), 5 external links, all
  opened this run.
- Caps: third article dated 21 October (Bucharest) after trigify-api-alternative and
  intentsly-vs-gojiberry; the daily cap is 7. No cap reported.
- Queue: 9 guides keywords still queued (next: how to write a linkedin outreach message), so no new
  keywords were added.
- Supabase connector: the session listed a lowercase `supabase` server as failed (ERR_PROXY_TUNNEL)
  and a separate `Supabase` server whose `execute_sql` worked after a `select 1` check. Same pattern
  as the previous two runs. No `add_repo` tool existed in the session; the repository was already in
  scope and `git pull origin main` was used on the existing clone.

## What the research turned up
- Page one for "how to build a b2b prospect list" is all vendor blogs: Zapier (Mar 2024), Sopro
  (2 Sep 2026), Cognism (upd. 13 May 2026), Cleanlist AI (Apr 2026), Lead Scrape (upd. Oct 2026),
  Danish Lead Co (Apr 2026), Leadin (Jun 2025). Every one starts from a database export and filters
  down; none gives a pasteable LinkedIn search string, none applies a scoring rule to a row, none says
  which rows to delete. Statistics are the vendor's own or routed through other blogs.
  Brief: blog/briefs/build-b2b-prospect-list.md.
- Outside facts used, each linked in its paragraph: Google sender guidelines (spam rate below 0.10%,
  never 0.30%, stricter rules above 5,000 messages a day to Gmail); Forrester press release
  21 Jan 2026 (13 internal stakeholders, nine external influencers, procurement decides in 53% of
  cycles); ZeroBounce Email List Decay Report (at least 23% of a list decays within a year, data
  Jan to Dec 2025); LinkedIn's Sales Navigator how-to page (filter names, Job Changes spotlight,
  "40+ filters"); Apollo pricing page (plan names only; no figures rendered, so none stated).
- Could not open: LinkedIn help page on the commercial use limit (robots), the businesswire copy of
  the Forrester release and the Sales Navigator filter page (provenance prompt). The commercial use
  limit is stated qualitatively, with no number.
- Angle taken: build the list from LinkedIn activity first (post search strings, competitor-post
  commenters, Job Changes), firmographics second; a 19-column paste-in header row; a fit + signal
  scoring table applied to a labelled hypothetical company (Lantern Compliance); a cut rule (under 50
  points); a weekly routine; a message template that quotes the signal.
- Intentsly facts used: LinkedIn signals (competitor posts, keyword posts, page followers) and ICP
  scoring from product.md; 30/30/15 limits and 2 accounts; 14 demos in 14 days, zero manual outreach,
  4x reply rate (story + /case-studies); /try-ai with no account. No price. No Reddit/X. The 21% and
  2 to 4 figures were not used (gate reads only rows whose status is exactly `verified`).

## What the founder should supply
- The export format(s) Intentsly offers (CSV? HubSpot only?), so a guide can say "export the scored
  list to your sheet" instead of staying vague about how a reader gets Intentsly rows into the
  template above.
- A real list-building number from the product: how many signal rows a typical agent finds in a week
  for a defined ICP, and what share passes scoring. That would replace the invented Lantern numbers
  with a measured example on the next guide ("how to set up signal-based outbound").
- One short story from the 14-demos launch: the first search string you used, the post that led to
  the first demo, what you turned off. The story file still has the founder placeholder.
- Same as earlier runs: decide whether proof.md rows marked `verified: say ...` should be split so the
  gate accepts the 21% reply rate and 2 to 4 meetings figures.
- Confirmation of the Sales Navigator filter names the site should use (the public how-to page lists
  Function, Seniority, Titles, Current Company, Account Lists, Company Headcount, Region; the help
  pages that list the rest are blocked to this run).

## Live check (after push)
- Filled in below after the push and the sitemap fetch.
