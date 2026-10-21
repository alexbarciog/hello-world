# Last run: 2026-10-21 (Trigify campaign task, blog section)

- Keyword: free trigify alternatives (cluster trigify, listicle, commercial, priority 0, low). No PAUSE file.
  `blog_next.py` first returned "what happens to my trigify data"; it was marked `skipped` because the
  published `trigify-shutting-down` article already lists it as a secondary keyword and answers it in the
  H2 "What stops on 22 October, and what do you keep?" and the FAQ "What happens to my Trigify data after
  22 October?" (campaign brief: do not write two articles that answer the same question). The next queued
  trigify keyword, "free trigify alternatives", was written instead.
- Title: Free Trigify Alternatives: 7 Options Sorted by the Job They Cover
- Live URL: https://intentsly.com/blog/free-trigify-alternatives
- Date logic: run on 21 October 2026, so present tense ("Trigify closes ... 22 October 2026"), deadline
  first, export steps included. No "this week" or "tomorrow".
- Status: published (Supabase upsert returned `status = published`, published_at 2026-10-21 10:39 UTC).
  The SQL file was run once, unchanged, through the `Supabase` connector's execute_sql.
- Gate: run 1 failed on two items (opening paragraph 94 words; "$56, $69" without a source link in the
  paragraph). Fix 1 trimmed the opening and linked the PhantomBuster pricing page in that paragraph; run 2
  still reported 91 words (the gate's tokenizer counts "7-day" and "11:59pm" differently from a plain
  count). Fix 2 trimmed three more words; run 3 passed. One truth-pass edit after passing ("the job most
  Trigify customers used Social Signals for" was an unverifiable claim about customers; now "the one
  Trigify's Social Signals covered"); gate re-run, still `"ready": true`, no warnings. Final 3,254 words
  (listicle min 1,500), 13 H2s, 6 FAQ entries, two tables, 7 internal links (/blog/trigify-alternatives
  hub with "Trigify alternatives" anchor in the first 300 words, /blog/trigify-shutting-down,
  /blog/rebuild-trigify-workflows-in-clay, /blog/trigify-replacement-linkedin-engagement-tracking,
  /features/linkedin-signals, /try-ai, /signal-playbook), 9 external links, all opened this run.
- Hub "Related" list: `blog/published/trigify-alternatives.md` has no Related section, so the step in the
  campaign brief was skipped as instructed.
- Caps: config/blog.json currently reads max_posts_per_day 7 and max_posts_per_week 45 (the task prompt
  describes 3 and 21). The gate reported no cap. This is the fourth article dated 21 October (Bucharest):
  intentsly-vs-gojiberry 00:07, trigify-api-alternative 09:12, build-b2b-prospect-list 10:48, this one
  13:39. If the intended cap is 3 a day, config/blog.json should be changed by the founder; the run did
  not touch it.
- Queue: 6 trigify keywords still queued (trigify vs gojiberry, trigify pricing and what replacements
  cost, linkedin profile monitoring tool, trigify vs valley, trigify vs teamfluence, life after trigify:
  signal-based selling playbook). No new keywords added.
- Connectors: the session listed a lowercase `supabase` server as failed (ERR_PROXY_TUNNEL) and a separate
  `Supabase` server whose execute_sql worked; same pattern as the previous runs. No `add_repo` tool existed
  in the session; the repository was already in scope and `git pull origin main` was run on the existing
  clone. No computer was linked (cloud-only run).

## What the research turned up
- Page one for "free trigify alternatives" is vendor alternatives lists that rank their own product first
  (Overloop 14 Sep 2026, Octolens upd. Oct 2026, Embers upd. 1 Oct 2026, BuzzLead DIY stack, Gojiberry,
  Teamfluence, Satellyte, Cleed, MagicPost). None separates free plans from free trials, none states the
  limit of each free tier for the specific Trigify job, none offers a manual free method or a routine.
  Brief: blog/briefs/free-trigify-alternatives.md.
- Vendor pages opened on 2026-10-21 and used: trigify.io homepage (retirement notice: no pricing shown, so
  no Trigify price stated; help.trigify.io plans page could not be opened); help.trigify.io "What is
  Social Signals?", "Create Social Listening Search" node, "Social Listening & Monitoring" collection
  (sources: LinkedIn, X, Reddit, YouTube, podcasts, Hacker News); clay.com/pricing (free plan 500 actions,
  100 credits, 200 rows; webhooks, HTTP API, CRM integrations on Growth; job change signals on Launch);
  phantombuster.com pricing explainer dated July 2026 (free plan 30 min, 1 slot, 10 rows per export;
  Start $69/$56); f5bot.com (free, Reddit/HN/Lobsters; Silver $9.99, Gold $49.99); google.com/alerts
  (options only); octolens.com/pricing (no free plan; 7-day trial; Pro $159 annual, Scale $499);
  gojiberry.ai/#pricing (free trial wording; Pro $99).
- Could not open: LinkedIn help pages on post search and Boolean search (robots), Clay's plan FAQ entry
  and help.trigify.io plans page (fetch permission prompt withdrawn). The LinkedIn search steps are written
  as a procedure with no claim attributed to LinkedIn's help. Lynx Signal was dropped: its Product Hunt
  page mixes two products and the site did not surface a pricing page.
- Intentsly facts used: no free plan, 7-day free trial (verified), /try-ai with no account, signal types,
  scoring, verified email, AI SDR flow with Cal.com or Google Calendar, 2 accounts, 30/30/15, HubSpot only,
  export without a format, four languages, 14 demos in 14 days (labelled as one campaign). No price.
  The 21% and 2 to 4 figures were not used (the gate reads only rows whose status is exactly `verified`).

## What the founder should supply
- A decision on the daily cap: config/blog.json says 7 a day and 45 a week; the campaign task text says 3
  and 21. Today four articles were published across the three tasks.
- Whether the Trigify plans article (help.trigify.io/articles/5648707-plans-and-pricing) still shows
  prices; the "trigify pricing and what replacements cost" keyword needs that page or a decision to quote
  only ranking pages, attributed.
- A one-line statement of what /try-ai shows for a named competitor (names only? scored list?), so the
  closing "two-minute check" paragraph can be made exact on the next campaign article.
- Same as earlier runs: the export format(s) Intentsly offers, and whether proof.md rows marked
  `verified: say ...` should be split so the gate accepts the 21% and 2 to 4 figures.
- Date logic reminder: from 23 October 2026 the remaining trigify keywords switch to past tense; the
  published campaign articles written in present tense (including this one) are not rewritten by this task.

## Live check (after push)
- Filled in after the push and a ~4 minute wait; see the bottom of this file in the follow-up commit if
  the first check was too early.
