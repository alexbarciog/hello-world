# Correction run 2026-10-15

One-off correction after the founder confirmed (15 October 2026) that Reddit and X monitoring do not work yet
and that the AI SDR sends LinkedIn messages only. Five published pages described Intentsly as covering Reddit
and X; each was rewritten to LinkedIn-only, `checked_on` set to 2026-10-15, re-gated, and upserted (slug
conflict, original `published_at` kept). No `mark` run; no scripts/, config/ or brain/ changes.

| Slug | Republished | Supabase result |
|---|---|---|
| find-b2b-leads-on-reddit | yes | status = published, published_at 2026-10-12 20:51 UTC (unchanged) |
| gojiberry-alternatives | yes | status = published, published_at 2026-10-14 06:27 UTC (unchanged) |
| joinvalley-alternatives | yes | status = published, published_at 2026-10-15 06:12 UTC (unchanged) |
| trigify-alternatives | yes | status = published, published_at 2026-10-13 06:09 UTC (unchanged) |
| trigify-shutting-down | yes | status = published, published_at 2026-10-15 17:55 UTC (unchanged) |

Gate fixes needed on the second pass: find-b2b-leads-on-reddit (removing the Reddit pitch dropped it to 2
internal links and no link to another content page, so a link to /learn/what-is-intent-data was added in "What
to do next"); gojiberry-alternatives and joinvalley-alternatives (opening paragraph over 90 words after the
rewrite; shortened). Where an article said "buyers not on LinkedIn, choose Intentsly", the recommendation now
names CommunityTracker (gojiberry-alternatives) or says plainly that no tool in the list, Intentsly included,
listens outside LinkedIn (joinvalley-alternatives, with a link to the manual Reddit method).

Still needs the founder:
- `blog/published/what-is-intent-data.md` (learn section, not in this correction's scope) still links
  /features/reddit-x-signals as a working feature in its "Watch two sources by hand" step. Needs the same fix.
- `blog/site-pages.json` still lists /features/reddit-x-signals as a page articles may link to; the gate does
  not block it. Consider removing it (config change, not made here) or taking the feature page down.
- gojiberry-alternatives says the Buying Signal Playbook includes "the Reddit and X queries" to find signals.
  product.md describes the playbook as LinkedIn triggers and scripts; confirm the playbook really contains
  Reddit/X queries, otherwise that sentence needs editing too.
- trigify-shutting-down says Intentsly has "no public API". product.md does not confirm or deny an API; the
  sentence was kept but now acknowledges the native HubSpot integration. Confirm the API claim.

# Last run: 2026-10-15 (learn section, evening)

- Keyword: what is intent data (section learn, cluster fundamentals, lesson, priority 1)
- Title: What Is Intent Data? Definition, Types and Examples
- Live URL: https://intentsly.com/learn/what-is-intent-data
- Status: published (Supabase row returned `status = published`, published_at 2026-10-15 18:30 UTC)
- Gate: passed on the first run, 1,776 words (lesson range 1,000 to 1,800), 8 H2s, 4 FAQ entries,
  5 internal links (/learn, /blog/find-b2b-leads-on-reddit, /signal-playbook, /features/linkedin-signals,
  /features/reddit-x-signals), 2 external links, no warnings. Third article published today (daily cap 7).
- Keywords blocked or skipped: none. 11 learn keywords and 97 keywords in total remain queued, so no new
  keywords were added.
- First /learn page. "Related lessons" links to the /learn index because no other lesson is published yet;
  when "what is a buying signal", "what is an ideal customer profile" and "what is lead scoring" go live,
  this page's Related lessons paragraph should link to them (blog_cloud.py has no update mode yet).

## What the research turned up
- Every ranking page (Bombora, Boomi, G2 glossary, FoxData, Ninetailed, Artisan, several abmatic.ai
  near-duplicates) is vendor-written, defines first-party vs third-party, lists benefits and stops. None
  separates account-level from person-level intent data, none states downsides, none gives a decision rule.
- Outside statistic used: Gartner press release 9 March 2026 (survey of 646 B2B buyers, Aug to Sep 2025,
  67% prefer a rep-free experience, 45% used AI during a recent purchase), opened this run and linked in the
  same paragraph.
- Bombora's own page (opened today) supplied the three third-party subtypes (data cooperative, publisher
  direct, bidstream). No prices, no claims about Bombora's accuracy.
- Trade statistics found on other pages (e.g. "93% of marketers report higher conversions") trace to
  vendor round-ups with no primary source, so none was used.

## Calls made without review
- Used the verified "14 qualified demos in 14 days ... no manual outreach" line once, in the "How to use
  it this week" section, phrased as "our own launch campaign". No price, no customer names, no quotes.
- Product features named: LinkedIn signals (comments, likes, competitor-page followers), Reddit and X
  monitoring, scoring against the customer profile. All are in brain/wiki/product.md.
- The hypothetical agency example is labelled as an example and uses no real company.
- Trimmed from 1,905 to 1,776 words to stay inside the lesson range (the gate only enforces the minimum).

## For the founder
- Add posts to brain/posts/ and run brain-ingest: voice.md is still "untrained".
- The "12,400+ buyers detected weekly" figure and the GrowthLab quote are still unverified in proof.md;
  a verified weekly-detection number would strengthen every lesson in this cluster.
- A short first-hand story about one intent signal that turned into a deal (what the person posted, what
  we replied, what happened) would give the lessons on buying signals and triggers a real example instead
  of a labelled hypothetical.
- The Trigify past-tense edit from 23 October (see the previous last-run) is still pending.
