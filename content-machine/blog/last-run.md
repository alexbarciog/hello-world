# Last run: 2026-10-21 (Compare task, compare section)

- Keyword: intentsly vs gojiberry (cluster intentsly-vs, comparison, commercial, priority 1, medium;
  returned by `blog_next.py --section compare`, no draft was waiting). No PAUSE file.
- Title: Intentsly vs Gojiberry: Which Signal Tool Should You Pick?
- Live URL: https://intentsly.com/compare/intentsly-vs-gojiberry
- Status: published (Supabase upsert returned `status = published`, published_at 2026-10-20 21:06 UTC,
  which is 00:06 on 21 October in Europe/Bucharest). The SQL file was run once, unchanged. Live check
  at the bottom of this file, filled in after the push.
- Gate: first run failed on two items (meta_description 166 chars; opening paragraph 91 words). Fixed by
  shortening both; second run passed. Final 2,301 words (comparison range 1,300 to 2,500; min 1,300),
  8 H2s, 6 FAQ entries, 6 internal links (/blog/gojiberry-alternatives, /try-ai, /features/ai-sdr,
  /features/linkedin-signals, /pricing, /compare), 11 external links, all to gojiberry.ai or
  help.gojiberry.ai and all opened this run. blog_cloud.py: `"ready": true`, no warnings.
- Caps: 5 articles were published on 20 October (Bucharest); this one counts for 21 October. No cap reported.
- Queue: 9 compare keywords remain queued (next: intentsly vs valley, then common room, phantombuster,
  apollo, linkedin sales navigator, teamfluence, clay, 11x, heyreach). Above the threshold of 5, so no
  new keywords were added.
- Note on the Supabase connector: the session reported it as failed to connect at startup
  (ERR_PROXY_TUNNEL), but `execute_sql` worked when called. Recorded in case it recurs.

## What the research turned up
- The exact phrase "intentsly vs gojiberry" has no competing page; the results are goji berry fruit
  pages. Page one for "<tool> vs Gojiberry" is vendor comparison pages (BeReach 6 Oct 2026, ReactIn
  24 Sep 2026, Sbl.so 24 Aug 2026, plus Factors, Vendo, ConnectSafely, Reachy, Salesforge, Scrap.io by
  title). All rank their own tool first; none is a LinkedIn signal tool comparing like for like.
  Brief: blog/briefs/intentsly-vs-gojiberry.md.
- Gojiberry facts come only from its own site opened this run: gojiberry.ai/#pricing (Pro $99/month,
  Custom for teams of 3+, integrations HubSpot/Pipedrive/Attio/API/MCP, free trial "Live in 5
  minutes"), gojiberry.ai blog (two agents, two LinkedIn seats, 200 credits, 1,800 contacted
  prospects, no credit card), and help centre articles on pricing (add-ons $59/$29/$99/$25), agents,
  campaigns, replies ("Nothing is ever sent automatically"), inbox, LinkedIn safety (no numeric
  limits in text), API and HubSpot. The founder's earlier run could not open gojiberry.ai; this run
  reached it through a link on a gojiberry.ai blog page.
- Left out: gojiberry.ai/integrations describes call summaries and Google Meet, which contradicts the
  help centre and looks like an older product page. Gojiberry languages and trial length are not
  stated on its pages, and the page says so instead of guessing.
- Angle taken: like-for-like map of the same five jobs; the real difference is reply handling
  (Gojiberry's AI drafts and the user sends; Intentsly's AI SDR holds the conversation and sends the
  calendar link). Six listed cases where Gojiberry is the better choice (email, Pipedrive/Attio, more
  senders, approval control, lookalikes/visitors/voice, API). Decision rule and /try-ai as the test.
- Intentsly facts used: product.md (LinkedIn-only signals, scoring, verified emails, export, HubSpot/
  Cal.com/Google Calendar/LinkedIn, AI SDR LinkedIn-only, 2 senders, 30/30/15, four languages, 7-day
  trial, self-serve). Numbers only from proof.md verified rows and the 14-demos story. No price.
  The 21% reply rate and 2 to 4 meetings figures were not used (the gate reads only rows whose status
  is exactly `verified`).

## What the founder should supply
- Whether Intentsly offers a public API or CSV import; the page says "an API is not among its listed
  integrations" and that lists are not imported. If either exists, the "How to switch" section and the
  at-a-glance table should be updated.
- Whether Intentsly has a stated position on running other LinkedIn automation on the same account
  (the page only quotes Gojiberry's warning and Intentsly's caps).
- Any customer who moved from Gojiberry to Intentsly, with what changed, so the page can carry a real
  switching example instead of only the launch story.
- Same as earlier runs: decide whether proof.md rows marked `verified: say ...` should be split so the
  gate accepts the 21% reply rate and 2 to 4 meetings figures.
- For the next keyword ("intentsly vs valley"): nothing specific, joinvalley.co/pricing was reachable in
  the 14 October run.

## Live check (after push)
- Filled in below after the push.
