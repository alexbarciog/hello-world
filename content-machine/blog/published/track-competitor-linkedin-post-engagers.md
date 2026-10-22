---
published_at: 2026-10-22T09:06:13.040782+03:00
title: How to Track Competitor LinkedIn Post Engagers (3 Ways)
slug: track-competitor-linkedin-post-engagers
primary_keyword: track competitor linkedin post engagers
secondary_keywords: who liked competitor linkedin post, competitor post engagement leads, linkedin engagers list, competitor engagement tracking
cluster: linkedin-signals
type: how-to
meta_title: Track Competitor LinkedIn Post Engagers: 3 Ways
meta_description: How to track competitor LinkedIn post engagers by hand, per post or continuously: a volume rule, a scoring table and a message that skips the competitor.
excerpt: The reaction list under a public LinkedIn post is open to anyone. Here is how to turn a competitor's likers and commenters into a scored list, when clicking is enough, when it is not, and what to write.
original_angle: Unlike the pages ranking now, all written by vendors and ending in the vendor's tool, this one states first what LinkedIn's own API, Buyer Intent and Page analytics will not give you (docs linked), gives a volume rule for choosing between clicking, a per-post export and continuous monitoring, a copy-paste sheet layout, a scoring table and a message template, says where each route including Intentsly is the wrong choice, and carries our own result from running it.
first_hand: brain/stories/dogfooding-14-demos.md
checked_on: 2026-10-22
---
To track competitor LinkedIn post engagers, open the competitor's post, click the reaction count under it, and copy the names into a sheet; the comments are already on the page. That works for one competitor and a few posts a week. Past three competitors or a post with more than about 50 reactions, you need either a per-post export or a tool that watches the profiles for you and scores each name against your ideal customer. This article covers all three, when each one is enough, and what to send.

## Why do competitor post engagers matter?

Someone who comments on a competitor's post about your category has told you two things: they care about the problem right now, and they are already looking at one way to solve it. That is a [buying signal](/learn/what-is-a-buying-signal), and it is timed. A cold list tells you who fits; an engager list tells you who fits and is paying attention this week.

The signal is also cheap to read. Reactions and comments on a public post are visible to anyone logged in, including the names, headlines and profile links of the people who left them. You do not need Sales Navigator or an ad budget to see them.

## What LinkedIn itself will and will not give you

Start here, because every tool page skips it. LinkedIn gives you the engager list in the interface, and almost nothing else.

The official Reactions API does not help. In [LinkedIn's Reactions API documentation](https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/reactions-api), the permission that returns reactions on an organisation's posts is "restricted to organizations in which the authenticated member has one of the following company page roles", and the member-level permission is "granted to select developers only". You can pull reactions on your own company's posts through the API. You cannot pull them on a competitor's.

Sales Navigator Buyer Intent does not help either. The signals listed on [LinkedIn's Buyer Intent page](https://business.linkedin.com/sell/resources/sales-terms/buyer-intent) are following a company, visiting a company page, engaging with ads, completing a lead form and visiting the company website. Engagement with another company's posts is not on the list. Buyer Intent tells you who is warming up to you, not who is warming up to them.

Page analytics has a Competitors tab, but it compares follower growth and engagement totals between pages. It shows numbers, not people. So for names, you are back to the post itself.

## How do you track competitor LinkedIn post engagers by hand?

This is the free method and it is enough for one or two competitors.

1. List the sources. For each competitor, note the company page and the two or three people there who post most: usually the founder, a head of sales or marketing, and one loud account executive. Add two industry voices whose audience overlaps yours. Five to eight profiles is plenty.
2. Open each profile's Activity, then the Posts tab, twice a week. Skip anniversary posts and hiring posts. Keep posts about the problem you solve, pricing, a launch, or a comparison with another tool.
3. Click the reaction count under the post. The list that opens shows every person who reacted, with their headline. Scroll it to the end; LinkedIn loads it in batches.
4. Read the comments on the same post. A comment is worth more than a reaction, and a question in a comment is worth more than praise.
5. Log every name that fits your ideal customer profile in a sheet with these columns: name, headline, company, profile URL, post URL, action (reaction, comment, question), date seen, competitor, score, status.
6. Dedupe weekly by profile URL. The same person reacting to two competitors in a month is your best row.

Budget about 15 minutes per profile per visit. The clicking is cheap. The expensive part is the gap between visits: a post you missed on Tuesday is three days cold by the time you see it on Friday.

## When is clicking not enough? A volume rule

Multiply three numbers: competitors you watch, relevant posts each publishes per week, and typical reactions per post. Then decide.

| Weekly volume (profiles x posts x reactions) | What to do |
|---|---|
| Under 300 names | Click and log by hand. Twice a week is fine. |
| 300 to 1,500 names | Export each relevant post with a per-post tool, score in the sheet. |
| Over 1,500 names, or more than 3 competitors | Continuous monitoring with ICP scoring. Hand-logging will fall behind and you will message stale names. |

As an example, three competitors with two relevant posts a week at 40 reactions each is 240 names a week before filtering. That is a manual job. Add two industry voices with 300-reaction posts and you are above 800, most of them a poor fit, and the sorting is the work.

## Which tools export or watch competitor post engagers?

Three kinds of tool exist, and they differ on two questions: does it log in as you, and does it only read, or also write the message?

**Per-post exporters** take one post URL and return the reactors and commenters as a table. Some run inside your LinkedIn session through a browser extension, which means your account is the one doing the scrolling. Others read public data without a login. The [LinkedIn Competitor Hijack Leads actor on Apify](https://apify.com/data-slayer/linkedin-competitor-hijack-leads) is the second kind: its page says it needs "no cookies and no login", reads "public data only", scans 1 to 30 posts per source, weights comments above reactions, infers seniority from the headline, and is priced at $0.02 per run plus $0.04 per scored lead. You still enrich, dedupe and write the messages yourself.

**Spreadsheet stacks** push those exports into Clay or a sheet, enrich emails, and route rows to a sequencer. [Databar's guide](https://databar.ai/blog/article/how-to-target-the-followers-and-engagers-of-your-competitors-on-linkedin) describes this well and names four audience pools worth pulling: page followers, post engagers, event attendees and group members. It is the right route if Clay is already the centre of your outbound and you have someone to maintain the table. Its weak spot is the same as the manual method: nobody is watching the posts between runs.

**Continuous monitors** take the competitor profiles once and then watch every new post, capture each reactor and commenter, score them against your ICP and hand you the short list. [Linked Panda's own comparison](https://linkedpanda.com/blog/track-competitor-linkedin-engagement) is honest about the trade: a set-up of minutes against the hours a week a stack costs to maintain, in exchange for a subscription. Most tools in this group stop at the list. Intentsly's [LinkedIn signals](/features/linkedin-signals) go one step further: it watches the posts of competitors and industry leaders you name, captures who likes, comments or shares, scores each person against your ICP, adds a verified email, and can hand the name to an AI SDR that sends the LinkedIn connection request and holds the conversation until the person books through your Cal.com or Google Calendar link.

Where each route is the wrong choice:

| Route | Wrong choice when |
|---|---|
| By hand | You watch more than three profiles, or a single post regularly passes 50 reactions. |
| Per-post export | You need to know within a day, not when you remember to run it. |
| Clay or sheet stack | Nobody owns the table. It rots in a month. |
| Continuous monitor that only lists | You wanted the messages written and sent, not another list. |
| Intentsly | You want email sequences, Reddit or X monitoring, more than two LinkedIn sender accounts, or more than 30 connection requests a day per account. It sends on LinkedIn only, with a cap of 30 messages and 30 connection requests per account per day, and we recommend 15. |

If you are choosing between full products rather than methods, the [seven tools compared as a Trigify replacement](/blog/trigify-replacement-linkedin-engagement-tracking) covers what each captures, whether it needs your LinkedIn session and whether it sends.

## How do you score the engagers before messaging?

Most names on a reaction list are peers, employees of the competitor, and people who like everything. Score before you write. Copy this table into the sheet and adjust the role line to your ICP.

| Signal | Points |
|---|---|
| Commented with a question or an objection | 5 |
| Commented (anything else) | 3 |
| Reacted only | 1 |
| Engaged with two or more competitors in 30 days | +3 |
| Title matches a buying role for your product | +3 |
| Works at the competitor, an agency pitching the competitor, or a direct peer of yours | remove |

Message anything at 6 or above the same week. Put 3 to 5 in a second column and revisit them if they show up again. Below 3, leave them; a single like is not an invitation.

If you prefer to let software do this, ICP scoring is what Intentsly does to every captured engager before anyone is contacted, so the list you see is already in this order.

## What do you send to someone who engaged with a competitor?

Do not mention the competitor's post. "I saw you liked X's post" reads as surveillance and puts the competitor's name in the first line of your message. Lead with the topic instead, which you know because you read the post.

For a commenter who asked a question, a connection note that works as an example:

> Your question under the thread on [topic] is one I hear from most [role] teams this quarter. I wrote up what we found on it. Happy to send it if useful.

For someone who only reacted, lower the ask:

> We are both following the [topic] conversation on here. I work with [type of company] on exactly that. Open to connecting?

Send within three days of the engagement, while the topic is still on their mind. Send from a real profile with a real headline, keep the daily volume low, and never automate the message from a browser extension running in your own session.

We ran this on ourselves at launch. We pointed Intentsly's own signals and AI SDR at founders complaining about cold outreach burnout on LinkedIn and let the system hold the replies. It booked 14 qualified demos in 14 days with zero manual outreach, at a reply rate 4x our previous cold campaigns, and most of those leads came from signals caught in real time. The full account is in [our case study](/case-studies).

## What about competitor page followers?

Followers are a different pool from engagers. A company page's follower list is not public the way a reaction list is, so no tool can give you the complete list of who follows a competitor. What tools can do is capture the followers who show up: people who engage with the page's posts, people who list the competitor in a comment, and people who follow the page and are visible through their own activity. Treat follower data as partial and engagement data as complete for the posts you watched.

If a competitor page's followers are your target, the better free move is to work backwards from accounts: pick the companies you want, then [find the decision makers on LinkedIn](/guides/find-decision-makers-on-linkedin) and check which of them appear in competitor comment threads.

## What to do this week

Pick the method by volume, score before you write, and send on the topic rather than the post. If you would rather see the scored list than build it, [try the AI with your competitors' profiles](/try-ai): it shows matching buyers with no account, and the 7-day free trial lets you run the outreach.

## FAQ

### Can you see who liked a competitor's LinkedIn post?

Yes, when the post is public. Click the reaction count under the post and LinkedIn opens the full list of people who reacted, with names and headlines. Comments are visible on the post itself. If the author limited the post to connections, you will only see it if you are connected, and the same limit applies to any tool.

### Is it allowed to scrape engagers from LinkedIn?

LinkedIn's user agreement bars scraping and unapproved automation, and a tool that acts inside your LinkedIn session puts your own account at that risk. Reading a reaction list by hand is normal use. Tools that read public pages without your login keep your account out of it; browser extensions that scroll the list for you do not. Know which kind you are using before you run it.

### Does Sales Navigator show who engages with competitor posts?

No. Buyer Intent in Sales Navigator reports interest in your own company: page visits, ad engagement, lead forms and website visits, per LinkedIn's own description of the feature. It does not list people who engaged with another company's posts. Saved searches and alerts help you watch a competitor's employees, not their audience.

### How soon should you message someone who engaged?

Within three days, and the same day if they asked a question in a comment. The topic is fresh and so is the person's memory of it. After a week, the reaction is just a data point to combine with others; on its own it no longer justifies a message.

### Should you mention the competitor's post in the message?

No. Mentioning it tells the person you were watching the competitor's thread and puts that competitor's name in front of them again. Reference the topic the post was about, which you know because you read it, and offer something useful on it. The engagement tells you timing and topic; it should not appear in the copy.

### Can you see who follows a competitor's company page?

Not in full. A company page's follower list is not public, so no visitor and no tool can read all of it. Tools can only surface the followers who also engage or who are visible through their own activity, so any follower list you buy is partial. Engagers on the page's posts are the complete and useful part of that audience.
