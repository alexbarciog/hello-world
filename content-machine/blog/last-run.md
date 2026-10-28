# Last run: 2026-10-28 (solutions task; started 13:45 UTC, 15:45 Bucharest)

- Keyword: how to find leads for a software company (section solutions, cluster find-customers, type landing,
  intent commercial, priority 2, difficulty medium). `blog_next.py --section solutions` returned it directly.
  No PAUSE file, no draft waiting. Repository already cloned and in scope; `git pull origin main` was up to
  date at 2de7c40. `add_repo` was not available as a tool, as on previous runs.
- Published: "How to Find Leads for a Software Company: Buyers in Public"
  https://intentsly.com/solutions/find-leads-for-a-software-company
  The gate failed once (meta_description 162 chars, opening 93 words, title "Signals First" too close to the
  marketing-agency page); fixed by trimming both and retitling to "Buyers in Public". Ready on the second run.
  8 H2, 6 FAQ, 10 internal links, 2 external, 2,785 words by the gate's count (three tables hold a share).
  Fourth page of 28 October (phantombuster comparison 00:03, linkedin-buying-signals 09:11, hiring-signals
  guide 10:39 Bucharest); daily cap 7 and weekly cap 45 not reached.
- Database: a read-only select first confirmed no row existed for the slug. The generated SQL ran unchanged on
  project uwwajlezgeurnvvrvdvb and returned status published, published_at 2026-10-28 14:09:17 UTC. A second
  read-only select confirmed the stored content_md matches the draft body exactly (17,073 chars, same md5),
  6 FAQ entries, 4 secondary keywords, word_count 2785.
- Angle: page one is vendor guides (Instantly, Cognism, Alore, Martal, DemandZEN, Woodpecker, Cleverly) that list
  8 to 13 tactics each, relay statistics from other vendors' round-ups, and treat "software company" as one
  business. This page splits product company from development shop (a decision table), gives the LinkedIn signal
  table per type (8 rows: competitor engagers, "anyone using" posts, pain posts, page followers, "hiring our
  first engineer" posts, engineering job clusters, failed-build posts, new-role posts), a one-person week-one
  plan with the sending caps, the Intentsly feature mapping, the 14-demo story, and when referrals/partners,
  review sites and ads beat signals. Brief in blog/briefs/find-leads-for-a-software-company.md.
- External sources opened today and linked: businesswire.com press release for the 6sense 2024 Buyer Experience
  Report (nearly 70% through the purchase before engaging sellers, 81% have a preferred vendor, buyers initiate
  contact 80%+ of the time, average buying group 11) and company.g2.com/news/buyer-behavior-in-2024 (1,900+
  buyers surveyed; research stage 34%, evaluation 23%, discovery 21%; 3% never want sales; 69% say implementers
  are a factor; 38% consider them during research). 6sense.com, the G2 PDF and gartner.com each asked for a
  permission nobody was there to grant, so the press release and G2's own news page were used instead.
  yourshortlist.com looped on a redirect and was skipped.
- Intentsly facts only from product.md, the plain-`verified` proof rows and the dogfooding story: the four
  LinkedIn signal types, ICP scoring, verified emails, export, HubSpot/Cal.com/Google Calendar, AI SDR on
  LinkedIn only, 2 accounts, 30/30 caps with 15 recommended, four languages, /try-ai with no account, 14 demos
  in 14 days, 4x reply rate, 12 signals and 8 to ignore. The page states that Intentsly does not watch job
  boards. No price, no Reddit/X claim, no email-sending claim, no reply-rate percentage.
- Links: /learn/what-is-a-buying-signal, /guides/track-hiring-signals-for-sales,
  /blog/track-competitor-linkedin-post-engagers, /blog/linkedin-message-templates-for-buying-signals,
  /features/linkedin-signals (contextual sentence), /features/ai-sdr, /case-studies,
  /solutions/find-customers-for-b2b-saas, /try-ai and /signal-playbook (closing).
- Keywords: 5 solutions keywords remain queued (how to find customers for a startup, b2b lead generation for
  small business, how to find clients for a web design agency, how to get clients for a saas company, how to
  find b2b customers on reddit), so none were added (RUN.md step 6 triggers below 5). Blocked keywords: none.
- Live check: not possible from this run, as before. Four minutes after the push (14:14 UTC) the fetches of
  intentsly.com/sitemap.xml and the page URL both asked for a permission on intentsly.com that nobody was
  there to grant. The row is `status = published` and the push landed on main at 0d98f2d, so the page goes
  live when the host finishes the build. Push note: the first push was rejected as non-fast-forward from the
  depth-1 clone; `git fetch --unshallow` fixed it and the push went through at 14:10 UTC.
- Connector note: a lowercase `supabase` server was listed as failed (ERR_PROXY_TUNNEL) while the capitalised
  `Supabase` connector worked, as on previous runs.
- For Alex: (1) a real development-shop or product-company win from a customer (the post that was spotted, what
  was sent, time to the meeting) would replace the hypothetical Northwind Studio example with a measured one;
  (2) confirm whether keyword post monitoring can be set to hiring phrases such as "looking for a developer" so
  the mapping row stays accurate; (3) the proof.md rows whose Status cell reads "verified: <note>" are still
  not accepted by the gate (it matches the cell exactly), so the 21% reply rate and 2 to 4 meetings figures
  remain unusable where the statistic check fires; (4) the queued keyword "how to find b2b customers on reddit"
  sits in /solutions but Reddit is not an Intentsly feature, so its "How Intentsly does this for you" section
  can only point to LinkedIn signals; consider moving it to guides or dropping it; (5) open
  https://intentsly.com/solutions/find-leads-for-a-software-company once after the deploy and check the three
  tables render.
