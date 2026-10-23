# Last run: 2026-10-23 (Compare task, compare section; started 20:52 UTC, 23:52 Bucharest)

- Keyword: intentsly vs common room (section compare, cluster intentsly-vs, type comparison, commercial,
  priority 1, difficulty medium), returned by `blog_next.py --section compare`. No PAUSE file, no draft waiting.
- Published: "Intentsly vs Common Room: Signal Tool or Revenue OS?"
  https://intentsly.com/compare/intentsly-vs-common-room
  Gate passed on the fourth blog_gate run (fix 1: meta description trimmed from 161 to 159 characters; fixes 2
  and 3: opening paragraph cut from 106 to 88 words). `blog_cloud.py sql` printed ready on its first run.
  2,573 words by the gate's count (table and link anchors included; body prose about 2,000), 8 H2, 6 FAQ,
  7 internal links, 12 external. The generated SQL ran unchanged on Supabase project uwwajlezgeurnvvrvdvb and
  returned status = published at 21:05:08 UTC. Seventh article of 23 October by UTC; the mark step filed it
  under 24 October Bucharest time because the run crossed midnight, so the 24 October daily count starts at 1.
- Angle: no page ranks for the exact query. The neighbouring pages (Valley's "Valley vs Common Room",
  marketbetter.ai and factors.ai "Common Room alternatives") are all vendor-written and quote Common Room prices
  ($625, "$1,000+", tier names) that Common Room's own pricing page no longer shows (Essential $2,500/month
  billed annually, 5 seats, last modified 29 September 2026). None reads Common Room's LinkedIn integration docs,
  which say: company page only, no personal profiles, no followers "due to API limitations", and the Chrome
  extension stopped capturing engagement from any LinkedIn post on 6 December 2024. The page prints those next
  to Intentsly's own limits, gives Common Room six honest wins (website/product/community signals, account
  layer, sequencer integrations, research agents, SOC 2/GDPR, team size) and ends with a decision rule.
  Brief in blog/briefs/intentsly-vs-common-room.md.
- Facts: Common Room facts only from commonroom.io pages opened today (pricing, /pricing/zra/, LinkedIn
  integration guide, Chrome extension docs and July 2024 post, native signals, signals index, Zapier/API doc,
  S3 export doc, RoomieAI page, homepage, "turn LinkedIn signals into pipeline" post). Their claimed reply-rate
  numbers (21.3%, 9.5%) were NOT used. Intentsly facts from proof.md verified rows (14 demos in 14 days, 4x reply
  rate, 2 accounts, 30/30 caps with 15 recommended, 7-day trial) and product.md. No Intentsly price, no 21%
  figure, no ~1,000 leads figure, no Reddit/X features, no API claim. No em dashes, no banned phrases.
- Note on Common Room's site: commonroom.io now carries a "Zoom" product group (Revenue Accelerator, Engage,
  Dialer) with its own pricing page. The article says only that Engage sequencing "is sold on the same site" and
  makes no claim about the corporate relationship, because no page opened today states it.
- Queue: 7 compare keywords still queued (phantombuster, apollo, linkedin sales navigator, teamfluence, clay,
  11x, heyreach); 61 queued overall, so none added. Blocked keywords: none.
- Connector note: the session again listed a lowercase `supabase` server as failed (ERR_PROXY_TUNNEL); the
  capitalised `Supabase` connector worked after a `select 1` check. `add_repo` was not available as a tool; the
  repository was already in scope and `git pull` succeeded. WebFetch refused commonroom.io URLs typed from
  memory; every page had to be reached through a search result first, which worked.
- For the founder, carried over and new: (1) the 21% reply-rate, ~1,000 leads/month and 2 to 4 meetings rows in
  proof.md still cannot be used until their status cell reads exactly `verified`; (2) export formats are still
  unstated in product.md, so comparisons say "export" without naming CSV or API; (3) the Intentsly price is
  still not citable; (4) confirm whether Intentsly has SOC 2 or a GDPR statement: this page had to say "ask
  Intentsly" in the compliance row, and the next pairings (Apollo, Clay, Sales Navigator) will raise it again;
  (5) a first-hand story from a customer who left a bigger platform for Intentsly would strengthen every
  "vs enterprise tool" page; (6) "intentsly vs phantombuster" is next in the compare queue.
- Live check: NOT possible from this run. Four minutes after the push, WebFetch refused both
  https://intentsly.com/sitemap.xml and the article URL (provenance / robots_disallowed on intentsly.com), and the
  repository has no GitHub Actions workflow to read a deploy status from. The database row returned
  status = published and the push landed on main (e5430c5..a7db498), so the page should appear once the site
  redeploys; Alex should open the URL to confirm.
- Git note: the push was rejected as non-fast-forward until the shallow clone was deepened
  (`git fetch --deepen=20 origin main`), after which it went through. Future runs should deepen before pushing.
