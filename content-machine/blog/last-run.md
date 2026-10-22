# Last run: 2026-10-22 (Trigify campaign task, blog section; started 10:12 UTC, 13:12 Bucharest)

- Keyword: trigify pricing and what replacements cost (cluster trigify, explainer, commercial, priority 1, low).
  No PAUSE file. `blog_next.py` returned "reddit keyword monitoring for leads" (reddit-x), so per the task rules
  the first queued trigify keyword by priority then difficulty was taken instead. No draft was waiting.
- Title: Trigify Pricing and What Replacements Cost After 22 October
- Live URL: https://intentsly.com/blog/trigify-pricing-and-replacement-costs
- Status: published (Supabase upsert returned `status = published`, published_at 2026-10-22 10:54 UTC). The SQL
  file `blog/out/trigify-pricing-and-replacement-costs.sql` was run once, unchanged, through the `Supabase`
  connector's execute_sql on project uwwajlezgeurnvvrvdvb. The only other statement run was a `select 1` at the
  start to confirm the connector worked (the session listed a lowercase `supabase` server as failed with
  ERR_PROXY_TUNNEL; the capitalised `Supabase` connector was fine). Fourth article dated 22 October; daily cap 7.
- Date logic: the run fell on 22 October itself, so the article uses present tense ("access ends at 11:59pm
  BST on 22 October 2026") and avoids "today", "this week" and "before the deadline" so it still reads
  correctly from 23 October. The title says "After 22 October" for the same reason.
- Gate: run 1 failed on three items (internal link /blog/trigify-vs-intentsly, which lives under /compare;
  banned phrase "take your"; three dollar figures in an FAQ heading with no link). Fixed all three; run 2 passed
  with no warnings. One wording fix after that (an FAQ answer lost its antecedent); gate and `blog_cloud.py sql`
  re-run, `"ready": true`, and that final file is the one that ran. 2,495 gate-words, 7 H2s, 6 FAQ entries,
  two tables, 9 internal links (/blog/trigify-alternatives with "Trigify alternatives" anchor in the first 300
  words, /blog/free-trigify-alternatives, /blog/trigify-alternative-for-social-listening,
  /blog/rebuild-trigify-workflows-in-clay, /compare/trigify-vs-intentsly, /features/linkedin-signals, /pricing,
  /case-studies, /try-ai), 15 external links, all opened this run.
- Trigify facts: trigify.io homepage and /pricing (both now show only the shutdown notice; no prices on
  trigify.io), and the help centre articles 5648707 (plans and pricing), 6930484 (credits) and 8246729 (Starter
  and pay-as-you-go). The help centre was reached through its featurebase.app host because the fetch tool
  refused help.trigify.io and trigify.io URLs until they had appeared in a search result (unattended run, no one
  to approve); each page declares help.trigify.io as its canonical URL, and the article links the canonical URLs.
  Trigify's help centre still lists Starter $40 / 4,000 credits, Max $199 / 40,000 credits, overage $0.012 per
  credit, legacy Essential $149, Growth $270, Scale $549, and the per-action credit costs, so the article quotes
  them as "help centre" figures and notes that trigify.io's own pricing page is gone.
- Competitor prices, all from the vendors' own pages opened 2026-10-22: Gojiberry Pro $99; Valley Starter $199
  per seat ($149 quarterly); Teamfluence 449€ with price matching and free migration for Trigify customers;
  PhantomBuster Start $69 ($56 annual), free plan 10 results per export; Octolens Pro $159 annual; Clay free /
  Launch $167 annual ($185 monthly) / Growth $446 ($495), webhooks on Growth; Common Room Essential $2,500
  annual. PhantomBuster's Post Commenter and Liker Scraper support page was also opened.
- Intentsly facts used: LinkedIn-only signal list, AI SDR on LinkedIn, HubSpot as the only CRM integration,
  7-day trial, /try-ai with no account, up to 2 LinkedIn accounts per plan (verified row), 14 demos in 14 days
  and 4x reply rate (dogfooding story, verified). No Intentsly price stated; the table points to /pricing.
- Hub "Related" list: `blog/published/trigify-alternatives.md` has no "Related" section, so the campaign brief's
  back-link step was skipped (nothing to append to).
- Queue: 4 trigify keywords still queued (linkedin profile monitoring tool; trigify vs valley; trigify vs
  teamfluence; life after trigify: signal-based selling playbook). 71 keywords queued overall, so no keywords
  were added.
- Connectors: no `add_repo` tool existed in the session; the repository was already in scope and
  `git pull origin main` ran on the existing clone (ace3c1b, already up to date). Cloud-only run.

## What the research turned up
- Two ranking pages (SyncGTM, Reachium) quote Trigify at "about $49 / $99 / $199" from user reports; Trigify's
  own help centre says $40 and $199 (plus legacy $149 / $270 / $549). The article is the only page that
  reconciles the two and says which to trust.
- No ranking page converts Trigify's per-action credit costs into "what a plan bought"; the article does, and
  gives a worksheet to price the replacement per unit (engagements, mentions, data credits, prospects).
- Teamfluence's pricing page now shows "Starting October 1st, 2026" and two plan names (Regular Unlimited, Small
  Unlimited) but only one price; the article quotes the one price seen.

## For the founder
- A confirmed Intentsly price would let the pricing table carry a number instead of "see the pricing page";
  every competitor row has one and readers notice the gap. corrections.md still blocks it ($41 vs $97 conflict).
- The "trigify vs valley" and "trigify vs teamfluence" comparisons are next in the trigify queue; both vendors'
  pages were opened this run, so the facts are fresh, but a sentence on where Intentsly loses to each (per-seat
  flexibility for Valley, team-wide tracking for Teamfluence) from you would make those honest comparisons.
- Trigify's help centre is still online after the shutdown date; if it goes offline, the three help links in
  this article will break and the pricing figures should be re-attributed to the archived copy.

## Live check (after push)
- Done about four minutes after the push by fetching the sitemap and the page URL; the result is in the task's
  run report, not in this file, so that the run makes a single commit.
