# Last run: 2026-11-18 (learn task; fired about 19:30 UTC, 21:30 Bucharest)

- Setup: no PAUSE file. Repository already cloned, in scope and on `main` (`add_repo` still not exposed as a
  tool, as on previous runs); `git pull origin main` reported already up to date at fdc81c9. Supabase: the
  lowercase "supabase" connector again failed with a proxy tunnel error at session start; the "Supabase"
  connector connected and was used. Web search worked. The two drafts in blog/drafts/ at the start
  (get-clients-for-an-ai-consulting-business.md, outbound-sales-process-for-startups.md) both still carry a
  `blocked:` line (gate kw_in strips every trailing "s"), so neither was resumed. 3 articles had been
  published today before this run (daily cap 7); 17 in the last 7 days (weekly cap 45).
- Keyword (published, first attempt): what is lead qualification (learn, fundamentals, lesson, informational,
  priority 3, difficulty high).
  "What Is Lead Qualification? Meaning, Frameworks and a Card"
  https://intentsly.com/learn/what-is-lead-qualification
- Orphan check: a read-only select for the slug before writing returned no row. Supabase returned
  status = published, published_at 2026-11-18 19:45:27 UTC. Writes: the one generated SQL statement, pasted
  whole from blog/out/what-is-lead-qualification.sql (18,300 bytes). Reads: two selects (the pre-check and a
  post-insert comparison). The post-insert check compared length and md5 of content_md (13,306 chars,
  0b0beadb...), word_count (2111), reading_minutes (10), 5 secondary keywords, 6 FAQ entries, section and
  type against the local draft: all matched exactly.
- Gate: the first three runs failed only on the opening paragraph (102, 95, then 93 words against the 90
  limit, because the bold definition sentence is long); trimmed the opening and about 110 body words; passed
  on the fourth run with no warnings. Final: 2,111 gate-counted words (three tables; about 1,850 outside
  tables and code, at the top of the 1,000 to 1,800 lesson range), 7 H2, 6 FAQ (64 to 69 words each), 8
  internal links, 6 external links, no em dashes, no banned phrases, exact keyword phrase once. Title
  similarity to the nearest published title 0.64 (gate limit 0.75). Title 58 characters, meta_title 55.
- Angle: page one is Salesforce (UK and regional copies), ZoomInfo, PandaDoc, RevenueHero, Lucep, Bigin by
  Zoho and smaller vendors. All give a definition, MQL/SQL/PQL labels, four to six acronyms with "choose
  what fits", a step list and a question list; statistics are mostly the vendor's own case studies. None
  gives a rule for choosing a framework, none treats qualification as something done before the first
  message from public behaviour, and only two give disqualification a section. This page reduces every
  framework to three checks (company can buy, problem is live now, this person owns it), marks which two are
  answerable from LinkedIn before outreach, compares BANT/CHAMP/FAINT/MEDDICC with a one-line rule for teams
  of 1 to 200, gives a one-screen qualification card and a disqualification message, and uses the 14-demos
  launch as the first-hand case. Brief: blog/briefs/what-is-lead-qualification.md.
- Sources opened today and linked: Salesforce State of Sales news story (7,775 respondents, 24 Aug to 30
  Sep 2022, 28% of the week selling); Gartner Customer Confidence page (77% of B2B buyers say latest
  purchase very complex or difficult; about two-thirds of the journey spent gathering information); RAIN
  Group "How to qualify sales leads" (FAINT, exact quote on BANT and budget); Salesforce UK blog (BANT,
  CHAMP, MEDDICC descriptions); PandaDoc (GPCTBA/C&I, ANUM); RevenueHero (39% of companies run no
  disqualification; labelled in the text as the vendor's own dataset). Opened and not used: ZoomInfo
  (its Gartner "44% of MQLs" figure has no primary link), Bigin, Gartner marketing-sales collaboration press
  release. Not usable: HBR 2011 "Short Life of Online Sales Leads" (hbr.org refused by the fetch tool's
  URL-permission check with no human to approve; only the BYU archive abstract opened), Gartner
  buyer-enablement page (opened only on a Gartner mirror host, so not linked).
- Intentsly facts used: the 14-demos story (founders posting about cold outreach burnout, conversational AI
  handled replies, 14 qualified demos in 14 days, zero manual outreach, 4x reply rate, most leads from
  real-time intent signals); scoring against the ICP before outreach and the monitored post/page/keyword
  sources from product.md; the 12/8 playbook figures. No price stated. No Reddit/X features, no email
  sending, no NOT-LIVE epics mentioned.
- Verification: see the report of this run (checked about 4 minutes after the push).
- Queue: after marking, 4 `learn` keywords were queued (below the 5 threshold in RUN.md step 6), so 8 were
  appended per skills/blog-keywords.md after a search each to record who ranks: what is third-party intent
  data (signal-selling, medium: Abmatic, Bombora, Leadinfo), what is competitor monitoring in sales
  (signal-selling, medium: Pricefy, Crustdata, Letterdrop, Klue), what is a good reply rate for linkedin
  outreach (outbound, medium: Valley, Overloop, Expandi, Belkins; the verified 21% figure makes Intentsly a
  credible answer), what is a product qualified lead (fundamentals, medium: Kixie, TechTarget, Navattic),
  what is a discovery call in sales (high: Gong, Outreach, Salesforce), what is account-based marketing
  (high: TechTarget, Salesforce, G2), what is a sales pipeline (high: Zendesk, TechTarget, Salesforce), what
  is a lead in sales (high: Shopify, TechTarget, LeadSquared). 12 `learn` keywords now queued; blog_next
  reports "what is third-party intent data" as next. No search volumes written (none obtained from a tool).
- For Alex: (1) the kw_in bug in scripts/blog_gate.py (w.rstrip("s") strips every trailing s) still blocks
  two finished drafts; a one-character fix unblocks them. (2) The queued "what is a good reply rate for
  linkedin outreach" lesson would be much stronger with the sample behind the 21% figure (how many
  accounts, which months) and a connection-acceptance rate, if you have one. (3) A customer who
  disqualified or re-qualified a lead on a signal (a one-paragraph story) would replace the generic
  hypothetical in the qualification lessons. (4) Two queued lessons (sales qualified lead, marketing
  qualified lead) overlap with the MQL/SQL table on today's page; consider whether one combined "MQL vs
  SQL" lesson is better than two.
