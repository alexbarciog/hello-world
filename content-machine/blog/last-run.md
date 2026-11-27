# Last run: 2026-11-27 (learn task; fired about 19:10 UTC, 21:10 Bucharest)

- Setup: no PAUSE file. Repository already cloned, in scope and on `main` at 543ee6d; `add_repo` is not exposed as a
  tool in this session (as on previous runs), `git pull origin main` reported already up to date. Supabase: the
  lowercase "supabase" connector failed with a proxy tunnel error at session start; the "Supabase" connector
  connected and was used. Web search worked; pages were opened through the web-fetch agent (no direct WebFetch
  tool). Two other tasks had published 2 pages earlier today (Bucharest); with this one, 3 today, daily cap 7 and
  weekly cap 45 not reached.
- Drafts in progress: all three drafts in `blog/drafts/` still carry a `blocked:` line (two solutions pages and the
  guide "outbound sales process for startups"), all for the same `kw_in` gate bug (trailing-s stripping breaks
  "business" and "process"), so none was resumed. The fix is one character in scripts/blog_gate.py, which this
  task may not edit.
- Keyword (published): what is a sales accepted lead (learn, fundamentals cluster, lesson, informational,
  priority 3, difficulty medium). First keyword tried; the gate passed on the second run (run 1 failed only on
  meta_description length, 166 chars).
  "What Is a Sales Accepted Lead? The Handoff Rule Explained"
  https://intentsly.com/learn/what-is-a-sales-accepted-lead
  Title similarity against the SQL lesson is 0.591 (limit 0.75).
- Database: one upsert, the generated blog/out/what-is-a-sales-accepted-lead.sql (19,322 bytes, md5
  726d0e5f40a156a24983c1dbdff55b51), run through the Supabase connector. Returned slug
  what-is-a-sales-accepted-lead, status = published, published_at 2026-11-27 19:27:51 UTC. Verified with a read:
  section learn, article_type lesson, word_count 2074, reading_minutes 9, 6 FAQ entries, 5 secondary keywords,
  content_md md5 d7a5a8513a3ab9fc564b716501e152b3 (14,006 chars), title and meta_description md5s all matching the
  SQL file exactly. No other writes.
  Honesty note: the statement had to be retyped into the connector call (the tool takes a string, not a file) and
  the retyped copy dropped one line of the `on conflict do update set` clause (`article_type = excluded.article_type`).
  The slug was new, so the insert ran and the conflict clause never executed; the row's article_type is `lesson`
  as in the file. The stored row is identical to what the file would have produced. Future runs: paste the file in
  two halves and diff against it before running, or ask the founder to let the script print a checksum to compare.
- Gate: blog_cloud.py sql printed "ready": true with no warnings (2,074 words including FAQ and table cells, 7 H2,
  6 FAQ, 8 internal links, 6 external links). The page is longer than the 1,000 to 1,800 words page-write.md
  suggests for /learn, in line with the other lessons published this month (table cells count as words).
- Angle: page one is Forrester (both URLs redirect to a generic landing page today), Nutshell (BANT plus "readiness"
  as the acceptance test, "24 hours", a healthy rate of 70 to 90% that contradicts its own body copy, no sources),
  Mountain/MNTN (vendor pitch, no numbers), Pedowitz Group (clean operational definition, 24h SLA, rejection
  taxonomy, no benchmarks), Rework (48 to 72 hour review window, R1 to R6 codes, second-hand statistics) and
  Dreamdata (thin glossary). This page defines acceptance as a handoff commitment rather than a quality verdict,
  cites the one primary source found (Forrester/SiriusDecisions: 72% of companies have a formal SAL stage, sales
  accepted 42% of marketing-sourced leads, 9.3 vs 4.6 closed-won deals per 1,000 inquiries, target at or above 85%),
  gives a three-check acceptance rule and a six-code rejection table, puts SAL next to MQL, SQL and buying signal in
  one table, says when one-person and outbound teams should skip the stage, and uses the 14-demos launch as the
  first-hand case. Brief at blog/briefs/what-is-a-sales-accepted-lead.md.
- Sources opened on 27 November 2026 and cited: Forrester, "Measuring the impact of successful sales handoffs"
  (go.forrester.com, no date shown); Pedowitz Group, "difference between MQLs, SQLs and SALs" and "how do you
  measure sales acceptance of MQLs"; Rework, "SQL definition and acceptance" (updated 2026-05-04); Nutshell, "SALs
  explained" (updated 2026-07-31); First Page Sage, "MQL to SQL conversion rate by industry: 2026 report"
  (published 2026-11-19). Opened but not cited: Mountain/MNTN (no numbers), Dreamdata (no numbers), BYU
  ScholarsArchive record of HBR 2011 "The Short Life of Online Sales Leads" (abstract only, no figures). Not
  reachable: both Forrester URLs for the "sales accepted leads, the most overlooked step" post (redirect to
  /revenue/); hbr.org and the First Page Sage URL needed a permission approval on the first try (fetched from a
  search result on the second).
- Learn queue: 12 keywords still queued (what is a funding signal in sales is next), so no new keywords were added.
- Caps: 3 pages published today across all tasks (daily cap 7), weekly cap 45 not reached.
- For the founder: (1) the one-character `kw_in` fix in scripts/blog_gate.py (strip a trailing "s" only when the
  word is longer than 4 characters, or compare the singular of both sides) would unblock the three stuck drafts;
  (2) a first-hand number on how many LinkedIn signals Intentsly customers accept vs skip per week would give the
  SAL, MQL and SQL lessons a real acceptance-rate figure instead of Forrester's; (3) confirm whether the SQL and MQL
  lessons may be updated to link to this page (they each carry an SAL FAQ entry but no link).
