---
published_at: 2026-10-28T10:39:20.110942+02:00
title: How to Track Hiring Signals for Sales: A Free Weekly Routine
slug: track-hiring-signals-for-sales
section: guides
primary_keyword: how to track hiring signals for sales
secondary_keywords: hiring signals sales, job posting buying signal, companies hiring as a sales trigger, track job postings for prospecting, hiring signal outreach
cluster: linkedin-prospecting
type: guide
meta_title: How to Track Hiring Signals for Sales (Free Method)
meta_description: How to track hiring signals for sales without paid tools: LinkedIn Jobs alerts, Google queries for ATS boards, a scoring rule and a sheet, one hour a week.
excerpt: A weekly routine for catching companies whose job postings mean budget. Exact LinkedIn Jobs filters, Google queries for Greenhouse and Lever boards, a tell-role table, a scoring rule that separates a surge from a backfill, a tracking sheet and the message that follows.
original_angle: Unlike the pages ranking now, which are vendor playbooks and tool round-ups with unsourced reply-rate figures, this one is a free weekly routine with the exact LinkedIn Jobs filters and saved-search alerts, Google site: queries for Greenhouse and Lever boards, a tell-role table, a scoring rule that separates backfill from first hire from surge, a tracking sheet, a labelled hypothetical example, the recruiter trap, and the LinkedIn post side of hiring, with every outside figure linked.
first_hand: brain/stories/dogfooding-14-demos.md
checked_on: 2026-10-28
---
Here is how to track hiring signals for sales with no paid tool: decide which two or three job titles mean budget for what you sell, save a LinkedIn Jobs search for each with an alert, run two Google queries against the hosted job boards weekly, and log every hit in a sheet with a score that separates a surge from a backfill. Then message the hiring manager, not the recruiter, within a week of the posting. The routine takes about an hour a week once the searches are saved.

## What you need to track hiring signals for sales

- A LinkedIn account. Free is enough for everything below. Sales Navigator adds account-level hiring and headcount filters and is worth it from roughly 50 target accounts upward; where a step uses it, it says so.
- A written ideal customer profile: company size, industry, region and the team whose budget pays for you. If you do not have one, the lesson on [what an ideal customer profile is](/learn/what-is-an-ideal-customer-profile) takes ten minutes.
- A sheet with one tab, "Hiring", and the columns in Step 4.
- Google, for the job board sweep in Step 3.
- One fixed hour a week. Tuesday morning works: the LinkedIn alert for "past week" then covers the Monday postings, and you still have the week to send messages.

A hiring signal is a job posting, a headcount change or a public "we're hiring" announcement that tells you a company is about to spend on the problem your product solves. It is one kind of trigger event; the lesson on [what a trigger event in sales is](/learn/what-is-a-trigger-event-in-sales) covers the others. Hiring is the most visible of them because companies advertise it on purpose, which is also why the raw signal is noisy: the US Bureau of Labor Statistics counted 7.1 million open positions in August 2026 ([JOLTS, 29 September 2026](https://www.bls.gov/news.release/jolts.htm)). The routine below is mostly about filtering.

## Step 1: Decide which job titles are your tell

Write down the two or three roles whose posting means a company is about to buy what you sell. Everything else in the routine filters on those titles, so get this right before you save a single search.

A company hires for a function when it has decided to invest in it, and the person it hires will need tools, data or outside help within their first quarter. Match the title to your product, not to "growth" in general.

| Posted role | What it usually means | Who should care |
|---|---|---|
| First SDR or BDR, or two or more at once | Outbound has a budget line; they will need data, sequencing and LinkedIn tooling | Sales tools, lead data, outbound agencies |
| Head of Sales, VP Sales, first sales leader | A founder is handing sales over; the new leader audits the stack early | Sales tools, CRM consultants, sales training |
| Revenue Operations, Sales Operations | CRM clean-up, reporting, tool consolidation | RevOps consultants, data and integration tools |
| Two or more Account Executives | Pipeline must grow to feed them | Lead generation, appointment setting, demand gen |
| Demand Generation, Content Marketing lead | Inbound investment, content production | Agencies, freelancers, marketing software |
| Customer Success Manager | Retention and onboarding now matter | Onboarding, CS and support tools |
| In-house recruiter, Talent lead | A hiring wave is coming | Recruitment agencies, HR software, employer branding |
| Compliance, Security or Legal lead | Enterprise deals or an audit are near | Compliance platforms, legal services |

Pick your rows, then write the exact title strings you will search. "Sales Development Representative" and "SDR" are different strings to a job board; "Business Development Representative" is a third. Keep all of them.

## Step 2: Save a LinkedIn Jobs search with an alert for each title

LinkedIn Jobs is the largest free feed of postings you can filter and get emailed about. The click path, as of today:

1. Open the Jobs tab from the top navigation.
2. Type one title string in the search box. The box accepts quotation marks and uppercase OR, so `"Sales Development Representative" OR SDR OR "Business Development Representative"` is one search.
3. Set the location to the region you sell into, or "Worldwide" if you sell remotely.
4. Open the filters and set "Date posted" to the past week. Narrow further with company size, industry or experience level only if the result count is above about 150; a long list you do not read is worth less than a short one you do.
5. Switch the alert toggle on for the search. LinkedIn then emails or notifies you when new postings match, and you can change the frequency in the job alerts settings.

Vendor walkthroughs describe the same path, for example [Valley's free playbook](https://www.joinvalley.co/blog/hiring-signals-for-sales-prospecting), which calls the saved-search alert "a free alert system nobody uses". LinkedIn renames filters from time to time, so if a label above differs in your account, use the nearest one and keep the logic.

Two settings matter more than the rest. Sort by "Most recent", not "Most relevant", so the newest postings are on top. And read the company name, not the posting title: when the poster is a recruitment agency, the hiring company is usually not named at all, and the signal is useless to you. Step 4 handles that.

If you use Sales Navigator, the account search has filters that do this at the account level rather than the posting level. Amplemarket's walkthrough names them as "Hiring on LinkedIn", "Department Headcount Growth" and "Company Headcount Growth" ([Amplemarket](https://www.amplemarket.com/blog/how-to-find-purchase-intent-linkedin)); Valley's tool table adds that Sales Navigator's hiring and senior-hire alerts fire only on accounts you have saved and expire after 60 days ([Valley](https://www.joinvalley.co/blog/hiring-signals-for-sales-prospecting)). Save your target accounts first, then let the alerts run.

## Step 3: Sweep the hosted job boards with Google once a week

Many companies publish their postings on a hosted applicant tracking system board, often before the job appears on LinkedIn, and Google indexes those boards. Greenhouse-hosted boards live at `boards.greenhouse.io/<company token>` ([Greenhouse support](https://support.greenhouse.io/hc/en-us/articles/360020776251-Job-board-URL-for-Greenhouse-hosted-job-board)); Lever boards live at `jobs.lever.co`. Google's `site:` operator restricts a search to one domain and quotation marks force an exact phrase ([Google Search help](https://support.google.com/websearch/answer/2466433)), so one query per board per title covers thousands of companies at once.

```
site:boards.greenhouse.io "sales development representative"
site:jobs.lever.co "sales development representative"
site:boards.greenhouse.io ("head of sales" OR "vp of sales" OR "vp sales")
site:jobs.lever.co ("revenue operations" OR "sales operations") -intern
```

Three habits make the sweep useful:

1. Use Google's "Tools" menu to limit results to the past week. Without it you are reading last year's postings.
2. Note the board token in the URL: `boards.greenhouse.io/northwindpayroll` tells you the company even when the page title does not.
3. Add a region word when you sell locally: `"sales development representative" "London"`.

Other ATS vendors host boards the same way. To find the domain for one you care about, open the careers page of any company you know uses it and copy the hostname from a posting URL. Keep every query in a note so the sweep is a paste, not a rebuild.

## Step 4: Log the posting and score it

A posting on its own is weak. PredictLeads, which sells this data, puts it plainly: an "is hiring" flag "does almost no prioritization work on its own", and the patterns that carry intent are a net-new function, a first hire, a leader placed above an existing team, a volume spike against the company's own baseline and a tool named in the requirements ([PredictLeads, September 2026](https://predictleads.com/blog/hiring-as-a-buying-signal/)). The same source recommends removing staffing agencies, recruiting firms and job boards before scoring, because they post on behalf of others.

Log every hit in the "Hiring" tab with these columns: company, posting title, board or source, posted date, function, number of open roles in that function, pattern, score, hiring manager, status, next date.

Then score with this rule. It takes under a minute per posting once you have opened the company's own careers page or the LinkedIn company page's Jobs tab, which shows how many other roles are open.

| What you see | Read it as | Score |
|---|---|---|
| Posted by a staffing agency, the employer not named | Not a signal for you | Drop |
| One role, a title the company already has several of | Backfill | 0 |
| One role, a title the company has never had ("first", "founding", "build from scratch" in the text) | First hire; no incumbent vendor | 2 |
| A director or VP over a team that already exists | Professionalising the function; a stack review is coming | 2 |
| Two or more roles in one function posted within the last 30 days | Surge with budget behind it | 3 |
| Your product category, or a competitor, named in the requirements | They use it or plan to; add to any row above | +1 |
| Posting older than 45 days, or reposted several times | Ghost or stalled posting | Subtract 1 |

Anything scoring 3 or more goes to Step 5 this week. A 2 goes on a watch list and gets re-checked in a month, because a second posting turns it into a surge. Zeros stay in the sheet only so you recognise the company later.

To check whether a company's hiring is a spike or its normal rate, look at its careers page total today and write it down; next month, compare. A company that usually has three open roles and now has eight is the signal, whatever the absolute number.

## Step 5: Find the hiring manager, not the recruiter

The person who posted the job is almost never the buyer. The recruiter's job is to fill the role; the manager the role reports to owns the budget the new hire will spend. For an SDR posting that is the Head of Sales or the founder; for a RevOps posting it is the VP Sales or the CRO; for a demand generation posting it is the marketing lead.

The posting usually says who the role reports to. Search that title on the company's LinkedIn People tab, confirm the person is current and that their profile describes owning the function, and add them to the sheet. The guide on [how to find decision makers on LinkedIn](/guides/find-decision-makers-on-linkedin) has the title strings and the five checks for this.

If the posting is for a leader ("first Head of Sales"), the hiring manager is the founder or CEO. Message them now about the problem the hire is meant to solve, and set a reminder for 60 to 90 days out to message the person who got the job, once their name appears on the company page. Valley's playbook makes the same two-touch point: sequence the manager now, follow up when the hires land ([Valley](https://www.joinvalley.co/blog/hiring-signals-for-sales-prospecting)).

## Step 6: Watch for hiring announcements in LinkedIn posts

Job boards miss a whole class of hiring signal: the founder who posts "We're hiring our first two SDRs, DM me" before the role exists on any board, and the hundred people who like and comment on it. Those posts are earlier than the board posting, and the engagers are often the same buyers you want.

To catch them by hand, run a LinkedIn post search once a week. Type a phrase in the main search bar, switch to "Posts", and sort by "Latest":

```
"we're hiring" AND (SDR OR "sales development")
"join our sales team" OR "first sales hire"
"hiring a head of sales" OR "hiring our first"
```

Add an industry word when the feed is too broad. Log a hit the same way as a board posting, with "LinkedIn post" as the source, and score it as a first hire or a surge by what the post says. This is the step that does not scale by hand past a few searches a week; Intentsly watches LinkedIn posts for the keywords you choose, including hiring phrases, scores each poster and engager against your ideal customer profile and surfaces them with a verified email, so the search becomes a list you review ([LinkedIn intent signals](/features/linkedin-signals)). The guide to [setting up signal-based outbound](/guides/set-up-signal-based-outbound) shows how that list fits into a week.

## A worked example (hypothetical)

Northwind Payroll is an invented company used to show the routine; nothing below is a real customer. Suppose you sell a LinkedIn outreach service to companies of 50 to 300 people.

Tuesday, 9:00. The LinkedIn alert for `"Sales Development Representative" OR SDR` lists Northwind twice: two SDR postings, both posted in the past six days, both in Manchester. The Google sweep adds `boards.greenhouse.io/northwindpayroll`, where the careers page shows four open roles: the two SDRs, a Head of Sales and a payroll specialist.

9:15. The sheet gets one row per function. Sales: three open roles, two SDR postings within a week and a leader above them. Pattern: surge plus leader. Score: 3 for the surge, plus 2 for the leader hire, plus 1 because the SDR posting lists "experience with LinkedIn Sales Navigator and a sequencing tool" under requirements. Six points, the top of the week.

9:25. The SDR posting says the role reports to the "incoming Head of Sales", which means nobody is in the seat yet. The hiring manager for now is the founder. Her profile is current, she posted about the hiring push on Sunday, and 38 people reacted. She goes in the sheet as the contact, with the Head of Sales row marked "follow up when named".

9:40. The message, sent from a profile that has already engaged with her Sunday post:

```
Saw the two SDR roles and the Head of Sales opening at Northwind. Most teams hiring
their first reps spend the first quarter building lists by hand before the new leader
arrives. If it helps, I can send the three LinkedIn searches we use to find payroll
buyers who are already complaining about their provider, no call needed.
```

No pitch, one specific observation, one useful offer. Status: "sent", next date: in five days for a follow-up, and a second reminder in 75 days to message the Head of Sales once the company page lists one.

## Where this goes wrong

**Treating every posting as a signal.** A single backfill at a company that always has one SDR open tells you nothing, and messaging on it reads as spam. The score in Step 4 exists so that only surges, first hires and leader hires get a message. If more than a third of your hits score 3 or above, your tell roles are too broad.

**Messaging the recruiter.** Recruiters receive these messages all day and cannot buy from you. Worse, the message often arrives before the hiring manager has told the recruiter what tools the new hire will get. Step 5 is not optional.

**Running the sweep monthly.** Postings go up, get filled and come down. A posting first seen three weeks after it went live has usually already produced a shortlist, and the manager's attention has moved to interviews. Weekly is the slowest cadence that works; if you have the alerts set, a ten-minute daily glance is better.

One smaller one: trusting the posting date on aggregator sites, which often show the date they scraped it rather than the date it went up. The company's own board is the source of truth.

## What to do with the list

A scored list is only useful if a message follows the same week. Three rules:

1. **Lead with the posting, not with you.** The first sentence names what you saw (the two SDR roles, the new Head of Sales). The second names the problem that hire usually brings. The third offers something they can use without replying, as in the example above. The [LinkedIn message templates for buying signals](/blog/linkedin-message-templates-for-buying-signals) include a set for "their company is hiring for the role your product helps".
2. **Connect before you message.** React to or comment on the hiring post, then send the connection request with no pitch, then the message. Keep to the volume your account can carry; a signal-based list is short on purpose.
3. **Follow up on the hire, not on the silence.** If the manager does not reply, the next useful touch is in 60 to 90 days, when the new hire appears on the company page and inherits the problem. Set the date in the sheet when you send the first message.

When we ran our own outbound on signals rather than on a static list, choosing who to message by what they had just posted, it booked 14 qualified demos in 14 days with zero manual outreach, and the reply rate was 4x our previous cold campaigns. Hiring signals are one of the clearest of those posts, and the routine above gets you the list by hand in about an hour a week. If you would rather see which companies and people match your profile before you build the sheet, [try the AI](/try-ai) shows matching buyers for your product with no account, and the free [Buying Signal Playbook](/signal-playbook) lists which of the other signals are worth the same treatment.

## FAQ

### What is a hiring signal in sales?

A hiring signal is any public evidence that a company is adding people to a function: a job posting, a headcount increase on its company page, or a "we're hiring" post from an employee. For a seller it means the company has decided to invest in that function and the new person will need tools, data or services within their first quarter. The useful part is the pattern, not the single posting.

### Which job postings are the strongest buying signals?

Three patterns stand out: two or more roles in one function posted within a month, a first hire for a function the company has never had, and a director or VP placed over an existing team. Each means a decision has been made and a budget exists. A single backfill of a role the company already has several of is the weakest kind, and a posting by a staffing agency is not a signal at all.

### How do you track hiring signals for free?

Save a LinkedIn Jobs search per tell-role title with the date filter set to the past week and the alert switched on, then run a weekly Google sweep of hosted job boards with queries such as `site:boards.greenhouse.io "sales development representative"`. Log hits in a sheet, score them, and check the company's own careers page for the total number of open roles.

### Who should you contact when a company is hiring?

The manager the new role reports to, not the recruiter who posted it. The recruiter fills the seat; the manager owns the budget the hire will spend. For an SDR posting that is usually the Head of Sales or the founder. When the posting is for the leader itself, contact the founder or CEO now and the new leader 60 to 90 days later, once their name appears on the company page.

### How soon should you reach out after a job posting goes up?

Within the week you first see it, and the same day if you can. Postings get filled or paused, and the manager's attention moves from "what will this person need" to interviews within a few weeks. A weekly routine with alerts catches most postings inside that window; a daily glance at the alert email catches nearly all of them.

### Can Intentsly track job postings for me?

Not job boards. Intentsly monitors LinkedIn only: posts that mention the keywords you choose, including hiring phrases, plus the people who engage with competitor and industry posts, scored against your ideal customer profile. That covers Step 6 of this routine automatically and leaves the job board sweep in Steps 2 and 3 as a manual task, which is why the sheet and the Google queries are in this guide.
