# Last run: 2026-10-22 (Trigify campaign task, blog section; started 15:18 UTC, 18:18 Bucharest)

- Keyword: trigify vs valley (cluster trigify, comparison, commercial, priority 1, low). `blog_next.py` returned
  "reddit keyword monitoring for leads" (cluster reddit-x), so per the campaign task rule the first queued
  trigify keyword by priority then difficulty was taken instead. No PAUSE file, no draft waiting.
- Date logic: run on the closing day itself. Standard access ends 11:59pm BST on 22 October 2026, still in the
  future at run time, so the article uses present tense with the date spelled out, and frames export as
  "while you still have access", which also reads correctly after the cutoff.
- Title: Trigify vs Valley: Which Trigify Jobs Valley Takes Over
- Live URL: https://intentsly.com/blog/trigify-vs-valley
- Status: published (Supabase upsert returned `status = published`, published_at 2026-10-22 15:32 UTC). The SQL
  file `blog/out/trigify-vs-valley.sql` was run once, unchanged, through the `Supabase` connector's execute_sql on
  project uwwajlezgeurnvvrvdvb. The only other statement run was a `select 1` at the start to confirm the
  connector worked (the session again listed a lowercase `supabase` server as failed with ERR_PROXY_TUNNEL; the
  capitalised `Supabase` connector answered). Sixth page dated 22 October against the config daily cap of 7.
- Gate: run 1 failed on two items (meta_description 175 chars; $40/$149/$199 in the cost summary paragraph had
  no link). Fixed by shortening the description and adding the Valley pricing link to that paragraph. Run 2
  passed; a third run after three wording edits (own-profile note in the settings table, "shows no prices",
  a Trigify vs Gojiberry link) also passed with no warnings. 2,960 gate-words, 10 H2s, 6 FAQ entries, two
  tables, 7 internal links, 13 external links.
- Sources: trigify.io homepage (HubSpot notice; no prices shown), help.trigify.io Plans & Pricing (Starter $40,
  Max $199, Enterprise custom, $0.012 overage), Set up Social Signals monitoring (16 signal types, plan profile
  caps, none on Max/Enterprise, cadence), What is Social Signals, Quick Start, Listening vs Workflows, How do I
  get my data into Clay / my CRM; joinvalley.co homepage (stack list naming Trigify under "Post engagement"),
  pricing (updated 19 Oct 2026), product, signals/linkedin-post-engagers (competitors' posts on up to five
  monitored profiles), api-and-mcp, per-seat pricing post, and Valley's own "Valley vs Trigify" post (the only
  page that ranks for the query; written before the retirement notice). Full list in
  `blog/briefs/trigify-vs-valley.md`.
- Intentsly facts used: LinkedIn-only signal list, ICP scoring, verified emails, export (no format named), AI SDR
  on LinkedIn only with Cal.com/Google Calendar booking, HubSpot as the only CRM, 2 accounts, 30/30 cap with 15
  recommended, 7-day trial, /try-ai, 14 demos in 14 days and 4x reply rate (story). No price. Reddit, X,
  YouTube, podcasts and Hacker News explicitly stated as not covered.
- Hub "Related" list: `blog/published/trigify-alternatives.md` has no Related section, so no edit was made.
- Queue: 3 trigify keywords still queued (linkedin profile monitoring tool, trigify vs teamfluence, life after
  trigify: signal-based selling playbook); 37 blog keywords queued overall, so none were added.
- For the founder: the campaign articles still lean on one story (14 demos). A short note on one Trigify
  customer who moved to Intentsly (what they tracked, what they switched on, first reply) would let the next
  articles carry a first-hand migration example; none is claimed until it exists in `brain/stories/`.
