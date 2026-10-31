---
published_at: 2026-10-31T10:34:55.158696+02:00
title: How to Use LinkedIn Search Operators for Prospecting
slug: linkedin-search-operators-for-prospecting
section: guides
primary_keyword: how to use linkedin search operators for prospecting
secondary_keywords: linkedin boolean search, linkedin boolean search strings, linkedin search operators, linkedin x-ray search
cluster: linkedin-prospecting
type: guide
meta_title: How to Use LinkedIn Search Operators for Prospecting (Guide)
meta_description: How to use LinkedIn search operators for prospecting on a free account: the five operators, where they work, copy-paste strings and a fix table.
excerpt: Five operators, four places on LinkedIn where they actually work, a worksheet that turns your ideal customer profile into a string, and a fix table for searches that return nothing or everything. Ends with the Posts search that tells you who to message first.
original_angle: Unlike the pages ranking now, this one maps the four places on LinkedIn where operators work (People search, company People tab, Posts tab, Google X-ray) with what each accepts, builds the string from the reader's ICP with a worksheet, gives a debugging table for strings that return zero or ten thousand results, cites only LinkedIn's and Google's own documentation for limits, and ends with the Posts search as the signal step that turns a list into a reason to message.
first_hand: brain/stories/dogfooding-14-demos.md
checked_on: 2026-10-31
---
Here is how to use LinkedIn search operators for prospecting: write your buyer's job title as a quoted phrase, add the synonyms with OR inside parentheses, join the company or problem words with AND, cut the noise with NOT, then paste the string into the People search bar and narrow with the Location and Current company filters. The same five operators work in the company page People tab and in the Posts tab, where they find people writing about the problem you solve. Steps, strings and fixes follow.

## What you need

- A LinkedIn account. Free is enough for everything in this guide. Sales Navigator adds Seniority Level, Function and Company Headcount filters and saved-search alerts, which pay off once you run the same searches every week.
- An ideal customer profile written as three lists: titles that own the purchase, words that appear on the right companies' pages, and words that mark the wrong people (interns, recruiters, students, consultants). The lesson on [what an ideal customer profile is](/learn/what-is-an-ideal-customer-profile) shows how to write one in an hour if you have none.
- A plain text editor. Word processors and chat apps turn straight quotes into curly ones, and LinkedIn reads curly quotes as ordinary characters, so the phrase match silently stops working.
- A spreadsheet with five columns: string, where you ran it, result count, first-page hit rate, date. Fifteen minutes to build the first string, under five per search after that.

## Step 1: Learn the five LinkedIn search operators you can use for prospecting

LinkedIn recognises five operators and nothing else. LinkedIn's own Sales Navigator community post lists them with examples: quotation marks for an exact phrase, AND to require every term, OR to accept any term, NOT to exclude a term, and parentheses to group terms, with the rule that operators must be typed in capital letters ([LinkedIn Sales Navigator community, 24 June 2025](https://scommunity.linkedin.com/tips-from-linkedin-experts-80/how-to-use-boolean-search-like-a-pro-in-sales-navigator-7813)).

| Operator | What it does | Example | Trap |
|---|---|---|---|
| "quotes" | Matches the exact phrase | "head of sales" | Curly quotes from a word processor do not count |
| AND | Every term must appear | "head of sales" AND SaaS | Lowercase "and" is treated as a word |
| OR | Any term may appear | CRO OR "chief revenue officer" | Commas are not OR |
| NOT | Removes profiles with the term | sales NOT recruiter | Matches the term anywhere on the profile, including past roles |
| ( ) | Groups terms so OR lists are evaluated first | ("VP Sales" OR CRO) AND fintech | Unbalanced parentheses return odd results with no error |

Guides that quote LinkedIn's help centre agree on what is ignored: the asterisk wildcard, square and curly brackets, plus and minus signs, and field commands such as title: or company: ([Linked API, 14 July 2026](https://linkedapi.io/guides/linkedin-boolean-search); [100Hires, July 2026](https://100hires.com/linkedin-boolean-search.html)). If you need "market*" to catch marketing and marketer, write (marketing OR marketer). If you need a title match, use the Title field in Step 3, not a command in the string.

Evaluation order matters when a string mixes operators. The same guides describe the order as quotes first, then parentheses, then NOT, then AND, then OR. Without parentheses, "VP Sales" OR CRO AND fintech is read as "VP Sales", or else a CRO in fintech, which is rarely what you meant.

## Step 2: Turn your ideal customer profile into a string

Build the string from three lists before you type anything into LinkedIn. Each list becomes one parenthesised group.

| List | Question to answer | Example for a hypothetical payroll software seller | Becomes |
|---|---|---|---|
| Titles | Who signs for this at a 50 to 300 person company? | Head of Finance, Finance Director, CFO, Controller | ("head of finance" OR "finance director" OR CFO OR controller) |
| Context words | What word is on the profile of the right person and not on the wrong one? | payroll, "month-end", "finance team" | AND (payroll OR "month-end" OR "finance team") |
| Exclusions | Which titles match the words but never buy? | recruiter, consultant, intern, student, "talent acquisition" | NOT (recruiter OR consultant OR intern OR student OR "talent acquisition") |

Joined, the worksheet gives one string:

```
("head of finance" OR "finance director" OR CFO OR controller) AND (payroll OR "month-end" OR "finance team") NOT (recruiter OR consultant OR intern OR student OR "talent acquisition")
```

Three rules keep the string honest. Spell out abbreviations as a second OR term, because profiles use both (CRO OR "chief revenue officer"). Keep the NOT list to five terms or fewer, since NOT reads the whole profile and a long list removes people whose first job was an internship. Leave locations and company size out of the string entirely; those are filters in Step 3, and putting "Berlin" in the string matches anyone who mentions Berlin anywhere.

Five starting strings you can adapt by swapping the function word:

```
(Founder OR "Co-Founder" OR CEO OR "Managing Director") AND (B2B OR SaaS OR agency) NOT (Assistant OR Intern OR Former OR Student)
("VP Sales" OR "VP of Sales" OR "Head of Sales" OR "Sales Director" OR CRO OR "Chief Revenue Officer") NOT (recruiter OR "talent acquisition")
("Revenue Operations" OR RevOps OR "Sales Operations") AND (Head OR Director OR Lead OR Manager)
("Head of Marketing" OR "Marketing Director" OR CMO OR "VP Marketing") AND ("demand generation" OR "lead generation" OR ABM) NOT (agency OR freelance)
("Head of People" OR "HR Director" OR "People Operations" OR CHRO) AND (payroll OR onboarding OR HRIS) NOT (recruiter OR consultant)
```

## Step 3: Run the string in LinkedIn People search and add filters

The free People search is where most prospecting strings belong. The clicks:

1. Paste the string into the search bar at the top of LinkedIn and press Enter.
2. Click "People" in the row of result types.
3. Open "All filters". Set "Locations" to the regions you sell into. Under "Current company", add target companies if you have a list; the filter accepts many.
4. Scroll to "Keywords" inside All filters. Move your title group from the main string into the "Title" field, and leave the context words in the general field. The Title field matches current titles; the general field matches the whole profile, including past roles and recommendations.
5. Click "Show results" and read the first 20 profiles before you do anything else.

Boolean logic works only in the keyword-type fields: the main search bar and the Keywords, Title and Company boxes. The structured filters (Locations, Industry, Connections, Current company) are picklists and ignore operators, which is why location belongs in a filter and never in the string ([LinkedIn Sales Navigator community, 24 June 2025](https://scommunity.linkedin.com/tips-from-linkedin-experts-80/how-to-use-boolean-search-like-a-pro-in-sales-navigator-7813)).

| Where you type the string | What it matches | Use it for |
|---|---|---|
| Main search bar | Whole profile: headline, About, every role, skills | Context words, problem words |
| Keywords > Title (All filters) | Current and past job titles | Your title group |
| Keywords > Company (All filters) | Company names in experience entries | Named accounts, competitor employees |
| Company page > People tab box | Employees of that one company | One account at a time, see Step 4 |
| Posts tab search bar | Post text | Buying signals, see Step 5 |

Free accounts have a commercial use limit on people searches. LinkedIn's Premium FAQ says the count builds from your search activity since the first of the calendar month, that non-name searches and searches outside your network count toward it, and that search is restricted until it resets on the first of the next month; Premium Business, Sales Navigator and Recruiter Lite remove the limit ([LinkedIn Premium FAQ](https://premium.linkedin.com/professional/faq)). Run broad discovery searches early in the month and record results as you go, because the sheet is the only thing that survives the limit.

If you have Sales Navigator, the same string goes into its Keywords, Job Title or Company field, and the Seniority Level, Function and Company Headcount filters replace most of your NOT list. LinkedIn's community guidance states a maximum of 2,500 profiles per search and up to 15 saved searches with alerts ([LinkedIn Sales Navigator community, 13 May 2020](https://scommunity.linkedin.com/education-training-8/4-ways-to-maximize-advanced-search-in-sales-navigator-1264)). Our guide to [Sales Navigator alerts](/guides/set-up-linkedin-sales-navigator-alerts) covers the saved-search setup.

## Step 4: Search one company's People tab when you work account by account

For a named account the company page beats the global search, because every result already works there and the count is small enough to read in full.

1. Search the company name, pick the result marked "Company", and open the "People" tab.
2. Type your title group into the box labelled "Search employees by title, keyword or school". The five operators work here.
3. Use the "Where they live" and "What they do" facets below the box to narrow by region and function.
4. If the tab returns more than 50 people for your title group, add a region; if it returns zero, open the three most senior people under "What they do" and copy the title word they actually use.

For large accounts, the same title group split across regions gives you the owner per territory rather than one global VP. The guide on [finding decision makers on LinkedIn](/guides/find-decision-makers-on-linkedin) shows how to confirm that the person you found owns the budget rather than supports it.

## Step 5: Search the Posts tab to find people with the problem now

A profile tells you who could buy. A post tells you who is thinking about it this week. After running the string in People, run a shorter version in Posts:

1. Type the problem phrase in the search bar and press Enter.
2. Click "Posts" in the result types.
3. Open filters and set "Date posted" to "Past week" or "Past 24 hours", and "Sort by" to "Latest".
4. Add your exclusions, because Posts search is full of vendors writing about the problem you want buyers to have.

Problem strings for the Posts tab are built from the words a buyer uses when something is broken, never from their title:

```
("cold outreach" OR "cold email") AND (burnout OR "not working" OR "reply rate") NOT (agency OR "we help")
("month-end close" OR "payroll error") AND (manual OR spreadsheet OR "every month") NOT (webinar OR "sign up")
("looking for" OR "any recommendations") AND (CRM OR "sales tool" OR "outreach tool")
("just raised" OR "series A" OR "seed round") AND (hiring OR "first sales hire")
```

Read the author's headline before you save the name. A founder complaining about reply rates is a prospect; a consultant quoting someone else's complaint is not. Record the post date and the sentence that made you stop, because that sentence becomes the first line of your message.

Running these searches by hand every day is the part that does not scale. Intentsly does this step automatically for LinkedIn: it watches posts for the keywords you set, tracks who likes, comments on and shares your competitors' posts and who follows their pages, scores each person against your ideal customer profile, and surfaces them with a verified email, so the list you would have built from Posts search arrives sorted ([LinkedIn intent signals](/features/linkedin-signals)).

## Step 6: Fix a string that returns nothing or everything

Read the first 20 results of every new string and count how many fit. Fewer than 15 of 20 means the string needs work, and the result count tells you which way.

| Symptom | Likely cause | Fix |
|---|---|---|
| Zero results | A lowercase and or or treated as a word; curly quotes; a NOT term that also appears in the title you want | Retype operators in capitals in a plain text editor; move the title group to the Title field; remove NOT terms one at a time |
| Tens of thousands of results, first page off target | OR group has no AND partner; context words are too generic (sales, growth) | Add a context group with AND; replace generic words with the phrase a buyer writes ("month-end close") |
| Right titles, wrong companies | Title group is in the main bar, so past roles match | Move titles to the Title field; add Current company filter |
| Right people, wrong country | Location word inside the string | Delete it from the string, set the Locations filter |
| Results change between runs | LinkedIn orders results by relevance, so the same string shows a different first page | Set the Connections filter to 2nd, then run 3rd+ separately, or search from the company People tab where the set is fixed |
| Everyone is a recruiter or a vendor | Missing exclusions | Add NOT (recruiter OR "talent acquisition" OR "we help" OR agency), five terms at most |

Change one thing per run and log the result in the sheet. A string that is right for one month of searches is worth more than fifty strings copied from a cheat sheet, because it encodes what your buyers actually call themselves.

## A worked example: Harbor Ledger builds its first list

Harbor Ledger is a hypothetical company used to make the steps concrete. It sells expense management software to companies of 80 to 400 people in the Netherlands and has no list yet.

Step 2 gave three groups: titles ("head of finance" OR "finance director" OR CFO OR controller), context (expenses OR "expense management" OR "month-end" OR receipts), and exclusions NOT (recruiter OR consultant OR intern OR student). Step 3, with Locations set to Netherlands and the title group moved into the Title field, returned several hundred profiles; the first 20 contained 17 plausible owners, two consultants who had slipped past the exclusion because "advisor" was not on the list, and one CFO of a 3,000-person bank. Adding NOT advisor and reading the "Current company" facet to drop banks took two runs.

Step 5 used ("expense reports" OR receipts) AND (chasing OR manual OR "every month") NOT (webinar OR "we help") in Posts, sorted by Latest, past week. It found four posts: two from controllers complaining about receipt chasing, one from a finance director asking for tool recommendations, and one from a vendor. The three real ones went to the top of the sheet with the sentence that mattered. By the end of an afternoon Harbor Ledger had 41 names from People search sorted by title and region, and 3 names from Posts search with a reason to write this week.

## Where this goes wrong

**Copying a cheat sheet string without the context group.** ("VP Sales" OR CRO) on its own returns every sales leader on the platform. The string is useless until an AND group narrows it to the problem or the market you serve. Build the context list in Step 2 before anything else.

**Putting filters in the string.** "Berlin", "50-200 employees" and "fintech" typed into the search bar match anyone whose profile mentions those words, including the agency that serves fintech clients in Berlin. Locations, Industry and Current company are filters; the string carries titles and problem words only.

**Trusting the result count.** Judge every string by its first page: twenty read profiles with 17 hits beat ten thousand unread results. Log the hit rate in the sheet and stop refining when it holds across two runs.

## What to do with the list

Message the Posts-search names first, quoting the sentence you recorded, and work the People-search names by region after that. One template for someone who posted about the problem:

```
Hi {first name}, your post on {topic} this week matched what we hear from {title}s at {company size} companies. We built {product} for that exact step. If useful I can send a two-minute walkthrough; if not, no follow-up from me.
```

Keep the volume low. We cap our own platform at 30 messages and 30 connection requests per LinkedIn account per day and recommend 15, because every name you verified was expensive and a restricted account wastes the whole sheet. The guide on [writing a LinkedIn outreach message](/guides/write-linkedin-outreach-message) covers the message itself.

When we ran this on our own product, the names that converted came from what people had posted rather than from their titles: founders complaining about cold outreach burnout. That run booked 14 qualified demos in 14 days with zero manual outreach, and most leads came from signals caught in real time. If you would rather see the buyers who are posting about your problem before you build the sheet, [try the AI](/try-ai) shows them for your product with no account, and the rest of the [guides](/guides) cover what happens after the first reply.

## FAQ

### Does Boolean search work on a free LinkedIn account?

Yes. The five operators (quotes, AND, OR, NOT, parentheses) work in the main search bar, in the Keywords, Title and Company fields under All filters, in the company page People tab box and in the Posts search. They do not work inside the picklist filters such as Locations or Industry, on any plan. Free accounts also meet a monthly commercial use limit on people searches.

### Why does my LinkedIn Boolean search return nothing?

The usual causes are lowercase operators, which LinkedIn reads as ordinary words, curly quotation marks pasted from a word processor, a NOT term that also appears in the title you want, or a location typed into the string. Retype the string in a plain text editor with capital operators, move titles to the Title field, and remove NOT terms one at a time until results return.

### Can you use wildcards or title: commands on LinkedIn?

No. Guides that quote LinkedIn's help centre agree that the asterisk, square and curly brackets, plus and minus signs and field commands such as title: are ignored in standard search. Write the variants out with OR, as in (marketing OR marketer OR "marketing manager"), and use the Title field under All filters when you need a title-only match.

### Is Google X-ray search better than LinkedIn search for prospecting?

It is a different tool. A Google search such as site:linkedin.com/in/ "head of finance" "Netherlands" needs no LinkedIn account and does not count toward the commercial use limit, but Google documents that the site: operator does not necessarily return every indexed URL, and it cannot tell a current employer from a past one ([Google Search Central, site: operator](https://developers.google.com/search/docs/monitor-debug/search-operators/all-search-site)). Use it to scout titles, then verify on LinkedIn.

### How many results does LinkedIn show for a search?

LinkedIn's Sales Navigator community guidance states a maximum of 2,500 profiles per search on Sales Navigator and up to 15 saved searches. The free People search shows fewer pages, and LinkedIn does not publish the figure, so treat any number you read elsewhere as an observation. If you need more than one search can show, split the string by region or by title group and run each separately.

### Should the job title go in the search bar or in the Title field?

In the Title field, found under Keywords in All filters. The main bar matches the whole profile, so a string with "sales director" there also returns people who held that title years ago or who recommend one. The Title field narrows to titles, which is what you want; keep problem and context words in the general field.
