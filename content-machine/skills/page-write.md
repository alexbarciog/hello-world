---
name: page-write
description: Section-specific rules for the non-blog content sections of intentsly.com (/guides, /learn, /solutions, /compare). Read after skills/blog-write.md, which still governs research, facts, voice, editing and the file format. This skill only adds what each section must look like to rank and convert.
---
# page-write

Every page in every section goes through the same six stages as `skills/blog-write.md` and the
same gate. The front matter gains one line, `section: <guides|learn|solutions|compare>`, and the
`type` must match the section (below). URL = `/<section>/<slug>`.

Shared rules for all four sections:

- Title and H1 are the same string, keyword near the front, under 60 characters, specific.
- First paragraph answers the query in under 90 words; a reader who stops there has the answer.
- H2s are phrased as the questions people search. Each H2 stands alone.
- At least one copy-paste asset: a table, a checklist, a query list, a message template.
- 2 to 5 internal links: one to the section index, one to a related page in another section
  (a guide links to a lesson that defines its terms; a solution page links to the guides it
  relies on), and the rest to feature pages from `blog/site-pages.json`.
- One call to action, placed after the reader has got what they came for, never above it.
- FAQ: 3 to 6 real questions, 40 to 70 word answers. The FAQ becomes FAQPage schema.
- No invented numbers, customers or quotes, ever. See blog-write.md "Facts".

## /guides (type: guide, 1,500 to 3,000 words)

Procedures. The reader wants to do the thing today.

Shape: short answer, then "What you need" (accounts, tools, time), then numbered steps as H2s
("Step 1: ...") each with the exact click, filter, search string or message, a worked example
with a labelled hypothetical company, a "Where this goes wrong" section with the three most
common mistakes, then "What to do with the list" (the outbound step), then FAQ.
Tables for filters and search operators. Code blocks for queries and message templates.
The guide must be doable without Intentsly; mention Intentsly once where it removes manual
steps, and once in the CTA.

## /learn (type: lesson, 1,000 to 1,800 words)

Definitions and concepts for someone new to signal-based selling.

Shape: one-sentence definition in bold in the first paragraph (this is what answer engines
quote), then "Why it matters" with a concrete example, then "How it works" or "Types of ...",
then "<Term> vs <neighbouring term>" (a short table), then "How to use it this week" (three
actions), then "Related lessons" with links to 2 or 3 other /learn pages (published ones from
`blog/published/`, or the section index if there are none yet), then FAQ.
Plain English, no jargon left undefined, no sales pitch in the body. CTA is the free Buying
Signal Playbook at `/signal-playbook`.

## /solutions (type: landing, 1,100 to 2,000 words)

Landing pages for "how to find customers for <business type>". Commercial intent, so the page
must both rank and convert, in that order.

Shape: the answer paragraph (where this business type's buyers show up and the fastest way to
reach them), then "Where <business type> customers show up" with the specific LinkedIn, Reddit
and X signals for that audience as a table (Signal | Where | What it means | What to do),
then "A week-one plan" as numbered steps the reader can run by hand, then "How Intentsly does
this for you" mapping each signal to the product feature from `brain/wiki/product.md` (only
features listed there), then "What this looks like in practice" using only `brain/stories/`
and verified `brain/wiki/proof.md` rows, then "Other ways to find customers" with two or three
honest alternatives (referrals, communities, paid) and when they beat signals, then FAQ.
Title pattern: "How to Find Customers for <Business Type>: <Specific Promise>".
The comparison table is required (the gate checks it). CTA: `/try-ai` or
`/features/linkedin-signals`.

## /compare (type: comparison, 1,300 to 2,500 words)

"Intentsly vs <tool>" pages. Readers are deciding; vendor bias loses them.

Shape: the verdict paragraph (who each tool is for, in two sentences), then "At a glance"
table (Job to be done | Intentsly | <Tool>) with 8 to 12 rows, then "Where <tool> is the
better choice" (a real list, not a token one), then "Where Intentsly is the better choice",
then "Pricing" quoting only the competitor's own pricing page opened today with the link and
"See pricing page" for Intentsly, then "Can you use both?", then "How to switch" (only if the
competitor's docs describe an export), then FAQ.
Competitor facts only from the competitor's own site or docs, opened during the run, with
`checked_on` set to today. Say what they do well. Never disparage.

## Front matter example

```
---
title: How to Find Customers for B2B SaaS: Signals That Work in 2026
slug: find-customers-for-b2b-saas
section: solutions
primary_keyword: how to find customers for b2b saas
secondary_keywords: b2b saas customer acquisition, find saas customers on linkedin
cluster: find-customers
type: landing
meta_title: How to Find Customers for B2B SaaS (Signal Method)
meta_description: 120 to 160 characters with the keyword once and the outcome stated.
excerpt: One or two sentences for the index card.
original_angle: Unlike the pages ranking now, this one ...
first_hand: brain/stories/dogfooding-14-demos.md
checked_on: 2026-10-15
---
```
