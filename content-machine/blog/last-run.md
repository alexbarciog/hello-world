# Last run: 2026-10-28 (daily blog task, blog section; started 06:52 UTC, 09:52 Bucharest)

- Keyword: linkedin buying signals (cluster linkedin-signals, type pillar, intent informational, priority 1,
  difficulty medium). `blog_next.py --section blog` returned it directly. No PAUSE file, no draft waiting.
  Repository already cloned and in scope with push access; `git pull origin main` was up to date at 6e7c484.
  `add_repo` was not available as a tool, as on previous runs.
- Published: "LinkedIn Buying Signals: 12 Worth Chasing, Sorted by Where You See Them"
  https://intentsly.com/blog/linkedin-buying-signals
  `blog_gate.py` failed once (meta_description 161 chars, opening 92 words, and "21%" flagged as an unsourced
  statistic); fixed by shortening both and dropping the 21% figure. `blog_cloud.py sql` printed ready on its
  first run. 11 H2, 6 FAQ, 10 internal links, 4 external, 3,091 words by the gate's count (two tables hold a
  good share). First page of 28 October; weekly cap not reached.
- Database: a read-only select first confirmed no row existed for this slug and nothing else published today.
  The generated SQL ran unchanged on project uwwajlezgeurnvvrvdvb and returned status published, published_at
  2026-10-28 07:11:16 UTC.
- Angle: the first page is six vendor blogs (Valley, ColdIQ, Clearcue, Updately, Tapistro, OutX), each a list of
  7 to 14 signals with unsourced reply-rate ranges and a pitch. This page sorts 12 signals by where you can
  see them (free account / Sales Navigator / only a watcher), quotes LinkedIn's own pages for what the Job
  Changes spotlight and Buyer Intent cover and do not, gives a points table with a decay rule, lists the
  signals not worth a message, and carries the 14-demos run. Brief in blog/briefs/linkedin-buying-signals.md.
- External sources opened today and linked: business.linkedin.com/sell/sales-navigator/how-to-use (Job
  Changes spotlight, "62% more receptive" quote, alerts), business.linkedin.com/sell/resources/sales-terms/
  buyer-intent (the Buyer Intent signal list), coldiq.com/blog/buying-signals-linkedin (Sales Navigator filter
  paths, cited as a vendor walkthrough), tapistro.com/blog/linkedin-buying-signals (its "operating defaults"
  caveat). The LinkedIn help-centre Spotlights page (linkedin.com/help/sales-navigator/answer/a105146) refused
  automated readers, so the exact filter names beyond Job Changes are attributed to ColdIQ with a "check in
  your own account" caveat. The PhantomBuster result redirected off-domain (tealde.ai) and was not used.
- Intentsly facts only from product.md and the plain-`verified` proof rows (14 demos in 14 days, 4x reply
  rate, 12 signals and 8 to ignore, 7-day trial, 2 accounts, 30/30/15, /try-ai). The "around 1,000 leads a
  month per agent" and "2 to 4 meetings a week, typical" figures are used once, attributed "across Intentsly
  customers in October 2026" as corrections.md asks. The 21% reply rate was removed: its proof row reads
  "verified: say ..." rather than plain "verified", so the gate does not accept it (see note for Alex). No
  price, no Reddit/X claim, no email-sending claim, no Mike Ruiz quote.
- Links: /learn/what-is-a-buying-signal, /guides/linkedin-lead-generation-guide,
  /guides/set-up-signal-based-outbound, /blog/track-competitor-linkedin-post-engagers,
  /features/linkedin-signals (contextual sentence at the "spot the repeat competitor engager" step),
  /blog/linkedin-message-templates-for-buying-signals, /case-studies, /try-ai, /signal-playbook (closing),
  /learn/what-is-intent-data (FAQ).
- Live check: not possible from this run, as before (the fetch tool asks for a permission on intentsly.com
  that nobody is there to grant). The row is `status = published`, so the page goes live when the host
  finishes the build triggered by the push.
- Queue: 30 blog keywords still queued, so none added. Blocked keywords: none.
- Connector note: a lowercase `supabase` server was listed as failed (ERR_PROXY_TUNNEL) while the capitalised
  `Supabase` connector worked (a read-only select ran before the write), as on previous runs.
- For Alex: (1) proof.md rows whose status cell reads "verified: <phrasing note>" are not counted as verified
  by the gate (it matches the cell exactly), so 21%, ~1,000, 2 to 4 meetings and the GrowthLab quote can only
  be used where the gate's statistic check does not fire; if you want 21% usable, split the phrasing note into
  the Claim cell and leave the Status cell as plain "verified" (your edit, not the run's); (2) a first-hand
  example of one signal that led to a real customer (what they posted, what we sent, how long it took) would
  replace the generic timing rules with a measured one; (3) confirm whether the signal decay the product
  applies matches the 7/30/90-day rule the article suggests, so the page and the product agree; (4) open
  https://intentsly.com/blog/linkedin-buying-signals once after the deploy.
