# Last run: 2026-10-29 (guides task; started about 08:10 UTC, 10:10 Bucharest)

- Keyword: how to warm up a linkedin account for outreach (section guides, cluster outbound, type guide,
  intent commercial, priority 2, difficulty low). `blog_next.py --section guides` returned it directly. No
  PAUSE file, no draft waiting. Repository already cloned and in scope; `git pull origin main` was up to
  date at 59620fb. `add_repo` was not available as a tool, as on previous runs; the repo was already
  attached. Supabase: one of the two configured connectors reported a proxy tunnel error at session start,
  the other connected. A read-only count before any work: 1 post published on 29 Oct UTC in the database
  (2 by the repo's files), 25 in the last 7 days; caps 7 and 45 not reached; no row for the slug.
- Published: "How to Warm Up a LinkedIn Account for Outreach in 4 Weeks"
  https://intentsly.com/guides/warm-up-linkedin-account-for-outreach
  The gate failed once (meta description 162 chars, opening paragraph 96 words); both trimmed, ready on
  the second run. 11 H2, 6 FAQ, 8 internal links, 5 external, 3,469 words by the gate's count.
- Database: the generated SQL ran unchanged on project uwwajlezgeurnvvrvdvb and returned status
  published, published_at 2026-10-29 08:31:35 UTC. A read-only select confirmed the stored content_md
  matches the draft body exactly (21,317 chars, md5 3e2733f7f80bd19ffc8830df7ea431ed), 6 FAQ entries,
  5 secondary keywords, word_count 3469, reading_minutes 16, section guides.
- Angle: the ranking pages (Sendio Mar 2026, WarmSocials Mar 2026, ReactIn May 2025, The Lead Lab,
  Closely Aug 2025, PhantomBuster calendar Jul 2026) are all 4-week ramps written by vendors, with
  daily numbers that contradict each other inside the same article, acceptance thresholds from 20% to
  70% with no source, no worked example, and nobody saying who to engage with during the warm-up. This
  guide spends the warm-up engaging with the target list and competitor-post commenters so the four
  weeks produce a signal log, uses a hold-or-advance rule based on counts (three in ten accepted, no
  warning) instead of a percentage, states Intentsly's own caps (30/30 a day, 15 recommended, 2 accounts)
  as the week-four end state, rests requests at weekends so 15 a day stays under the community-reported
  weekly ceiling, and adds a labelled hypothetical worked example. Brief in
  blog/briefs/warm-up-linkedin-account-for-outreach.md.
- Outside facts: LinkedIn's own help pages (answer/4800, billing/answer/a550555) could not be opened
  (robots disallowed), so the page quotes no LinkedIn figure. The weekly ceiling of roughly 100 and the
  first-month 10 to 15 a day / 40 to 60 a week band are attributed to Overloop (8 Jul 2026) and
  PhantomBuster (updated 8 Jul 2026), both labelled community-reported and linked in the same paragraph.
  Device/location warnings attributed to The Lead Lab and Closely with links. No percentages used.
- Intentsly facts only from proof.md verified rows (up to 2 accounts per plan; 30 messages and 30
  connection requests a day per account, 15 recommended) and product.md (AI SDR sends LinkedIn messages
  and connection requests only, holds the conversation, calendar link; /try-ai with no account). No
  price, no customer names, no Reddit/X claim. The dogfooding story was not used because it does not
  concern account warm-up; `first_hand` points to brain/wiki/proof.md.
- Links: /linkedin-profile-analyzer (step 1, conversion page), /guides/find-decision-makers-on-linkedin,
  /blog/track-competitor-linkedin-post-engagers, /guides/write-linkedin-outreach-message,
  /features/ai-sdr (contextual sentence at the sending step), /guides/set-up-signal-based-outbound,
  /guides (index), /try-ai (closing CTA).
- Queue: 12 `guides` keywords still queued; not below 5, so none added this run. Nothing blocked.
- For the founder: (1) Does Intentsly ramp a newly connected LinkedIn account automatically (a warm-up
  mode), or does the user set the daily number? If it ramps, say so in product.md and this guide can
  state it; the page currently says only that the AI SDR runs "inside those same limits". (2) A real
  anonymised example of an account you warmed (the schedule you used, when acceptances dipped, whether
  LinkedIn ever prompted a verification) would replace the labelled hypothetical. (3) The proof.md rows
  for 21% reply rate, ~1,000 leads/month per agent and 2 to 4 meetings a week still carry a
  "verified: ..." status with a phrasing note; the gate only accepts the exact word "verified", so those
  numbers stay unusable until the status cell reads "verified" and the note moves into the claim cell.
  (4) If you want LinkedIn's own help-centre wording on invitation limits quoted, paste the sentence and
  the date you read it; the pages cannot be fetched from this environment.
- Live check: attempted four minutes after the push (08:37 UTC). Fetching intentsly.com/sitemap.xml and the
  page URL from this environment needs a permission prompt nobody was there to answer, as on earlier runs,
  so live status and sitemap listing are unconfirmed. The push (182cc58) triggers the redeploy that renders
  the page; the database row is confirmed published.
