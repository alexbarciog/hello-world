# Last run: 2026-10-22 (Guides task, guides section; started about 10:20 Bucharest)

- Keyword: how to write a linkedin outreach message (cluster outbound, guide, commercial, priority 1, medium).
  No PAUSE file. First keyword returned by `blog_next.py --section guides`; no draft was waiting in `blog/drafts/`.
- Title: How to Write a LinkedIn Outreach Message That Gets a Reply
- Live URL: https://intentsly.com/guides/write-linkedin-outreach-message
- Status: published (Supabase upsert returned `status = published`, published_at 2026-10-22 07:31 UTC, 10:31
  Bucharest). The SQL file `blog/out/write-linkedin-outreach-message.sql` was run once, unchanged (the text sent
  was written to a scratch file and diffed byte-for-byte against the generated file before sending), through the
  `Supabase` connector's execute_sql on project uwwajlezgeurnvvrvdvb. The only other statement run was a
  `select 1` to confirm the connector worked, because the session reported the lowercase `supabase` server as
  failed (ERR_PROXY_TUNNEL). Third article dated 22 October (compare at 00:01, blog at 09:06); daily cap 7.
- Gate: `blog_gate.py` run 1 failed on one item (opening paragraph 92 words). Trimmed to under 90; run 2 passed
  with no warnings. Truth-pass edits after that (removed "that we run ourselves" from the cadence sentence,
  removed an unsourced claim about LinkedIn restrictions, softened "we ran this exact approach" to "the
  signal-first version", added the LinkedIn link to the Saturday paragraph, corrected the template character
  counts to 132 and 307), then a "ten-point check" H2 was added because the excerpt promised one, then one
  inline-code spacing fix. Gate re-run after each: pass, no warnings. `blog_cloud.py sql` printed `"ready": true`
  on the final file, which is the one that ran. 2,844 gate-words (code blocks excluded), 10 H2s, 6 FAQ entries,
  four tables, four code-block templates, a numbered ten-point checklist, 8 internal links (/guides,
  /guides/build-b2b-prospect-list, /guides/find-decision-makers-on-linkedin, /learn/what-is-a-buying-signal,
  /blog/track-competitor-linkedin-post-engagers, /features/linkedin-signals, /features/ai-sdr, /try-ai),
  6 external links, all opened this run.
- External sources used: lemlist (cadence floor of 24h, one message a day), Nutshell (break-up after two or
  three silences, 300-char note claim), Hublead (200-char note citing LinkedIn Help, three personalised notes a
  month on free accounts, InMail 200/1,900), QuickMail (300-char note, InMail 2,000), PhantomBuster (Indie
  Hackers 2023 dataset: 16,492 invites, 37% acceptance, 63% within 24h), LinkedIn Talent Blog data story
  (InMails under 400 chars 22% above average response, over 1,200 chars 11% below, individual 15% above bulk,
  Saturday 8% below; labelled as recruiter data in the article). Close and Taplio were opened for the brief but
  not cited. LinkedIn Help pages (46662, 62928) could not be opened (robots_disallowed), so the connection-note
  character limit is presented as disputed between third parties (200 vs 300) and every template is kept
  under 200.
- Intentsly facts used: LinkedIn signals on competitor and industry-leader posts with ICP scoring; AI SDR on
  LinkedIn with replies handled; 30 messages / 30 connection requests per account per day, 15 recommended;
  /try-ai with no account (product.md); 14 qualified demos in 14 days, zero manual outreach, 4x reply rate
  (dogfooding story, verified). No price stated. Reddit/X not mentioned. The 21% reply rate, ~1,000 leads and
  2 to 4 meetings rows were not used (their proof.md status cell is not exactly `verified`, so the gate would
  reject the numbers).
- Queue: 8 guides keywords still queued (72 overall), so no keywords were added. Next guides keyword is "how to
  set up signal-based outbound" (outbound).
- Connectors: `Supabase` execute_sql worked. No `add_repo` tool existed in the session; the repository was
  already in scope and `git pull origin main` ran on the existing clone (3733aa4, already up to date). Cloud-only
  run, no desktop bridge.

## What the research turned up
- Every ranking page is a vendor guide (lemlist, Close, Nutshell, PhantomBuster, Taplio, Dealsflow) or a
  Substack. All start from a list and bolt personalisation on afterwards; none starts from a LinkedIn signal,
  none gives a per-line character budget, none shows a filled sequence with the days between messages.
- Reply-rate "benchmarks" on the ranking pages are unsourced (Nutshell: 6 to 7% average; Close: 10 to 25% for
  personalised). The article says so and tells the reader to measure their own.
- The connection-note limit is disputed between third-party pages (200 vs 300 characters); Hublead attributes
  200 to LinkedIn Help page a563153. Worth a one-minute check in the product by someone with a LinkedIn login.

## For the founder
- A real first message from an Intentsly AI SDR campaign (anonymised), with the signal it was built on and
  whether it got a reply, would give this guide a first-hand example the vendor pages cannot copy. Nothing like
  it is in brain/stories/.
- Confirm the current connection-note character limit (200 or 300) from a logged-in LinkedIn account; the
  guide hedges because the help pages are unreachable from the run.
- proof.md rows for 21% reply rate, ~1,000 leads/month per agent and 2 to 4 meetings a week still carry phrasing
  notes in the status cell, so the gate does not accept them. If the status cell were exactly `verified` and the
  phrasing rule moved to corrections.md, the next outreach guide could cite the 21% figure with the date.
- The next guides keyword, "how to set up signal-based outbound", would benefit from a short description of
  the actual Intentsly setup flow (which screens, in what order) so the guide can describe it without guessing.

## Live check (after push)
- Done about four minutes after the push by fetching the sitemap and the page URL; the result is in the task's
  run report, not in this file, so that the run makes a single commit.
