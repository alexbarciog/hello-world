# Last run: 2026-11-04 (learn task; fired about 19:10 UTC, 21:10 Bucharest)

- Setup: no PAUSE file. Repository already cloned and in scope; `git pull origin main` was up to date at 312cb16.
  `add_repo` was not available as a tool, as on previous runs. Supabase: the lowercase "supabase" connector reported
  a proxy tunnel error at session start; the "Supabase" connector connected and was used. The only other draft in
  blog/drafts/ (outbound-sales-process-for-startups.md, guides) carries a `blocked:` line, so it was not resumed.
- Keyword (published): what is signal-based selling (section learn, cluster fundamentals, lesson, informational,
  priority 2, difficulty medium).
  "What Is Signal-Based Selling? Definition, Test and Routine"
  https://intentsly.com/learn/what-is-signal-based-selling
  Gate: ready: true on the first run, 2,043 words, 7 H2, 6 FAQ, 11 internal links, 4 external links, no warnings.
  Over the page-write guide's 1,800-word suggestion for a lesson, under the gate's 4,000 cap; the extra length is
  the four-way comparison table and the FAQ, which answer the "vs" and "examples" queries the secondary keywords
  target. Title similarity to published titles peaks at 0.65 (limit 0.75).
- Angle: page one is entirely vendor pages (Cognism, Abmatic, Autobound, Komo, Amplemarket, Findymail, Cleverly,
  Dreamdata, Common Room), each with its own definition, a list of signal types, a workflow and its product. None
  gives a test for telling a signal from activity, none separates the method from the data products sold under the
  name, and the reply-rate and close-rate multiples they quote (2-4x, 3-5x, 5-10x, 15-25% vs 3-5%, 33-41% vs
  18-25%) disagree with each other and trace to vendor reports, a LinkedIn post or nothing. This lesson gives the
  one-sentence definition, a two-question test, the four-way "vs" table (intent data, trigger events, account-based
  selling), says plainly that the quoted multiples have no primary source, gives the hand-run LinkedIn routine with
  search strings, and reports the 14-demos story as the only first-hand number, labelled as one company, two weeks.
- Outside sources opened today and linked: Gartner press release 9 March 2026 (646 B2B buyers, Aug to Sep 2025,
  67% prefer a rep-free experience, "fewer early interactions"); Ehrenberg-Bass Institute summary of the LinkedIn
  B2B Institute study by John Dawes (up to 95% of businesses not in the market at any one time, five-year switching
  cycles); Common Room, 28 August 2026 (page view is activity, not a signal); Abmatic, 29 April 2026 (reply-rate
  lift attributed to "practitioner reports"). MadKudu's help page now redirects to help.hginsights.com and could not
  be opened (fetch permission), so it is not cited. No competitor is described as a competitor; vendor pages are
  cited only for what they say about the term.
  Intentsly facts used: 14 qualified demos in 14 days, zero manual outreach, reply rate 4x previous cold campaigns,
  most leads from signals caught in real time (story + /case-studies); product.md signal types (keyword posts, post
  engagement, scoring against the profile; LinkedIn only); free Buying Signal Playbook (12 to chase, 8 to ignore).
  No price, no Reddit/X claims, no 21% reply-rate figure, nothing from the NOT LIVE epics.
- Database: the generated SQL ran unchanged on project uwwajlezgeurnvvrvdvb and returned slug
  what-is-signal-based-selling, status published, published_at 2026-11-03 19:28:05 UTC. That timestamp is older
  than this run: a row with this slug already existed, so yesterday's learn run (3 November, about 19:28 UTC)
  inserted a version of this page into the database but never marked it, committed it or wrote a last-run entry.
  The upsert replaced that content with today's version and kept the original published_at (the SQL's coalesce).
  No other statement was run. `blog_cloud.py mark` filed the article and set the keyword to published.
- Queue: 6 `learn` keywords remain queued (next: what is a sales trigger), so blog-keywords did not run.
  14 learn lessons published.
- Daily cap: second page of 4 November by Bucharest time (cap 7); weekly count under 45.
- For Alex: (1) yesterday's learn run left a database row without a commit; if other sections show the same
  pattern (a live page with no file in blog/published/), the keyword will be picked again and the page rewritten,
  which is what happened here; (2) "what is a sales trigger" is next in the queue and the trigger-event lesson
  already defines the term in its vs table, so consider merging or dropping that keyword; (3) a customer example
  of signal-based selling with a before/after reply rate would replace the launch story that every lesson reuses;
  (4) a price is still blocked by the corrections log; (5) the 21% reply-rate row is still unused pending a
  phrasing you are happy with.
- Live check: see the note below once it has run.

---

# Previous run (kept because the two runs pushed within the same hour)


- Setup: no PAUSE file. Repository already cloned and in scope; `git pull origin main` was up to date at 312cb16.
  `add_repo` was not available as a tool, as on previous runs. Supabase: the lowercase "supabase" connector reported
  a proxy tunnel error at session start; the "Supabase" connector connected and was used. The only other draft in
  blog/drafts/ (outbound-sales-process-for-startups.md, guides) carries a `blocked:` line, so it was not resumed.
- Keyword (published): intentsly vs waalaxy (section compare, cluster intentsly-vs, comparison, commercial,
  priority 2, difficulty medium).
  "Intentsly vs Waalaxy: Sequences on a List or an AI SDR?"
  https://intentsly.com/compare/intentsly-vs-waalaxy
  Title similarity against published titles: 0.68 at most (Apollo page), under the 0.75 limit; 55 characters.
  Gate: first run failed only on the opening paragraph (94 words, max 90); two trims later the third run printed
  ready: true at 2,506 words, 8 H2, 6 FAQ, 8 internal links, 9 external links, no warnings. Six words over the
  page-write guide's 2,500 suggestion, well under the gate's 4,000 cap.
- Angle: page one for Waalaxy comparisons is G2/Capterra/TrustRadius checkbox grids and reviews written by competing
  vendors (Valley, Linked Helper); none mention Intentsly, none link Waalaxy's export steps. This page compares job by
  job from Waalaxy's own pricing page, feature pages, AI-info page, lemlist comparison and limits article (updated
  24 September 2026), names the two deciding rows (who finds the lead, who answers the reply), prints both tools'
  daily limits side by side and says plainly that Waalaxy allows far more volume per account, states the overlap
  honestly (Waalaxy's feature page says it imports people who react to or comment on your posts and can target
  people "engaging with competitors or Key Opinion Leaders"), and builds the switch list on Waalaxy's own CSV export.
- Waalaxy facts used (all waalaxy.com, opened 4 November 2026 UTC, linked in the page): Pro €19 / Advanced €49 /
  Business €69 per user per month as printed, with a Monthly / Quarterly -20% / Yearly -50% toggle; the lemlist
  comparison page says €19 is "billed yearly", so the page tells readers the monthly-billing price is higher and
  to check the toggle. Inbox add-on: €20/month in the pricing FAQ, €10/month on the lemlist comparison page; the
  page reports both and says to confirm in the app. 300 / 800 / 800 invitations a month; 25 / 25 / 500 finder
  credits; limits article: Pro 11 invitations a day, Advanced and Business 100 a day and 200 a week, 120 to 150
  messages a day, 2 min 30 s spacing, 80 to 100% randomisation; 14-day trial; cold email and multiple senders on
  Business; API and Zapier/Make/n8n from Advanced; HubSpot, Pipedrive, Salesforce; "Full CSV export with history";
  "100% cloud-based"; AI assistant marked "(soon)" on the homepage; 10 languages; "guaranteed 61%+ match rate".
  Not used: Waalaxy's self-reported 33.5% acceptance and 16.2% reply rates (vendor claims, not needed);
  competitor reviews' figures (monthly €39/€99/€139, extension removed July 2026) because they are not from
  Waalaxy's own site.
  Intentsly facts used: 14 demos in 14 days, zero manual outreach, 4x reply rate (verified proof), 2 accounts,
  30/30 with 15 recommended, four languages, HubSpot/Cal.com/Google Calendar, export without naming a format,
  no API, /try-ai, 7-day trial, no price, no email sending, no Reddit/X claims.
- Database: the generated SQL ran unchanged on project uwwajlezgeurnvvrvdvb and returned slug intentsly-vs-waalaxy,
  status published, published_at 2026-11-04 22:08:28 UTC. No other statement was run. `blog_cloud.py mark` filed
  the article and set the keyword to published.
- Queue: 7 `compare` keywords remain queued (next: intentsly vs expandi, then dripify, lemlist, la growth machine,
  artisan, aisdr, salesrobot), so blog-keywords did not run. 12 compare pages published.
- Caps: by Bucharest time this is the first page of 5 November (cap 7); the gate's weekly count stayed under 45.
- For Alex: (1) a customer who moved from a sequence tool (Waalaxy, Expandi, Dripify) to Intentsly, with one number,
  would replace the launch story that every compare page reuses; (2) confirm whether "AI-powered lead scoring" on
  the Intentsly side should be described as scoring only, or whether there is a visible score the reader can
  check, since Waalaxy now also claims AI lead scoring on one page; (3) confirm the export formats (CSV? API?),
  because every compare page has to write "export" without naming one while competitors print "CSV"; (4) a price
  is still blocked by the corrections log, so every pricing section points to /pricing while Waalaxy's euro prices
  are printed in full; (5) the self-serve $97 plan, templates and done-for-you setup are still marked NOT LIVE in
  product.md and were not mentioned.
- Live check: see the note appended below after the push.
