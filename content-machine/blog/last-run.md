# Last run: 2026-10-29 (solutions task; started about 14:09 UTC, 16:09 Bucharest)

- Keyword: how to find customers for a startup (section solutions, cluster find-customers, type landing,
  intent commercial, priority 2, difficulty medium). `blog_next.py --section solutions` returned it directly.
  No PAUSE file, no draft waiting. Repository already cloned and in scope; `git pull origin main` was up to
  date at 23aa73e. `add_repo` was not available as a tool, as on previous runs; the repo was already attached.
  Supabase: the lowercase "supabase" connector reported a proxy tunnel error at session start, the "Supabase"
  connector connected and was used. A read-only count before any work: 2 posts published on 29 Oct UTC in
  the database, 24 in the last 7 days; caps 7 and 45 not reached; no row for the slug.
- Published: "How to Find Customers for a Startup: Your First 10 Buyers"
  https://intentsly.com/solutions/find-customers-for-a-startup
  The gate failed once (69% and 38% in the referrals paragraph referred to "the G2 survey linked above" without
  the link in the same paragraph); link added, ready on the second run. 7 H2, 6 FAQ, 10 internal links,
  3 external, 2,740 words by the gate's count (in line with the other solutions pages at 2,268 to 2,785).
- Database: the generated SQL ran unchanged on project uwwajlezgeurnvvrvdvb and returned status published,
  published_at 2026-10-29 14:23:58 UTC. A read-only select confirmed the stored content_md matches the draft
  body exactly (16,512 chars, md5 4ee380f7c995ebd2b23e8e0b12778cd9), 6 FAQ entries, 4 secondary keywords,
  word_count 2740, reading_minutes 12, section solutions.
- Angle: the ranking pages (LinkedIn collaborative article, HubSpot, Stripe Atlas, Flowla Aug 2026, SBA 2019,
  Dreamstate Jul 2026, Harvard Innovation Labs) all give the same order: ICP, own network, referrals, then
  "do outbound" and "start marketing", with no sourced statistics and no way to pick who to contact once the
  network is spent. This page starts there: the LinkedIn behaviours that mark a buyer for a startup with no
  brand (pain-phrase posts, "anyone using X?" posts, competitor-post commenters, new-role posts, same-stage
  founder posts, new competitor followers) with the exact search, meaning and message for each, a one-person
  week-one plan with sending caps, when referrals, communities or paid beat signals, and our own launch run.
  Scoped to B2B startups in the opening. Brief in blog/briefs/find-customers-for-a-startup.md.
- Outside facts, all opened this run and linked in the same paragraph: 6sense 2024 Buyer Experience Report
  press release on businesswire.com (nearly 70% through the purchase before engaging a seller, 81% have a
  preferred vendor at first contact); G2 buyer behaviour 2024 (1,900+ buyers, research stage 34%, 69% say
  service providers are a factor, 38% during research); Paul Graham, "Do Things That Don't Scale" (recruit
  users by hand; 10% weekly growth from 100 users reaches about 14,000 in a year). No CB Insights failure
  statistic: only secondary copies surfaced in search, so it was left out.
- Intentsly facts only from proof.md verified rows (14 qualified demos in 14 days, 14 meetings in 2 weeks,
  reply rate 4x previous cold campaigns, 12 signals / 8 to ignore, 2 accounts, 30/30 a day, 15 recommended)
  and product.md (keyword posts, post engagement, competitor followers, hashtags, ICP scoring, verified
  emails, export, HubSpot / Cal.com / Google Calendar, AI SDR LinkedIn-only, four languages, /try-ai with no
  account). No price, no customer names, no Reddit/X feature claim. The dogfooding story is used as the
  "in practice" section because Intentsly was itself a startup launching into a crowded market.
- Links: /learn/what-is-a-buying-signal, /guides/find-decision-makers-on-linkedin,
  /blog/linkedin-message-templates-for-buying-signals, /features/linkedin-signals (contextual sentence at the
  watching step, conversion page), /features/ai-sdr, /case-studies, /solutions/find-customers-for-b2b-saas,
  /blog/find-b2b-leads-on-reddit, /try-ai (closing CTA), /signal-playbook. No link to the /solutions index
  itself; the gate does not require it and the site navigation carries it.
- Queue: after marking, 4 `solutions` keywords were queued (below 5), so per RUN.md step 6 five were added
  with status queued, section solutions, type landing, priority 3 so the existing four keep their place:
  "how to find clients for a lead generation agency" (medium: nocrm, Belkins, Snov, Woodpecker, Expandi),
  "how to get clients for an msp" (medium: V2 Cloud, Syncro, ElectroNeek, Domotz), "how to find customers
  for a cybersecurity company" (medium: Callbox, Salespanel, Attention, small sites), "how to find clients
  as a fractional cfo" (low: ClickUp templates, Substack, small consultancies), "how to get clients for an
  hr consulting firm" (low: Kenjo, myhrtoolkit, forums). "how to find customers for a fintech startup" was
  checked and skipped (a16z and Entrepreneur rank; mostly consumer fintech). 9 `solutions` keywords now
  queued; next is "b2b lead generation for small business". Nothing blocked.
- For the founder: (1) The proof.md rows for 21% reply rate, ~1,000 leads/month per agent and 2 to 4
  meetings a week still carry a "verified: ..." status with a phrasing note; the gate accepts only the exact
  word "verified", so those numbers remain unusable until the status cell reads "verified" and the note moves
  into the claim cell. They would strengthen every solutions page. (2) A sentence or two of first-hand
  detail on the 14-demo launch (which pain phrases you searched, the first reply, how many signals a day
  you saw) would turn the "in practice" section from a summary into a story. (3) If any customer is itself an
  early-stage startup and agrees to be named, that is the proof this page lacks most. (4) Does the product
  let a user set keyword searches with a date window (for example "past week only")? If so, say so in
  product.md and the week-one plan can state that the saved-search step maps exactly.
- Live check: see the end of this run's report; attempted about four minutes after the push.
