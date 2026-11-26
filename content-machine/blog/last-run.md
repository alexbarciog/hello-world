# Last run: 2026-11-26 (blog task; fired about 06:45 UTC, 08:45 Bucharest)

- Setup: no PAUSE file. Repository already cloned, in scope and on `main`; `add_repo` is not exposed as a tool in this
  session (as on previous runs). `git pull origin main` brought main from fdf23c1 to d07867a. Supabase: the lowercase
  "supabase" connector failed with a proxy tunnel error at session start; the "Supabase" connector connected and was
  used. Web search worked; pages were opened through the web-fetch agent (no direct WebFetch tool). Both drafts in
  blog/drafts/ still carry a `blocked:` line (gate kw_in strips every trailing "s"; see 2026-11-15 notes), so the
  queue's next blog keyword was taken. 1 article published on the 26th (Bucharest) after this one; well under the
  weekly cap of 45.
- Keyword (published, first keyword tried): signal-based outreach statistics (blog, data cluster, data type,
  informational, priority 2, difficulty low).
  "Signal-Based Outreach Statistics: 14 Numbers, Each Traced"
  https://intentsly.com/blog/signal-based-outreach-statistics
- Database: one insert, the generated blog/out/signal-based-outreach-statistics.sql (23,235 bytes, md5
  1d6d72dc87334db90a71c5df7ac9d014), run unchanged through the Supabase connector. Returned slug
  signal-based-outreach-statistics, status = published, published_at 2026-11-26 07:07:44 UTC. Verified afterwards
  with a read: section blog, article_type data, word_count 2429, reading_minutes 11, 6 FAQ entries, content_md
  md5 efc06e5fd153aba79bc071f204147b40, which matches the body in the SQL file exactly. No other writes.
- Gate: first blog_gate.py run failed on two points: five percentages in paragraphs without a source link (21%, 25%,
  5%, 59%, 95%) and a vague-attribution hit on a table cell quoting a ranking page's own "according to research".
  Fixes: links added to the 95-5 and 6sense paragraphs, the 5% removed from the example callout, the FAQ heading
  reworded, the table cell reworded to 'Attributed to unnamed "research"', the 21% moved into the paragraph that
  links the case study. Second run failed once more on a "15 to 25%" left in the warning callout; removed. Third run
  passed, blog_cloud.py sql printed "ready": true, no warnings. One table row was then reordered for clarity
  (the 5.5% Instantly row sat under the Salesforce rows with "Same report") and the SQL regenerated; gate still
  passes (2,429 words, 9 H2, 6 FAQ, 7 internal links, 9 external links).
- Angle: page one is entirely vendor and agency blogs (twelfth.agency, linkedotter.com, autobound.ai, spuriq.ai,
  growleads.io, outboundrepublic.com, updately.ai, trydreamstate.com) repeating "15-25% reply rate for signal-based
  vs 3.43% for cold email". Traced today: twelfth.agency cites Autobound's guide for the 15-25% reply rate; that
  guide's only "15-25%" is an illustrative meeting booking rate it labels "not measured". LinkedOtter credits it to
  unnamed "Salesforce and industry benchmarks"; Salesforce's State of Sales 2026 announcement has no reply-rate
  figure. The article keeps 14 numbers with a primary page opened today, lists 6 dropped claims with where they
  appear and what the cited source actually contains, and adds our own dated LinkedIn numbers.
- Primary sources opened on 26 November 2026 and cited: instantly.ai/cold-email-benchmark-report-2026 (3.43%
  average, 5.5%+ top 25%, 10.7%+ top 10%, 58% of replies from step one, data 1 Jan to 18 Dec 2025);
  6sense.com/buyer-experience-report-2026 (pre-contact favourite wins 82%; first seller contact at ~59% of a
  10.3-month cycle; 91.4% ranked a shortlist first; buyer's team initiated 82% of first contacts); businesswire
  6sense 2025 release (80%, 94%, 4,000+ buyers, 11 to 10 months); Gartner press release 9 Mar 2026 (67% rep-free,
  45% used AI, 646 buyers Aug-Sep 2025); LinkedIn B2B Institute 95-5 rule page (95%, computers every 4 years 75%,
  banking every 5 years 80%); Salesforce State of Sales 2026 announcement (40% time selling, 48% lack bandwidth,
  55% use AI for prospecting, 4,050 respondents, 22 countries, Aug-Sep 2025).
- Not cited: HBR "The Short Life of Online Sales Leads" (2011); only the BYU catalogue record opened, so the
  response-time numbers were not seen and are not on the page. The first fetch of the Instantly report hit an
  unanswered permission prompt; it loaded once the URL came from a search result.
- Intentsly facts used: 14 qualified demos in 14 days, zero manual outreach, 4x reply rate (case study, labelled as
  our own launch); 21% reply rate across Intentsly customers, October 2026; 2 to 4 meetings a week "typically";
  30 messages and 30 connection requests a day, 15 recommended; /try-ai shows matching buyers with no account.
  No price stated. No Reddit/X claims. No unreleased features.
- Keywords: 19 blog keywords still queued after this publish, so none were added. Next blog keyword is whatever
  blog_next.py returns tomorrow.
- For the founder: (1) The gate's verified-number check only recognises proof.md rows whose status cell is exactly
  `verified`; the 21%, ~1,000 leads/month and 2 to 4 meetings rows read `verified: say ...`, so the gate treats those
  numbers as unverified and they only pass inside a paragraph that also carries a source link. If you want those
  numbers usable on their own, either split the phrasing note out of the status cell in proof.md or publish the 21%
  figure on intentsly.com/case-studies so it can be linked directly (I did not change proof.md). (2) A dated
  reply-rate figure per signal type (post engagement vs keyword post vs competitor follower) would make the
  "what reply rate does signal-based outreach get" section the only measured answer on page one. (3) The two
  blocked drafts (ai-consulting-business, outbound-sales-process-for-startups) are still waiting on the kw_in
  trailing-"s" fix in scripts/blog_gate.py, which I am not allowed to edit.
- Live check: not verified from this session (the shell has no network route to intentsly.com and the fetch tool
  needs a permission prompt for the site). The database row is status = published and the push to main landed, so
  the page should be live and in the sitemap after the deploy; please open the URL once to confirm.
