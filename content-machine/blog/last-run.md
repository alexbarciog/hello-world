# Last run: 2026-11-01 (learn task; fired about 19:25 UTC, 21:25 Bucharest)

- Setup: no PAUSE file, no unblocked `learn` draft waiting (the only draft, outbound-sales-process-for-startups.md, is
  the blocked guides draft from the morning). Repository already cloned and in scope; `git pull origin main` was up
  to date at 5a65b06. `add_repo` was not available as a tool, as on previous runs. Supabase: the lowercase "supabase"
  connector reported a proxy tunnel error at session start; the "Supabase" connector connected and was used.
- Keyword (published): what is dark social in b2b (cluster signal-selling, informational, priority 2).
  "What Is Dark Social in B2B? Definition and Examples"
  https://intentsly.com/learn/what-is-dark-social-in-b2b
  Gate: first local run failed only on meta_description length (166 chars); trimmed to 158 and passed on the second
  run. `blog_cloud.py sql` printed ready: true at 1,989 words by the gate's count (two tables included; 1,673 words
  of prose, inside the 1,000 to 1,800 lesson range), 8 H2, 6 FAQ, 10 internal links, 5 external sources.
- Angle: every ranking page (Oktopost, Cognism, Abmatic, Databox, Kalungi, Topo, Ambassify, Adobe) is written for
  the marketer who owns attribution. This lesson defines dark social for the seller and splits it into the private
  layer no tool can read and the public edge on LinkedIn a seller can watch (a six-row table), puts it next to the
  dark funnel, direct traffic and intent data, states the limits, and gives three actions for the week.
- Research: eight ranking pages opened plus primary sources. Sources opened and linked in the page: Business Wire
  release of 6sense's 2025 Buyer Experience Report (12 Nov 2025: 4,000+ buyers, 94% ranked a preferred vendor before
  first contact, that vendor won 80% of deals); Refine Labs "The Attribution Mirage" (15 Oct 2024: 620 conversions
  over 12 months, software 78% web search vs buyers 12%, 85% of named sources social/podcast/word of mouth/community);
  SparkToro, Rand Fishkin (27 Apr 2023: 1,113 visits, 16 links; TikTok, Slack, Discord, Mastodon, WhatsApp 100%
  "direct", Facebook Messenger 75%, public LinkedIn posts 14%); Wikipedia "Dark social media" for the Madrigal 2012
  origin; Recast on "how did you hear about us" memory bias (31 May 2023). The Atlantic original and the Gartner
  June 2025 press release could not be opened (fetch permission not available in an unattended run), so Wikipedia
  stands in for the origin and Gartner is not cited. Intentsly facts used: LinkedIn post, comment and competitor
  engagement monitoring with ICP scoring (product.md), and the 14 demos / 14 days / zero manual outreach / 4x story;
  the page states plainly that Intentsly does not read private channels. Hypothetical example (staffing agency in a
  Slack community) is labelled. No price, no Reddit/X feature claims.
- Database: the generated SQL ran unchanged on project uwwajlezgeurnvvrvdvb and returned status published,
  published_at 2026-11-01 19:38:41 UTC. `blog_cloud.py mark` filed the article and set the keyword to published.
- Queue: 8 `learn` keywords still queued (next: what is outbound sales), 12 published, so no keyword refresh this run.
- Daily cap: this is the 4th page published today across all sections (cap 7); weekly count is under 45.
- Push: see the commit `learn: publish what-is-dark-social-in-b2b`. Nothing outside content-machine/ changed.
- Live check: recorded in the run report (attempted about four minutes after the push). On the three earlier 1 Nov
  runs the fetch tool asked for a permission nobody was there to grant for intentsly.com URLs, so the live check may
  again be unconfirmed; the database row shows published and the push is what the deploy reads from.
- For Alex: (1) the proof.md rows for the 21% reply rate, 1,000 leads/agent and 2 to 4 meetings still carry the
  status "verified: say ...", which the gate reads as not verified; plain "verified" with the phrasing note moved
  into the Claim cell would let lessons quote them. (2) A real "how did you hear about us" tally from Intentsly's own
  demo form (top three answers, sample size, month) would make this dark social lesson first-hand instead of
  sourced only from Refine Labs and SparkToro; the same tally would strengthen the queued "what is signal-based
  selling" lesson. (3) Allow-listing intentsly.com for the fetch tool, or opening the sitemap and the new page once
  in a live session, would let future runs confirm the live check.
