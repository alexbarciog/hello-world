---
name: blog-keywords
description: Refresh the blog keyword queue: find new keywords, re-check who ranks, and re-prioritize from Search Console data when available. Run monthly or when the queue has fewer than 5 queued keywords.
---
# blog-keywords

1. Read `blog/keywords.json`, `brain/wiki/product.md`, `brain/wiki/icp.md`.
2. Find candidates: search each cluster's main terms and collect related searches, "people also
   ask" questions, competitor blog titles (joinvalley.co, gojiberry.ai, trigify.io, findymail.com,
   commonroom.io) and recurring questions in r/sales, r/SaaS and r/b2bmarketing. New competitor
   names become "alternatives" and "vs" keywords.
3. For each candidate, search it and record who ranks. Difficulty: `low` if the first page is
   small sites, directories or forums; `medium` if vendor blogs; `high` if major publications or
   category leaders. Skip keywords where Intentsly is not a credible answer.
4. If the user provides a Search Console export (queries with impressions and position), fill
   `monthly_volume` proxies from impressions, raise priority for queries at positions 8 to 30
   (an update or supporting article can lift them), and add an `update` note to those keywords.
5. Never write a search volume you did not get from a tool or export. Leave it null.
6. Append new entries with status `queued`; do not delete or reorder existing ones. Report what
   was added and the new top five.
