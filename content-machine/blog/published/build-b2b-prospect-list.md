---
published_at: 2026-10-21T10:48:16.402823+03:00
title: How to Build a B2B Prospect List: 7 Steps and a Template
slug: build-b2b-prospect-list
section: guides
primary_keyword: how to build a b2b prospect list
secondary_keywords: b2b prospecting list, prospect list template, sales prospecting list, build a prospect list from linkedin
cluster: outbound
type: guide
meta_title: How to Build a B2B Prospect List (7 Steps + Template)
meta_description: How to build a B2B prospect list that gets replies: ICP as filters, a paste-in sheet header, LinkedIn search strings, verification, scoring and a cut list.
excerpt: Start from what people did on LinkedIn this week, not from a database export. A paste-in header row, the exact LinkedIn search strings, a scoring rule applied to a worked example, and the rows to delete before anyone writes a message.
original_angle: Unlike the pages ranking now, this one builds the list from LinkedIn activity first and firmographics second, gives paste-in LinkedIn search strings and Sales Navigator filter names, a copy-paste header row, a scoring table applied to a labelled hypothetical company, a cut list of rows to delete before outreach, and links only primary sources (Google sender guidelines, Forrester 2026, ZeroBounce 2025 data, LinkedIn's own Sales Navigator page, Apollo's pricing page).
first_hand: brain/stories/dogfooding-14-demos.md
checked_on: 2026-10-21
---
Here is how to build a B2B prospect list you can message this week: write your ideal customer as five filters, set up a sheet with one row per person, find companies from what their people did on LinkedIn in the last 30 days, add the one or two people who own the decision, get a verified email for each, score every row for fit and timing, and cut the bottom half before anyone writes a message. A free LinkedIn account, a spreadsheet and one email finder are enough.

## What you need to build a B2B prospect list

- A LinkedIn account. Free covers the post search and company People tab used below. Sales Navigator adds the Function, Seniority, Company Headcount and Region filters, saved searches and the Job Changes spotlight ([LinkedIn, how to use Sales Navigator](https://business.linkedin.com/sell/sales-navigator/how-to-use)), which pay off once you search more than a few dozen times a week.
- A spreadsheet. Google Sheets or Excel. The header row is in Step 2.
- One email finder with a free tier and one verifier. Apollo's pricing page lists a Free plan alongside Basic, Professional and Custom, and says free plans can connect Gmail accounts only ([Apollo pricing](https://www.apollo.io/pricing)). Hunter, Dropcontact, NeverBounce and ZeroBounce all do the finding or the checking; pick one of each.
- One sentence describing who buys from you and why now. "Payroll software for 50 to 300 person companies whose finance lead just posted about month-end close" is enough to start.
- Time: about three hours for the first 50 rows, under an hour a week after that.

## Step 1: Write the ideal customer as filters, not as a persona

Turn the sentence above into five filters you can type into a search box. A persona ("Finance Fiona, 38, values efficiency") cannot be searched. A filter can. If you have not written an ideal customer profile yet, the lesson on [what an ideal customer profile is](/learn/what-is-an-ideal-customer-profile) has a worksheet; this guide needs only the five rows below.

| Filter | Example value | Where it is applied |
|---|---|---|
| Company headcount | 20 to 200 | Sales Navigator "Company Headcount", or read from the company page |
| Industry or product type | B2B software, agencies | Sales Navigator account filters, or the company's own About line |
| Region | United States, DACH, Benelux | Sales Navigator "Region", LinkedIn "Locations" facet |
| Title that owns the budget | Founder, CEO, Head of Sales, VP Finance | People tab title search, Sales Navigator "Titles" and "Seniority" |
| Trigger in the last 30 days | Posted about the problem, engaged with a competitor, changed jobs | LinkedIn post search, competitor page engagers, "Job Changes" spotlight |

The fifth row is the one every ranking article leaves out, and it is the one that decides reply rates. The first four say who could buy. The fifth says who is thinking about it this month. Write all five down before you open a search box, and add one exclusion line: the companies you will never sell to (competitors, customers, the last 90 days of lost deals).

## Step 2: Set up the sheet with one row per person

Paste this header row into cell A1, freeze row 1, and format the whole sheet as plain text so phone numbers keep their leading plus sign:

```
company,domain,headcount_band,industry,country,first_name,last_name,title,linkedin_url,signal,signal_date,signal_source,email,email_status,fit_score,signal_score,total_score,status,last_touched
```

Nineteen columns, four blocks. Company (five columns, with `domain` as the key because company names get rewritten and collide), person (four), signal (three: what they did, when, and the URL of the post or page where you saw it), contact and status (seven). Add a dropdown on `email_status` with Valid, Risky, Invalid and Unchecked, and on `status` with New, Contacted, Replied, Meeting, Closed and Cut.

One row per person, not per company. A 100-person company with three relevant people is three rows that share a domain. That is what lets you sort by signal date in Step 6 without losing the company view.

## Step 3: Find companies from what their people did on LinkedIn

Start with activity, then check the firmographic filters, not the other way round. A database export gives you 5,000 companies that fit on paper and no way to tell which 50 are in the market now. LinkedIn post search gives you the 50 first.

Open LinkedIn search, type a string, pick "Posts" and set "Date posted" to "Past month". Paste one of these, swapping the quoted phrases for your buyer's words:

```
("cold email" OR "cold outreach") AND ("reply rate" OR "response rate") AND (dropped OR falling OR "not working")
("hiring" OR "looking for") AND ("SDR" OR "sales development" OR "outbound") AND (first OR "our first")
("switching from" OR "moving off" OR "replacing") AND ("ZoomInfo" OR "Apollo" OR "Sales Navigator")
```

For each post that reads like your buyer, open the author's profile, note company, title and the post URL, and fill `signal`, `signal_date` and `signal_source`. The guide on [LinkedIn lead generation](/guides/linkedin-lead-generation-guide) goes deeper on reading posts and engagers; the short version is that the comment "we have the same problem" under a competitor's post is a better row than any filter match.

Second source: competitor and industry pages. Open a competitor's company page, open their last five posts, and read the people who commented. Commenters who match your first four filters go in the sheet with `signal_source` set to the post URL and `signal` set to "engaged with [competitor]".

Third source, if you have Sales Navigator: Account Search with Company Headcount and Region, saved as a search so new accounts land in your alerts, and the Job Changes spotlight on lead searches, which surfaces people who moved role recently. LinkedIn's page describes these filters by name and counts "40+ filters" in total ([LinkedIn](https://business.linkedin.com/sell/sales-navigator/how-to-use)). On a free account, LinkedIn throttles heavy people search with its commercial use limit; post search and the company People tab are the free-account workhorses.

Finding the signal rows by hand is the slow part: [Intentsly's LinkedIn signals](/features/linkedin-signals) watch competitor posts, keyword posts and page followers for you and score every matching person against your filters, so you start from a list of people with a signal attached instead of building those rows by hand.

Stop at 40 to 60 companies the first week. More than that and Step 5 becomes a weekend.

## Step 4: Add the one or two people who own the decision

For each company, you want the person who signs and one person who can block. Forrester's January 2026 buyer research puts the typical business buying decision at 13 internal stakeholders and nine external influencers, with procurement acting as a decision maker in 53% of buying cycles ([Forrester, 21 January 2026](https://www.forrester.com/press-newsroom/forrester-2026-the-state-of-business-buying/)). You do not need 13 rows. You need the owner and one more.

Open the company page, click "People", and paste a title string that matches the company's size. These three cover most tools and services deals once you swap the function word:

```
(Founder OR "Co-Founder" OR CEO OR "Managing Director") NOT (Assistant OR Intern OR Former)
("Head of Sales" OR "VP Sales" OR "VP of Sales" OR "Sales Director" OR CRO OR "Revenue Operations")
("Head of Finance" OR CFO OR "Finance Director" OR Controller OR "VP Finance")
```

Use the first string under about 50 employees, the second or third above it. If the person who posted in Step 3 is not the owner, keep both rows: the poster is your way in, the owner is your target, and the message in the last section names them both. The guide on [finding decision makers on LinkedIn](/guides/find-decision-makers-on-linkedin) has the full title ladder by company size and five checks that confirm someone owns the budget.

Record `linkedin_url` for every row. It is the one identifier that survives a job change, a renamed company and a bounced email.

## Step 5: Get a verified email for every row and keep the rest out

Run the sheet through your email finder by name plus domain, then through a verifier, even when the finder says the address is deliverable. Mark each row Valid, Risky or Invalid. Risky rows stay in the sheet and out of the sequence; Invalid rows get a second finder or get cut.

Verification is not a formality. ZeroBounce, looking at the addresses it checked between January and December 2025, found that at least 23% of an email list decays within one year ([ZeroBounce, Email List Decay Report](https://www.zerobounce.net/email-list-decay)). A row you found in March is a coin flip by the following spring.

Bounces and complaints cost more than the rows they come from. Google's sender guidelines tell senders to keep the spam rate reported in Postmaster Tools below 0.10% and never reach 0.30%, and apply stricter rules, including one-click unsubscribe, to anyone sending more than 5,000 messages a day to Gmail accounts ([Google, Email sender guidelines](https://support.google.com/mail/answer/81126?hl=en)). A list with unverified addresses burns through those thresholds in a week and takes your domain with it.

If your outreach runs on LinkedIn rather than email, the email column still matters: it is how the meeting invite and the follow-up after the call arrive. Fill it, but do not block a row on it.

## Step 6: Score every row for fit and timing, then cut the bottom half

Score two things separately and add them. Fit says whether they could buy. Signal says whether they are thinking about it now. A perfect-fit company with no signal is a row for next quarter. A decent-fit company whose founder posted about the problem on Tuesday is a row for today.

| Column | Rule | Points |
|---|---|---|
| fit_score | Headcount inside the band | 20 |
| fit_score | Industry or product type matches | 15 |
| fit_score | Region you can sell into | 10 |
| fit_score | Title owns the budget (not a user, not an assistant) | 15 |
| signal_score | Posted about the problem in the last 30 days | 30 |
| signal_score | Engaged with a competitor or a peer's post on the topic in the last 30 days | 20 |
| signal_score | Changed jobs or started hiring for the function in the last 90 days | 15 |
| signal_score | No signal, firmographic match only | 0 |
| total_score | fit_score plus signal_score; maximum 100 | |

Put the rules in as formulas or just type the numbers; the sheet is small. Sort by `total_score` descending, then by `signal_date` descending. Everything under 50 points is cut this week: set `status` to Cut, keep the row, and revisit it when a signal appears. Scoring every prospect against the profile before outreach is the step Intentsly does automatically; by hand it takes about a minute per row, which is why the list stops at 60 companies.

The cut is the step most teams skip, and it is why their "quality over quantity" list is still 800 rows. A list of 40 scored rows gets written to this week. A list of 800 gets a template.

## A worked example: Lantern Compliance's first list

Lantern Compliance is a hypothetical six-person firm that sells SOC 2 readiness to software companies of 20 to 200 people in the US. Its five filters: headcount 20 to 200, B2B software, United States, title Founder or CTO or Head of Engineering, trigger "posted about SOC 2, a security questionnaire, or an enterprise deal stalled on security in the last 30 days".

Week one, Step 3: three post searches ("SOC 2" AND (questionnaire OR "enterprise deal" OR audit), "security questionnaire" AND (stuck OR delayed OR "lost the deal"), ("Vanta" OR "Drata") AND (switching OR renewal OR "too expensive")) produced 31 posts from people at companies in the band. Two competitor pages added 14 commenters. Total: 45 companies, 45 signal rows.

Step 4 added an owner where the poster was not one: 19 more rows, 64 total. Step 5 found 52 valid emails, 7 risky, 5 invalid. Step 6 scored them: 28 rows at 70 or above (full fit plus a post or an engagement), 21 between 50 and 69, 15 under 50, cut. Lantern's first sequence went to the 28, written one by one, each quoting the post. The 21 got a shorter message the following week. The 15 stayed in the sheet with `status` Cut and no message.

The numbers are invented to show the shape. The shape is the point: three searches, two competitor pages, under 70 rows, a cut, and a first batch small enough to write by hand.

## Where this goes wrong

**Starting from the export.** The team opens a database, sets four firmographic filters, exports 3,000 rows and calls it a prospect list. Nothing in it says who is in the market this month, so the message has to be generic, and generic messages are what the reply rate measures. Start from Step 3, then fill in firmographics.

**Skipping verification because the finder said "deliverable".** Finders guess from patterns; verifiers test the mailbox. The decay figure above applies to the finder's database as much as to your sheet. Verify before the first send and again before any row re-enters a sequence after 90 days.

**Sorting by title instead of by signal date.** A VP at a perfect-fit company who has done nothing on LinkedIn in six months outranks a Head of Sales who commented "same here" under a competitor's post yesterday in every title-sorted list. Reverse it. The comment is the opening line of your message; the title is not.

## What to do with the list

Write to the top rows first, one at a time, and quote the signal. A message that names the post or comment gets read because it is obviously not a template. This shape works for LinkedIn connection notes and for the first email:

```
Saw your comment under [competitor]'s post about [topic] on [day].
We hit the same wall at [your company] and fixed it by [one-line method].
If [specific outcome] is on your list this quarter, happy to show you what we did. No deck.
```

Keep the daily volume low enough that every message is written, not sent. On LinkedIn, Intentsly caps each connected account at 30 messages and 30 connection requests a day and recommends 15, with up to 2 accounts per plan; those are sensible limits for a human too. At 15 a day, the 28 top rows from the example are done in two days, with the afternoon left for replies.

Treat the sheet as a weekly routine rather than a project: on Monday, run the three post searches again with "Past week", add the new rows, re-score anything whose `signal_date` is now older than 30 days, and re-verify any email about to re-enter a sequence. The list stays under 100 live rows that way, and every row has a reason to be there.

When we launched Intentsly we ran this loop on ourselves, with the signals and the outreach handled by the product: 14 qualified demos in 14 days, zero manual outreach, and a reply rate 4x our previous cold campaigns ([case study](/case-studies)). If you would rather see the signal rows for your own filters before building anything, [try the AI](/try-ai) shows matching buyers with no account, and the [guides index](/guides) has the other procedures.

## FAQ

### How many prospects should a B2B prospect list have?

Enough that you can write to every row above the cut within two weeks, which for one person is 40 to 80 scored rows, not thousands. A larger pool is fine as a database, but the live list is the rows with a signal in the last 30 days. Add to it weekly rather than building a year's supply in advance.

### Should you buy a B2B prospect list?

Usually no. A purchased list has no signal column, has been sold to other buyers, and decays at the same rate as any other list without anyone verifying it for you. If you buy one, treat it as a company pool: verify every address, then run Step 3 against those companies so you still start from what their people did this month.

### What is the difference between a prospect list and a lead list?

A prospect list is people who match your filters and have not responded yet; you chose them. A lead list is people who did something toward you, such as a form fill, a reply or a demo request. The signal column in this guide sits between the two: the person acted in public, but not toward you, which is why the message has to quote it.

### How often should you update a B2B prospect list?

Weekly for signals and quarterly for the whole sheet. Re-run the post searches every Monday with "Past week", re-score rows whose signal is older than 30 days, and re-verify any email before it re-enters a sequence after 90 days. ZeroBounce's 2025 data found at least 23% of an email list decays within a year, so an untouched sheet is stale by spring ([ZeroBounce](https://www.zerobounce.net/email-list-decay)).

### Can you build a B2B prospect list for free?

Yes, for the first 50 to 100 rows. Free LinkedIn covers post search and the company People tab, a spreadsheet costs nothing, and most email finders and verifiers have a free tier. The limits arrive with volume: LinkedIn's commercial use limit on free-account people search, and the per-credit cost of finding and verifying emails past the free allowance.

### Where do you find verified email addresses for a prospect list?

Run each row through an email finder by first name, last name and company domain, then through a separate verifier, and keep only addresses marked valid. Apollo, Hunter and Dropcontact find; NeverBounce and ZeroBounce verify. A finder's "deliverable" label is a pattern guess; the verifier's result is a test of the mailbox, and that is the one to trust.
