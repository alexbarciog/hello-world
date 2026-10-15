# Trigify campaign brief

Applies to every keyword in cluster `trigify`. Read this before stage 1 of `skills/blog-write.md`
for those keywords. The campaign exists because Trigify's customers lose access on 22 October 2026
and are searching for what to do; Intentsly is the honest answer for the LinkedIn engagement and
keyword-listening jobs they used Trigify for.

## Facts about Trigify (from trigify.io, read 2026-10-15; re-open the page each run)

- Announced 23 September 2026: the Trigify team is joining HubSpot. The standalone platform is
  retired and does not continue inside HubSpot.
- Most customers keep access until 11:59pm BST on 22 October 2026. Customers with other
  contractual notice periods get their own date from Trigify directly.
- Accounts are not migrated to HubSpot. Customer data is retained or deleted according to
  Trigify's contractual, privacy and legal obligations; HubSpot does not use it.
- Export must be done by the customer, with the export options already in the product. Export
  help: hugo@trigify.io or a reply to the customer notice.
- For standard customers, integrations, API access, monitoring and signal collection all stop
  when account access ends.
- Subscriptions do not renew past the end date. Final invoices, credits or refunds are confirmed
  to each customer directly; the public page states no refund policy, so never claim one.
- Trigify's jobs, per its help docs (help.trigify.io): Social Signals on tracked profiles and
  companies; Listening searches with AND/NOT keywords across LinkedIn, X, Reddit, YouTube,
  podcasts and Hacker News; workflow nodes to Clay (HTTP request), HubSpot, Attio, Salesforce,
  Airtable, with an If Condition filter. Also Profile Monitoring and Profile Engagement. Only
  state a Trigify feature you can see on trigify.io or help.trigify.io during the run.
- Trigify pricing: do not state a number unless trigify.io still shows one when you open it.
  If the pricing page is gone, say so and quote only what the ranking pages claim, attributed.

## Date logic (check the current date at the start of every run)

- Before 22 October 2026: present tense ("Trigify closes on 22 October"), lead with the deadline
  and what to export today.
- From 23 October 2026: past tense ("Trigify closed on 22 October 2026"), lead with what to do
  now that access has ended, and drop "before the deadline" wording. Keep the export steps only
  as a note for customers on longer notice periods.
- Never write "this week" or "tomorrow". Use the date.

## Angle rules

- Each article answers one job the reader is replacing, not the whole product. Decide which job
  in the first paragraph.
- Where Intentsly is the right replacement, say exactly which Trigify job it covers (post
  engagement on competitor and leader content, keyword posts, competitor page followers, hashtag
  engagement, Reddit and X monitoring, outreach by the AI SDR) and which it does not (anything
  not listed in `brain/wiki/product.md`: do not claim YouTube, podcast or Hacker News sources,
  CRM-native nodes, or an API unless the founder has added them to product.md).
- Name at least two other options for each job and state where each is the better choice.
- Copy-paste assets win: an export checklist, a field-mapping table, a message template for
  re-engaging people who engaged with competitor posts, a search-query rewrite table.

## Internal linking (hub and spoke)

- Hub: `/blog/trigify-alternatives`. Every campaign article links to it in the first 300 words
  with anchor text containing "Trigify alternatives".
- Each new campaign article also links to at least one other published campaign article (see
  `blog/published/` for slugs with `cluster: trigify`) and to `/features/linkedin-signals`.
- After publishing, add a one-line link to the new article in the hub article's "Related" list
  if the hub has one. Do this by editing `blog/published/trigify-alternatives.md` and re-running
  `python3 scripts/blog_cloud.py sql blog/published/trigify-alternatives.md` ONLY IF the script
  supports updating a published article; if it does not, skip this step and note it in the
  report. Never edit the script to make it work.

## Call to action

Commercial articles: `/features/linkedin-signals` or `/try-ai`. Informational articles: the free
Buying Signal Playbook at `/signal-playbook`.

## What not to do

- No price for Intentsly. No invented migration stories. No "we helped X customers move".
- Do not disparage Trigify or HubSpot. The team built something people liked; say so.
- Do not write two articles that answer the same question. If a queued keyword is already
  covered by a published campaign article, mark it `skipped` with the reason.
