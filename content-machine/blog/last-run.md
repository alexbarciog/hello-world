# Last run: 2026-10-20 (Trigify campaign task, blog section)

- Keyword: rebuild trigify workflows in clay (cluster trigify, how-to, commercial, priority 0;
  returned by `blog_next.py` directly, no draft was waiting). Date logic: before 22 October, so
  present tense, deadline first.
- Title: Rebuild Trigify Workflows in Clay Before 22 October: 6 Steps
- Live URL: https://intentsly.com/blog/rebuild-trigify-workflows-in-clay
- Status: published (Supabase upsert returned `status = published`, published_at 2026-10-20 10:33 UTC).
  The SQL file was run once, unchanged. Live check: see the bottom of this file, filled in after the push.
- Gate: blog_gate failed once (meta_description 166 chars; no H2 with the keyword; opening 104 words),
  fixed in one pass, then one more trim of the opening (91 to 90 words). Pass with no warnings.
  2,763 words as the gate counts them (how-to range 1,200 to 4,000), 11 H2s, 5 FAQ entries, 6 internal
  links (/blog/trigify-alternatives in the first 300 words with "Trigify alternatives" anchor,
  /blog/migrate-from-trigify-to-intentsly, /blog/trigify-replacement-linkedin-engagement-tracking,
  /features/linkedin-signals, /signal-playbook, /try-ai), 11 external links, all opened this run.
  blog_cloud.py: `"ready": true`.
- Caps: one page had been published today before this one (the guides task at 07:30 UTC), so two
  today after this one. The gate did not report a daily or weekly cap.
- Hub "Related" list: `blog/published/trigify-alternatives.md` has no "Related" section, so the
  campaign brief's step to add a link there was skipped. The hub already links Clay in its text.
- 10 trigify keywords remain queued (86 queued overall), so no keywords were added. Next trigify
  keyword by the run's rule: "trigify alternative for smartlead and heyreach" (priority 0, low).
  Note for the owner: "trigify export data before shutdown" and "trigify hubspot acquisition" are
  marked skipped from earlier runs.

## What the research turned up
- Page one for the keyword: Octolens (vendor list, says Clay's post-audience action and Growth-plan
  webhooks, no rebuild steps), BuzzLead (DIY stack, conflicting Clay prices, Clay Elite Partner),
  Satellyte (Trigify vs Clay comparison, pricing "verified July 2026", no steps), HeyReach's playbook
  (Trigify to Clay to HeyReach, still uses Trigify as the source), a Clay community thread from
  November 2025, two generic Clay workflow guides, and our own
  /blog/trigify-replacement-linkedin-engagement-tracking. Brief: blog/briefs/rebuild-trigify-workflows-in-clay.md.
- Angle taken: a node-by-node mapping table from Trigify workflow nodes (from Trigify's own help
  centre) to Clay features (from Clay's Claybook and plan FAQ), three documented trigger replacements
  with the limit each carries (Clay's getReactions/getComments return at most ten per post; PhantomBuster
  exports launch per post from your own account; a signal tool into a Clay webhook needs the Growth plan),
  a "when not to rebuild" section, a ten-line checklist and a field map.
- Trigify facts: trigify.io homepage (joining HubSpot announced 23 September 2026; access for most
  customers ends 11:59pm BST 22 October 2026; accounts not migrated; existing export options;
  hugo@trigify.io; integrations, API, monitoring and signal collection stop; no price shown) and the
  help centre (Clay HTTP Request node, If Condition before integrations, workflow editor triggers and
  actions, Listening vs Workflows, Social Signals wizard with 16 signal types, daily default cadence,
  30-day first look-back). All opened 2026-10-20. No Trigify price is stated anywhere in the article.
- Outside figures, each linked in the same paragraph: Clay Growth "starting at $495/mo" and webhooks,
  HTTP API and CRM auto-sync on Growth (Clay's plan FAQ); ten reactions and ten comments per post
  (Clay Claybook); HeyReach playbook's 159 messages, 86 replies, 49 qualified leads (their page);
  PhantomBuster's 15 to 25 a day outreach cap advice (their blog). Clay's pricing page itself could not
  be opened (WebFetch asked for approval), so the FAQ page figures are used instead.
- Intentsly facts used: the feature list from brain/wiki/product.md (competitor and leader post
  engagers, keyword posts, competitor page followers, hashtag engagement, ICP scoring, AI SDR sends
  LinkedIn messages, HubSpot native), the explicit limit that Intentsly does not post into a Clay
  webhook, the 14 demos / 14 days / 4x story labelled as one campaign, and the 12-versus-8 playbook
  split. No price, no Reddit/X claims, no customer names.

## For the founder
- Does Intentsly offer a webhook or API out, or a CSV export of signals? The article says it "does not
  post into a Clay webhook" because product.md lists only HubSpot, Cal.com, Google Calendar and
  LinkedIn. If an outbound webhook exists, this article and the Clay row in /blog/trigify-alternatives
  should say so; it would make Intentsly an option C source for Clay users.
- A real Trigify customer who moved their Clay pipeline (what they exported, which trigger they picked)
  would replace the hypothetical "typical workflow" description.
- Clay's pricing page (clay.com/pricing) and PhantomBuster's automation pages need JavaScript or a
  permission prompt to open from this task; the article cites Clay's plan FAQ and PhantomBuster's blog
  instead. Opening those two pages once in a chat where this task runs would let later runs quote them.
- The remaining trigify queue has "trigify api alternative" and "trigify alternative for smartlead and
  heyreach" next; both need a confirmed answer on Intentsly export formats and any API.

## Live check (after the push)
- Push at 10:34 UTC (commit a7a7128; the first push went to a stale local `main` because the clone was
  on a detached HEAD, so the commit was pushed as `HEAD:main` and the local branch moved onto it).
  Checked at 10:39 UTC.
- https://intentsly.com/blog/rebuild-trigify-workflows-in-clay is live: H1 "Rebuild Trigify Workflows
  in Clay Before 22 October: 6 Steps", title tag from meta_title, byline Alex Barciog with 13-minute
  read time, both named H2s present, both tables in the source, 5 FAQ entries.
- https://intentsly.com/blog lists it first, above the social listening article.
- https://intentsly.com/sitemap.xml could not be opened from this run: as in the previous runs, WebFetch
  asked for approval for that URL (no page or search result links to it) and nobody was present to
  answer. The prerendered /blog index includes the page and the sitemap is built from the same route
  list, so it is very likely listed, but that is inferred, not confirmed. Alex: a footer or robots.txt
  link to /sitemap.xml, or opening the sitemap once in a chat where this task runs, would let future
  runs confirm it.
