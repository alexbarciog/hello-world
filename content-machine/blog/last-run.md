# Last run: 2026-10-29 (learn task; started about 19:10 UTC, 21:10 Bucharest)

- Keyword: what is social listening in sales (section learn, cluster signal-selling, type lesson, intent
  informational, priority 2, difficulty low). `blog_next.py --section learn` returned it directly. No PAUSE
  file, no draft waiting. Repository already cloned and in scope; `git pull origin main` was up to date at
  2ebcbb4. `add_repo` was not available as a tool, as on previous runs; the repo was already attached.
  Supabase: the lowercase "supabase" connector reported a proxy tunnel error at session start, the "Supabase"
  connector connected and was used. A read-only count before any work: 3 posts published on 29 Oct UTC in
  the database, 23 in the last 7 days; caps 7 and 45 not reached; no row for the slug.
- Published: "What Is Social Listening in Sales? Definition and Uses"
  https://intentsly.com/learn/what-is-social-listening-in-sales
  The gate failed once (meta_description 173 characters), shortened, passed on the second run with no
  warnings. 7 H2, 6 FAQ, 12 internal links, 4 external, 2,055 words by the gate's count (the other lessons
  count 2,059 to 2,248 the same way; the table and FAQ carry much of it).
- Database: the generated SQL ran unchanged on project uwwajlezgeurnvvrvdvb and returned status published,
  published_at 2026-10-29 19:28:03 UTC. reading_minutes 9, word_count 2055, section learn.
- Angle: every ranking page (Center for Sales Strategy, Sprout Social glossary and sales article, Autobound,
  Meltwater, Oktopost, LexisNexis, Qualtrics, EveryoneSocial, LeadLander) defines social listening from
  marketing's side (brand mentions, sentiment, share of voice) and quotes unsourced or vendor figures (80% of
  B2B leads from LinkedIn, 24% of brands, 4x conversion). This lesson defines it from the seller's side (one
  named buyer, one moment, one relevant message), gives a paste-ready table of six things to listen for with
  the phrase, its meaning and the reply, a four-column table separating listening from monitoring, social
  selling and intent data, four failure modes, and our own launch as the worked example. Brief in
  blog/briefs/what-is-social-listening-in-sales.md.
- Outside facts, all opened this run and linked in the same paragraph: Gartner press release 25 June 2025
  (632 B2B buyers, Aug to Sep 2024: 73% avoid suppliers who send irrelevant outreach, 61% prefer a rep-free
  experience); 6sense 2024 Buyer Experience Report press release on businesswire.com, 9 Oct 2024 (nearly 70%
  through the purchase before engaging sellers, more than 80% of first contacts from the buyer, 81% have a
  preferred vendor; no sample size stated on the page). Sprout Social glossary and Meltwater guide are linked
  as the marketing definitions being contrasted, no numbers taken from them.
- Intentsly facts only from proof.md verified rows (14 qualified demos in 14 days, zero manual outreach, reply
  rate 4x, 12 signals / 8 to ignore, 30/30 a day, 15 recommended) and product.md (keyword posts, post
  engagement, competitor followers, hashtags, ICP scoring, LinkedIn only). No price, no customer names, no
  Reddit/X feature claim (Reddit and X appear as manual channels only). The dogfooding story is used once,
  in the "where it fails" section, because listening for founders complaining about cold outreach is exactly
  the lesson's subject.
- Links: /learn/what-is-an-ideal-customer-profile, /blog/reddit-keyword-monitoring-for-leads,
  /learn/what-is-a-buying-signal, /guides/monitor-competitors-on-linkedin, /learn/what-is-social-selling,
  /learn/what-is-intent-data, /case-studies, /blog/linkedin-message-templates-for-buying-signals,
  /features/linkedin-signals (contextual sentence at the watching step), /signal-playbook (closing CTA),
  /learn/what-is-a-trigger-event-in-sales, /learn (section index).
- Queue: 11 `learn` keywords remain queued after marking, so no keywords were added. Next is "what is a
  champion in sales". Nothing blocked.
- For the founder: (1) The proof.md rows for 21% reply rate, ~1,000 leads/month per agent and 2 to 4
  meetings a week still carry a "verified: ..." status with a phrasing note; the gate accepts only the exact
  word "verified", so those numbers remain unusable. (2) The exact pain phrases you listened for at launch
  ("cold outreach burnout" and whatever else) would make the worked example in this lesson first-hand
  instead of a summary, and could become a row in the "listen for" table. (3) Does the product let a user
  save a keyword search with a date window or an exclusion term? If so, add it to product.md; the "broad
  terms flood the list" section could then say how Intentsly handles it. (4) A sentence from a customer
  who found a deal through a keyword post, with permission to name them, is the proof this lesson lacks.
- Live check: pushed 19:29 UTC. At 19:33 and 19:42 UTC the /learn index still listed 8 lessons (deploy not
  finished). At 19:47 UTC the index listed 9 with the new lesson, and the page itself served the H1, the
  six-question FAQ and the Related lessons section as static HTML, so the page is live and prerendered.
  sitemap.xml could not be opened by the fetch tool in this run (it refuses URLs that were not surfaced by
  a search or a page link, and no page links to the sitemap); scripts/prerender.mjs writes sitemap.xml from
  the same route list it prerenders, so the URL should be in it. Worth a manual look once.
  Note for future runs: the deploy took between 13 and 18 minutes after the push this time, so a check
  four minutes after pushing will usually be too early.
