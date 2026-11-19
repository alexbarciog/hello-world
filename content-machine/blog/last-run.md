# Last run: 2026-11-19 (blog task; fired about 07:00 UTC, 09:00 Bucharest)

- Setup: no PAUSE file. Repository already cloned, in scope and on `main` (`add_repo` still not exposed as a
  tool, as on previous runs); `git pull origin main` reported already up to date at 9c360b0. Supabase: the
  lowercase "supabase" connector again failed with a proxy tunnel error at session start; the "Supabase"
  connector connected and was used. Web search worked. The two older drafts in blog/drafts/
  (get-clients-for-an-ai-consulting-business.md, outbound-sales-process-for-startups.md) still carry a
  `blocked:` line, so neither was resumed. 0 articles had been published today (UTC) before this run
  (daily cap 7); the gate reported no weekly-cap problem (cap 45).
- Keyword (published, first attempt): intent signals vs intent data (blog, signal-selling, explainer,
  informational, priority 2, difficulty low).
  "Intent Signals vs Intent Data: Which Tells You Who to Call?"
  https://intentsly.com/blog/intent-signals-vs-intent-data
- Orphan check: a read-only select for the slug before writing returned no row. Supabase returned
  status = published, published_at 2026-11-19 07:05:41 UTC. Writes: the one generated SQL statement, pasted
  whole from blog/out/intent-signals-vs-intent-data.sql (20,982 bytes). Reads: three selects (the slug
  pre-check, a count of posts published today, and a post-insert comparison). The post-insert check compared
  length and md5 of content_md (15,988 chars, b679521a...), word_count (2514), reading_minutes (11), 4
  secondary keywords, 6 FAQ entries, section and type against the local file: all matched exactly.
- Gate: first run failed only on the opening paragraph (98 words against 90); trimmed it, shortened the
  title from 63 to 59 characters, and the gate passed with no warnings. blog_cloud.py sql printed
  "ready": true with no warnings. 2,514 words (explainer range 1,100 to 4,000), 10 H2, 6 FAQ (50 to 70
  words each), 10 internal links, 6 external links, no em dashes, no banned phrases. meta_title 58 chars,
  meta_description 149.
- Angle: every first-page result is a vendor (Landbase, B2B Data Scout, Autobound, SalesIntel,
  DemandScience, Rodz, Common Room) defining the two terms so its own product is the answer, with lifts
  (4x, 93%, 400%, "48% false positives") that trace to no readable source. This page gives a one-question
  test ("can I quote the action and name the person?"), shows what Bombora and G2 actually output from their
  own documentation (Company Surge: score 60+ = spiking, latest 3 weeks vs a 12-week baseline, account
  level; G2: company level, Buying Stage plus Activity Level, updated daily), states where intent data,
  signals and Intentsly's LinkedIn signals are each the wrong buy, gives a decision rule by team size and
  deal size, and uses the 14-demos story labelled as one company. Brief: blog/briefs/intent-signals-vs-intent-data.md.
- Outside sources opened 2026-11-19 and linked: bombora.com/intent/, customers.bombora.com/crc-brand/thresholding,
  documentation.g2.com/docs/buyer-intent, businesswire.com (6sense 2025 Buyer Experience Report, 12 Nov 2025:
  4,000+ buyers, 94%, 77%, 60/40, ~10 months), salesintel.io/blog/buying-signals-vs-intent-data,
  commonroom.io/blog/intent-data-vs-buyer-intelligence. Not used: third-party price figures for Bombora and
  6sense (not from the vendors' own sites), the "39% rate intent data highly accurate" DGR figure (seen only
  second-hand on Autobound; the DGR landing page shows no numbers), and the Gartner 2026 press release
  (web fetch needed a permission that an unattended run cannot grant).
- Intentsly facts used: product.md confirmed rows (LinkedIn signals only: post engagement, keyword posts,
  competitor page followers, hashtag engagement; ICP scoring; AI SDR sends the first LinkedIn message; no
  email or Reddit monitoring; /try-ai with no account) and proof.md verified rows (14 demos in 14 days,
  4x reply rate, 12 signals worth chasing and 8 to ignore). No Intentsly price stated. The one example
  message is labelled as a hypothetical, not one we sent.
- Blog queue after this run: 21 keywords still queued, so step 6 (add more when fewer than 5) did not trigger.
- Verification: database row confirmed published and content-identical to the local file; commit pushed to
  origin/main (hash in the git log). The live page at intentsly.com/blog/intent-signals-vs-intent-data was not
  fetched this run (the web-fetch tool needs a URL permission an unattended run cannot grant), so live status
  and sitemap listing depend on the redeploy triggered by the push.
- For the founder: (1) a second first-hand story, ideally a customer who moved from an account-level intent
  data contract to LinkedIn signals (with permission and a before/after reply rate), would give the
  signal-selling cluster something beyond the launch case; (2) confirm whether the AI SDR's first message
  quotes the triggering post, so articles can say so instead of "sends the first LinkedIn message";
  (3) the two blocked drafts still wait on first-hand material (AI consulting clients; startup outbound
  process); (4) confirm the pricing figure so pages can print a number.
