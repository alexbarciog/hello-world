# Last run: 2026-11-23 (blog task; fired about 06:50 UTC, 08:50 Bucharest)

- Setup: no PAUSE file. Repository already cloned, in scope and on `main`; `add_repo` is not exposed as a tool in this
  session (as on previous runs), `git pull origin main` reported up to date at 6ee2a00. Supabase: the lowercase "supabase"
  connector failed with a proxy tunnel error at session start; the "Supabase" connector connected and was used. Web search
  worked; pages were opened through the web-fetch agent (no direct WebFetch tool). Both drafts in blog/drafts/ carry a
  `blocked:` line (solutions and guides, the gate kw_in issue with "business"/"process"), so the queue's next blog keyword
  was taken. 0 articles had been published today (Bucharest) before this run (daily cap 7); well under the weekly cap (45).
- Keyword (published, first attempt): what to say when a prospect likes a competitor's post (blog, templates cluster,
  templates type, informational, priority 2, difficulty low).
  "What to Say When a Prospect Likes a Competitor's Post"
  https://intentsly.com/blog/what-to-say-when-a-prospect-likes-a-competitors-post
- Database: one statement, the generated blog/out/what-to-say-when-a-prospect-likes-a-competitors-post.sql (22,433 bytes,
  md5 68dbc55c527b68896426b0f997e84dd6), run unchanged through the Supabase connector. Returned slug
  what-to-say-when-a-prospect-likes-a-competitors-post, status = published, published_at 2026-11-23 07:06:26 UTC. No other
  reads or writes.
- Gate: blog_gate.py first run failed on two points: meta_description 165 chars (max 160) and opening paragraph 91 words
  (max 90). Both trimmed; three FAQ answers over 70 words were also cut to 64 to 67, and the printed character counts next to
  the seven scripts were corrected to the real counts (113 to 238). Second gate run passed; blog_cloud.py sql printed
  "ready": true first time. 2,607 words, 10 H2, 6 FAQ, 9 internal links, 8 external links (all opened today), no em dashes,
  no banned phrases. Longer than the 1,200 minimum for templates, in line with the earlier templates article (7 sequences).
- Angle: page one is vendor playbooks (Common Room, Expandi, Unify, Valley, AiSDR, Reply.io, Fuzzy) plus Koka Sexton and
  Carta's Peter Walker. All give the same message for a like and a comment, none gives a decision rule for when a like
  deserves a message, and one (Common Room) names the competitor in the opener. This page gives a five-point 30-second check
  (message / connect silently / skip), four scripts by kind of post (problem post, launch post, repeat liker, like plus a
  second signal) with character counts, a reply for "just following", the phrases that read as surveillance, a sourced
  baseline instead of a vendor reply band, and Carta's "never works" view with where it is right.
- Outside sources opened today and cited: Expandi LinkedIn Outreach Benchmarks 2026 (13,218,869 requests, 6,730,447 messages,
  13,302 accounts, May 2025 to April 2026; 28.5% acceptance, 3.0% note reply, 10.4% message reply, note reply 3.5% to 2.2%),
  LinkedIn B2B Institute 95-5 page ("95% of your potential buyers aren't ready to buy today"), Carta (Peter Walker, 12 Jan
  2026, reaction-triggered cold outreach never works), Unify use case (a like ranks last), Koka Sexton (a like is noise), Valley
  launch-post playbook (lead with the category, exclude staff and partners), Common Room prompt (template naming the
  competitor handle, quoted as the example to avoid), Fuzzy AI (the "if they could see how you found them" test). Not cited:
  the LinkedIn Talent Blog InMail-length page and a Melanie Goodman Substack dataset (fetch permission not granted this run),
  PhantomBuster's guide (verification interstitial, no text), LinkedIn Help pages on reaction visibility (robots-disallowed),
  and every unsourced vendor reply band (Valley 15-45%, AiSDR 24%, Fuzzy 36.4%).
- Intentsly facts used: 14 qualified demos in 14 days, zero manual outreach, 4x reply rate, most leads from real-time signals
  (case study, labelled as our own launch, with the note that it does not break leads down by signal type); caps 30/30 a day
  with 15 recommended, 2 LinkedIn accounts; /try-ai shows matching buyers with no account; Intentsly tracks competitor and
  industry post engagers and scores them against the ICP (product.md). No price, no Reddit/X features, no NOT-LIVE epics.
  Conversion links: /features/linkedin-signals, /try-ai, /signal-playbook.
- Queue after this run: 20 blog keywords still queued; templates cluster now fully published (2 of 2). No new keywords added
  (threshold is fewer than 5).
- Verification: the database row shows status = published. The push result and the live-page check are recorded in the commit
  below; as on previous runs, intentsly.com URLs cannot be opened from this session without a permission prompt, so "live" is
  inferred from the published row plus the deploy commit on main.

## For the founder
- A first-hand number for like-triggered messages (reply rate for likers vs commenters from the Intentsly AI SDR, even for
  one month) would let this article and the seven-sequence templates article replace the Expandi floor with our own figure.
- The two blocked drafts (get-clients-for-an-ai-consulting-business, outbound-sales-process-for-startups) stay blocked by the
  gate's kw_in singular/plural rule on "business" and "process"; only a change to scripts/blog_gate.py (which the tasks may
  not edit) or a reworded keyword will free them.
- brain/stories/ still has one story. One customer story about a competitor-engagement campaign (with permission to name
  them) would give the templates cluster and the competitor-monitoring guides a case other than our own launch.
