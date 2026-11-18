# Last run: 2026-11-18 (solutions task; fired about 13:40 UTC, 15:40 Bucharest)

- Setup: no PAUSE file. Repository already cloned, in scope and on `main` (`add_repo` still not exposed as a
  tool, as on previous runs); `git pull origin main` reported already up to date at a22da16. Supabase: the
  lowercase "supabase" connector again failed with a proxy tunnel error at session start; the "Supabase"
  connector connected and was used. Web search worked. The two drafts in blog/drafts/ at the start
  (get-clients-for-an-ai-consulting-business.md, outbound-sales-process-for-startups.md) both still carry a
  `blocked:` line (gate kw_in strips every trailing "s", so "business" and "process" never match), so neither
  was resumed. 0 articles had been published today before this run (daily cap 7); 14 in the last 7 days
  (weekly cap 45).
- Keyword (published, first attempt): how to find clients for an seo agency (solutions, find-customers,
  landing, commercial, priority 3, difficulty medium).
  "How to Find Clients for an SEO Agency: 7 Posts That Mean Budget"
  https://intentsly.com/solutions/find-clients-for-an-seo-agency
- Orphan check: a read-only select for the slug before writing returned no row. Supabase returned
  status = published, published_at 2026-11-18 13:49:41 UTC. Writes: the one generated SQL statement, pasted
  whole from blog/out/find-clients-for-an-seo-agency.sql (21,095 bytes). Reads: two selects (the pre-check
  and a post-insert comparison). The post-insert check compared length and md5 of content_md (16,100 chars,
  2611b12a...), word_count (2546), reading_minutes (12), 4 secondary keywords, 6 FAQ entries, section and
  type against the local draft: all matched exactly.
- Gate: first run failed only on the opening paragraph (94 words, max 90). Trimmed the opening and about
  120 body words; passed on the second and third runs with no warnings. Final: 2,546 gate-counted words (two
  tables; about 2,120 outside tables, in line with the web design agency page at 2,023), 7 H2, 6 FAQ (60 to
  69 words each), 14 internal links, 2 external links, no em dashes, no banned phrases, exact keyword phrase
  used 3 times (0.9%). Title similarity to the nearest published title checked at 0.66 (gate limit 0.75);
  candidates built on "Signals First" / "Catch the ..." scored 0.70 to 0.71 and were dropped. Title is 63
  characters, slightly over the 60 target; meta_title is 53.
- Angle: page one is Search Engine Land (Semrush-owned, 19 tips), DesignRush, Traffic Think Tank, Reply.io,
  Snov.io, ManyRequests, Surfer. All give the same tactic list (niche, rank locally, LinkedIn posting,
  referrals, partnerships, directories, cold email with a free audit) with no timing, zero search strings,
  no templates and either self-reported case studies or unsourced percentages. None cites the two surveys
  that exist. This page names seven LinkedIn behaviours that precede an SEO purchase (traffic-drop and
  migration complaints, new marketing leader, in-house SEO job ad, funding or new market, recommendation
  request, DIY-SEO or fired-agency post), gives the Posts-tab or Jobs search and the message for each, a
  week-one plan with LinkedIn's sending caps, a traffic-drop message template, and a "when referrals,
  partnerships and directories beat signals" section. Brief: blog/briefs/find-clients-for-an-seo-agency.md.
- Sources opened today and linked: Search Engine Journal's report on the SEOFOMO 2024 survey (337
  self-selected respondents: referrals 77%, ranking in search 39%, social 26%, events 25%, cold outreach
  14%), SparkToro's 2025 State of Digital Agencies write-up dated 17 Feb 2026 (59% tried outbound; 9% very
  effective, 33% not at all; 70% no full-time sales; 15% partner referrals top source; 73% LinkedIn most
  effective social channel). Opened and not used: Momentic's State of Agency Discoverability 2026 (secondary
  compilation of RSW/US and G2 figures, no sample size). The SEOFOMO figures are cited via SEJ because the
  original survey write-up was not found in search; the page says "reported by Search Engine Journal".
- Intentsly facts used: the 14-demos story, 4x reply rate, around 1,000 leads a month per agent, 2 to 4
  meetings a week (both attributed to October 2026 and labelled typical), the Mike Ruiz quote, the 12/8
  playbook figures, the 2-account and 30/30/15 caps, the four languages, LinkedIn-only, no email sending.
  No price stated. Agent templates, self-serve billing, done-for-you setup and the new free tools were not
  mentioned (still marked NOT LIVE in product.md).
- Verification: see the task report; sitemap and page fetched about 4 minutes after the push.
- Queue: 7 `solutions` keywords still queued (next: "how to get clients for an it consulting company"),
  2 blocked (ai consulting business, plus the guides draft) pending the kw_in fix in scripts/blog_gate.py.
- For Alex: (1) the kw_in bug in scripts/blog_gate.py (w.rstrip("s") strips every trailing s) blocks two
  finished drafts and will block any keyword containing "business", "process", "success", "address" etc.;
  a one-character fix (strip one s) unblocks them. (2) An SEO-agency customer story or a number from an
  agency account would replace the "we are not an SEO agency" paragraph with real proof. (3) Confirm whether
  job-post monitoring exists or is planned; every agency page currently says the job-ad signal is not
  monitored. (4) The /solutions pages now number 24; a founder-written line on which business types convert
  best would help re-prioritise the remaining 7 keywords.
