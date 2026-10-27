---
published_at: 2026-10-27T09:05:04.752013+02:00
title: How to Scrape LinkedIn Post Likers and Commenters: 4 Methods
slug: scrape-linkedin-post-likers-and-commenters
primary_keyword: scrape linkedin post likers and commenters
secondary_keywords: export linkedin post likers, linkedin post engagers scraper, linkedin comment scraper, who liked a linkedin post
cluster: linkedin-signals
type: how-to
meta_title: Scrape LinkedIn Post Likers and Commenters: 4 Methods
meta_description: Four ways to scrape LinkedIn post likers and commenters into a CSV, with each tool's cap and price as shown today, the URL forms that work, and a clean-up step.
excerpt: The reaction list under a public LinkedIn post can be exported four ways. Here is which ones use your own account, what each vendor's page says it costs and caps today, and how to clean the CSV before you message anyone.
original_angle: Unlike the pages ranking now, which are single-tool tutorials and vendor listicles, this one sorts the four ways to scrape LinkedIn post likers and commenters by whether your own account does the scrolling, lists the cap and price each vendor's page shows on 27 October 2026, gives the exact URL forms that work, a six-step clean-up and scoring recipe for the CSV, a decision rule by weekly volume, and says where each route including Intentsly is the wrong choice.
first_hand: brain/stories/dogfooding-14-demos.md
checked_on: 2026-10-27
---
To scrape LinkedIn post likers and commenters, copy the post's link, paste it into a tool that reads the reaction list, and download the result as a CSV with name, headline, profile URL and reaction type or comment text. There are four ways to do it: by hand, with a browser extension inside your own session, with a cloud scraper that needs no login, or with a monitor that watches profiles and scores every new engager. Before you choose a tool, decide whose LinkedIn account takes the risk.

## What a scrape of post likers and commenters gives you

One row per person who reacted or commented on a post. Across the tools opened for this article, the fields that come back are the person's name, headline, profile URL, the reaction type (LinkedIn has six: Like, Celebrate, Support, Love, Insightful and Funny) and, for commenters, the comment text and time. Some add the connection degree and a photo URL.

What you do not get matters as much. No email, no phone, no work history: the [engagers scraper by george.the.developer on Apify](https://apify.com/george.the.developer/linkedin-post-engagers-scraper) says plainly that it returns no emails, phone numbers or full profile data, and that is true of the whole category. Enrichment is a second step. You also only get what is public: people with strict privacy settings show up as "LinkedIn Member" with fewer fields, as the [InsightSocial extension page](https://www.insightsocial.app/scraper/linkedin-post-likers-scraper) notes, and a post limited to the author's connections returns nothing to a tool that is not connected.

Why bother at all: a person who comments on a post about your category has told you the topic is on their mind this week. That is a [buying signal](/learn/what-is-a-buying-signal), and it is timed, which a cold list never is.

## Which post URLs work?

Every tool starts from the post's own link, not the feed. Open the post, click the three dots in its top right corner, choose "Copy link to post". The link you get has one of these shapes:

- `linkedin.com/posts/<author>_<slug>-activity-<19 digits>-xxxx`
- `linkedin.com/posts/<author>_<slug>-ugcPost-<19 digits>-xxxx`
- `linkedin.com/feed/update/urn:li:activity:<19 digits>`

The [data-slayer reactions actor on Apify](https://apify.com/data-slayer/linkedin-post-reactions.md) accepts all three and rejects a comment URL, which is what you get if you copy the link from a comment's own menu rather than the post's. If a tool returns nothing, check the link first: it is usually a comment link or a post the author restricted.

## Method 1: scrape by hand

Free, safe, and enough for a handful of posts a week.

1. Open the post and click the reaction count under it. LinkedIn opens a panel listing everyone who reacted, with their headline and reaction type. Scroll to the bottom; the list loads in batches.
2. Copy each name and headline into a sheet with one row per person and a column for the reaction type.
3. Comments are already on the post page. Load more comments until the button stops appearing, then log name, headline and the comment text the same way.
4. Add the profile URL by opening each name in a new tab and copying the address. This is the slow part.

The manual method breaks at around 50 reactions on a post, or three posts a week, because step 4 does not scale. If that is where you are, the [competitor engager tracking article](/blog/track-competitor-linkedin-post-engagers) has a volume rule for choosing between clicking, exporting and monitoring.

## Method 2: a browser extension or tool that runs inside your session

These tools read the same panel you see in step 1, but a script does the scrolling and the copying. The cost is that your account is the one making the requests.

**InsightSocial** is a free Chrome extension. Its page says it "reads that same list inside your own logged-in session", exports 50, 100 or 500 reactors per run, pauses when the tab is not in front, and is free "up to a monthly limit" it does not state. Output includes connection degree and reaction type.

**Phantombuster** is the tool most older tutorials describe, including the [Evaboot walkthrough](https://evaboot.com/blog/export-linkedin-post-likers) (published in 2023, despite the year in its title): paste the post link into the Post Likers Export phantom, leave the count empty to get everyone, download the CSV, and run the Post Commenters Export separately. Phantombuster's automation pages did not render for this check, but its [own LinkedIn scraping guide](https://phantombuster.com/blog/sales-prospecting/linkedin-scraping/) (updated 7 July 2026) says setup installs a browser extension and connects your LinkedIn account, offers a 14-day trial with plans from $56 a month for 20 hours of execution time, and tells users to warm the account up, start small and use a proxy. That advice is the honest tell: it is your account doing the work.

**HeyReach** imports reactors straight into an outreach list. [Its help article](https://help.heyreach.io/en/articles/9888257-how-to-import-leads-who-reacted-to-specific-linkedin-posts) says to choose the "LinkedIn Post (Reactors)" import, pick a sender account, paste the post link, and keep LinkedIn open in another tab. The cap is 10,000 reactors per sender per import. Commenters are not imported by this route.

**Cookie-paste actors** on Apify, such as [MeetMagnet's post like scraper](https://apify.com/meetmagnet-owner/linkedin-post-like-scraper), ask you to export your LinkedIn session cookies with a browser extension and paste them in. That is the same risk as an extension with less visibility, and that actor's page was last modified two years ago. Treat any tool that wants your LinkedIn session cookie as running inside your session.

**Make with Browserflow** is the no-code variant: the [Make community thread](https://community.make.com/t/scrape-people-that-have-reacted-to-linkedin-posts-like-love-celebrate-etc/71414) describes a "Scrape Leads from a LinkedIn Post" module that returns commenters and reactors, with a default limit of 200 reactions and advice to loop with an offset on bigger posts to avoid time-outs.

Use this group when you want the richest fields (degree, reaction type, nested replies) on your own or a partner's posts, and keep the volume low.

## Method 3: a cloud scraper that needs no login

These read the public post page from the vendor's infrastructure. Your account is not involved, so a ban risk sits with the vendor, not you. Prices and caps below are what each vendor's own page showed on 27 October 2026; they change often, so check before you run.

| Tool | Login needed | What it returns | Cap per post | Price shown today | Source |
|---|---|---|---|---|---|
| Apify: Scraping Solutions engagers | No | Likers, commenters or reshares (one type per run); name, headline, profile URL, comment text and time | 1 to 3,000 unique profiles | from $1.10 per 1,000 results | [actor page](https://apify.com/scraping_solutions/linkedin-posts-engagers-likers-and-commenters-no-cookies) |
| Apify: data-slayer post reactions | No | One row per reaction with type, name, headline, profile URL; filter by reaction type | default 100, 0 for all up to a 100-page cap | from $1.50 per 1,000 results | [actor page](https://apify.com/data-slayer/linkedin-post-reactions.md) |
| Apify: george.the.developer engagers | No | Reactors and commenters deduped across posts, filtered by headline keywords; only matched rows are billed | `maxEngagersPerPost` (example 1,000) | $4 to $5 per 1,000 matched leads (the page shows both) plus a start fee | [actor page](https://apify.com/george.the.developer/linkedin-post-engagers-scraper) |
| Vayne | No, but a Vayne account | Likers and commenters for one post or a profile's last 20 posts, scheduled runs, CSV kept 90 days | up to 20 posts per profile run | one credit per engager; free credits to start, plan prices on a separate page | [product page](https://www.vayne.io/en/linkedin-post-scraper) |
| Clay: LinkedIn Community action | No, bring your own key | "Find Post Audience" returns reactors and commenters into a Clay table | not stated | not stated | [Clay community](https://community.clay.com/x/tutorials/u1ghk0x31o4h/scrape-linkedin-engagers-easily-with-clay--apify-g) |

Three things to know before you pick one. First, the Apify actors are run by independent developers, so read the stats on the page: the data-slayer reactions actor showed 15 users and [71.4% of runs succeeded](https://apify.com/data-slayer/linkedin-post-reactions.md) today, while the Scraping Solutions actor showed 1,500 users and a recent update. Second, "cap per post" is an upper bound, not a promise; every page says results depend on what the public page exposes. Third, the cheapest route is not always the cheapest list: the george.the.developer actor costs more per row but bills only for rows whose headline matches your keywords, so, as an example, on a 400-reaction post where 60 people fit your titles, you pay for 60.

To run one: start a run from the actor page, paste one or more post links into the URL field, set the per-post limit, and export the dataset when the run finishes; the actor pages list CSV, JSON and Excel among the formats. Apify's servers do the rest.

## Method 4: a monitor that watches profiles and scores the engagers

Methods 1 to 3 answer "who engaged with this post". They do not tell you when the next post goes up, and the gap between runs is where the signal goes cold. A monitor takes the profiles once, captures the reactors and commenters of every new post, and puts the list in the order you would message it.

Vayne's scheduled runs cover the first half of that: pick a profile, run it on a schedule, collect the new engagers from its last 20 posts. Scoring and the message are still yours.

Intentsly's [LinkedIn signals](/features/linkedin-signals) cover both halves. You name the competitors and industry voices to watch; it captures who likes, comments or shares their posts, scores each person against your [ideal customer profile](/learn/what-is-an-ideal-customer-profile), adds a verified email, and can hand the name to an AI SDR that sends the connection request and holds the conversation on LinkedIn until the person books through your Cal.com or Google Calendar link. It is the right choice when the scraping is the chore you want gone and the list is not the goal; it is the wrong choice if you want a raw CSV to feed another tool, or Reddit and X engagers, since it watches LinkedIn only.

## How to clean the CSV before you message anyone

Whatever produced the file, do these six steps in a sheet before a single row goes into a sequencer.

1. **Dedupe by profile URL**, not by name. Across several posts the same person appears many times; one row per person, with a column counting how many posts they engaged with.
2. **Drop "LinkedIn Member" rows** and any row with an empty profile URL. You cannot message them and you cannot score them.
3. **Remove the author's own people.** Employees of the account whose post you scraped, their agency and the author themselves are a large share of any company post's reactions. Filter the headline column for the company name.
4. **Weight comments over reactions.** A comment with a question or an objection outranks a Celebrate. If your tool returned comment text, read it; the few rows that matter are there.
5. **Score against your ICP.** Role, company size, geography, and whether they engaged with two sources in the last month. The scoring table in the [competitor engager tracking article](/blog/track-competitor-linkedin-post-engagers) works unchanged on a scraped file.
6. **Enrich only the survivors.** Email enrichment is paid per row almost everywhere; run it on the scored short list, not the raw export.

If you would rather skip the sheet, this is the step Intentsly does for you: every captured engager is scored against your ICP before you see the list.

## Is it allowed to scrape LinkedIn post likers and commenters?

Reading the reaction panel by hand is ordinary use of the site. Automation is where LinkedIn draws the line. In its [own statement on the hiQ case](https://blog.linkedin.com/2022/november/4/update-hi-q-legal-proceeding) (4 November 2022), LinkedIn quotes the court that its User Agreement "unambiguously prohibits scraping and the unauthorized use of scraped data" and says it will keep fighting what it calls illegal scraping. Its help pages on prohibited software could not be opened for this article because they block automated readers, so read them yourself before you install an extension.

The practical consequence is the split this article is built around. A tool that runs inside your session, whether as an extension, a pasted cookie or a sender account kept open in another tab, makes your account the one breaking the rule, and the restriction, if it comes, lands on you. A cloud scraper reading public pages keeps your account out of it, but the data still came from LinkedIn against its terms, so do not store more than you will use, do not resell it, and respect the privacy law where the person lives. None of this is legal advice; if the list feeds a regulated process such as recruiting, ask someone who can give it.

The messaging rule follows from the same logic: never automate the outreach from the account that did the scraping, and never mention the post you scraped. Lead with the topic. The [outreach message guide](/guides/write-linkedin-outreach-message) covers the wording.

## Which method should you use? A one-minute rule

| Your situation | Use |
|---|---|
| Fewer than 3 posts a week, under about 50 reactions each | Method 1, by hand |
| Your own or a partner's posts, you want degree and reaction type, low volume | Method 2, an extension in your session |
| Competitor or industry posts, hundreds of names, you already run Clay, a sheet or a sequencer | Method 3, a no-login cloud scraper |
| You want to know within a day of every new post from a set of profiles, scored, with the outreach handled | Method 4, a monitor; Intentsly if LinkedIn is the only source you need |

Where each route is the wrong choice: by hand when a post regularly passes 50 reactions; an extension when the account is the one you sell from; a cloud scraper when nobody owns the clean-up sheet; a monitor when all you wanted was one list from one post.

We used method 4 on ourselves at launch: we pointed Intentsly's signals and AI SDR at founders complaining about cold outreach burnout and let the system hold the replies. It booked 14 qualified demos in 14 days with zero manual outreach, at a reply rate 4x our previous cold campaigns, and most of those leads came from signals caught in real time. The account is in [our case study](/case-studies).

## What to do today

Pick one post that your buyers engaged with, run it through method 1 or a no-login actor, and clean the file with the six steps above. If the short list is worth messaging, the sheet will tell you in an hour whether this is a weekly job or a system. If you would rather see the scored list than build it, [try the AI with the profiles you would scrape](/try-ai): it shows matching buyers with no account, and the 7-day free trial covers the outreach.

## FAQ

### Can you see everyone who liked a LinkedIn post?

Yes, if the post is public and you are logged in. Click the reaction count under the post and LinkedIn opens the full list with each person's name, headline and reaction type. If the author limited the post to connections, you only see it when you are connected, and the same limit applies to every tool, with or without a login.

### Can I export likers and commenters from someone else's post?

Yes, for any public post. The tools in this article take a post link, not ownership; a competitor's post, an industry voice's post or a partner's post all work the same way. What you cannot export is a company page's full follower list, so the engagers on the page's posts are the complete and useful part of that audience.

### Do I need to connect my LinkedIn account to scrape a post?

Not for the cloud scrapers: the Apify actors from Scraping Solutions, data-slayer and george.the.developer, and Vayne, all say they need no cookies or login. Extensions such as InsightSocial, HeyReach's import, Phantombuster and cookie-paste actors do run inside your session. Decide which kind you are using before the first run.

### How many likers can you scrape from one post?

It depends on the tool, and each number is an upper bound. The Scraping Solutions actor allows 1 to 3,000 unique profiles per post, data-slayer defaults to 100 with an option for all up to a page cap, InsightSocial exports 50, 100 or 500 per run, and HeyReach imports up to 10,000 reactors per sender. All of them return fewer when LinkedIn stops loading the list.

### Does the export include the comment text?

Only if you scraped commenters, which is usually a separate run or a setting. The Scraping Solutions actor returns comment text and time for commenters, the george.the.developer actor returns `commentText` on comment rows, and the curious_coder comment scraper returns nested replies. Reaction-only runs return the reaction type instead.

### Can I get emails from a scrape of LinkedIn post likers?

No. Every tool opened for this article returns name, headline and profile URL, and some add reaction type, comment text and degree. Emails come from a second enrichment step, paid per row, which is why you should score the list first and enrich only the rows you will message.
