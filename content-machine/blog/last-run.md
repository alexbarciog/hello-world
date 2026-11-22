# Last run: 2026-11-22 (learn task; fired about 19:10 UTC, 21:10 Bucharest)

- Setup: no PAUSE file. Repository already cloned, in scope and on `main`; `add_repo` is not exposed as a tool
  in this session (as on previous runs), `git pull origin main` reported up to date at 2500166. Supabase: the
  lowercase "supabase" connector failed with a proxy tunnel error at session start; the "Supabase" connector
  connected and was used. Web search worked; pages were opened through the web-fetch agent (no direct WebFetch
  tool). Both drafts in blog/drafts/ carry a `blocked:` line (solutions and guides, the gate kw_in issue with
  "business"/"process"), so the queue's next learn keyword was taken. 1 article had been published today
  (Bucharest) before this run (daily cap 7); well under the weekly cap (45).
- Keyword (published, first attempt): what is a product qualified lead (learn, fundamentals, lesson,
  informational, priority 3, difficulty medium).
  "What Is a Product Qualified Lead? PQL Meaning and a Rule"
  https://intentsly.com/learn/what-is-a-product-qualified-lead
- Database: one statement, the generated blog/out/what-is-a-product-qualified-lead.sql (19,967 bytes,
  md5 f8abf59e1ca33ed2b5c236273947f6dc), run unchanged through the Supabase connector. Returned slug
  what-is-a-product-qualified-lead, status = published, published_at 2026-11-22 19:28:51 UTC. No other reads
  or writes.
- Gate: first run failed on two points: meta_description 164 chars (max 160) and title too close to
  what-is-dark-social-in-b2b.md ("... Definition and Examples"). Title changed to "PQL Meaning and a Rule",
  meta description trimmed to 158. Second run passed; blog_cloud.py sql printed "ready": true first time.
  7 H2, 6 FAQ (55 to 65 words each), 9 internal links, 6 external links (all opened today), no em dashes, no
  banned phrases. Gate word count 2,326, in line with the other lessons (lead qualification 2,483, warm lead
  2,313, lead scoring 2,540).
- Angle: page one is glossary-style explainers (Shopify, HubSpot, TechTarget, Mailchimp, Paddle, ProductLed,
  Navattic). All assume a SaaS product with a free trial or freemium plan; none says what a PQL is for a
  service company or software with no self-serve tier, none puts PQLs next to buying signals, and most
  statistics are unlinked or second-hand (Paddle's 13%, 6%, 84 days, 5 to 6x; HubSpot's 20% activation
  example is an arithmetic slip; Navattic's Forrester 68% has no link). This page gives the definition, the
  three parts of any PQL rule (fit, value moment, threshold), a four-row table for businesses without a free
  plan, a PQL vs MQL vs SQL vs buying signal table, the PQL rate formula, and a three-line worksheet.
- Outside sources opened today and cited: First Round Review Slack launch interview (Feb 2015: 2,000
  messages, 93% still using Slack, >90% of sign-ups never invite anyone), Tomasz Tunguz PQL post (Jan 2013:
  PQL definition, "about 25 to 30%" when sales calls PQLs, labelled as his own figure), OpenView 2023 Product
  Benchmarks with Pendo (~1,000 respondents; tracking PQLs/PQAs +61% likelihood of fast growth, fast = 75%+
  YoY), ProductLed beginner's guide (Facebook 7 friends, Drift 100 conversations, "10 log-ins" minimum viable
  PQL), HubSpot PQL article (four PQL types attributed to Christopher O'Donnell), Shopify (PQL rate formula).
  Not used: Gainsight 2.8x (gated, second-hand from "PLG Index 2022"), Paddle's unlinked figures. Userpilot
  and two OpenView blog URLs returned no article content.
- Intentsly facts used: 14 qualified demos in 14 days, zero manual outreach, 4x reply rate (case study,
  labelled as our own launch); /try-ai shows matching buyers with no account (product.md). No price, no
  Reddit/X features, no NOT-LIVE epics mentioned. CTA: /signal-playbook.
- Queue after this run: 8 learn keywords still queued (what is a sales qualified lead, what is an sdr, what
  is sales prospecting, what is a marketing qualified lead, what is a discovery call in sales, what is
  account-based marketing, what is a sales pipeline, what is a lead in sales); 30 learn published. No new
  keywords added (threshold is fewer than 5).
- Verification: see the run report (sitemap and page fetched about 4 minutes after the push).

## For the founder
- The two blocked drafts (get-clients-for-an-ai-consulting-business, outbound-sales-process-for-startups)
  stay blocked by the gate's kw_in singular/plural rule on "business" and "process"; only a change to
  scripts/blog_gate.py (which the tasks may not edit) or a reworded keyword will free them.
- A first-hand PQL or trial-activation number for Intentsly (for example, what share of /try-ai visitors or
  7-day trials reach their first signal, and whether that predicts conversion) would turn the next lessons
  (sales qualified lead, marketing qualified lead, lead in sales) from definitions into pages with our own data.
- brain/stories/ still has one story. One more customer story (with permission to name them) would let the
  learn lessons stop reusing the 14-demos launch as the only first-hand case.
