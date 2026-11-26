# Last run: 2026-11-26 (solutions task; fired about 13:30 UTC, 15:30 Bucharest)

- Setup: no PAUSE file. Repository already cloned, in scope and on `main`; `add_repo` is not exposed as a tool in this
  session (as on previous runs). `git pull origin main` brought main from fdf23c1 to e389187. Supabase: the lowercase
  "supabase" connector failed with a proxy tunnel error at session start; the "Supabase" connector connected and was
  used. Web search worked; pages were opened through the web-fetch agent (no direct WebFetch tool). 2 articles had
  been published on the 26th (Bucharest) before this one; daily cap is 7, weekly cap 45, both well clear.
- Keyword 1 (tried first, BLOCKED): how to get clients for an executive coaching business. Research was done (eight
  ranking pages, ICF 2025 Global Coaching Study, McKinsey on leadership transitions, DDI HR Insights 2025) and a full
  draft written, brief at blog/briefs/get-clients-for-an-executive-coaching-business.md, draft at
  blog/drafts/get-clients-for-an-executive-coaching-business.md. The gate fails only on the keyword checks:
  `kw_in` in scripts/blog_gate.py does `w.rstrip("s")`, which turns "business" into "busine", and the regex
  `\bbusine(s|es)?\b` can never match the word "business". Same bug that blocks ai-consulting-business. The draft
  passes every other check (meta lengths, opening under 90 words, table, FAQ, links, stats); marked `blocked` with
  the reason in its front matter and in keywords.json. Not fixable from here: scripts/ is off limits.
- Keyword 2 (published): how to get clients for a cloud consulting company (solutions, find-customers cluster,
  landing, commercial, priority 3, difficulty medium).
  "Get Clients for a Cloud Consulting Company: 7 Platform Decisions"
  https://intentsly.com/solutions/get-clients-for-a-cloud-consulting-company
  Title dropped the leading "How to" because the gate's title-similarity check (ratio > 0.75) flagged
  "How to Get Clients for a Cloud Consulting Company: ..." against the DevOps consulting page; the H1 still carries
  the keyword and the first sentence opens with "The fastest way to get clients for a cloud consulting company".
- Database: one upsert, the generated blog/out/get-clients-for-a-cloud-consulting-company.sql (25,186 bytes, md5
  7464c5e59ad0c3e6369c41f6e6696838), run unchanged through the Supabase connector. Returned slug
  get-clients-for-a-cloud-consulting-company, status = published, published_at 2026-11-26 13:59:39 UTC. Verified
  afterwards with a read: section solutions, article_type landing, word_count 3025, reading_minutes 14, 6 FAQ
  entries, content_md md5 cf0df3dff90ad18c39fa37faaee315c4, which matches the body in the SQL file exactly.
  No other writes.
- Gate: first run failed on three points (meta_description 161 chars, opening paragraph 91 words, title too close to
  the DevOps page). Fixed by shortening the meta description, trimming one clause in the opening, and retitling.
  Second run passed; blog_cloud.py sql printed "ready": true with no warnings (3,025 words, 7 H2, 6 FAQ, 17 internal
  links, 3 external links). Truth/voice pass after that removed three unsupported claims ("all five pages on the
  first page", "new this year", "tier requirements take a year"); gate re-run, still passes.
- Angle: page one is DemandZEN, Callbox, Telzio, Apollo and ClickUp (two lead-gen agencies, a phone vendor, a sales
  data platform, a PM tool). None gives a LinkedIn search or message; triggers are named but never with where to
  see them. Our DevOps consulting page already owns the "week after something broke" angle, so this page owns the
  platform-decision angle: new CTO/VP Eng, first platform engineer job post, funding round, migration announced,
  cloud-bill post, data residency/sovereignty requirement, request for a partner.
- Primary sources opened on 26 November 2026 and cited: Gartner press release 22 Apr 2026 ($6.31T IT spend, +13.5%;
  IT services past $1.87T; data center systems +55.8%); Flexera press release 18 Mar 2026, 2026 State of the Cloud
  (750+ respondents; 85% cloud spend a top challenge; 29% wasted spend, first rise in five years; 81% using gen AI);
  Gartner press release 9 Feb 2026 (sovereign cloud IaaS $80B in 2026, +35.6%; Europe +83%, passes North America in
  2027; 80% of spend from net new or legacy workloads waiting to migrate). Flexera's first fetch needed a search
  result as provenance; it loaded once the URL came from a search.
- Intentsly facts used: 14 qualified demos in 14 days, zero manual outreach, 4x reply rate (case study, labelled as
  our own launch); around 1,000 leads a month per agent and 2 to 4 meetings a week, attributed "across Intentsly
  customers in October 2026" and "typical"; 2 LinkedIn accounts, 30/30 caps, 15 recommended; languages; HubSpot,
  Cal.com, Google Calendar; verified emails; export; 12 signals / 8 to ignore. No price. No Reddit/X claims. No
  unreleased features. Job-post signal stated as not monitored.
- Keywords: 6 solutions keywords still queued (cloud consulting published, executive coaching blocked), so none
  were added. One of the six ("how to get clients for a bookkeeping business") will hit the same "business" bug.
- Live check: see the run report (the shell has no network route to intentsly.com; the fetch tool was used after a
  wait for the deploy).
- For the founder: (1) scripts/blog_gate.py `kw_in`: change `w.rstrip("s")` to strip at most one trailing "s"
  (e.g. `re.sub(r"s$", "", w)`), then re-run the gate on the three blocked drafts (ai-consulting-business,
  executive-coaching-business, outbound-sales-process-for-startups); the executive coaching one is finished and
  should pass as is. Until then, every keyword containing "business" is unpublishable. (2) A real cloud or
  technical-consultancy customer story (even one sentence: niche, signal used, meetings booked) would replace the
  "we are not a cloud consultancy" paragraph on this and the DevOps page. (3) Confirm whether the job-post signal is
  still outside the product; every solutions page states it as not monitored.
