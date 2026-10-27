# Last run: 2026-10-27 (learn task, learn section; started about 19:10 UTC, 21:10 Bucharest)

- Keyword: what is a trigger event in sales (cluster fundamentals, type lesson, intent informational, priority 2,
  difficulty medium). `blog_next.py --section learn` returned it directly. No PAUSE file, no draft waiting.
  Repository already cloned and in scope with push access; `git pull origin main` was up to date at 4f5eed9.
  `add_repo` was not available as a tool, as on previous runs.
- Published: "What Is a Trigger Event in Sales? Definition and Examples"
  https://intentsly.com/learn/what-is-a-trigger-event-in-sales
  `blog_gate.py` failed once on meta_description length (171, then 162 chars), fixed by shortening; `blog_cloud.py
  sql` printed ready on its first run. 8 H2, 5 FAQ, 8 internal links, 6 external, 2,091 words by the gate's count
  (the two tables hold about 250 of them; the published lessons sit at 1,980 to 2,070 by the same count).
  Fourth page of 27 October (daily count 4 of 7); weekly cap not reached.
- Database: a read-only select first confirmed no row existed for this slug (the two other rows published today
  were scrape-linkedin-post-likers-and-commenters and qualify-leads-before-outreach; find-customers-on-linkedin
  keeps its 24 October published_at). The generated SQL ran unchanged on project uwwajlezgeurnvvrvdvb and returned
  status published, published_at 2026-10-27 19:27:06 UTC. A second read-only select confirmed the stored content_md
  matches the local body (md5 7f241124fa510847569506fce270fd05, 12,946 characters, word_count 2091).
- Angle: the ranking pages (HubSpot 29 types, Crunchbase, UserGems 23 types, Salesforge, Autobound 60 signals, Komo
  glossary) are definition plus a long list plus the vendor's product, with statistics that are either self-reported
  or trace to a 74% "Forrester via Craig Elias" figure whose primary document is not reachable online. This lesson
  separates what a trigger tells you (the company has a new reason) from what it does not (which person, whether
  anyone is acting), uses Craig Elias's three types (Bad Experience, Transition, Awareness) with a link to his 2008
  article, says plainly that the travelling statistics are weak, adds a "trigger event vs buying signal vs sales
  trigger" table (the third column covers the CRM-automation meaning), and gives a five-deals rule plus three
  LinkedIn Posts-tab search strings for the triggers a small team can see without a database. Brief in
  blog/briefs/what-is-a-trigger-event-in-sales.md. Labelled hypothetical example: Northgate Payroll.
- Outside statistics, from primary pages opened today and linked in the same paragraph: Gartner press release
  9 March 2026 (646 buyers, Aug to Sep 2025; 67% prefer a rep-free experience; "fewer early interactions") and Gartner
  press release 20 May 2026 (reps "the most important information source when buyers are researching a business
  problem or need"). The 74% figure appears only to say it has no reachable source, linked to the 2013 InsideSales
  article that quotes it. HubSpot and Autobound are linked as examples of long lists. Intentsly facts only from
  product.md (LinkedIn keyword posts and competitor-post engagement, scoring, LinkedIn as the only source) and the
  verified playbook row (twelve to chase, eight to ignore, written in words). No price, no 21% or ~1,000 figures, no
  Reddit/X claim, no email-sending claim.
- Links: /learn/what-is-a-buying-signal, /learn/what-is-intent-data, /learn/what-is-an-ideal-customer-profile,
  /learn, /guides/find-decision-makers-on-linkedin, /guides/set-up-signal-based-outbound,
  /features/linkedin-signals (contextual sentence at the "which triggers can you see" step), /signal-playbook (CTA in
  the this-week section and the closing).
- Live check: not completed from this run, as on previous runs. Pushed at 19:29:39 UTC (4f5eed9..66f9797). At
  19:34 UTC the fetch tool asked for a permission to open intentsly.com/sitemap.xml and the /learn URL, nobody was
  there to grant it, and the request was withdrawn; a fetch of the homepage (found through web search) was refused by
  the site's robots rules for the fetcher. The repository has no GitHub Actions workflow, so the deploy could not be
  checked from the API either. The row is `status = published`, so the page goes live when the host finishes the build
  triggered by the push. Alex should open https://intentsly.com/learn/what-is-a-trigger-event-in-sales and the
  sitemap once. If live checks matter, a small GitHub Actions workflow in the site repo that curls the new URL after
  deploy, or adding intentsly.com to the fetch tool's allowed domains for this task, would let runs confirm it.
- Queue: 5 learn keywords still queued (54 across all sections), so none added (RUN.md adds only below 5). Blocked
  keywords: none. Note: "what is a sales trigger" is still queued and this page already defines that term in its vs
  table and FAQ; the next learn run should either skip it (`blog_next.py set "what is a sales trigger" skipped`) or
  treat it as an update of this page rather than a new one, to avoid two pages on one keyword family.
- Connector note: as on previous runs, a lowercase `supabase` server was listed as failed (ERR_PROXY_TUNNEL) while
  the capitalised `Supabase` connector worked (a read-only `select 1` confirmed it before any write).
- For Alex: (1) decide on "what is a sales trigger" (skip or merge, above); (2) a real story of a deal that started
  from a trigger event (a new hire, a funding post, a complaint you replied to) would replace the Northgate
  hypothetical and give the lesson a first-hand number; (3) the gate still rejects the 21% reply rate and ~1,000
  leads/agent figures because their proof.md status reads "verified: ..." rather than exactly "verified"; (4) confirm
  whether job-change posts or hiring posts are, or will be, a monitored keyword-post type, since this page tells
  readers to run those searches by hand and says job boards stay manual; (5) the lessons are running about 2,000
  words by the gate's count against the 1,000 to 1,800 range in page-write.md; say if you want them shorter.
