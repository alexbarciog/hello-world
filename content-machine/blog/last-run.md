# Last run: 2026-11-02 (compare task; fired about 21:50 UTC, 23:50 Bucharest)

- Setup: no PAUSE file. Repository already cloned and in scope; `git pull origin main` was up to date at 7e82d6d
  (detached HEAD, re-attached to main before committing). `add_repo` was not available as a tool, as on previous
  runs. Supabase: the lowercase "supabase" connector reported a proxy tunnel error at session start; the "Supabase"
  connector connected and was used. The only draft in blog/drafts/ besides this one
  (outbound-sales-process-for-startups.md, guides) carries a `blocked:` line, so it was not resumed.
- Keyword (published): intentsly vs heyreach (section compare, cluster intentsly-vs, comparison, commercial,
  priority 2, difficulty medium).
  "Intentsly vs HeyReach: Sending Engine or AI SDR?"
  https://intentsly.com/compare/intentsly-vs-heyreach
  Gate: first run failed only on the opening paragraph (97 words, max 90); one clause cut, second run printed
  ready: true at 2,158 words, 8 H2, 6 FAQ, 8 internal links, 8 external links, no warnings. Title similarity
  checked first (0.63 against the Apollo comparison, limit 0.75).
- Angle: nothing ranks for the pairing; page one is HeyReach reviews by competing vendors (lemlist, Valley) and
  directories, none mentioning Intentsly. This page takes HeyReach's side only from heyreach.io and help.heyreach.io
  opened today, names the two deciding rows (who finds the lead: HeyReach imports the list you bring; who answers the
  reply: HeyReach's unified inbox for a person, Intentsly's AI SDR), prints both tools' LinkedIn limits, lists six
  places HeyReach is the better buy, and gives a switch list built on HeyReach's CSV export rule.
- HeyReach sources opened: pricing page (Growth $79/sender monthly, $72 quarterly, $64 yearly; Agency $999;
  Unlimited $2,999, fair-use 300 senders; 14-day trial no card), plans help article of 11 Sep 2026 (10+ senders $59;
  Agency 50 $1,399; Early Stage program), homepage, connection-request limits article of 28 Aug 2026 (200/week,
  up to 40/day, 25 recommended), sending-limits article, n8n replies post of 14 Jul 2026 (no native auto-reply
  described), alternatives post updated 30 Oct 2026, leads screen article of 15 Aug 2026 (CSV export, default columns
  only). The pricing page and help article differ slightly on quarterly/yearly figures ($72/$64 vs $71/$63); the page
  quotes the pricing page. Third-party claims (Valley's session-cookie point, lemlist's stack cost) were not used.
  Intentsly facts used: 14 demos in 14 days, zero manual outreach, 4x reply rate, 2 accounts, 30/30 with 15
  recommended, languages, 7-day trial, /try-ai, no price, no email sending, no Reddit/X claims.
- Database: the generated SQL ran unchanged on project uwwajlezgeurnvvrvdvb and returned slug intentsly-vs-heyreach,
  status published, published_at 2026-11-02 21:56:33 UTC. No other statement was run. `blog_cloud.py mark` filed the
  article and set the keyword to published.
- Queue: 8 `compare` keywords remain queued (waalaxy, expandi, dripify, lemlist, la growth machine, artisan, aisdr,
  salesrobot), so blog-keywords did not run. 11 compare pages published.
- Daily cap: sixth page of 2 November by Bucharest time (cap 7); weekly count under 45.
- For Alex: (1) confirm a price so comparison pages can quote Intentsly's next to the competitor's (the corrections
  log still blocks it); (2) a customer example with one number from a team that moved off a sending tool like
  HeyReach would beat reusing the 14-demos launch story; (3) the 21% reply-rate row in proof.md is still not accepted
  by the gate as a plain number; (4) allowing intentsly.com for the fetch tool in this task's settings would let runs
  confirm the sitemap directly.
- Live check: see the run report (done after the push).
