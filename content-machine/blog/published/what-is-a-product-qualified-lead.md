---
published_at: 2026-11-22T21:29:00.949991+02:00
title: What Is a Product Qualified Lead? PQL Meaning and a Rule
slug: what-is-a-product-qualified-lead
section: learn
primary_keyword: what is a product qualified lead
secondary_keywords: product qualified lead definition, PQL meaning, PQL vs MQL, PQL examples, product qualified lead criteria
cluster: fundamentals
type: lesson
meta_title: What Is a Product Qualified Lead? PQL Meaning and Examples
meta_description: A product qualified lead is someone who has used your product and crossed a usage threshold that predicts buying. Definition, examples, PQL vs MQL, worksheet.
excerpt: A plain definition of the product qualified lead, the Slack and Expensify thresholds that made the term popular, how a PQL differs from an MQL, an SQL and a buying signal, and a three-row worksheet for writing your first PQL rule even if you sell a service rather than software.
original_angle: Unlike the pages ranking now, this one defines the product qualified lead for a company that has no freemium product (the "product" becomes the free asset, the sample or the first paid deliverable), puts PQLs next to buying signals so the reader sees which evidence exists before and after sign-up, gives a three-row worksheet (fit, value moment, threshold) for a first definition, links every statistic to the primary page it appears on, and uses our own 14-demos launch as the first-hand case.
first_hand: brain/stories/dogfooding-14-demos.md
checked_on: 2026-11-22
---
> [!SUMMARY]
> - A product qualified lead (PQL) is a person or account that has used your product and crossed a usage threshold which predicts they will pay.
> - The threshold is specific to each product: Slack used 2,000 messages sent by a team; Expensify's example was ten receipts and one invited friend.
> - A PQL is evidence from inside your product. A buying signal is evidence from outside it. Most small teams need the second before they can collect the first.
> - You can write a first PQL rule in ten minutes with three lines: who fits, what the value moment is, and how many times it has to happen.

**A product qualified lead is a person or account that has used your product, usually through a free trial or free plan, and reached a predefined level of usage that shows they got value and are likely to pay.** That is the short answer to "what is a product qualified lead". The acronym is PQL. Where a marketing qualified lead is counted by downloads and page views, and a sales qualified lead by a conversation, a PQL is counted by what someone actually did inside the product.

## Why does the product qualified lead matter?

Because usage is the most honest evidence of intent a seller can get. Someone who downloaded a PDF might buy; someone who has run your product on their own data for a week, invited a colleague and come back on day six is telling you something a form never could.

The term has a public origin. In 2013 the investor Tomasz Tunguz described PQLs as potential customers who have used a product and reached pre-defined triggers that signify a strong likelihood to become a paying customer, and wrote that when a sales team calls PQLs they typically convert at about 25 to 30% ([Tomasz Tunguz, The product qualified lead](https://tomtunguz.com/the-new-sales-hotness-the-product-qualified-lead-pql/)). The figure is his own observation, not a study, so treat it as an order of magnitude rather than a benchmark.

The best-known example is Slack. In a 2015 interview, co-founder Stewart Butterfield said the company decided that any team which had exchanged 2,000 messages had "really tried" Slack, and that 93% of teams who reached that number were still using it; in the same interview he noted that more than 90% of people who filled in the sign-up form never invited anyone or started using the software ([First Round Review, Slack's founder on launch strategy](https://review.firstround.com/from-0-to-1b-slacks-founder-shares-their-epic-launch-strategy/)). The gap between those two numbers is the whole case for PQLs: a sign-up means almost nothing, a usage threshold means almost everything.

There is newer evidence that the practice travels. OpenView's 2023 Product Benchmarks survey, run with Pendo and answered by around 1,000 companies, found that tracking product qualified leads or product qualified accounts raised the likelihood of being a fast-growing company (75% or more year-on-year growth) by 61% ([OpenView, 2023 Product Benchmarks](https://openviewpartners.com/2023-product-benchmarks/)). Correlation, not proof, but a large one.

```stats
93% | of Slack teams that passed 2,000 messages were still using Slack (2015) | https://review.firstround.com/from-0-to-1b-slacks-founder-shares-their-epic-launch-strategy/
25-30% | typical conversion when sales calls a PQL, per Tunguz (2013, his own figure) | https://tomtunguz.com/the-new-sales-hotness-the-product-qualified-lead-pql/
61% | higher likelihood of fast growth for companies tracking PQLs or PQAs | https://openviewpartners.com/2023-product-benchmarks/
```

## How does a product qualified lead work?

Every PQL definition has the same three parts. Write them down in this order, because each one narrows the list before the next one is checked.

1. **Fit.** The account looks like your paying customers: company size, industry, the role of the person who signed up. A student testing your tool is not a PQL however much they use it. This is the same check as an [ideal customer profile](/learn/what-is-an-ideal-customer-profile), applied to sign-ups instead of strangers.
2. **A value moment.** The action inside the product that means "this worked for me". For a chat tool it is messages exchanged by a team. For an expense tool, Tunguz's own example was a user who uploads ten receipts and invites one friend. For a design tool it might be a file shared with someone outside the account.
3. **A threshold.** How many times, or how fast, the value moment has to happen before sales gets involved. Slack chose 2,000 messages. ProductLed's guide reports Facebook's early rule as a user adding seven friends and Drift's as 100 conversations on a website, and suggests a first version can be as simple as ten log-ins ([ProductLed, Beginner's guide to PQLs](https://productled.com/product-qualified-leads/)).

When all three are true, the account is handed to a person, or to an automated message, with a reason to talk: "your team hit the free plan limit", "you invited four people this week". HubSpot's guide, citing its product VP Christopher O'Donnell, splits PQLs into four kinds: free users who meet the criteria, users who raise their hand inside the product, users who hit a free-plan limit, and users who buy with no sales contact at all ([HubSpot, Are PQLs the new MQLs?](https://blog.hubspot.com/sales/pql)). The last group is the goal; the first three are the ones a salesperson can act on.

> [!EXAMPLE]
> A labelled, hypothetical example. A 12-person company sells a time-tracking tool to agencies. Its PQL rule reads: agency with 10 to 200 staff (fit), a project with billable hours logged by two or more people (value moment), within the first 14 days of the trial (threshold). Trials that pass get a message from a founder; trials that log hours alone get a nudge to invite a teammate; trials with no hours get nothing but the automated sequence.

### What if you do not have a freemium product?

This is the question the ranking pages skip. Most companies with 1 to 200 people sell a service, or software that needs onboarding, and have no free plan for anyone to qualify themselves in. The logic still applies if you widen "product" to "the first thing a prospect can use for free or cheaply".

| Business | The "product" a prospect can try | A value moment that counts | A threshold worth a call |
|---|---|---|---|
| Agency or consultancy | A free audit, teardown or template | They open the deliverable and reply with a question about their own numbers | Two replies, or a request to walk through it |
| Software with no free tier | A sandbox, a live demo they drive, or a free tool on your site | They run it on their own data, not sample data | Returns a second time, or shares the result |
| Training or coaching | A free workshop or a paid first session | They complete the session and ask what comes next | Attends plus asks about a plan |
| Productised service | A paid pilot or a first small deliverable | They approve it without rework and ask about scope | Approval plus a second request |

The point is to pick a behaviour that proves value was received, not interest expressed. A download is interest. Replying with your own numbers is value. Intentsly's own entry point works the same way: [Try the AI](/try-ai) shows a visitor matching buyers for their service with no account, so the first conversation starts from something they have already seen work rather than a promise.

## Product qualified lead vs MQL, SQL and buying signal

The four terms get used as if they were ranks on one ladder. They are different kinds of evidence, collected at different moments.

| | Product qualified lead | Marketing qualified lead | Sales qualified lead | Buying signal |
|---|---|---|---|---|
| Evidence | Behaviour inside your product | Engagement with your marketing | A conversation with a salesperson | Public behaviour outside your product |
| Example | Team sends 2,000 messages on a free plan | Downloads two guides, visits pricing | Confirms budget and timeline on a call | Posts on LinkedIn asking for a vendor in your category |
| When it exists | After sign-up | After a form fill | After a meeting | Before any contact |
| Who collects it | Product analytics | Marketing automation | Sales | Signal monitoring or manual search |
| Predicts | Conversion of an existing user | Interest, loosely | Fit and timing, with effort | Timing, before competitors see it |

The row that matters for a small team is "when it exists". A PQL can only be found among people who have already arrived. If nobody is signing up yet, there is nothing to qualify, and the work is finding the people who are showing [buying signals](/learn/what-is-a-buying-signal) in public: hiring for the role you replace, complaining about the tool you compete with, asking their network for a recommendation. PQLs and buying signals are the same idea, usage-based proof of intent, applied after and before the door respectively.

That is how we launched. We had no pool of free users to score, so we ran our own platform on LinkedIn, targeted founders who were posting about cold outreach burnout, and let the conversational AI handle the replies. The system booked 14 qualified demos in 14 days with zero manual outreach, at a reply rate 4x our previous cold campaigns, and most of those leads came from intent signals caught in real time. The signal did the job the PQL threshold does for a freemium company: it told us who had already felt the problem.

For the frameworks that sit on top of all four terms (BANT, CHAMP, MEDDIC), the lesson on [what lead qualification is](/learn/what-is-lead-qualification) reduces them to three questions; the lesson on [lead scoring](/learn/what-is-lead-scoring) shows how to turn signals into a ranked list.

## How do you calculate PQL rate?

Divide the number of sign-ups that met your PQL definition by the total number of sign-ups in the same period, and multiply by 100 ([Shopify, What is a product-qualified lead](https://www.shopify.com/blog/product-qualified-lead)). Track two more numbers next to it: PQL to paid (how many PQLs bought) and time to PQL (how many days a typical account takes to cross the threshold). If PQL rate is high and PQL to paid is low, the threshold is too easy; if PQL rate is tiny, the threshold is too hard or the onboarding is losing people before the value moment.

> [!WARNING]
> Pick the threshold from your own data, not from Slack's. Butterfield's team chose 2,000 messages by looking at which companies stuck with Slack and which did not. Copying someone else's number gives you a rule that predicts their customers' behaviour, not yours.

## How to use the product qualified lead this week

1. **Write your three lines.** Open a document and fill in fit, value moment and threshold for your product or your free asset, using the table above if you have no free plan. Keep the first version crude; "ten log-ins" is a fine start. You will tighten it after a month of data.
2. **Look at your last ten customers before they paid.** What did each of them do first? If seven of ten invited a colleague before buying, "invited a colleague" is your value moment. The guide on [qualifying leads before outreach](/guides/qualify-leads-before-outreach) uses the same backwards method for strangers.
3. **Decide what happens when someone crosses the line.** A PQL nobody contacts within a day is a sign-up again. Write the one message, name the person who sends it, and check at the end of the week how many PQLs got it.

## Related lessons

[What is lead qualification?](/learn/what-is-lead-qualification) covers the decision a PQL feeds into. [What is a buying signal?](/learn/what-is-a-buying-signal) defines the off-product evidence you need before you have users to qualify, and [What is a warm lead?](/learn/what-is-a-warm-lead) separates the leads who have shown interest from the ones who have shown value. The [Learn index](/learn) has the full series.

If your pipeline is still too small for PQLs to exist, the free [Buying Signal Playbook](/signal-playbook) names twelve public signals that lead to conversations and eight that only look like they do, with the LinkedIn trigger and opening line for each. Start there, and the PQL rule can wait until there is something to measure.

## FAQ

### What does PQL stand for?

PQL stands for product qualified lead: a person or account that has used your product and crossed a usage threshold which predicts they will pay. The term sits alongside MQL (marketing qualified lead) and SQL (sales qualified lead), and differs from both because the qualifying evidence comes from inside the product rather than from marketing engagement or a sales conversation.

### What is the difference between a PQL and an MQL?

An MQL is qualified by engagement with marketing: downloads, email opens, visits to the pricing page. A PQL is qualified by behaviour inside the product: features used, data added, colleagues invited, a free-plan limit reached. The MQL shows interest; the PQL shows that value was received, which is why teams that can collect PQLs usually trust them more.

### What are examples of product qualified lead criteria?

Slack's early rule was a team exchanging 2,000 messages. Tunguz's illustration for an expense tool was a user uploading ten receipts and inviting one friend. ProductLed reports Facebook's early rule as adding seven friends and Drift's as 100 website conversations. Common building blocks are log-in frequency, a core feature used on real data, team invitations, and hitting a free-plan limit.

### Can a business without a free trial have product qualified leads?

Yes, if you widen "product" to the first thing a prospect can use: a free audit, a sandbox, a free tool on your site, or a small paid pilot. The qualifying behaviour is still value received rather than interest expressed, for example replying with a question about their own numbers after opening a free teardown, or approving a pilot deliverable and asking about scope.

### Who owns product qualified leads, sales or product?

The definition is usually written together, because product knows which behaviours predict retention and sales knows which accounts are worth a call. The data comes from product analytics, so product or growth typically maintains the rule, and sales owns what happens after an account crosses it. In a company of ten people that is often the same founder wearing two hats.

### How is a PQL different from a buying signal?

A PQL is evidence from inside your product after someone has signed up. A buying signal is evidence from outside it, before any contact: a hiring post, a public complaint about a competitor, a question asked on LinkedIn in your category. Both are behaviour-based proof of intent; the buying signal is what you work with until you have enough users to find PQLs among them.
