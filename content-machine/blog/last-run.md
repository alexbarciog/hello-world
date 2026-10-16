# Last run: 2026-10-16 (solutions section)

- Keyword: how to find customers for b2b saas (cluster find-customers, landing, commercial, priority 1;
  returned by `blog_next.py --section solutions`).
- Title: How to Find Customers for B2B SaaS: The Signal Method
- Live URL: https://intentsly.com/solutions/find-customers-for-b2b-saas
- Status: published (Supabase upsert returned `status = published`, published_at 2026-10-16 12:53 UTC).
  Live check: see the bottom of this file, filled in after the push.
- Gate: first blog_gate run failed on three points (meta_description 161 chars, opening 95 words,
  "21%" reply-rate figure flagged as unsourced); all three fixed in one pass, then `"ready": true`
  with no warnings on the first blog_cloud.py run. 2,268 words as the gate counts them (two tables
  and a six-entry FAQ included; body prose is around 1,600, so the page sits above the 2,000-word
  landing range in page-write.md but inside config/blog.json's 1,100 to 4,000 for `landing`).
  7 H2s, 6 FAQ entries, 8 internal links (/learn/what-is-intent-data, /blog/find-b2b-leads-on-reddit,
  /guides/linkedin-lead-generation-guide, /features/linkedin-signals, /features/ai-sdr, /case-studies,
  /try-ai, /signal-playbook), 3 external links, all opened this run. Caps: 4 pages had been
  published today before this one (cap 7); the gate did not report the daily or weekly cap.
- Database: the generated SQL was run twice. The first paste accidentally dropped the line
  `article_type = excluded.article_type` from the ON CONFLICT clause (the INSERT path ran, so the
  row was correct); the file was then run again verbatim, which upserted identical values and kept
  the original published_at. No other statement was run.
- 11 solutions keywords remain queued (90 queued overall), so no keywords were added.

## What the research turned up
- Page one is vendor list articles (SocialBu, Close, Expandi, SaaSworthy, inblog) and community
  threads (Indie Hackers). All say "use LinkedIn"; none names which behaviours mark an in-market
  SaaS buyer, none gives a daily plan, none states sending limits, and only Expandi carries
  statistics, mostly third-party or its own report. Brief: blog/briefs/find-customers-for-b2b-saas.md.
- External sources used: 6sense 2024 Buyer Experience Report press release on businesswire.com
  (nearly 70% through the process before engaging sellers, 81% with a preferred vendor, buyers
  initiate contact 80%+ of the time); Close's first-10-customers article (ask ten people in 24 hours);
  the Indie Hackers "first 1, 10, 100 customers" thread (most-mentioned channels). A Gartner page
  redirected to a generic insights page, so its 17% figure was not used.
- Intentsly facts: product features from brain/wiki/product.md only; the 14 demos / 14 days / 4x
  story from brain/stories and verified proof rows; "around 1,000 leads a month per agent" and
  "2 to 4 meetings a week on average", attributed to Intentsly customers, October 2026, per
  corrections.md. The 21% reply rate was cut because the gate does not read the
  "verified: say ..." rows as verified. No price stated. Reddit and X described as manual channels.

## For the founder
- proof.md rows 12 to 14 and 18 are marked "verified: <phrasing note>" rather than "verified", so
  the gate rejects their percentages (21%). Changing those status cells to plain "verified" (and
  moving the phrasing notes into the Claim column or corrections.md) would let the reply-rate figure
  and the GrowthLab quote be used. This run did not edit proof.md.
- A SaaS customer story (which competitor posts or keyword searches produced the leads, what the
  first reply said, what was turned off) would make the "in practice" section specific to this
  page rather than reusing the 14-demos story on every solutions page.
- page-write.md sets 1,100 to 2,000 words for /solutions while config/blog.json allows up to 4,000;
  confirm which range the solutions pages should follow. The required signal table and the
  Intentsly mapping table alone are about 600 words as the gate counts them.

## Live check (13:01 UTC, about 5 minutes after the push)
- https://intentsly.com/solutions/find-customers-for-b2b-saas renders the full article: H1, all 7 H2s,
  both tables (6 and 7 rows), the 6-entry FAQ, plus the site's own "Your next step" and "Keep reading"
  sections. Not a 404.
- https://intentsly.com/solutions lists the page as its first (and only) card, dated 16 October 2026,
  10-minute read.
- https://intentsly.com/sitemap.xml could not be opened: the fetch tool requires the URL to come from
  the user or a linked page, and nothing on the site links to the sitemap, so the permission request
  went unanswered (same as earlier runs). Sitemap listing unconfirmed; the page itself is live.
