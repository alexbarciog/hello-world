# Brief: scrape linkedin post likers and commenters (2026-10-27)

Keyword: scrape linkedin post likers and commenters. Cluster linkedin-signals, type how-to, intent commercial.

## Intent
The searcher has a post (their own, a competitor's, an industry voice's) and wants the people who reacted
or commented as a table they can work: name, headline, profile URL, reaction type or comment text. The top
results are tool pages (Apify actors, Vayne, InsightSocial, Phantombuster) and vendor tutorials (Evaboot,
Bardeen, HeyReach help). Format to match: a how-to with numbered steps per method and a comparison table.

## Who ranks (opened today)
- Apify actors: george.the.developer "LinkedIn Post Engagers Scraper" (no cookies, ICP keyword filter,
  $5 per 1,000 matched leads plus a start fee; page also says "from $4.00 / 1,000"), scraping_solutions
  "Linkedin Posts Engagers (No cookies)" (from $1.10 / 1,000 results, resultsLimit 1 to 3,000 per post,
  one engagement type per run), data-slayer "LinkedIn Post Reactions (No Cookies)" (from $1.50 / 1,000,
  accepts /posts/...-activity-..., ...-ugcPost-..., /feed/update/urn:li:activity:..., default 100 per post,
  0 = all with a 100-page cap, 71.4% of runs succeeded, 15 users), meetmagnet "Post Like Scraper" (needs
  your session cookies pasted in, last modified 2 years ago), curious_coder "comment scraper" (pay per
  usage, rating 2.1 from 3, nested replies in output).
- scrapecreators.com "6 Best LinkedIn Post Scrapers" (30 Sept 2026): vendor-written, favours itself, covers
  post scrapers more than engager scrapers.
- vayne.io post scraper page: cloud, no cookie or extension, one credit per engager, post URL or profile URL
  (up to 20 recent posts), scheduled runs, CSV kept 90 days. No plan prices on the page.
- evaboot.com "How to export LinkedIn post likers & commenters" (published Aug 2023, title says 2026):
  Phantombuster walkthrough, no prices, no limits, promotes Evaboot for Sales Navigator.
- insightsocial.app "LinkedIn Post Likers Scraper": free Chrome extension, reads the list inside your
  logged-in session, 50 / 100 / 500 per run, tab must stay in front, "exports free up to a monthly limit".
- help.heyreach.io: import reactors (not commenters) from a post URL, up to 10,000 reactors per sender per
  import, LinkedIn must be open in another tab, a sender account is selected.
- bardeen.ai answers page (Nov 2024): generic four steps, names Phantombuster, TexAu, Expandi, Octoparse,
  Captain Data; no limits, no prices.
- community.make.com: Browserflow module in Make, default limit 200 reactions, loop with offset to avoid
  time-outs.
- community.clay.com threads: Phantombuster or Apify suggested, warning about account risk; Clay's own
  "Find Post Audience with LinkedIn Community" action (bring your own key).
- phantombuster.com: automation pages need JavaScript and could not be read; the blog page (modified
  7 July 2026) says setup installs a browser extension and connects your LinkedIn account, 14-day trial,
  plans from $56/month for 20 hours of execution time, and advises warming up, proxies and staying within
  LinkedIn's limits. Pricing page asked for a permission nobody was there to grant.
- LinkedIn's own position: blog.linkedin.com (4 Nov 2022) quotes the court that its User Agreement
  "unambiguously prohibits scraping and the unauthorized use of scraped data". help.linkedin.com pages are
  robots-blocked for the tool, so the "prohibited software and extensions" page is not quoted.

## What every page covers
Copy the post link, paste it into a tool, download a CSV with name, headline, profile URL, reaction type
or comment text. Likers and commenters are usually separate runs. Reaction types: Like, Celebrate, Support,
Love, Insightful, Funny.

## What no page covers
- Which methods run inside your own LinkedIn session (extensions, cookie-paste actors, HeyReach,
  Phantombuster) and which read public pages without it (data-slayer, scraping_solutions, george, Vayne),
  stated side by side with the price and per-post cap each vendor shows today.
- The URL formats that work and the ones that fail (comment URLs are rejected by data-slayer; the
  ugcPost form exists).
- A clean-up recipe for the CSV: dedupe by profile URL across posts, drop "LinkedIn Member" rows, remove
  the author's colleagues, weight comments over reactions, then score against the ICP.
- A decision rule by volume and by who owns the account risk.
- Where each route, including Intentsly, is the wrong choice.
- What the list is for after the export (message on the topic, not the post) and that reaction lists are
  complete only for the posts you scraped.

## Questions people ask (from the vendor FAQs and threads)
- Can you see everyone who liked a LinkedIn post?
- Can I export likers from someone else's post?
- Is scraping who liked a post allowed?
- How many reactors can I export per post?
- Do I need to connect my LinkedIn account?
- Does it capture the reaction type and the comment text?
- Can I get emails from the export?

## Unlike the pages ranking now, this one ...
... is not written to sell one scraper: it sorts the four ways to scrape LinkedIn post likers and commenters
by whether your own account does the scrolling, lists the cap and the price each vendor's page shows today
(27 Oct 2026), gives the exact URL forms that work, a six-step clean-up and scoring recipe for the CSV, a
one-minute decision rule by weekly volume, and says where each route including Intentsly is wrong.

## Relation to published pages
blog/track-competitor-linkedin-post-engagers covers the why, the manual method and the message. This page
is the scraping procedure itself (tools, caps, URL forms, clean-up) and links to that one for the message
and scoring detail. Title kept far from it.
