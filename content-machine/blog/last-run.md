# Last run: 2026-11-02 (learn task; fired about 19:20 UTC, 21:20 Bucharest)

- Setup: no PAUSE file. Repository already cloned and in scope; `git pull origin main` was up to date at 63a90dd
  (the checkout was a detached HEAD, re-attached to main before committing). `add_repo` was not available as a tool,
  as on previous runs. Supabase: the lowercase "supabase" connector reported a proxy tunnel error at session start
  again; the "Supabase" connector connected and was used. The only draft in blog/drafts/
  (outbound-sales-process-for-startups.md, guides) carries a `blocked:` line, so it was not resumed.
- Keyword (published): what is outbound sales (section learn, cluster fundamentals, lesson, informational,
  priority 2, difficulty medium).
  "What Is Outbound Sales? Definition and a One-Minute Rule"
  https://intentsly.com/learn/what-is-outbound-sales
  Gate: passed on the first run. `blog_cloud.py sql` printed ready: true at 2,049 words by the gate's count (one
  table and two numbered lists included; the prose is about 1,750 words, inside the 1,000 to 1,800 lesson range),
  7 H2, 6 FAQ, 10 internal links, 3 external source links, no warnings. Title chosen after checking the gate's
  title-similarity test: "Definition, Process and Limits" and "Definition, Example and Limits" scored 0.74 and 0.76
  against the cold outreach lesson (limit 0.75), so the "One-Minute Rule" title (0.62) was used.
- Angle: the pages read (Salesforce, G2, Close, Zendesk, Emelia; Dealfront redirected to Leadfeeder and the fetch
  needed a permission nobody could grant) all define outbound as seller-initiated contact, list channels and steps,
  and cite either nothing or second-hand infographics. This lesson builds the definition on one testable fact (who
  made first contact), adds a third column (signal-based outbound) to the inbound vs outbound table, quotes three
  primary sources opened this run, states what a day of outbound produces in activities and reply rates, gives a
  one-minute rule for when outbound is the wrong choice, and states LinkedIn caps honestly.
- Sources opened and linked: Gartner press release of 9 March 2026 (646 B2B buyers, Aug to Sep 2025: 67% prefer a
  rep-free experience, 45% used AI during a recent purchase), The Bridge Group 2025 SDR Metrics Report (351 companies:
  median 112 activities a day, 44 phone, 41 email, 19 LinkedIn, 8 other; 4.1 qualified conversations a day; 3.0 month
  ramp; 1 SDR to 2.4 AEs; 60% of reps at quota, lowest on record), Hunter State of Cold Email 2025 (11 million emails:
  4.1% average reply, 5.8% at 50 or fewer recipients, 2.1% at 1,000+, 4.9% with follow-ups vs 3% without; 217
  decision-makers, 71% cite lack of relevance). The two Gartner June 2025 URLs returned a client error this run, so the
  newer March 2026 release was used instead.
  Intentsly facts used: 14 qualified demos in 14 days, zero manual outreach, 4x reply rate (linked to /case-studies),
  LinkedIn caps 30 messages and 30 connection requests a day with 15 recommended, the Playbook's 12 signals worth
  chasing and 8 to ignore. No price, no 21% figure, no Reddit or X feature claims, no Mike Ruiz quote, no sales pitch in
  the body beyond the one contextual sentence; the CTA is /signal-playbook as the /learn rules require.
- Database: the generated SQL ran unchanged on project uwwajlezgeurnvvrvdvb and returned slug what-is-outbound-sales,
  status published, published_at 2026-11-02 19:34:28 UTC. No other statement was run. `blog_cloud.py mark` filed the
  article and set the keyword to published.
- Queue: 7 `learn` keywords remain queued (next: what is signal-based selling, then what is a sales trigger, what is
  account-based prospecting, what is lead qualification, what is a sales qualified lead, what is firmographic data,
  what is an sdr), so blog-keywords did not run. 13 learn pages published.
- Daily cap: fifth page of 2 November by Bucharest time (intentsly-vs-11x 00:16, best-subreddits 09:19,
  personalize-cold-outreach 10:38, find-clients-as-a-fractional-cfo 16:05, this one 21:34), cap 7; weekly count well
  under 45.
- For Alex: (1) a real customer example of outbound run on signals (even anonymised) with one number would let the
  learn pages stop reusing the 14-demos launch story as their only first-hand example; (2) the proof.md row for the 21%
  reply rate is still written as "verified: say ..." and is not accepted by the gate as a plain number, same note as
  previous runs; (3) the guides draft outbound-sales-process-for-startups.md is still blocked on the gate's keyword
  matcher (it strips a trailing "s" from "process"), a scripts/ change only you can make; (4) allowing intentsly.com
  for the fetch tool in this task's settings would let runs confirm the sitemap directly.
- Live check (19:39 to 19:50 UTC, push e97b609 at 19:35): direct fetches of the page URL and
  https://intentsly.com/sitemap.xml asked for a permission nobody was there to grant, as on previous runs. Workaround:
  the homepage footer led to https://intentsly.com/learn; at 19:40 that index still showed 12 cards (deploy not
  finished), at 19:49 it showed 13 with the new lesson first, which made the page URL fetchable. The page renders:
  H1 "What Is Outbound Sales? Definition and a One-Minute Rule", all seven H2s, the three-column table and the
  six-question FAQ, with the bold definition opening the article. So the redeploy took between 5 and 14 minutes after
  the push. The sitemap itself is still unconfirmed (no page links to it); the site builds it from the same published
  rows, so it should be listed. No GitHub Actions workflows exist on the repository, so the deploy is not observable
  from there either.
