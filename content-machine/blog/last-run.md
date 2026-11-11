# Last run: 2026-11-11 (compare task; fired about 21:50 UTC, 23:50 Bucharest)

- Setup: no PAUSE file. Repository already cloned, in scope and on `main` (`add_repo` not available as a
  tool, as on previous runs); `git pull origin main` already up to date at e9baf31. Supabase: the
  lowercase "supabase" connector again reported a proxy tunnel error at session start; the "Supabase"
  connector connected and was used. Web search worked. The only draft in blog/drafts/
  (outbound-sales-process-for-startups.md, guides) carries a `blocked:` line, so it was not resumed.
- Pre-write check: a read of public.blog_posts for the slug returned no row, so nothing was overwritten.
- Keyword (published): intentsly vs expandi (section compare, cluster intentsly-vs, comparison,
  commercial, priority 2, difficulty medium).
  "Intentsly vs Expandi: Both Watch Posts, One Replies"
  https://intentsly.com/compare/intentsly-vs-expandi
- Gate: passed on the third run (first: meta description 162 chars and opening 96 words; second:
  opening 94 words; third: 89 words, pass). Two later wording edits (Smart Campaigns actions quoted
  as "engaging actions" rather than a guessed list; the seat row quoted rather than inferred) and a
  regeneration, still passing. 2,437 gate-counted words, 8 H2, 6 FAQ, 9 internal links, 10 external
  links, no warnings. Title similarity to the closest published compare title is 0.62 (limit 0.75).
- Database: the upsert returned status published, published_at 2026-11-11 21:59:46 UTC.
- Angle: Expandi shipped a Signals feature (post 20 July 2026, modified 9 November 2026): profile
  visitors, company page visitors, and engagers on up to 3 posts per campaign, synced roughly every
  24 hours, with an ICP filter. No ranking page compares that with a signals-first tool, so the page
  is built on two rows: how wide the signal net is, and who answers the reply (Expandi MCP: "It
  drafts, you approve"; Intentsly's AI SDR holds the conversation). Both tools' limits side by side,
  where Expandi wins (several seats, agency roles and white label, branching Smart Campaigns, imported
  lists, Salesforce/Pipedrive, Smartlead email, API/webhooks/MCP, own profile visitors), a pricing
  section from Expandi's page only, and a switch list from Expandi's export article.
- Sources opened today and linked: expandi.io/pricing ($99 monthly, $79 annual, 20% off, 7-day trial
  all features, Agency/Custom from 10 seats, image/GIF and video personalisation extra),
  expandi.io/linkedin-outreach, expandi.io/smart-campaigns/, expandi.io/blog/expandi-signals/,
  expandi.io/integrations/, expandi.io/expandi-mcp/, expandi.io/email-outreach/,
  help.expandi.io export article (5405850), help.expandi.io warm-up article (5405001),
  expandi.io/blog/mobile-connector-campaign/ (10 to 15 a day, 70 to 105 a week). Opened, not linked:
  expandi.io/blog/linkedin-limits (2022 post), joinvalley.co Expandi review (competitor). Blocked by
  robots.txt: help.expandi.io recommended-limits, daily-limits, linkedin-settings and FAQ articles,
  so Expandi's own recommended limit table could not be quoted; the warm-up example and the 2023 post
  were used instead and labelled as such. The gojiberry.ai Expandi review redirected to its blog index.
  Intentsly facts used: LinkedIn signals (competitor and industry-leader posts, keyword posts,
  competitor page followers and engagers, hashtags), ICP scoring, verified emails, export, HubSpot /
  Cal.com / Google Calendar integrations, AI SDR on LinkedIn only, 2 accounts, 30/30/15 limits, four
  languages, 7-day trial, /try-ai, 14 demos in 14 days, zero manual outreach, 4x reply rate. No price,
  no Reddit/X feature, nothing from the NOT LIVE epics; the 21% and 2 to 4 meetings rows unused.
  "No API" for Intentsly repeats the wording already published on the HeyReach page.
- Queue: 6 `compare` keywords still queued (above the 5 threshold), so blog-keywords was not run.
  Next up per blog_next is "intentsly vs dripify", then lemlist, la growth machine, artisan, aisdr,
  salesrobot.
- Caps: third page of 11 November by Bucharest time (solutions 15:53, learn 21:27, this one 23:59;
  cap 7); the weekly count stays under 45.
- For Alex: (1) confirm whether Intentsly has a public API; the HeyReach and now the Expandi page say
  "native integrations and export, no API", taken from product.md's silence rather than a stated fact;
  (2) Expandi's Signals feature now overlaps Intentsly's post-engagement source, so a first-hand line
  on how many posts or competitors a typical agent watches would sharpen the "wider net" argument
  with a real number; (3) the "outbound sales process for startups" guide draft is still blocked by
  the gate's handling of the word "process" (see its blocked: line), which needs a change in scripts/;
  (4) a price is still blocked by the corrections log; (5) the 21% reply-rate row is still unused
  pending a phrasing you are happy with.
- Push and live check: see the end of this file (appended after the push).
- Push: `git push origin HEAD:refs/heads/main` fast-forwarded the remote from e9baf31 to 583ed09 at
  22:00 UTC; local `main` realigned to HEAD afterwards.
- Live check: PAGE LIVE. WebFetch refused the direct page URL and the sitemap with the
  PROVENANCE_REQUIRED prompt seen on 5 to 11 November; the check went homepage -> /compare -> page.
  At 22:05 UTC (about 5 minutes after the push) the Compare index listed the new page first of 13
  cards ("Intentsly vs Expandi", November 11, 2026), and the page loads with that H1, "11 min read",
  "November 11, 2026", the 12-row at-a-glance table and six FAQ entries. SITEMAP NOT CHECKED:
  https://intentsly.com/sitemap.xml could not be fetched from this session (provenance block); the
  page is reachable from the index, which is what the sitemap is built from.
- Noticed on the index, not fixed (website code is out of scope for this task): the 12 "Intentsly vs"
  cards on /compare render their titles as "Intentsly vs Intentsly vs <Competitor>", which looks
  like the index template prefixing "Intentsly vs" to a title that already starts with it. The
  Trigify card ("Trigify vs Intentsly") renders normally. Worth a look in the /compare index template.
