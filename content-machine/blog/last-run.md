# Last run: 2026-11-04 (compare task; fired about 22:00 UTC, 00:00 Bucharest on 5 November)

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
