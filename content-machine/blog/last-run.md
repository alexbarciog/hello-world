# Last run: 2026-11-19 (solutions task; fired about 13:50 UTC, 15:50 Bucharest)

- Setup: no PAUSE file. Repository already cloned, in scope and on `main` (`add_repo` still not exposed as a
  tool, as on previous runs); `git pull origin main` brought main to 17edfa2. Supabase: the lowercase
  "supabase" connector again failed with a proxy tunnel error at session start; the "Supabase" connector
  connected and was used. Web search and web fetch worked (McKinsey and TechRepublic could not be fetched:
  one needed a permission an unattended run cannot grant, the other returned a client error). The two older
  drafts in blog/drafts/ (get-clients-for-an-ai-consulting-business.md, outbound-sales-process-for-startups.md)
  still carry a `blocked:` line, so neither was resumed. 1 article had been published today (UTC) before this
  run (daily cap 7); the gate reported no weekly-cap problem (cap 45).
- Keyword (published, first attempt): how to get clients for an it consulting company (solutions,
  find-customers, landing, commercial, priority 3, difficulty medium).
  "How to Get IT Consulting Company Clients: Seven Deadlines"
  https://intentsly.com/solutions/get-clients-for-an-it-consulting-company
- Database: a read-only select before writing returned no row for the slug and 1 post published today.
  Supabase returned status = published, published_at 2026-11-19 13:59:32 UTC. Writes: the one generated SQL
  statement, pasted whole from blog/out/get-clients-for-an-it-consulting-company.sql (26,665 bytes). Reads:
  two selects (the pre-check and a post-insert comparison). The post-insert check compared length and md5 of
  content_md (21,011 chars, 353a4081...), word_count (3323), reading_minutes (15), 5 secondary keywords,
  6 FAQ entries, section and type against the local file: all matched exactly.
- Gate: first local run failed on five points (meta_title 61 chars, meta_description 164 chars, opening
  paragraph 97 words, "21%" reply-rate figure not gate-verifiable because its proof row is annotated rather
  than plain `verified`, and title too close to the HR consulting firm page at 0.77). Fixed all five: new
  title (similarity 0.58), meta_title 59 chars, meta_description 157, opening 88 words, the 21% figure
  removed (the 1,000 leads and 2 to 4 meetings figures stay, attributed to October 2026). Second run passed
  with no warnings; blog_cloud.py sql printed "ready": true with no warnings. 3,323 words (landing min
  1,100, max 4,000; the MSP and HR consulting solution pages are 3,089 and 2,954), 7 H2, 6 FAQ, 15 internal
  links, 3 external links, no em dashes, no banned phrases.
- Angle: every first-page result (airdroid, eGrabber, Callbox, HubSpot, mariopeshev) is a 7-to-9-item channel
  list (website, referrals, networking, content, partnerships, cold email, marketplaces) with unlinked
  statistics or none; the only signal-shaped page (salesmotion.io) is about selling TO consultancies. This
  page organises the answer around the seven dated triggers that make a company of 20 to 500 people hire
  an IT consultancy (vendor end-of-support, ERP/CRM selection or slipping go-live, first IT director or new
  CIO, cloud cost or data-centre exit, acquisition, audit or compliance deadline, stalled AI pilot or
  public partner request), gives the Posts-tab/Jobs-tab search and message for each, a week-one plan, the
  MSP-vs-consultancy distinction (linking the MSP page), and when partner programmes, referrals and tenders
  beat signals. Brief: blog/briefs/get-clients-for-an-it-consulting-company.md.
- Outside sources opened 2026-11-19 and linked: gartner.com newsroom 27 Jul 2026 ($6.37T, 14.2%; IT
  services $1,570B, 5.3%); techcommunity.microsoft.com Windows IT Pro blog 20 Feb 2026 (Windows Server 2016
  EOS 12 Jan 2027, Windows 10 LTSB 2016 EOS 13 Oct 2026, ESU up to three years, "temporary bridge" quote);
  panorama-consulting.com press release 4 Mar 2026 (more than a quarter over budget, additional technology
  needs the leading cause). Opened but not used: hingemarketing.com High Growth Study 2025 (770 firms, 4X,
  30%; too general for the page). Not used: airdroid's unlinked HBR/Forbes/Statista figures, Callbox
  case-study counts.
- Intentsly facts used: product.md confirmed rows (LinkedIn signals only; keyword posts, post engagement,
  competitor followers/engagers, hashtag engagement; ICP scoring; verified-email enrichment and export;
  AI SDR LinkedIn-only with Cal.com/Google Calendar booking; HubSpot; 2 accounts, 30/30 caps, 15
  recommended; four languages; /try-ai with no account) and proof.md rows (14 demos in 14 days, 4x reply
  rate, 12 signals and 8 to ignore, ~1,000 leads a month per agent, 2 to 4 meetings a week, both attributed
  to October 2026). No Intentsly price stated. Job posts are stated as not monitored. The one message
  template is a copyable example, not a message we sent.
- Solutions queue after this run: 6 keywords still queued (ppc agency, branding agency, pr agency,
  executive coaching, cloud consulting, fintech startup); 50 queued across all sections, so step 6 (add more
  when fewer than 5) did not trigger. Note that "how to get clients for a cloud consulting company" sits
  next to this page; the next solutions run should angle it on cloud-specific triggers (bill shock, lease
  exit, data residency) rather than repeat the end-of-support story.
- Verification: database row confirmed published and content-identical to the local file; commit pushed to
  origin/main (hash in the git log). Live page and sitemap check recorded in the run report (fetched about
  4 minutes after the push).
- For the founder: (1) the 21% reply-rate row in proof.md is marked "verified: say ..." rather than
  `verified`, so the gate rejects the number; change the status cell to plain `verified` (and keep the
  phrasing rule in corrections.md) if pages may quote it; (2) a first-hand story from a consultancy or
  agency customer (what signal they chased, what they sent, what came back) would let the eight
  find-customers landing pages stop reusing the 14-demos launch story; (3) confirm whether job posts will
  ever be a monitored signal, since every services page currently has to say they are not; (4) the two
  blocked drafts still wait on first-hand material (AI consulting clients; startup outbound process);
  (5) confirm the pricing figure so pages can print a number.
