# Last run: 2026-11-25 (compare task; fired about 21:25 UTC, 23:25 Bucharest; finished after midnight Bucharest)

- Setup: no PAUSE file. Repository already cloned, in scope and on `main`; `add_repo` is not exposed as a tool in this
  session (as on previous runs), `git pull origin main` reported up to date at 7f6fd0e. Supabase: the lowercase
  "supabase" connector failed with a proxy tunnel error at session start; the "Supabase" connector connected and was
  used. Web search worked; pages were opened through the web-fetch agent (no direct WebFetch tool). Both drafts in
  blog/drafts/ still carry a `blocked:` line, so the queue's next compare keyword was taken. 0 articles published
  on the 26th (Bucharest) at gate time; 1 on the 25th. Well under the weekly cap of 45.
- Keyword (published, first attempt): intentsly vs lemlist (compare, intentsly-vs cluster, comparison type,
  commercial, priority 2, difficulty medium).
  "Intentsly vs lemlist: Who Finds the Lead, Who Replies?"
  https://intentsly.com/compare/intentsly-vs-lemlist
- Database: one insert, the generated blog/out/intentsly-vs-lemlist.sql (23,817 bytes, md5
  cf6117500fcd3f27d5847e26debeba63), run through the Supabase connector. Returned slug intentsly-vs-lemlist,
  status = published, published_at 2026-11-25 22:03:25 UTC. Note: when pasting the statement into the connector one
  line of the `on conflict ... do update` clause (`article_type = excluded.article_type`) was dropped in transit.
  The update clause never ran because the slug was new (plain insert), so the stored row is identical to what the
  unchanged file produces; verified afterwards with a read: article_type = comparison, word_count 2498,
  content_md md5 1b1cd91a6e30d2f63eb09308d62a5a76, which matches the draft body exactly. No other writes.
- Gate: first blog_gate.py run failed on two points: meta_description 162 chars (max 160) and the opening paragraph
  104 words (max 90). Two edits; blog_cloud.py sql then failed once more on the opening at 91 words, one more word
  cut, and the third run printed "ready": true (2,498 words including FAQ, 8 H2, 6 FAQ, 9 internal links, 7
  external links, no warnings). Within page-write.md's 1,300 to 2,500 range for /compare.
- Angle: no page compares the two; page one is Instantly-vs-lemlist reviews by competing vendors (Reply.io,
  Instantly, Woodpecker, Saleshandy, Overloop, ColdIQ, Sparkle) plus G2, Capterra and CB Insights. This page
  compares job by job from lemlist's own pages, separates lemlist's account-level intent agents (job changes,
  hiring, website visits, added to a campaign) from Intentsly's person-level LinkedIn engagement signals, states what
  happens on a reply in each tool, prints both tools' published LinkedIn limits, and gives a switch list from
  lemlist's own campaign-results export and API export.
- lemlist pages opened on 25 November 2026 and cited: lemlist.com/pricing (Email $69/mo or $55 yearly; Multichannel
  $109/user/mo or $87 yearly; Enterprise custom; enrichment add-on $20/mo for 2k credits; buying intent signals
  add-on $29/mo for 100 signals; 14-day trial with 200 credits; feature list incl. AI reply intent detection,
  AI-generated replies, unified inbox, LinkedIn voice messages and InMail; HubSpot, Salesforce, Pipedrive, API, MCP,
  CLI); lemlist.com/versus/lemlist-vs-clay (Updated July 2026: 650M+ contacts, no card for trial, Intent Signal
  Agents, lemAgent); lemlist.com/blog/lemlist-vs-smartlead (serves the "Smartlead limitations" post, 4 Nov 2026:
  five channels, sequence stops on Interested by hand or AI, lemwarm per seat, intent signals = job changes, hiring,
  website visits); academy.lemlist.com LinkedIn limits lesson (updated 18 Oct 2024: defaults 20 invites, 30
  messages, 30 profile visits a day, ~100 actions recommended); lemlist.com/blog/linkedin-connection-limit (21 Oct
  2026: ~100 invites per rolling week, 15 to 20 a day, "internal data from 586,310 campaigns across 52,000 teams");
  help.lemlist.com export-campaign-results (one campaign at a time as CSV); developer.lemlist.com
  export-campaign-leads (CSV or JSON per campaign, marked legacy).
- Could not open (not cited): help.lemlist.com "Set account limits", "LinkedIn connection requests: limits" and
  "Export a list of leads" (http/https redirect loop through the fetch tool); academy "set LinkedIn limits" and
  "export leads to CSV" lessons (302 to thegtmclub.com). The first attempt at lemlist.com/pricing and the homepage
  hit an unanswered permission prompt; a second attempt on the pricing page loaded. The homepage was not opened.
- Intentsly facts used: 14 qualified demos in 14 days, zero manual outreach, 4x reply rate (case study, labelled as
  our own launch); 2 LinkedIn accounts per workspace; 30 messages and 30 connection requests a day, 15 recommended;
  languages English, Romanian, German, Dutch; HubSpot, Cal.com, Google Calendar integrations; export, no API; 7-day
  trial; /try-ai. No price stated. No Reddit/X claims. No unreleased features.
- Keywords: 4 compare keywords were queued after this publish (fewer than 5), so per RUN.md step 6 eight were
  appended, all section compare, type comparison, intentsly-vs cluster, commercial, medium, priority 2: intentsly
  vs linked helper, zopto, skylead, meet alfred, octopus crm, we-connect, salesforge, reply.io. Vendor blogs rank
  for the category terms (lemlist, Mailshake, Dripify, PhantomBuster, Salesforge, 11x, Snov.io round-ups), hence
  medium. 12 compare keywords now queued; next is intentsly vs la growth machine.
- For the founder: (1) the lemlist help-center articles on account limits and lead export could not be opened by
  the fetch tool; if you can open them, the "How to switch" section could cite the plain lead-list export rather
  than the campaign-results export. (2) lemlist's "AI-generated replies" feature is described only by name on its
  pricing page; the page says lemlist does not describe the AI holding a conversation on its own. If you know
  otherwise from a trial, say so and the page will be corrected. (3) A real customer story of someone who moved from
  lemlist (or runs both) would make the "Can you use both" section first-hand instead of reasoned.
