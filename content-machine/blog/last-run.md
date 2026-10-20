# Last run: 2026-10-20 (Learn task, learn section)

- Keyword: what is an ideal customer profile (cluster fundamentals, lesson, informational, priority 1,
  medium; returned by `blog_next.py --section learn`, no draft was waiting). No PAUSE file.
- Title: What Is an Ideal Customer Profile? Definition and Worksheet
- Live URL: https://intentsly.com/learn/what-is-an-ideal-customer-profile
- Status: published (Supabase upsert returned `status = published`, published_at 2026-10-20 18:26 UTC).
  The SQL file was run once, unchanged. Live check: bottom of this file, filled in after the push.
- Gate: first run failed on two items (meta_description 171 chars; opening paragraph 92 words). Fixed
  by shortening both; second run passed. Trimmed further to stay near the lesson range: final 1,802
  words (lesson min 1,000; the skill's 1,800 target is met within rounding, table cells included),
  8 H2s, 5 FAQ entries, 6 internal links (/learn, /learn/what-is-a-buying-signal,
  /learn/what-is-intent-data, /guides/find-decision-makers-on-linkedin, /features/linkedin-signals,
  /signal-playbook), 4 external links, all opened this run. blog_cloud.py: `"ready": true`, no warnings.
- Caps: 4 articles were published earlier today (config max_posts_per_day 7, max_posts_per_week 45); no
  cap reported.
- Queue: 9 learn keywords remain queued (83 overall), so no new keywords were added (threshold is
  fewer than 5). Next learn keyword: "what is an ai sdr" (priority 1), then the priority-2 set
  (sales trigger, trigger event, account-based prospecting, lead enrichment, lead scoring, outbound
  sales, signal-based selling, social selling).

## What the research turned up
- Page one is vendor glossaries and blogs (Hunter, Cognism, Clearbit, Close, Shopify, Miro, Adobe).
  All open with a definition, then why it matters, ICP vs buyer persona, 4 to 5 build steps, a
  template or FAQ. None separates fit (ICP) from timing (signals), none has a disqualifier column,
  and their statistics are mostly uncited vendor figures. Brief: blog/briefs/what-is-an-ideal-customer-profile.md.
- Outside numbers used, all from primary sources opened today: Ehrenberg-Bass Institute page on the
  95:5 rule (5% of B2B buyers in market at any time); Gartner 7 May 2025 release (632 buyers, Aug to
  Sep 2024, buying groups five to 16 people across up to four functions); Forrester 21 January 2026
  release (13 internal stakeholders, nine external influencers). Clearbit linked for the one-sentence
  ICP format. The Gartner 9 March 2026 release used in the buying-signal lesson could not be reopened
  (WebFetch asked for approval with nobody present), so it was not cited.
- Angle taken: ICP as the fit filter, buying signals as the timing filter; a five-row worksheet with a
  disqualifier row and a labelled hypothetical agency example; a three-way table (ICP vs persona vs
  signal); four ways a profile misleads; a rule for one profile vs two.
- Intentsly facts used: scoring against the ICP and LinkedIn signal types from brain/wiki/product.md;
  the 14-demos launch story (narrow profile: founders complaining about cold-outreach burnout); the
  playbook's "twelve signals, eight to ignore". No price, no reply-rate percentages.

## What the founder should supply
- A sentence or two on how Intentsly's own ICP is defined inside the product (which fields the scoring
  uses), so the lesson's worksheet can mirror the product's fields exactly in a future revision.
- A real customer example of a profile that was wrong and got rewritten (what changed, what happened to
  reply rates); the lesson currently uses only a labelled hypothetical and our own launch story.
- Same as the previous run: decide whether proof.md rows marked `verified: say ...` should be split
  so the gate accepts the 21% reply rate and 2 to 4 meetings figures.
- For the next keyword ("what is an ai sdr"): confirm which AI SDR limits may be stated (product.md
  already lists LinkedIn-only sending, 2 accounts, 30/30/15), and whether a customer conversation
  excerpt can be quoted.

## Live check (after push)
- Filled in about four minutes after the push.
