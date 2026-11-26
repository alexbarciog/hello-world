# Last run: 2026-11-26 (learn task; fired about 19:10 UTC, 21:10 Bucharest)

- Setup: no PAUSE file. Repository already cloned, in scope and on `main`; `add_repo` is not exposed as a tool in this
  session (as on previous runs). `git pull origin main` brought main from fdf23c1 to c2a0416. Supabase: the lowercase
  "supabase" connector failed with a proxy tunnel error at session start; the "Supabase" connector connected and was
  used. Web search worked; pages were opened through the web-fetch agent (no direct WebFetch tool). 3 articles had
  been published on the 26th (Bucharest) before this one and 17 in the last 7 days; daily cap is 7, weekly cap 45.
- Keyword (published): what is a marketing qualified lead (learn, fundamentals cluster, lesson, informational,
  priority 3, difficulty high). No draft was in progress, so this was the first keyword tried; the gate passed on the
  second run.
  "What Is a Marketing Qualified Lead? A 3-Line Rule and Benchmarks"
  https://intentsly.com/learn/what-is-a-marketing-qualified-lead
  Title avoids "Definition" and "MQL Meaning" because the gate's title-similarity check (ratio > 0.75) flagged both
  against the SQL lesson ("... Definition and a Checklist") and the PQL lesson ("... PQL Meaning and a Rule").
- Database: one upsert, the generated blog/out/what-is-a-marketing-qualified-lead.sql (18,883 bytes, md5
  75e7eea0d6f3bcb61b25658865791d55), run unchanged through the Supabase connector. Returned slug
  what-is-a-marketing-qualified-lead, status = published, published_at 2026-11-26 19:27:55 UTC. Verified afterwards
  with a read: section learn, article_type lesson, word_count 2044, reading_minutes 9, 6 FAQ entries, content_md md5
  d9ebe9ee43568c95d8d6b0d08574883e, which matches the body in the SQL file exactly. No other writes.
- Gate: first run failed on two points (opening paragraph 96 words, title too close to the SQL lesson). Fixed by
  trimming the opening and retitling. Second run passed; blog_cloud.py sql printed "ready": true with no warnings
  (2,044 words including FAQ, about 1,670 in the body, 6 H2, 6 FAQ, 11 internal links, 5 external links).
- Angle: page one is Tableau, Adobe, HubSpot, TechTarget, Pipedrive, ZoomInfo and CallRail, all glossary explainers
  that assume a marketing team with gated content feeding a separate sales team. This lesson defines the MQL for a
  company with no marketing department: a three-line rule (fit, action, threshold), the public LinkedIn evidence
  that stands in for a form fill, MQL next to SAL, SQL and PQL, Forrester's buying-group objection stated honestly,
  and a decision rule for skipping the stage under about 30 leads a month. Brief at
  blog/briefs/what-is-a-marketing-qualified-lead.md.
- Primary sources opened on 26 November 2026 and cited: First Page Sage MQL-to-SQL by industry (updated 19 Nov 2026:
  16.1% average, 15% median, B2B SaaS and IT & managed services 13%, staffing 12%, data 2019 to Nov 2026); First Page
  Sage lead-to-MQL benchmarks (1 Aug 2025: 31% average); Forrester "Saying goodbye to MQLs" blog (Aug 2023, Buyers'
  Journey Survey 2023: 93% bought in a group of 2+, 71% in a group of 4+); Forrester Palo Alto Networks client story
  (8x more likely to advance, 17% higher closed-won rate); MarketScale write-up of the Belkins 2026 B2B conversion
  survey (1 Nov 2026: 38% do not track MQL-to-SQL, 44% at 1 to 10 employees, 54% of outbound-led teams convert under
  10%). The Belkins report itself (belkins.io/blog/sales-pipeline-conversion) and the first fetch of First Page Sage
  were blocked by the fetch permission prompt; First Page Sage loaded once the URL came from a search result, Belkins
  did not, so its figures are attributed to MarketScale in the text.
- Intentsly facts used: 14 qualified demos in 14 days, zero manual outreach, 4x reply rate (case study, labelled as
  our own launch); scoring against the ideal customer profile from LinkedIn pain-point posts and competitor
  engagement (product.md); /try-ai shows matching buyers with no account; Playbook 12 signals / 8 to ignore. No
  price, no Reddit/X claims, no unreleased features.
- Keywords: 4 learn keywords were left queued, below the 5 in RUN.md step 6, so 9 were added per skills/blog-keywords.md
  after searching each and grading who ranks (sales accepted lead, hot lead, cold lead, decision maker in B2B sales,
  prospect list, lead response time, funding signal, job change signal, intent scoring). 13 learn keywords are now
  queued; "what is a linkedin ssi score" was considered and skipped because LinkedIn's own help page ranks for it.
- Live check: not verified from this session, as on previous runs. Waited 4 minutes after the push (c2a0416 to
  9ef2fc6 on main), then tried the fetch tool on both the sitemap and the page (PROVENANCE_REQUIRED: the permission
  prompt for intentsly.com is never answered in an unattended run) and a web search for the URL (not indexed yet).
  The database row is status = published and the push landed, so the page should be live once the deploy finishes.
  Note for the pipeline: this session's checkout was in detached HEAD, so `git push origin main` was rejected twice
  as non-fast-forward; `git push origin HEAD:main` succeeded on the first try. That is probably what happened on the
  previous run too. Please open
  https://intentsly.com/learn/what-is-a-marketing-qualified-lead once to confirm it renders and appears in
  https://intentsly.com/sitemap.xml.
- For the founder: (1) the scripts/blog_gate.py `kw_in` bug noted in the previous run (`w.rstrip("s")` turns
  "business" into "busine") still blocks every keyword containing "business"; the fix is one line. (2) A real
  customer example of an inbound funnel feeding Intentsly signals (even one sentence: company type, leads a month,
  how many became meetings) would replace the labelled hypothetical IT-consultancy example in this lesson and in the
  SQL lesson. (3) Confirm whether "scores every prospect against the ideal customer profile" is still the right
  description of the scoring feature; every fundamentals lesson now leans on it.
