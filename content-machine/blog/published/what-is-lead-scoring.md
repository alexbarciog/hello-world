---
published_at: 2026-10-28T21:31:26.323107+02:00
title: What Is Lead Scoring? A Definition and a Model to Copy
slug: what-is-lead-scoring
section: learn
primary_keyword: what is lead scoring
secondary_keywords: lead scoring definition, lead scoring model, lead scoring vs lead grading, predictive lead scoring
cluster: fundamentals
type: lesson
meta_title: What Is Lead Scoring? Definition and a Model to Copy
meta_description: Lead scoring ranks leads by points for fit and recent behaviour so the likeliest buyers are contacted first. Definition, a model to copy and when to skip it.
excerpt: A plain definition of lead scoring, a ten-row model with points and a threshold that a small team can copy, how it differs from grading and qualification, when it is not worth building, and the one test that shows whether it works.
original_angle: Unlike the pages ranking now, this one gives a complete worked model with points and a threshold that a small team can copy in ten minutes, puts public buying signals ahead of engagement with your own marketing (buyers are most of the way through a purchase before they contact a seller), names the lead volume below which scoring is not worth building, and gives the one test that shows whether a model works.
first_hand: brain/stories/dogfooding-14-demos.md
checked_on: 2026-10-28
---
**Lead scoring is a method of ranking leads by giving each one points for how well it fits your ideal customer and for what it has done recently, so that the people most likely to buy are contacted first.** The short answer to "what is lead scoring" is a sorting rule with numbers attached. A buying title at a company of the right size who asked about your category this week scores high; a student who downloaded one PDF scores low. The score decides who gets a call today.

## Why does lead scoring matter?

Because nobody has time to work every lead properly. In Salesforce's State of Sales research, a survey of 7,775 sales professionals run between 24 August and 30 September 2022, reps said they spend just 28% of their week actually selling, with the rest going to deal management, data entry and similar tasks ([Salesforce, State of Sales](https://www.salesforce.com/news/stories/sales-research-2023/)). Every hour spent on a lead that was never going to buy comes out of that slice.

The second reason is timing, and the glossary pages tend to skip it. In the 6sense 2024 Buyer Experience Report, buyers were nearly 70% of the way through their purchasing process before engaging with sellers, and 81% already had a preferred vendor at first contact ([6sense via Business Wire](https://www.businesswire.com/news/home/20241009142556/en/6sense-Launches-2024-Buyer-Experience-Report-Unveiling-Global-B2B-Buyer-Trends)). A score that measures fit alone sends you to the right company in the wrong month. The recency half of the score, what the person did this week, is what gets you in before the shortlist is closed.

A labelled example. Suppose a two-person consultancy that implements HubSpot has two new leads. Lead A is a marketing manager at a 40-person software company who visited the pricing page twice and yesterday posted on LinkedIn asking for HubSpot partner recommendations. Lead B is the CMO of a 2,000-person bank who downloaded a checklist in March and has done nothing since. On company size B looks bigger. On the score A wins by a distance, because A fits and A is buying now.

## How does lead scoring work?

Every model separates two kinds of points. Explicit points come from who the lead is: title, company size, industry, location. Implicit points come from what the lead did: visited a page, replied to a message, commented on a post. TechTarget's definition describes five model variants, including negative scoring, which subtracts points for signals like unsubscribing or sitting outside the target industry ([TechTarget, What is lead scoring](https://www.techtarget.com/enterprise-software/definition/What-is-lead-scoring)). Streak's examples put numbers on the email version: a few points for an open, more for a click, the most for a reply ([Streak, Lead scoring examples](https://www.streak.com/post/8-lead-scoring-examples-for-better-lead-prioritization)).

Building one takes six steps: pick three to five fit attributes from your ideal customer profile, pick five to eight behaviours that preceded your last ten deals, give each a point value, subtract for disqualifiers, set a threshold above which a person is contacted this week, and review the weights against closed deals every quarter.

### A lead scoring model you can copy

The table below is a complete starting model for a company of one to 200 people. It is built so that timing can outweigh fit, because a perfect-fit company that is not buying is still not a lead.

| Criterion | Points | Why |
|---|---|---|
| Company size inside your ideal range | +20 | Fit: the deal is possible |
| Holds the title that signs or uses | +15 | Fit: you are talking to the right person |
| Industry you have a case study in | +10 | Fit: you can prove it |
| Company size far outside your range | -30 | Disqualifier, whatever else happens |
| Asked publicly for a recommendation in your category (last 14 days) | +30 | Timing: an open question you can answer |
| Commented on or liked a competitor's post (last 14 days) | +15 | Timing: comparing options |
| Started following a competitor's page | +10 | Timing: early research |
| Replied to your message or booked a call | +40 | Timing: a conversation exists |
| Visited your pricing page | +15 | Timing: costing it |
| Unsubscribed or said "not now" | -20 | Respect the answer, revisit next quarter |

Threshold: 50 or more means contact this week; 30 to 49 means watch and add to the next signal check; under 30 means leave alone. Halve the timing points for anything older than 30 days, so a hot lead that went quiet drops out on its own.

Two notes on the numbers. The values are a ratio to start from, not a truth. LeadLiaison's guide makes the point that one company gives an email open 10 and another 25, and what matters is applying the same values to every lead ([Lead Liaison, Scoring vs grading](https://www.leadliaison.com/best-practices/lead-scoring/lead-scoring-vs-lead-grading/)). Set the threshold so that the number of people above it roughly equals the number of real conversations your team can hold this week; if 60 people clear it and you can call 12, raise it.

Notice that the timing rows are public LinkedIn behaviour rather than visits to your own site. A founder with a few hundred website visitors a month has almost nothing to score on page views, but competitors' posts and open questions in the category happen every day. If those rows are where your points come from, Intentsly's [LinkedIn signals](/features/linkedin-signals) do the collecting and the scoring for you: every person who engages with a monitored post, page or keyword is scored against your ideal customer profile and ranked before any outreach goes out.

## Lead scoring vs lead grading vs lead qualification

The three terms are used as synonyms, and they measure different things.

| | Lead scoring | Lead grading | Lead qualification |
|---|---|---|---|
| Measures | Fit and recent behaviour together, as a number | Fit only, usually as a letter (A to D) | Whether a specific deal can happen |
| Input | Profile fields plus actions | Profile fields | A conversation, or a checklist such as budget, authority, need, timeline |
| Output | A rank: who to contact first | A tier: how good the match is | A decision: pursue or drop |
| When | Before outreach, continuously | When the lead enters your system | During or after the first conversation |
| Who owns it | Marketing and sales together | Marketing | Sales |

Some teams run grading and scoring side by side, so a lead can be an A grade with a low score (perfect fit, no activity). The model above folds grading into its first four rows, which is simpler for a small team. Qualification comes after the score has done its job: the score picks who to talk to, the conversation decides whether there is a deal. The guide on [how to qualify leads before outreach](/guides/qualify-leads-before-outreach) covers that five-minute check.

## What is predictive lead scoring?

Predictive lead scoring lets software set the point values. Instead of you deciding that a pricing visit is worth 15, a model looks at the leads that became customers, finds which attributes and actions they shared, and weights new leads the same way, adjusting as deals close. It removes the guesswork from the weights, which is its real advantage. Its limit is data: a model trained on a dozen deals a year learns your last dozen deals, not your market. Teams closing a few deals a month are better served by the hand-built table above, reviewed quarterly, until the deal history is large enough to teach anything.

## When is lead scoring not worth building?

When there are fewer leads than you can look at by hand. Rework's guide on small-team qualification argues that scoring is a triage tool for volume, and suggests that below about 100 marketing-qualified leads a month an ideal-customer checklist and fast routing of demo requests beat any model, with a simple A/B/C fit tier and a yes/no intent flag covering the next band up ([Rework, When you don't need lead scoring](https://resources.rework.com/vi/libraries/marketing-sales-alignment/when-you-dont-need-lead-scoring)). The cost of a model is not the spreadsheet; it is the hours spent arguing about weights and the months a wrong model runs unnoticed.

For most companies of one to 200 people, then, the honest version of lead scoring is a checklist for fit and a watch-list of signals for timing, which is exactly what the ten-row table is. Build the full version when a second person starts working the same leads and you need a shared rule for who goes first.

## How do you know whether your lead scoring works?

Scoring works when leads with high scores turn into closed business more often than leads with low scores, and you cannot know that without a baseline measured before the model went in. That is the test Forrester's blog on the subject sets, with velocity and conversion-to-revenue as the measures and a sales-and-marketing service agreement as the frame ([Forrester, How do you know if your lead scoring is working?](https://www.forrester.com/blogs/how-do-you-know-if-your-lead-scoring-is-working)). The practical version for a small team: after 30 days, count meetings booked from people who cleared the threshold and from people who did not. If the two numbers are close, the weights are wrong, usually because fit is counting for too much and timing for too little.

Our own launch was the clearest test we have run. We scored people against our profile and prioritised the ones showing a live signal, mostly founders posting about cold outreach fatigue, and the system booked 14 qualified demos in 14 days with no manual outreach, at a reply rate 4x our previous cold campaigns. Most of those leads came from intent signals caught in real time, which is the timing half of the score doing its work.

## How to use lead scoring this week

1. **Write the fit rows from your last ten customers.** Take their company size, the title you sold to and their industry. Those three facts become the first three rows of your table, and anything far outside them becomes the disqualifier row. If you have not written your profile down, start with [what an ideal customer profile is](/learn/what-is-an-ideal-customer-profile).

2. **Score last week's signals, not your mailing list.** List everyone who asked a question in your category, engaged with a competitor's post or replied to you in the past seven days. Score them with the table. The ones above 50 are this week's outreach; the message opens with the thing they did.

3. **Record the baseline.** Before you change anything, note how many meetings last month came from which leads. In 30 days, compare the top tier against the rest. Adjust one weight at a time.

## Related lessons

[What is an ideal customer profile?](/learn/what-is-an-ideal-customer-profile) defines the fit half of every score, and [What is a buying signal?](/learn/what-is-a-buying-signal) explains the timing half: the public events that earn the biggest points in the table above. If your scores are built on empty fields, [What is lead enrichment?](/learn/what-is-lead-enrichment) covers how those fields get filled. The [Learn index](/learn) lists every lesson in the series.

To decide which behaviours deserve points at all, the free [Buying Signal Playbook](/signal-playbook) names twelve signals that lead to conversations and eight that only look like they do, with the LinkedIn trigger and the opening line for each.

## FAQ

### What is a good lead score?

There is no universal number, because every model uses its own scale. A good threshold is one where the people above it match the number of conversations your team can hold this week and convert to meetings more often than the people below it. In the model on this page, 50 points means contact now, and the threshold should move when either of those two conditions stops being true.

### What is the difference between lead scoring and lead qualification?

Lead scoring ranks people before you talk to them, using points for fit and recent behaviour, so you know who to contact first. Lead qualification is the decision, during or after the first conversation, about whether a specific deal can happen, usually covering budget, authority, need and timeline. Scoring narrows the list; qualification settles each name on it.

### How many points should a demo request be worth?

Enough to clear the threshold on its own. A demo request is the strongest timing signal a lead can give, so in the model above it sits with "replied or booked a call" at the top of the scale. The exact figure matters less than the order: a request for a meeting should always outscore a page view, and a disqualifier should still be able to cancel it.

### Do small businesses need lead scoring?

Not a full model. Below roughly a hundred leads a month, a written ideal customer profile and a list of the signals you act on do the same job in less time. The point of scoring is to decide who goes first when there are more leads than hours; while one person can read every lead, a checklist for fit and a weekly signal review are the honest version.

### How often should you update a lead scoring model?

Review the weights once a quarter against the deals that closed, and change one value at a time so you can see the effect. Review the threshold monthly, because it depends on how many conversations the team can hold. Re-check the fit rows whenever you win a customer who would have scored badly; that is the model telling you your profile has moved.

### What is negative lead scoring?

Negative scoring subtracts points for facts or actions that make a sale less likely: a company far outside your size range, a job title with no say in the purchase, an unsubscribe, a "not now". It stops a lead with lots of activity but no fit from rising to the top, and it keeps a polite no from being contacted again next week.
