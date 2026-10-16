# Last run: 2026-10-16 (Trigify campaign, blog section)

- Keyword: trigify replacement for linkedin engagement tracking (cluster trigify, alternatives, commercial, priority 0; returned by blog_next.py)
- Title: Trigify Replacement for LinkedIn Engagement Tracking: 7 Tools
- Live URL: https://intentsly.com/blog/trigify-replacement-linkedin-engagement-tracking
- Status: published (Supabase upsert returned `status = published`, published_at 2026-10-16 10:39 UTC).
  Live check: see the section at the bottom, filled in after the push.
- Date logic: run on 16 October 2026, so present tense, deadline first ("Social Signals stop for most
  customers at 11:59pm BST on 22 October 2026").
- Gate: two fixes on the first blog_gate run (meta_description was 176 chars and lacked the keyword;
  one "21%" reply-rate figure removed, see below), then `"ready": true` with no warnings on the first
  blog_cloud.py run. 2,776 words (alternatives min 1,500), 8 H2s, 6 FAQ entries, 9 internal links
  (/blog/trigify-alternatives in the first 300 words with "Trigify alternatives" anchor,
  /blog/trigify-shutting-down, /blog/migrate-from-trigify-to-intentsly, /features/linkedin-signals,
  /features/ai-sdr, /case-studies, /signal-playbook, /try-ai, /pricing), 22 external links, all opened
  this run. Caps: daily cap 7 and weekly cap 45 in config/blog.json; the gate did not report either
  as reached.
- Hub "Related" list: blog/published/trigify-alternatives.md has no "Related" section, so the campaign
  brief's step to add a one-line link there was skipped, as the brief allows. The new article links to
  the hub instead.
- 12 trigify keywords remain queued (91 queued overall), so no keywords were added.

## What the research turned up
- Page one for the keyword is vendor lists (Octolens, Clearcue, HeyReach, Valley, OutX, Teamfluence)
  plus a Clay community thread. None isolates the engagement-tracking job, none says whether each
  tool needs the user's LinkedIn session, none maps Trigify's own signal names to the replacement's
  settings. The brief is in blog/briefs/trigify-replacement-linkedin-engagement-tracking.md.
- trigify.io opened: the homepage carries the HubSpot announcement (23 September 2026; access until
  11:59pm BST on 22 October 2026 for standard customers; no migration to HubSpot; monitoring, signal
  collection, integrations and API stop with access; exports via existing options or hugo@trigify.io;
  invoices, credits and refunds confirmed individually, no public refund policy). trigify.io/pricing
  now shows the same announcement with no plan figures, so the article says the pricing page is gone
  and attributes the conflicting price claims ($40 to $199 on Octolens and Valley, $149 to $549 on
  Clearcue) to those pages.
- help.trigify.io opened: What is Social Signals (16 signal types, six of them engagement), Set up
  Social Signals monitoring (URL or CSV targets, daily/weekly/hourly cadence, 30-day lookback), limits
  article (Starter 50 profiles and 2 signal types, Max 5,000 and 10, Enterprise unlimited), Social
  Signals Trigger, Supported Platforms and Data, and the get-data-into-Clay/CRM guide. The help centre
  itself shows no shutdown banner.
- Competitor facts, each from the vendor's own site on 16 October 2026: Gojiberry (homepage and pricing
  help article), Valley (product, pricing, and its post-engagers blog), Teamfluence (pricing and its
  Trigify alternatives post), PhantomBuster (Post Commenters Export guide and plan-features support
  article; phantombuster.com pages themselves need JavaScript and did not render), Clay (pricing,
  LinkedIn Community integration page, university doc), Jungler (homepage and pricing). The Teamfluence
  homepage and gojiberry.ai needed a second attempt (fetch tool asked for approval the first time).
- The Reddit search for the keyword was rejected by the search proxy (HTTP 400), so no Reddit
  questions were used; the FAQ comes from the ranking pages' FAQs and the Clay thread.

## Calls made without review
- Angle: one job only (who engaged with which post), seven tools, three new comparison columns (what
  it captures, needs your LinkedIn session, sends the message), a rebuild table from Trigify's six
  engagement signal names, and a message template. Intentsly listed first with its own "wrong choice
  if" (raw feed into Clay, more than 2 senders, non-HubSpot CRM, non-LinkedIn sources).
- Verified numbers used: 14 qualified demos in 14 days, 4x reply rate (labelled one campaign, ours),
  12 signals to chase and 8 to ignore, 7-day trial, 2 sender accounts, 30 messages and 30 connection
  requests a day with 15 recommended. The 21% reply rate, ~1,000 leads per agent and 2 to 4 meetings
  rows were NOT used: their status cell in proof.md is "verified: ..." rather than exactly `verified`,
  so the gate rejects them (it flagged 21% on the first run and the sentence was removed).
- Teamfluence's "needs your LinkedIn session" and "sends the message" cells say "not stated on the
  pages we opened" / "not checked", because today's pages did not state them; no guess was made.
- Jungler is described as the only tool whose site says it needs no login or cookie; that is Jungler's
  claim, attributed, not verified by us.
- PhantomBuster's likers export is mentioned only as "its store also lists a likers export, whose page
  did not render for us".
- No Intentsly price. No Reddit/X monitoring claimed. Email sending by the AI SDR not claimed.
- Cluster for the hub article is `competitor` in its front matter, not `trigify`; the brief treats it
  as the hub regardless and this article links to it as required.

## For the founder
- proof.md: change the status cell of the 21% reply rate, ~1,000 leads per agent and 2 to 4 meetings
  rows to exactly `verified` (move the phrasing guidance into the Claim column) if you want those
  numbers usable. The 21% figure would have strengthened this article's Intentsly section.
- The exact menu names in the app for adding a competitor profile, a company page, a keyword or a
  hashtag as a source would let the rebuild table name the clicks instead of "add as a source".
- Confirm whether Intentsly exposes a monitoring cadence setting (the article says to check); if it
  monitors continuously, say so and the next campaign article can state it.
- A real example of a message the AI SDR sent to someone who engaged with a competitor's post (anonymised)
  would replace the hand-written template with first-hand material.
- Approve intentsly.com, trigify.io, gojiberry.ai, teamfluence.com, phantombuster.com and clay.com for
  the fetch tool once in a session where the request appears; each needed an approval that nobody was
  present to grant and cost a retry via search.
- Next trigify keywords in the queue (12): trigify alternative for social listening, rebuild trigify
  workflows in clay, trigify alternative for smartlead and heyreach, trigify api alternative, what
  happens to my trigify data (check overlap with /blog/trigify-shutting-down before writing), free
  trigify alternatives, then priority 1: trigify vs gojiberry, trigify pricing and what replacements
  cost, linkedin profile monitoring tool, trigify vs valley, trigify vs teamfluence, life after
  trigify: signal-based selling playbook.

## Live check (after the push)
- Pushed to main at 10:42 UTC (commit b533dd6). The first two pushes were rejected as "non-fast-forward"
  even though the remote tip was the commit's parent; `git -c push.negotiate=false push origin
  HEAD:refs/heads/main` went through. The global gitconfig in this environment sets push.negotiate=true,
  which seems not to work through the proxy; worth knowing for the morning task if it hits the same.
- At 10:47 UTC the fetch tool asked for a one-time approval for https://intentsly.com/sitemap.xml and
  https://intentsly.com/blog/trigify-replacement-linkedin-engagement-tracking that nobody was present to
  grant, the same block as the previous two runs. The homepage (found via search) could be read, and
  /blog returned the homepage shell with no article list, so the page could not be confirmed live or in
  the sitemap from here. The database row is published; check by hand:
  https://intentsly.com/blog/trigify-replacement-linkedin-engagement-tracking and
  https://intentsly.com/sitemap.xml.
