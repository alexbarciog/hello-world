# Last run: 2026-10-21 (Blog task, blog section)

- Keyword: trigify api alternative (cluster trigify, how-to, commercial, priority 0, low; returned by
  `blog_next.py --section blog`, no draft was waiting). No PAUSE file. Date logic: 21 October, so present
  tense and the 22 October deadline first.
- Title: Trigify API Alternative: What Replaces Each Endpoint
- Live URL: https://intentsly.com/blog/trigify-api-alternative
- Status: published (Supabase upsert returned `status = published`, published_at 2026-10-21 06:12 UTC,
  09:12 Europe/Bucharest). The SQL file was run once, unchanged. Live check at the bottom.
- Gate: first run failed on four items (meta_description 169 chars; a `# ` comment line inside a code
  block read as an H1; "$199" in a paragraph without a link; title similarity above 0.75 with the hub
  "Trigify Alternatives: 7 Tools to Replace It by 22 October"). Fixed by shortening the description,
  indenting the comment, adding the Octolens link to that paragraph, and retitling from "Replace Each
  Endpoint by 22 October" to "What Replaces Each Endpoint". Second run passed. Final 2,994 words (how-to
  min 1,200), 10 H2s, 6 FAQ entries, 8 internal links (/blog/trigify-alternatives in the first 300 words
  with "Trigify alternatives" anchor, /blog/trigify-shutting-down, /blog/trigify-alternative-for-social-
  listening, /blog/rebuild-trigify-workflows-in-clay, /blog/migrate-from-trigify-to-intentsly,
  /features/linkedin-signals, /try-ai, /case-studies), 18 external links, all opened this run.
  blog_cloud.py: `"ready": true`, no warnings.
- Caps: this is the second article dated 21 October (Bucharest); the daily cap is 7. No cap reported.
- Queue: 43 blog keywords still queued, so no new keywords were added. Trigify cluster still queued:
  trigify vs gojiberry, what happens to my trigify data, free trigify alternatives, trigify pricing and
  what replacements cost, linkedin profile monitoring tool, trigify vs valley, trigify vs teamfluence,
  life after trigify. From 23 October the campaign brief switches to past tense.
- Hub "Related" list: `blog/published/trigify-alternatives.md` has no Related list, so the hub was not
  edited and no second SQL was run, as the campaign brief allows.
- Supabase connector: the session listed a lowercase `supabase` server as failed (ERR_PROXY_TUNNEL) and
  a separate `Supabase` server that connected; `execute_sql` on the latter worked. Same pattern as the
  previous run.

## What the research turned up
- Page one for "trigify api alternative" is vendor alternatives lists (Overloop 14 Sep, Octolens
  updated Oct, HeyReach 30 Sep, Signado 3 Oct, Satellyte 29 Jul, ReactIn 24 Sep, Buska, Teamfluence),
  one Apify actor page and a BuzzLead DIY-stack article (10 Jun). None describes what the Trigify API
  actually exposed or shows a replacement call. Brief: blog/briefs/trigify-api-alternative.md.
- Trigify facts only from trigify.io (the pricing URL now serves the announcement: API and integrations
  stop with access at 11:59pm BST on 22 October 2026; no prices shown) and help.trigify.io articles on
  the API (x-api-key, same credits, four endpoint areas, OpenAPI), CLI (npm, TRIGIFY_API_KEY, searches,
  results, workflows, custom signals) and MCP (seven search tools at api.trigify.io/mcp), plus the CLI
  launch post for the install commands. The Trigify root URL could not be fetched directly (provenance
  prompt); the /pricing URL came up in search and carries the same notice.
- Competitor facts from their own pages today: Apify actor pages (HarvestAPI reactions from $1.50/1k,
  Scraping Solutions engagers from $1.10/1k) and Apify pricing; PhantomBuster API docs and support
  (API on all paid plans, connected LinkedIn account needed for the scraper); Octolens Trigify page
  (API, webhooks, MCP on every plan, no engager export); Buska pricing (API on Growth 500 req/mo,
  Scale 2,500 req/mo); Clay pricing (webhooks and HTTP API on Growth $446, FAQ shows $495); Gojiberry
  MCP docs (tools, OAuth, active plan); Clearcue FAQ (Feb 2026, CSV and API export, MCP, Starter €99).
  Gojiberry and PhantomBuster prices were not restated because their pricing pages were not opened
  this run; the table says so.
- Angle taken: map the four Trigify API areas to a replacement each, with auth and plan, a sample curl,
  where each is the wrong choice, a copy-paste endpoint map, and an honest section saying Intentsly has
  no API and is only the right choice when the API was a means to get LinkedIn engagers into HubSpot.
- Intentsly facts used: product.md (LinkedIn-only, scoring, verified emails, HubSpot/Cal.com/Google
  Calendar, AI SDR LinkedIn-only, 2 accounts, 30/30/15, four languages, 7-day trial, /try-ai, export
  with no format named, no API listed) and the 14-demos story. No price. The 21% and 2 to 4 figures
  were not used (gate reads only rows whose status is exactly `verified`).

## What the founder should supply
- Whether Intentsly has, or plans, a public API or webhook out. The article states "lists no public
  API"; if that changes, this page, the migration guide and the Gojiberry comparison need updating.
- The export format(s) Intentsly offers (CSV? JSON?), so the article can stop saying "the product does
  not name a format".
- A short note on what the founder would tell a developer who asks for an API today (roadmap or not),
  so the "wrong choice" paragraph can be more specific.
- Same as earlier runs: decide whether proof.md rows marked `verified: say ...` should be split so the
  gate accepts the 21% reply rate and 2 to 4 meetings figures.
- For the next trigify keyword ("trigify vs gojiberry", comparison): gojiberry.ai/#pricing was reachable
  on 20 October; Trigify prices are gone from trigify.io, so the comparison must quote them only from
  help.trigify.io's plans article if it still opens, or attributed to ranking pages.

## Live check (after push)
- First push attempt with `git push origin main` was rejected (the clone is a detached HEAD, so the local
  `main` ref was stale); `git push origin HEAD:main` succeeded at 06:13 UTC (commit 0e0735a).
- CONFIRMED at 06:18 UTC: https://intentsly.com/blog/trigify-api-alternative renders the H1 "Trigify API
  Alternative: What Replaces Each Endpoint", author line "Alex Barciog, CEO & Founder, Intentsly",
  21 October 2026, 14-minute read, 10 H2s in the body and the six FAQ entries. The existing page
  /blog/trigify-replacement-linkedin-engagement-tracking already lists the new article under "Keep
  reading". The direct fetch of the new URL needed a search result to lead to it first (same provenance
  prompt as earlier runs); reaching it through a linked page worked.
