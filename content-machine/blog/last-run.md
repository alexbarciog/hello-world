# Last run: 2026-10-24 (Trigify campaign task, blog section; started 10:11 UTC, 13:11 Bucharest)

- Keyword: linkedin profile monitoring tool (cluster trigify, type listicle, priority 1, difficulty medium).
  `blog_next.py` returned "scrape linkedin post likers and commenters" (cluster linkedin-signals), so per the
  task rules the first queued trigify keyword was taken instead; it was the only one left. No PAUSE file,
  no draft waiting. Repository was already cloned and in scope; `git pull origin main` brought it to cfb52c3.
  Date logic: 24 October, so the article is in past tense (Trigify closed on 22 October 2026).
- Published: "LinkedIn Profile Monitoring Tools After Trigify: 9 Compared"
  https://intentsly.com/blog/linkedin-profile-monitoring-tools
  `blog_gate.py` failed once (opening paragraph 91 words, trimmed to 88) and passed on the second run;
  `blog_cloud.py sql` printed ready on its first run, and again after one truth fix (two unverified CRM cells
  in the rebuild table replaced with "not stated"). 3,732 words by the gate's count (tables and the comment
  template included), 8 H2, 6 FAQ, 10 internal links, 15 external. The generated SQL ran unchanged on
  Supabase project uwwajlezgeurnvvrvdvb and returned status = published at 10:29:38 UTC; a read-only select
  confirmed the stored content_md matched the local body. After marking, a truth-pass re-read caught one
  wrong sentence (it said Trigify's Profile Monitoring covered Reddit and Hacker News; today's help docs list
  X, YouTube, Substack and podcasts for Profile Monitoring, and Reddit only in an enrichment FAQ), so the
  published file was corrected, `blog_cloud.py sql` was re-run on blog/published/ (ready on first run) and
  the regenerated upsert for the same slug was executed once more; the row kept its published_at and a
  read-only select confirmed the stored body matches the corrected file (md5 37e94100d6a5a9bd6f7a826e4b27263c,
  24,401 characters). Same single row, two executions. Fourth page of 24 October (daily count 4 of 7).
- Angle: the ranking pages are keyword-listening vendors (Brand24, Mentionkit) that do not take a person's
  profile as input, plus one vendor list (Extrovert) that mixes listening, analytics and job-change tools.
  This page splits profile monitoring into three jobs (new posts from named people, who engaged with those
  posts, job and profile changes), compares nine tools by job, whether they log in as you, refresh and the
  price each site showed today, says where each one including Intentsly is the wrong choice, and gives a
  rebuild table mapping Trigify's objects (Profile Monitoring search on a person or page, keyword search,
  check frequency, HubSpot node) onto each replacement, plus a comment template for when a watched profile
  posts. Brief in blog/briefs/linkedin-profile-monitoring-tools.md.
- Trigify facts: trigify.io homepage (announcement of 23 Sept, access ended 11:59pm BST 22 Oct 2026,
  no migration, export via existing options or hugo@trigify.io, invoices/credits/refunds confirmed per
  customer, no prices shown) and help.trigify.io, which now serves from trigifyio.featurebase.app (Profile
  Monitoring article, Create Profile Monitoring Search node, bulk-upload FAQ, company-pages FAQ). The help
  centre has been rewritten in generic terms ("business network profiles") and lists X, YouTube, Substack and
  podcast sources; no pricing page was found on trigify.io, so no Trigify price is stated. The help docs
  no longer mention Hacker News, so the campaign brief's source list is partly out of date; the article
  names only sources seen today.
- Competitor facts from their own sites today: jungler.ai and /pricing; outx.ai/chrome-extension;
  business.linkedin.com/sell/sales-navigator (LinkedIn Help pages are robots-blocked, so no Sales Navigator
  prices and no alert list beyond that page); usergems.com product and pricing pages; teamfluence.com
  pricing and influencer-monitoring help page (the pulse-linkedin-monitoring help page returned an error);
  goextrovert.com (Extrovert's own blog for its price); apify.com People Watcher (marked Deprecated);
  pagecrawl.io tool page. Intentsly facts only from proof.md rows marked exactly `verified` (14 demos,
  4x reply rate, 7-day trial, 2 accounts, 30/30 caps with 15 recommended) and product.md. No price, no 21%
  or ~1,000-leads figures, no Reddit/X claim, no email claim; job-change and profile-edit alerts stated as
  not available.
- Hub "Related" list: blog/published/trigify-alternatives.md has no Related section, so the step in the
  campaign brief was skipped (as on earlier campaign runs).
- Live check: see the note appended below after the push.
- Queue: trigify cluster now has 0 queued keywords (14 published, 3 skipped, 1 published this run). The
  campaign is complete unless new trigify keywords are added. 58 keywords still queued in other clusters
  (32 blog, 7 solutions, 7 compare, 6 guides, 6 learn), so none added. Blocked keywords: none.
- Connector note: as on previous runs, the session listed a lowercase `supabase` server as failed
  (ERR_PROXY_TUNNEL) while the capitalised `Supabase` connector worked. `add_repo` was not available as a
  tool, but the repository was already in scope and pushable. WebFetch needed URLs to come from a search
  result first (trigify.io and help.trigify.io direct fetches asked for a permission nobody was there to
  grant); searching for the pages first worked.
- For Alex: (1) confirm whether Intentsly's signal collection runs on its own data or needs the customer's
  LinkedIn session, so the "logs in as you" column can state it instead of only naming the two outreach
  accounts; (2) confirm how quickly new engagement signals appear after the engagement (the article says
  "as signals are detected"); (3) a real customer story of moving a Trigify profile list into Intentsly
  would replace the generic rebuild advice in this and future campaign articles; (4) if the Trigify
  campaign should continue, add new trigify keywords to blog/keywords.json, otherwise this task can be
  disabled.
