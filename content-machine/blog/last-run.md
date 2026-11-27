# Last run: 2026-11-27 (guides task; fired about 08:10 UTC, 10:10 Bucharest)

- Setup: no PAUSE file. Repository already cloned, in scope and on `main` at 0ad3f8a; `add_repo` is not exposed as a
  tool in this session (as on previous runs), `git pull origin main` reported already up to date. Supabase: the
  lowercase "supabase" connector failed with a proxy tunnel error at session start; the "Supabase" connector
  connected and was used. Web search worked; pages were opened through the web-fetch agent (no direct WebFetch
  tool). 4 articles were published on the 26th (Bucharest) and 0 on the 27th before this one; daily cap 7, weekly 45.
- Drafts in progress: all three drafts in `blog/drafts/` carry a `blocked:` line (two solutions pages and the
  guide "outbound sales process for startups"), all for the same `kw_in` gate bug, so none was resumed.
- Keyword (published): how to find prospects in linkedin groups (guides, linkedin-prospecting cluster, guide,
  commercial, priority 2, difficulty medium). First keyword tried; the gate passed on the third run.
  "How to Find Prospects in LinkedIn Groups Without a Scraper"
  https://intentsly.com/guides/find-prospects-in-linkedin-groups
  Title: "A 7-Step Method" was rejected by the title-similarity check (0.743 against the decision-makers guide),
  so the title names the angle instead.
- Database: one upsert, the generated blog/out/find-prospects-in-linkedin-groups.sql (25,108 bytes, md5
  4a251f55797645a7a3428ad1c917ea2c), run unchanged through the Supabase connector. Returned slug
  find-prospects-in-linkedin-groups, status = published, published_at 2026-11-27 08:34:55 UTC. Verified with a
  read: section guides, article_type guide, word_count 3176, reading_minutes 14, 6 FAQ entries, content_md md5
  120e42702fcb8eed32c920d74bca1633 (19,948 chars), which matches the body in the SQL file exactly. No other writes.
- Gate: run 1 failed on meta_description length (172) and the opening paragraph (104 words); run 2 on the opening
  paragraph (92); run 3 passed. blog_cloud.py sql printed "ready": true with no warnings (3,176 words including
  FAQ, 12 H2, 6 FAQ, 10 internal links, 9 external links).
- Angle: page one is PhantomBuster (two pages), Skylead, Scrupp, Kanbox, a 2014 Social Media Examiner piece and
  generic "LinkedIn prospecting" round-ups; every tutorial ends on its own export button. This guide gives a 30-day
  activity test for picking groups, the member-list and Sales Navigator Group Members filter clicks on free and paid
  accounts, the group feed as a second higher-intent list, the messaging rule stated with its 2026 caveats
  (recipient setting, Other tab), a scoring sheet capped at 20 to 40 names a week, a labelled hypothetical example
  (Harbor Payroll), three mistakes and the outbound step. Brief at blog/briefs/find-prospects-in-linkedin-groups.md.
- Sources opened on 27 November 2026 and cited: PhantomBuster group-members guide (modified 8 Jul 2026: Groups
  filter, 2,500 visible members per group); Skylead LinkedIn prospecting (updated 14 Sep 2026: most groups dead,
  Request to Join, See all, Navigator Groups filter); Scrupp (updated 27 Nov 2026: must be a member to see the
  list, Other inbox); Kanbox help (22 Jul 2026: member-only import); HubSpot messaging guide (updated 8 Sep 2026:
  Show all, recipient must allow messages from group members, 200-character note, few free personalized notes a
  month); Lilach Bullock groups guide (modified 21 Nov 2026: 100 groups cap, 20 pending requests); Taplio (Sep
  2026: 100 groups); Neal Schaffer (revised 19 Nov 2026: free messaging to fellow group members, Other tab);
  Simply B2B help (Group Members filter steps); LeadHunter on DEV (updated Feb 2026: filter matches groups you
  both belong to). Not cited: Boolean Strings 2021 `&network=["A"]` trick and the 2019 Linked Helper "15 messages a
  month" note (stale and contradictory); Social Media Examiner 2014 and Social Media Today 2016 (old UI); unsourced
  statistics on Scrupp, Taplio and the DEV page. LinkedIn's own help pages (a544795, 119257, a553202, a554575,
  a787436, 85772) were robots-blocked; the guide says so and sources the rules to the 2026 pages.
- Intentsly facts used: 14 qualified demos in 14 days, zero manual outreach, 4x reply rate (case study, labelled as
  our own launch); keyword posts and competitor-post engagement scored against the ideal customer profile
  (product.md); /try-ai shows matching buyers with no account. No price, no Reddit/X claims, no unreleased features,
  no claim that Intentsly monitors groups.
- Keywords: 4 guides keywords were left queued, below the 5 in RUN.md step 6, so 9 were added per
  skills/blog-keywords.md after searching each and grading who ranks: search linkedin posts by keyword (low, p1),
  prospect's email from linkedin, book a meeting from a linkedin conversation, leads from linkedin polls, a/b test
  linkedin outreach, re-engage cold leads on linkedin (medium, p2), lead list from sales navigator, leads on
  linkedin for free, target account list for outbound (high, p3). Skipped: "follow up on linkedin after no
  response" (too close to the queued follow-up sequence guide) and "sync linkedin leads to hubspot" (HubSpot's
  own ads-sync knowledge base owns the page). 13 guides keywords are now queued.
- Live check: not verified from this session, as on previous runs. Pushed 0ad3f8a to 4c8aa94 on main at about 08:40
  UTC (`git push origin HEAD:main`, first try), waited 4 minutes, then tried the fetch tool on both the sitemap and
  the page (PROVENANCE_REQUIRED: the permission prompt for intentsly.com is never answered in an unattended run) and
  a web search for the URL (not indexed yet, which is expected minutes after a deploy). The database row is
  status = published and the push landed, so the page should be live once the deploy finishes. Please open
  https://intentsly.com/guides/find-prospects-in-linkedin-groups once to confirm it renders and appears in
  https://intentsly.com/sitemap.xml.
- For the founder: (1) the scripts/blog_gate.py `kw_in` bug (`w.rstrip("s")` turns "business" into "busine" and
  "process" into "proce") still blocks the three drafts in blog/drafts/; the fix is one line and all three drafts
  are complete. (2) If you have ever worked a LinkedIn group yourself (which group, how many names, how many
  replies), one sentence would replace the labelled Harbor Payroll example in this guide. (3) The guide states
  LinkedIn's group rules (100-group cap, member-only lists, messaging fellow members) from third-party pages because
  LinkedIn Help blocks fetching; a 30-second check of those three facts in your own account would let the next run
  cite them as confirmed.
