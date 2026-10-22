# Last run: 2026-10-22 (Learn task, learn section; started 18:20 UTC, 21:20 Bucharest)

- Keyword: what is lead enrichment (cluster fundamentals, lesson, informational, priority 2, medium). Returned by
  `blog_next.py --section learn`. No PAUSE file, no draft waiting.
- Title: What Is Lead Enrichment? Definition, Data Types and Limits
- Live URL: https://intentsly.com/learn/what-is-lead-enrichment
- Status: published (Supabase upsert returned `status = published`, published_at 2026-10-22 18:25 UTC). The SQL file
  `blog/out/what-is-lead-enrichment.sql` was run once, unchanged, through the `Supabase` connector's execute_sql on
  project uwwajlezgeurnvvrvdvb. The only other statement run was a `select 1` at the start to confirm the connector
  worked (the session listed a lowercase `supabase` server as failed with ERR_PROXY_TUNNEL; the capitalised
  `Supabase` connector answered). Seventh page dated 22 October: the config daily cap of 7 is now reached, so any
  other task running later today should publish nothing.
- Gate: run 1 failed on one item (meta_description 174 chars). Shortened it; run 2 passed. Then trimmed about 200
  words to sit closer to the lesson range (gate-words 2,262 to 2,070, in line with the other published lessons at
  1,776 to 2,136); run 3 passed with no warnings. 9 H2s, 6 FAQ entries, two tables, 6 internal links, 5 external.
- Shape (page-write /learn): bold one-sentence definition, why it matters with a labelled hypothetical, data-types
  table, how it works (four steps, real-time/batch/waterfall), enrichment vs data enrichment vs lead scoring table,
  "when it is the wrong spend" (the angle no vendor page has), legal section, three actions this week, related
  lessons (buying signal, intent data, ICP, Learn index), FAQ. CTA is the Signal Playbook; one contextual Intentsly
  sentence links /features/linkedin-signals (scoring against ICP + verified emails, both in product.md).
- Sources opened and linked: Salesforce State of Sales (28% of time selling, 7,775 respondents, Aug to Sep 2022),
  Gartner data-quality topic page ($12.9M a year average, 2020 research), ICO legitimate-interests guide (three-part
  test, right to object), FullEnrich B2B lead enrichment guide (waterfall worked example), Clay glossary (refresh
  cadence). Also read, not linked: Clearbit (2022), Leadfeeder (Sep 2026), ZoomInfo (updated Jul 2026). Full brief
  in `blog/briefs/what-is-lead-enrichment.md`.
- Intentsly facts used: LinkedIn signals, ICP scoring, verified emails, 14 demos in 14 days story. No price, no
  Reddit/X, no email sending.
- Queue: 7 learn keywords still queued (social selling, trigger event in sales, lead scoring, outbound sales,
  signal-based selling, sales trigger, account-based prospecting), so none were added.
- Live check: see the run report (sitemap and page fetched about 4 minutes after the push).
- For the founder: (1) the lessons all lean on the one launch story; a sentence or two on what enrichment Intentsly
  actually returns per lead (which fields beyond verified email, and the export format) would let the next lesson
  on lead scoring describe the product precisely instead of generically. (2) The published intent-data lesson from
  15 October links /features/reddit-x-signals as a working feature; corrections.md now forbids that, so that page
  may want a one-line edit. (3) The voice file is still `untrained`; lessons are written in the house style from
  blog-write.md rather than the founder's own voice.
