---
published_at: 2026-11-19T21:30:53.674935+02:00
title: What Is Third-Party Intent Data? How Bought Signals Work
slug: what-is-third-party-intent-data
section: learn
primary_keyword: what is third-party intent data
secondary_keywords: third-party intent data, third-party intent data providers, third-party vs first-party intent data, account-level intent data, intent data co-op
cluster: signal-selling
type: lesson
meta_title: What Is Third-Party Intent Data? How Bought Signals Work
meta_description: Third-party intent data is buyer research recorded on sites you do not own and sold to you as a score. What you get, how it is collected, where it falls short.
excerpt: A plain definition of third-party intent data, what Bombora, G2 and 6sense say they actually deliver, a five-question checklist for a vendor call, and a rule for when a company under 200 people should skip it.
original_angle: Unlike the pages ranking now, this one quotes what Bombora, G2 and 6sense say about their own data (collection method, score logic, refresh cadence, account not person), opened today and linked, turns it into a what-you-receive table and a five-question vendor checklist, states where third-party intent data is the wrong buy for a company under 200 people, and names the public person-level signals the two-way framing leaves out, with our own 14-demos result labelled as one company's experience.
first_hand: brain/stories/dogfooding-14-demos.md
checked_on: 2026-11-19
---
> [!SUMMARY]
> - Third-party intent data is buyer research recorded on websites you do not own, matched to a company and sold to you, usually as a topic score.
> - You receive a company name and a number. The providers themselves say the data stops short of the individual.
> - It earns its contract for enterprise deals with long cycles and a named target list. Under 200 employees, start with public signals you can read for free.
> - Before paying, ask five questions: where was it recorded, how is the company matched, how fresh is it, does it name a person, and what happens to a topic with no baseline.

**Third-party intent data is a record of research behaviour collected on websites and platforms a seller does not own, matched to a company by a data provider, and licensed to that seller as evidence that the company is looking into a topic.** The short answer to "what is third-party intent data" is a bought score. Someone else's tag saw people at a company reading about a subject, the provider rolled those reads into a number per company per topic, and you pay to see which numbers rose this week.

## Why does third-party intent data matter?

It matters because most of the research that decides a purchase happens where you cannot see it. Your own analytics show the people who already found you. A provider that watches thousands of other sites can tell you that a company you have never spoken to is reading about your category.

A labelled example. Suppose a twelve-person company sells payroll software for restaurants, and its site gets 400 visits a week, almost all from existing customers. A third-party provider reports that a 300-location restaurant group has been reading about "payroll compliance" across several industry publications for three weeks. Nobody from that group has visited the payroll company's site, so without the bought data the group is invisible.

The same example shows the catch. The report names the restaurant group and the topic; it leaves out the person reading and the problem behind the reading. Whether the reader is the CFO choosing a vendor or an intern writing a training deck, the score looks the same.

## How is third-party intent data collected?

Third-party intent data comes from four kinds of source, and each one records something different. The table lists them with what is recorded and who the record identifies, because the source decides how much the signal is worth.

| Source | What is recorded | Who it identifies | Example |
|---|---|---|---|
| Publisher co-op | Pages read on member sites that run the provider's tag | A company, by resolving the visitor's network to a domain | Bombora Data Co-op |
| Review and comparison sites | Profile, pricing, alternatives and comparison pages viewed on the review site | A company, with a count of unique visitors | G2 Buyer Intent |
| Ad bidstream and publisher networks | Keywords inferred from ad requests, or pages read on a provider's own network | A company, by IP address and device signals | 6sense keyword intent |
| Content syndication | A gated download placed by a vendor on a partner network | A named person who filled in the form | Lead-generation networks |

The providers describe their own methods in plain terms. Bombora says its Co-op is "made up of thousands of media destinations" carrying "a proprietary, consent-driven tag on every site" ([Bombora, Company Surge](https://bombora.com/intent/)), and that it resolves visitors to companies with "AI for IP-to-company domain resolution" ([Bombora, topics and taxonomy guide](https://bombora.com/core-concepts/the-complete-guide-to-bomboras-topics-and-taxonomy/)).

G2 records a different kind of behaviour: Profile, Pricing, Alternatives, Category, Compare and Competitive page views, each "a unique buyer interaction on G2," reported per company with a "Unique visitors" count ([G2 documentation, Buyer Intent](https://documentation.g2.com/docs/buyer-intent)). The field list in its data reference has a company_domain and a buying_stage but no person field ([G2, Buyer Intent data reference](https://documentation.g2.com/docs/buyer-intent-data-reference)).

6sense is the clearest about the identification step. It "matches anonymous activity to accounts primarily by IP address and, when available, cookies and device-level signals," and says that bidstream-only intent "infers keywords from ad exchange metadata (bid requests) without confirming that anyone read the page" ([6sense, intent data](https://6sense.com/platform/intent-data)).

> [!NOTE]
> The word "consent" in a provider's description refers to the consent the publisher collected from its visitors. The person has agreed nothing with you. Bombora's own explainer says "publishers are responsible for obtaining consent" and offering an opt-out ([Bombora, privacy and compliance](https://bombora.com/blog/b2b-intent-data-explained-privacy-compliance/)). You inherit that chain; you cannot audit it.

## What does a third-party intent score actually mean?

A score means that reading on a topic rose against a baseline. It does not mean that anyone decided to buy, and it rarely means a particular person did anything. Three large providers each define the number differently, so the same company can be "surging" in one feed and quiet in another.

| Provider | What you receive | How it is computed | How often it changes |
|---|---|---|---|
| Bombora Company Surge | A topic score per company | Last 3 weeks of reading against a 12-week baseline | Continuously, per the provider |
| G2 Buyer Intent | Buying Stage (Awareness, Consideration, Decision) and Activity Level (Low, Medium, High) per company | Time spent per page and number of pages visited | Daily |
| 6sense predictive intent | A score from 0 to 100 per account | Likelihood of the account opening an opportunity in the next 90 days, from historical activity | Daily |

Each row comes from the provider's own documentation: Bombora's three-week against twelve-week comparison ([Bombora](https://bombora.com/intent/)), G2's stage and activity level based on "time spent per page and the total number of pages visited" ([G2](https://documentation.g2.com/docs/buyer-intent)), and 6sense's score "measured from 0-100" that predicts "the likelihood of the account opening an opportunity in the next 90 days" and is "updated daily" ([6sense, intent model](https://support.6sense.com/docs/intent-model)).

Read the table as a buyer. A rising Bombora topic says a company is reading more than it used to. A G2 Decision stage says people from that company looked at pricing and comparison pages on G2. A 6sense score says the model has seen this pattern before an opportunity opened at similar accounts. All three help you decide which accounts to look at first; none tells you who to message or what to say.

## Third-party intent data vs first-party intent data vs public signals

The usual comparison stops at two columns. The third column is the one a small team can act on today, so it belongs in the table.

| | Third-party intent data | First-party intent data | Public signals |
|---|---|---|---|
| Where it is recorded | Sites you do not own, via a provider | Your site, product, email, events | In the open, on LinkedIn and forums |
| Who it identifies | A company, by IP or network | A known person or account | A named person, by their own post or comment |
| What it proves | Reading on a topic rose | Interest in you specifically | A stated problem, question or comparison |
| Can you verify it? | No, you get a score | Yes, open the log | Yes, open the post |
| Cost | A contract | Already paid for | Free to read; time to monitor |
| Who it covers | The wider market | People who already found you | People talking about the problem |

Bombora itself defines the first two the same way: first-party intent data is "collected from prospects and customers engaging with a company's owned or paid experiences," and third-party intent data is "purchased or licensed data signals collected from outside a company's owned and paid experiences" ([Bombora, what is intent data](https://bombora.com/what-is-intent-data/)). The lesson on [first-party intent data](/learn/what-is-first-party-intent-data) covers the middle column in depth, and the [buying signal](/learn/what-is-a-buying-signal) lesson covers how to judge one item in the right-hand column.

## Where does third-party intent data go wrong for a small team?

It goes wrong when the buyer expects a name and a reason and receives a company and a number. Four limits follow from how the data is made, and the providers' own documents support each one.

1. **It stops at the account.** 6sense states that it identifies "the account behind anonymous research, not the individual" ([6sense](https://6sense.com/platform/intent-data)). A 2,000-person company "surging" on your topic still leaves you to find the one person who cares.

2. **The topic is broader than your product.** Bombora's current page says it monitors research "against 25,300+ topics" ([Bombora](https://bombora.com/intent/)). Your product sits inside a topic that also covers your competitors, your category's news, and students writing essays.

3. **You cannot check it.** Bombora says "86% of the data in our Data Co-op" is shared exclusively with Bombora ([Bombora](https://bombora.com/intent/)), a strength for the provider and a limit for you: there is no page you can open to see what was read.

4. **It is built for teams with a target account list.** Every provider above sells by contract. A company with no named account list, no CRM to match against, and one person doing outbound has nowhere to put the feed.

The last point is our own experience, labelled as one company's result. When we launched Intentsly we had no first-party data and no intent contract. We ran our own LinkedIn signals and AI SDR on founders complaining about cold-outreach burnout and booked 14 qualified demos in 14 days with zero manual outreach, at a reply rate 4x our previous cold campaigns. Those demos came from named people saying something in public rather than from a company-level score.

## How to use third-party intent data this week

Three actions, each under an hour, whether or not you end up buying anything.

1. **Write the five questions before any vendor call.** Where exactly was the behaviour recorded, and can I see a sample of the sites? How is a visitor matched to a company, and what match rate do you report? How fresh is the signal when it reaches me? Does any part of the data name a person, and under what consent? What does a company with no twelve-week history look like in your score? A provider that answers all five plainly is worth a pilot; one that answers with "proprietary" is not.

2. **Run the fit test on any flagged account.** Before a rep acts on a surge, check company size, region and industry against your ideal customer profile. A score with no fit is a false positive, and the [lead scoring](/learn/what-is-lead-scoring) lesson shows how to combine fit with behaviour so the two are never confused.

3. **Add the person-level source the feed cannot give you.** For each flagged account, or for your market if you have no feed, read what named people at those companies are saying on LinkedIn this week: comments under competitor posts, questions about your category, new follows of rival pages. If reading those feeds every morning is the step that will not get done, Intentsly's [LinkedIn signals](/features/linkedin-signals) watch competitor posts, keyword posts and competitor followers continuously and score each person against your customer profile, which turns an account-level hint into a named person with a quotable reason to write.

The decision rule in one sentence: buy third-party intent data when you sell long-cycle deals to a named list of large accounts and need to know which to work first; otherwise spend the money on time, and read the public signals that name the person.

## Related lessons

Start with [what is intent data](/learn/what-is-intent-data) for the account-level versus person-level split this lesson relies on, then [what is first-party intent data](/learn/what-is-first-party-intent-data) for the data you already own. The explainer on [intent signals vs intent data](/blog/intent-signals-vs-intent-data) shows how to tell a signal from a score on any vendor's sales page. The [Learn index](/learn) lists every lesson, and the guide to [setting up signal-based outbound](/guides/set-up-signal-based-outbound) is the hands-on next step.

If you want the list of which public signals deserve a reply and which do not, the free [Buying Signal Playbook](/signal-playbook) names 12 worth chasing and 8 to ignore, with what to say for each.

## FAQ

### How is third-party intent data different from first-party intent data?

First-party intent data is behaviour you recorded yourself on properties you own, such as pricing-page visits and demo requests, tied to known people and covered by your own privacy notice. Third-party intent data is behaviour recorded on other companies' sites, matched to a company by a provider and licensed to you, usually as a topic score. The first is narrow and precise; the second is broad and blurry.

### How accurate is third-party intent data at the account level?

Accuracy depends on how the provider matches a visitor to a company. Co-op and review-site data starts from a real page view, then resolves the visitor's network to a domain. Bidstream data starts from an ad request and infers the topic, which 6sense itself describes as unconfirmed reading. Ask any provider for its match method and a sample, and test twenty flagged accounts against your own knowledge before trusting the feed.

### Can third-party intent data replace first-party intent data?

No. They answer different questions. Third-party data tells you which companies in the wider market are reading about your topic, including ones that have never heard of you. First-party data tells you which known people are evaluating you specifically. Most teams that buy third-party data use it to choose accounts and then rely on first-party behaviour and direct conversation to choose people and timing.

### How long does a third-party intent signal stay relevant?

Each provider sets its own window. Bombora compares the last three weeks of reading with a twelve-week baseline, G2 updates its buying stage and activity level daily, and 6sense's predictive score looks at the likelihood of an opportunity within 90 days. In practice a surge is a reason to act within the same few weeks it was measured; a score that was high a quarter ago tells you little about this quarter.

### How should sales react to a third-party intent flag?

Treat it as a reason to look. Check the flagged company against your ideal customer profile first. Then find the people, since the flag names none: search for the roles you sell to at that company and read what they have posted or commented on recently. Write to the person whose public words match the topic, and refer to those words rather than to the score, which they have never seen.
