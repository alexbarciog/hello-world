# Last run: 2026-10-21 (Learn task, learn section)

- Keyword: what is an ai sdr (cluster fundamentals, lesson, informational, priority 1, medium). No PAUSE
  file. First keyword returned by `blog_next.py --section learn`; no draft was waiting in `blog/drafts/`.
- Title: What Is an AI SDR? Definition, Limits and a Checklist
- Live URL: https://intentsly.com/learn/what-is-an-ai-sdr
- Status: published (Supabase upsert returned `status = published`, published_at 2026-10-21 18:32 UTC).
  The SQL file `blog/out/what-is-an-ai-sdr.sql` was run once, unchanged, through the `Supabase`
  connector's execute_sql on project uwwajlezgeurnvvrvdvb. No other database statement was run.
- Gate: run 1 failed on two items (meta_description 172 chars, opening paragraph 91 words). Fix 1
  shortened both. Run 2 passed. The draft was then trimmed for length (no gate failure involved) and
  the gate re-run: `"ready": true`, no warnings. 2,136 gate-words (includes table cells; about 1,885
  words of prose), 7 H2s, 6 FAQ entries, two tables (five-way terms table and a vendor checklist),
  8 internal links (/learn/what-is-a-buying-signal, /learn/what-is-intent-data,
  /learn/what-is-an-ideal-customer-profile, /learn, /guides/linkedin-lead-generation-guide,
  /features/ai-sdr, /signal-playbook, /try-ai), 3 external links to primary sources opened this run
  (Bridge Group 2025 SDR tenure page, Gartner press releases 2026-05-20 and 2025-06-25).
- Intentsly facts used: AI SDR is LinkedIn only, no email; up to 2 sender accounts per workspace;
  30 messages and 30 connection requests per account per day, 15 recommended (product.md); 14 demos
  in 14 days, zero manual outreach, 4x reply rate (dogfooding story, verified). No price stated.
- Caps: config/blog.json max_posts_per_day 7, max_posts_per_week 45. This is the seventh article dated
  21 October (Bucharest), so the daily cap is now reached for the rest of 21 October; any other task
  that runs before midnight Bucharest will be refused by the gate, which is correct.
- Queue: 8 learn keywords still queued (what is lead enrichment, what is social selling, what is a
  trigger event in sales, what is lead scoring, what is outbound sales, what is signal-based selling,
  what is a sales trigger, what is account-based prospecting). 75 keywords queued overall, so no
  keywords were added.
- Connectors: lowercase `supabase` server failed (ERR_PROXY_TUNNEL); the separate `Supabase` server's
  execute_sql worked. No `add_repo` tool existed in the session; the repository was already in scope
  and `git pull origin main` was run on the existing clone (dbc7257). Cloud-only run, no computer linked.

## What the research turned up
- Page one for "what is an ai sdr" is entirely vendors: Salesforce, IBM (Apr 2026), Artisan (Aug 2024),
  Qualified (Mar 2025), AiSDR (Aug 2026, reviewed Oct 2026), Autobound glossary. All define the term as
  software doing a human SDR's top-of-funnel work and describe it as working a list. None explains
  where the list comes from, none states channel limits, and only AiSDR separates AI SDR from AI BDR,
  AI sales agent and AI sales assistant.
- Most statistics on those pages cite other vendors or the vendor's own report. Primary sources that
  held up when opened: Bridge Group 2025 (351 companies, SDR tenure 1.9 years, ramp 3.0 months),
  Gartner 20 May 2026 (645 buyers; 69% prefer to validate AI insights with a rep; 51% expect misleading
  information from GenAI vs 49% from a rep), Gartner 25 June 2025 (over 40% of agentic AI projects to be
  cancelled by end of 2027; about 130 real vendors; "agent washing"). The SaaStr "14 months" tenure
  figure is an informal community poll from 2023 and was not used.

## For the founder
- The proof.md rows for 21% reply rate, ~1,000 leads/month per agent and 2 to 4 meetings a week carry
  "verified: <phrasing note>" in the status cell, so the gate does not accept them. The 21% figure
  would have strengthened this lesson's "signal-fed vs list-fed" section. Either move the phrasing
  notes to their own column or accept that these numbers stay out of articles.
- A first-hand AI SDR anecdote (one real conversation the AI held, what it answered, what it handed
  off) would let the "How to reply" step show a transcript instead of a description. Nothing like it
  exists in brain/stories/.
- Does the Intentsly AI SDR have an approval mode (review messages before they go out) and does it
  disclose that it is automated when asked? Both appear in the vendor checklist as good answers; the
  article does not claim either for Intentsly because product.md does not list them. Confirming them
  would allow a stronger /features/ai-sdr mention next time.
- Native CRM: product.md lists HubSpot only. The article says "if it integrates with yours" and does
  not name Intentsly's CRM list; confirm whether more are planned before a lesson on CRM handoff.

## Live check (after push)
- Pushed at 18:33:46 UTC (d62cebd). The first `git push origin main` was rejected because the clone
  was on a detached HEAD; `git push origin HEAD:main` fast-forwarded main from dbc7257 to d62cebd.
  No other changes were on the remote.
- At 18:38 UTC (four minutes after the push) https://intentsly.com/sitemap.xml and
  https://intentsly.com/learn/what-is-an-ai-sdr could not be fetched from this run: the fetch tool
  asks for a permission that nobody is present to grant for URLs that did not come from a search
  result, and no search returned an intentsly.com URL. Same limitation as the 21 October blog run.
  The database row is published (status = published, 18:32 UTC), so the page should resolve once the
  Cloudflare deploy for d62cebd completes. Not confirmed by this run.
- Alex: open https://intentsly.com/learn/what-is-an-ai-sdr and the sitemap once; if the page is
  missing an hour after the push, check the deploy for commit d62cebd.
