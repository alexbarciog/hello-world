# Last run: 2026-11-21 (learn task; fired about 19:20 UTC, 21:20 Bucharest)

- Setup: no PAUSE file. Repository already cloned, in scope and on `main`; `add_repo` is not exposed as a tool in
  this session (as on previous runs), `git pull origin main` reported up to date at 2f9f50b. Supabase: the
  lowercase "supabase" connector failed with a proxy tunnel error at session start; the "Supabase" connector
  connected and was used. Web search worked; pages were opened through the web-fetch agent (no direct WebFetch
  tool). Both drafts in blog/drafts/ carry a `blocked:` line (solutions and guides, gate kw_in issue), so the
  queue's next learn keyword was taken. 1 article had been published today (Bucharest) before this run (daily
  cap 7); well under the weekly cap (45).
- Keyword (published, first attempt): what is competitor monitoring in sales (learn, signal-selling, lesson,
  informational, priority 3, difficulty medium).
  "What Is Competitor Monitoring in Sales? Meaning and Signals"
  https://intentsly.com/learn/what-is-competitor-monitoring-in-sales
- Database: one statement, the generated blog/out/what-is-competitor-monitoring-in-sales.sql (20,557 bytes,
  md5 7a4051031e3d75a681cf5b855248e55f), run unchanged through the Supabase connector. Returned slug
  what-is-competitor-monitoring-in-sales, status = published, published_at 2026-11-21 19:28:49 UTC. No other
  reads or writes.
- Gate: first run failed on one point: meta_description 165 chars (max 160). Rewritten; second run passed with no
  warnings; blog_cloud.py sql printed "ready": true. One further edit (moved the 54%/48% source-mix statistic
  to the Crayon page it actually appears on, added the Rivalize link) and a third run, also clean. 8 H2, 6 FAQ,
  11 internal links, 4 external links (all opened today), no em dashes, no banned phrases. Gate word count
  2,373, in line with the other learn pages (1,798 to 2,152 by the same count).
- Angle: page one is vendor explainers written for pricing, marketing or CI-platform buyers (Pricefy, A-Insights,
  nRev, Stealery, Owler, Elevated Signal, 7SearchPPC; also read Contify, Crunchbase, Rivalize, Klue, ZoomInfo,
  Aomni for the vs section). All define monitoring as tracking a rival's pages; every signal is company-level;
  nobody treats a competitor's LinkedIn followers, post engagers or commenters as a prospecting source; no sample
  messages; most numbers are Crayon 2026 quoted second-hand. This lesson defines the term from the seller's side
  (output = a named person and a moment), gives a five-signal table with where to see each on LinkedIn by hand,
  a monitoring vs CI vs analysis vs battlecard table, a "when it is the wrong tool" section, and links the two
  primary surveys directly.
- Outside sources opened today: Crayon 2026 State of Competitive Intelligence (blog post 8 Jul 2026 and report
  landing page: seven in ten teams say at least half of opportunities are competitive; ~56% share CI weekly or
  faster; revenue impact 79% vs 41%; internal data 54% vs competitor websites 48%; nearly eight in ten track 30
  or fewer competitors), 6sense 2025 Buyer Experience Report via Business Wire (4,000+ buyers; 94% of buying
  groups ranked preferred vendors before first contact; bought from the preliminary favourite 77% of the time),
  Rivalize (monitoring vs intelligence framing, no numbers). Gartner press releases could not be opened (fetch
  permission prompt), so no Gartner figures were used.
- Intentsly facts used: 14 demos in 14 days, zero manual outreach, 4x reply rate (case study, labelled as our
  own launch), 30/30/15 caps, LinkedIn signals feature (competitor page followers and engagers, keyword posts,
  hashtags, ICP scoring), Buying Signal Playbook (12 worth chasing, 8 to ignore). No price. No Reddit/X claims.
  CTA is /signal-playbook as page-write.md requires for /learn, plus /features/linkedin-signals.
- Queue: 9 learn keywords remain queued (5 or more, so no new keywords were added this run). Next up:
  "what is a sales qualified lead".
- Push: origin/main moved 2f9f50b -> d0a5184 at 19:29 UTC (message `learn: publish what-is-competitor-monitoring-in-sales`).
  The live-page and sitemap fetch 4 minutes after the push (19:34 UTC) could NOT be completed: as on the five
  previous runs, the web-fetch agent's requests for https://intentsly.com/sitemap.xml and
  https://intentsly.com/learn/what-is-competitor-monitoring-in-sales were stopped by a permission prompt
  (PROVENANCE_REQUIRED) that an unattended run cannot answer. The page is confirmed published in the database
  (status = published) and the deploy commit is on main, but "live" and "in the sitemap" are unverified.

## For Alex
- A customer story about competitor signals (one line: which competitor they watched, what came back) would let
  this lesson, the competitor-monitoring guide and the post-engagers article use a first-hand example other than
  our own launch.
- proof.md still has the 21% reply rate, ~1,000 leads and 2 to 4 meetings rows with a "verified: say ..." status
  cell. The gate only treats a row as verified when the cell is exactly `verified`, so those figures cannot be
  used; if you want them on pages, change the cells to `verified` and move the phrasing note into the Claim column.
- The two blocked drafts (ai consulting business, outbound sales process for startups) still need either a gate
  fix in scripts/blog_gate.py (kw_in strips a trailing "s" from "business" and "process") or a keyword rephrase;
  this task is not allowed to edit scripts/.
- Allowing intentsly.com (and gartner.com) fetches for this task, or adding a direct WebFetch tool, would let
  runs verify the live page and the sitemap and use Gartner's buyer research as a source.
- Agent templates, self-serve billing, done-for-you setup, the new free tools and the email digests are all
  still marked NOT LIVE in brain/wiki/product.md. Pages cannot mention them until those lines say "live".
