# Last run: 2026-10-31 (guides task; fired about 08:20 UTC, 10:20 Bucharest)

- Keyword: how to use linkedin search operators for prospecting (section guides, cluster linkedin-prospecting, type
  guide, intent commercial, priority 2, difficulty medium). `blog_next.py --section guides` returned it directly. No
  PAUSE file, no draft waiting. Repository already cloned and in scope; `git pull origin main` was up to date at
  702179f. `add_repo` was not available as a tool, as on previous runs. Supabase: the lowercase "supabase" connector
  reported a proxy tunnel error at session start; the "Supabase" connector connected and was used. Read-only count
  before any work: 1 post published on 31 Oct UTC, 22 in the last 7 days; caps 7 and 45 not reached; no row for the
  slug.
- Published: "How to Use LinkedIn Search Operators for Prospecting"
  https://intentsly.com/guides/linkedin-search-operators-for-prospecting
  Gate run 1 failed on two format points (meta description 167 chars, no H2 with the keyword); fixed in two edits,
  run 2 passed with no fails and no warnings. Three truth/voice edits after the pass (attributed the operator
  evaluation order to the cited guides, replaced a "sort by connection degree" fix that the free search does not
  offer with the Connections filter, removed one "X is not a list, Y is" contrast), then `blog_cloud.py sql` printed
  ready: true. 11 H2, 6 FAQ, 7 internal links, 6 external, 2,883 words by the gate's count (guide min 1,500, max
  4,000). Decision taken without review: title kept at 51 characters without a numeric promise, because every
  variant with "6 Steps" went over 60.
- Database: the insert ran on project uwwajlezgeurnvvrvdvb and returned status published, published_at
  2026-10-31 08:34:36 UTC. A read-only select afterwards confirmed section guides, article_type guide, word_count
  2883, reading_minutes 13, 6 FAQ entries, 4 secondary keywords, content length 19,643 characters and an md5 of the
  stored content_md identical to the draft body (a98537cf346d8a95bb5cb48341ba219e).
- Sources opened 31 Oct 2026 and used: scommunity.linkedin.com Boolean post (24 Jun 2025: five operators, uppercase,
  Keywords/Job Title/Company fields only, not dropdown filters); scommunity.linkedin.com "4 ways" post (13 May 2020:
  2,500 profiles per search, 15 saved searches with alerts); premium.linkedin.com/professional/faq (commercial use
  limit counted from the 1st of the month, resets on the 1st, removed by Premium Business / Sales Navigator /
  Recruiter Lite); developers.google.com site: operator doc ("doesn't necessarily return all the URLs");
  linkedapi.io Boolean guide (14 Jul 2026) and 100hires.com (Jul 2026) for the list of ignored symbols and the
  evaluation order. Ranking pages read for SERP context only, their unsourced stats not reused: amplemarket.com,
  blog.closelyhq.com (two pages), overloop.com, expandi.io, cleverly.co, skylead.io X-ray, linkedapi.io X-ray.
  LinkedIn Help pages (75814, a524335, a564226, 52950) are robots-blocked for the fetch tool, so nothing is
  attributed to them.
- Angle: the ranking pages are vendor cheat sheets with unsourced benchmarks and treat "LinkedIn search" as one
  box. This page maps the four places operators work (People search with the Title field, company People tab,
  Posts tab, Google X-ray), builds the string from the ICP with a three-list worksheet, gives a six-row fix table,
  cites only LinkedIn's and Google's own pages for limits, and makes the Posts search the signal step.
- Intentsly facts used: product.md feature list (keyword posts, competitor post engagement and page followers, ICP
  scoring, verified emails; 30/30 a day, 15 recommended); 14 qualified demos in 14 days, zero manual outreach,
  leads from real-time signals, founders complaining about cold outreach burnout (dogfooding-14-demos.md). No
  price stated. Reddit/X not mentioned. CTA is /try-ai with /features/linkedin-signals in the body. Internal links
  also to /guides, /learn/what-is-an-ideal-customer-profile, /guides/find-decision-makers-on-linkedin,
  /guides/set-up-linkedin-sales-navigator-alerts, /guides/write-linkedin-outreach-message.
- Queue: 10 guides keywords still queued (next: outbound sales process for startups), so no new keywords were
  added.
- For the founder:
  1. Keyword-post matching: the guide's Step 5 strings use OR/NOT groups. If Intentsly's keyword monitoring
     supports phrases, OR lists or exclusions, add that to brain/wiki/product.md and the Intentsly sentence can say
     "paste the same string"; today it says only "the keywords you set".
  2. A real example of a keyword post that became a meeting (the sentence in the post, how fast the reply came,
     what was booked) would replace the labelled hypothetical in Step 5 with first-hand material.
  3. Whether Intentsly's signal monitoring runs without the customer's own LinkedIn searches (so it does not touch
     the commercial use limit) is a selling point this page could state plainly if confirmed.
  4. The 21% reply-rate, ~1,000 leads and 2 to 4 meetings rows in proof.md still carry "verified:" plus a note,
     which the gate reads as not verified for figures with a % sign; this guide cites none of them.
- Push: `git push origin main` was rejected client-side as non-fast-forward three times although `git ls-remote` and
  the GitHub API both showed main at 702179f, the local parent; `git push origin HEAD:refs/heads/main` went through
  at once (702179f..0d631d9). Nothing was rebased or forced. If this repeats, the shallow clone's tracking ref is the
  likely cause and the explicit refspec is the fix.
- Live check (08:41 UTC, 5 minutes after the push): not possible from this run. The fetch tool refuses
  intentsly.com/sitemap.xml and the guide URL for lack of provenance (same as previous runs), the URL is not in
  web search results yet, and the repository has no GitHub Actions workflow runs to read a deploy status from. The
  database row is published and the commit is on main, so the page should appear with the next deploy; the founder
  can confirm at https://intentsly.com/guides/linkedin-search-operators-for-prospecting.
