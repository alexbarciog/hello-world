# Last run: 2026-10-20 (Trigify campaign task, blog section)

- Keyword: trigify alternative for smartlead and heyreach (cluster trigify, how-to, commercial, priority 0,
  low; returned by `blog_next.py` directly, no draft was waiting). Date logic: 20 October, so present tense
  and deadline-first.
- Title: Trigify Alternative for Smartlead and HeyReach: Keep the Campaigns
- Live URL: https://intentsly.com/blog/trigify-alternative-for-smartlead-and-heyreach
- Status: published (Supabase upsert returned `status = published`, published_at 2026-10-20 15:30 UTC).
  The SQL file was run once, unchanged. Live check: see the bottom of this file, filled in after the push.
- Gate: first run failed on two items (opening paragraph 94 words; the 21% reply-rate figure flagged as
  unsourced because its proof.md row reads `verified: say ...`, which `gate.verified_text()` does not count
  as `verified`). Fixed by trimming the opening and dropping the 21% and 2-to-4-meetings figures; second
  run passed. 2,658 words (how-to min 1,200, max 4,000), 10 H2s, 5 FAQ entries, 9 internal links
  (/blog/trigify-alternatives in the first 300 words with "Trigify alternatives" anchor,
  /blog/rebuild-trigify-workflows-in-clay, /blog/migrate-from-trigify-to-intentsly,
  /blog/trigify-alternative-for-social-listening, /blog/trigify-replacement-linkedin-engagement-tracking,
  /features/linkedin-signals, /features/ai-sdr, /signal-playbook, /try-ai), 14 external links, all opened
  this run. blog_cloud.py: `"ready": true`, no warnings.
- Caps: 3 articles were already published today before this one; config/blog.json has
  max_posts_per_day 7 and max_posts_per_week 45, so the gate did not report a cap. (The task prompt
  describes the caps as 3/21; the config file is what the gate enforces.)
- Hub "Related" list: blog/published/trigify-alternatives.md has no "Related" section, so the hub was not
  edited, per the campaign brief.
- Queue: 9 trigify keywords remain queued (84 queued overall). Next by the run's rule: "trigify api
  alternative" (priority 0, low), then "what happens to my trigify data", "free trigify alternatives".
  Note for 23 October onward: the brief's past-tense logic applies to those.

## What the research turned up
- Page one is vendor lists: HeyReach's own "Best Trigify alternatives" (30 Sep 2026, nine tools with
  prices and a native/non-native HeyReach column, nothing on Smartlead), Syft Data, Overloop (14 Sep),
  Signado (3 Oct), Embers (1 Oct), Seleqt, Leadfwd, plus our own engagement-tracking article. None shows
  what the Trigify Smartlead node or HeyReach export actually sent, what each receiving tool requires, or
  gives a message template. Brief: blog/briefs/trigify-alternative-for-smartlead-and-heyreach.md.
- Trigify facts re-opened on trigify.io today: 23 Sep announcement, 11:59pm BST 22 Oct cutoff,
  integrations/API/monitoring stop, exports via product or hugo@trigify.io, no pricing shown, nothing
  migrated to HubSpot. help.trigify.io Smartlead article: one action "Send to Smartlead Campaign", fields
  email/first/last/custom, custom fields must pre-exist, campaign needs active sending accounts with
  warm-up. HeyReach's help article on the Trigify integration: API key in HeyReach Integration tab,
  Trigify "Save to" > "Export to HeyReach", empty list, dedicated sender, "If connection" branch.
- Receiving-side facts: Smartlead API add-to-campaign (email only required, 400 leads/request, 200 custom
  fields, duplicate/unsubscribe settings); Clay's Smartlead action; HeyReach custom variables (LinkedIn
  URL + first + last mandatory, silent skip on API/Clay, naming rules, AddLeadsToCampaignV2); HeyReach
  Clay article (empty list, Finished until first lead). Smartlead integrations page lists no signal tool.
- Angle taken: keep the campaigns, replace the node. Three-option table (Clay bridge, signal tool with
  native push, Intentsly replacing the HeyReach half), two field maps, two labelled example templates,
  a ten-step checklist, and Intentsly's limits stated plainly (LinkedIn only, no email sending, HubSpot
  only, 2 accounts, 30/30/15).
- Intentsly facts used: feature list from brain/wiki/product.md, 2-account / 30-and-30 / 15 limits,
  verified-email enrichment, export (no format named), AI SDR LinkedIn-only with calendar link, the
  14-demos story with "4x" (verified rows). No price stated.

## What the founder should supply
- Decide whether the proof.md rows marked `verified: say ...` (21% reply rate, ~1,000 leads/agent, 2 to 4
  meetings/week) should be split into a plain `verified` status cell plus a phrasing note elsewhere, so
  the gate accepts them. Today they are unusable in any paragraph without an outside link.
- Confirm the export format(s) Intentsly offers (CSV? API?) so the Smartlead import step can be exact.
- A real customer story of someone who moved an engagement-triggered campaign from Trigify (or any signal
  tool) to Intentsly; the article currently leans on our own 14-demos launch only.
- For the next keyword ("trigify api alternative"): whether Intentsly has any public API or webhook; if
  not, that article has to say so and point elsewhere.

## Live check (after push)
- Filled in below once the deploy finished.
