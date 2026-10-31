# Last run: 2026-10-31 (blog task; fired about 06:50 UTC, 08:50 Bucharest)

- Keyword: linkedin keyword monitoring for leads (section blog, cluster linkedin-signals, type how-to, intent
  commercial, priority 2, difficulty low). `blog_next.py --section blog` returned it directly. No PAUSE file, no
  draft waiting. Repository already cloned and in scope; `git pull origin main` was up to date at 300beed. `add_repo`
  was not available as a tool, as on previous runs. Supabase: the lowercase "supabase" connector reported a proxy
  tunnel error at session start; the "Supabase" connector connected and was used. Read-only count before any work:
  0 posts published on 31 Oct UTC, 22 in the last 7 days; caps 7 and 45 not reached; no row for the slug.
- Published: "LinkedIn Keyword Monitoring for Leads: 3 Routes and a Rule"
  https://intentsly.com/blog/linkedin-keyword-monitoring-for-leads
  Gate run 1 failed on three format points (meta description 169 chars, no H2 with the keyword, opening 113
  words); fixed in two edits, run 3 passed with no fails and no warnings. Four truth-pass edits after the pass
  (removed an unverified "minus sign excludes an author" tip, removed GummySearch and Trigify-date claims whose
  sources were not opened this run, set Intentsly's refresh cell to "not stated", reworded the account-restriction
  FAQ around our own verified caps), then `blog_cloud.py sql` printed ready: true. 9 H2, 6 FAQ, 10 internal links,
  12 external, 2,917 words by the gate's count (how-to min 1,200, max 4,000). Decision taken without review: kept
  the length; the tool table, the five-step routine and the volume rule are the substance.
- Database: the insert ran on project uwwajlezgeurnvvrvdvb and returned status published, published_at
  2026-10-31 07:07:06 UTC. A read-only select afterwards confirmed section blog, article_type how-to, word_count
  2917, reading_minutes 13, 6 FAQ entries, 3 secondary keywords, content length 18,581 characters and an md5 of the
  stored content_md identical to the draft body (f8c564ebee56b83c8425c8f8fa9d0f1f). The SQL file was read back
  line-for-line before being passed and the ON CONFLICT clause was complete this time.
- Sources opened 31 Oct 2026 and used: buska.io/platforms/linkedin (li_at cookie, refresh daily/3h/hourly,
  $49/$99/$249, notifications fire only on tags); parsestream.com/linkedin-keyword-monitoring ($24/$67/$169,
  LinkedIn keywords 0/10/25, 3-day trial); octolens.com/linkedin-monitoring (posts and comments, no login, Pro
  $159 annual 10 keywords hourly, Scale $499 real time); mentionkit.com article and homepage ($49 base per its
  article, 14-day trial, Slack and webhooks); brand24.com LinkedIn monitoring article (API excludes private groups,
  restricted posts, DMs); linkedapi.io social-listening guide and post-search docs (official APIs centre on own
  Page; search widens narrow queries); favikon.com post-search article (literal match, no fit filters, Google x-ray
  coverage incomplete); business.linkedin.com Buyer Intent page (signal list, nothing about keyword posts),
  compare-plans (Core US$119.99, Advanced US$159.99 a month) and how-to-use (saved searches notify of new results);
  findymail.com (19 May 2026) and help.skylead.io for the Posted content keywords filter and the posted-in-30-days
  Spotlight (third-party descriptions, flagged as such in the article). Ranking pages read for SERP context only:
  databar.ai, leadspicker.com, ddevi.com, letterdrop.com. triggify.io's ranking page 302-redirected to an unrelated
  domain; the redirect target was not opened. LinkedIn Help pages (a526104, a523136, a102024, a112625, a528144)
  are robots-blocked for the fetch tool, so nothing is attributed to them; the free-route click path is written
  as a procedure with no quoted LinkedIn statistics.
- Angle: the ranking pages are vendor how-tos with no prices and vendor listicles that rank themselves first.
  This page states with sources what LinkedIn notifications, Buyer Intent and post search will not do, gives the
  bookmark routine and a negative-keyword list, puts five tools and Intentsly in one table with price, refresh and
  login requirement, and ends on a volume rule with each route's wrong-choice case.
- Intentsly facts used: product.md feature list and limits (LinkedIn only, keyword posts, 2 accounts, 30/30 a
  day, 15 recommended, 7-day trial, no sales call, Cal.com/Google Calendar link via the AI SDR); 14 qualified demos
  in 14 days, zero manual outreach, leads from real-time intent signals, founders complaining about cold outreach
  burnout (dogfooding-14-demos.md). No price stated. Reddit/X not mentioned. CTA is /try-ai with
  /features/linkedin-signals, /features/ai-sdr and /features/conversational-ai in the body.
- Queue: 27 blog keywords still queued, so no new keywords were added.
- For the founder:
  1. Refresh rate: the table says Intentsly's refresh interval is "not stated on the feature page". If you can
     confirm how often keyword posts are picked up (minutes, hourly), add it to brain/wiki/product.md and the
     cell can be filled; it is the column buyers compare on.
  2. Login model for monitoring: the page says Intentsly connects your LinkedIn account "for outreach". If signal
     monitoring itself runs without the customer's LinkedIn session, say so; that is a selling point against Buska
     and would be stated plainly.
  3. Keyword-post scope and language: product.md says keyword posts across LinkedIn in EN/RO/DE/NL. A sentence on
     whether keyword matching supports phrases, OR/NOT or exclusions would let the article's Step 1 list be mapped
     onto the product.
  4. A customer story about a keyword post that turned into a meeting (what the post said, how fast the AI SDR
     replied, what was booked) would be the first-hand material this how-to lacks; the only story available is the
     launch one.
  5. The 21% reply-rate, ~1,000 leads and 2 to 4 meetings rows in proof.md still carry "verified:" plus a note,
     which the gate reads as not verified for figures with a % sign; this article cites none of them.
- Live check: not attempted this run beyond the database row and the push; previous runs found the fetch tool
  refuses intentsly.com URLs for lack of provenance and that the index can lag the push by more than 20 minutes.
