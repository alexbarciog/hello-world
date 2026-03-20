import { useState } from "react";
import { Search, ArrowLeft, ChevronRight, ExternalLink, Rocket, Link, UserPlus, BarChart3, Shield, Sparkles, MessageSquare, Radio, CreditCard, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import intentslyIcon from "@/assets/intentsly-icon.png";

// ─────────────────────────────────────────
// DATA
// ─────────────────────────────────────────
const helpData = [
  {
    id: "getting-started",
    title: "Getting Started",
    description: "Everything you need to know to start using Intentsly",
    icon: "folder",
    articles: [
      {
        id: "what-is-intentsly",
        title: "What is Intentsly & How Does It Work?",
        content: `Intentsly is an AI-powered sales engine that turns intent signals into real sales opportunities.

Instead of guessing who might be interested in your service, Intentsly **detects intent signals** and automatically turns them into **warm prospects you can reach out to** via LinkedIn.

## How Intentsly works

**1. Your AI Signal Agent monitors intent signals**

It scans for signals like:
- People interacting with competitors on LinkedIn
- LinkedIn profile visits
- Job changes and hiring signals
- Content engagement on LinkedIn
- Reddit discussions matching your keywords

**2. Hot prospects appear in your Contacts**

These are people already showing interest in your space — scored and ranked by AI.

**3. You review and approve them**

You decide who to contact — no spam, no guesswork.

**4. Intentsly launches personalized campaigns**

AI-generated messages are sent automatically from your LinkedIn account.

## Why people use Intentsly

- They're tired of cold outreach with 0% reply rates
- They want to reach warm leads — people who are already showing interest
- They want to automate prospecting without spending hours on LinkedIn
- They want personalized messages at scale`,
      },
      {
        id: "quick-start-guide",
        title: "Your First 15 Minutes with Intentsly (Quick Start Guide)",
        content: `This is the fastest way to see value from Intentsly.

## Step 1 — Complete Onboarding (5 min)

When you first sign up, you'll go through a guided onboarding:

1. **Enter your website URL** — Intentsly will analyze it to understand your business
2. **Connect LinkedIn** — required for sending campaigns
3. **Define your ICP** — job titles, industries, company sizes, locations
4. **Set precision mode** — choose how strictly leads should match your ICP
5. **Configure intent signals** — pick which signals to track
6. **Set objectives** — tell Intentsly your campaign goals

## Step 2 — Create a Signal Agent (3 min)

1. Go to **Signals** from the sidebar
2. Click **Create Agent**
3. The wizard will guide you through ICP and signal configuration
4. Launch your agent — it will start detecting leads automatically

## Step 3 — Create your first campaign (3 min)

1. Go to **Campaigns** from the sidebar
2. Click **Start a campaign**
3. Follow the campaign wizard to set up your outreach sequence
4. Connect it to a contact list
5. Launch the campaign

## Step 4 — Check your Contacts (2 min)

1. Open **Contacts** from the sidebar
2. Review leads detected by your agent — sorted by Hot, Warm, and Cold
3. Create lists to organize your contacts
4. Your campaigns will automatically reach out to them

That's it. Your AI is now prospecting for you 24/7.`,
      },
      {
        id: "results-timeline",
        title: "What Results Should I Expect (And When)?",
        content: `## When will I see leads?

Most users see their **first warm prospects within a few minutes** after:
- LinkedIn is connected
- At least one Signal Agent is active

## How many warm leads should I expect?

This depends on:
- Your market size
- Your ICP configuration
- The signals selected

It can be 3–5 per day or 100+ per day depending on your criteria.

## If you see no leads after 48h

- Broaden your ICP (more industries, more job titles, more locations)
- Add more signals (the more signals, the more leads)
- Check that your LinkedIn is properly connected in **Settings → LinkedIn**
- Make sure your Signal Agent is set to **Active**`,
      },
      {
        id: "glossary",
        title: "Intentsly Glossary (Key Terms)",
        content: `**Signal Agent**
Your automated assistant that tracks prospects showing buying intent on LinkedIn and the web.

**Intent Signals**
Triggers your agent looks for:
- Competitor engagement
- Profile visits
- Job changes
- Posts, comments, likes
- Reddit keyword mentions

**Contacts**
Where all detected and imported prospects are stored and managed.

**Lists**
Custom groups you create to organize contacts (e.g., "Hot SaaS Founders").

**Campaign**
A sequence of LinkedIn actions (connect, message, follow-up) targeting contacts in a list.

**Warm lead**
A person already showing signs of interest — detected by intent signals.

**Unibox**
Your unified LinkedIn messaging inbox inside Intentsly.

**Reddit AI Agent**
Monitors Reddit for posts matching your intent keywords across specified subreddits.

**Precision Mode**
Controls how strictly leads must match your ICP criteria — from broad to exact match.`,
      },
    ],
  },
  {
    id: "connecting-linkedin",
    title: "Connecting LinkedIn",
    description: "How to connect and manage LinkedIn accounts",
    icon: "folder",
    articles: [
      {
        id: "connect-linkedin-steps",
        title: "How to connect your LinkedIn account (step-by-step)",
        content: `Connecting your LinkedIn account is required to send campaigns and use the Unibox.

## Step-by-step

1. Go to **Settings** from the sidebar
2. Click the **LinkedIn** tab
3. Click **Connect account**
4. Choose your connection method: "Credentials Login" or "Infinite Login"

## If "Credentials Login":
- Enter your LinkedIn email and password
- Click **Connect**
- If LinkedIn sends a verification code, enter it

## If "Infinite Login":
- Click the link provided
- Log into LinkedIn in the new window
- Copy the token shown and paste it in Intentsly

## What this allows
Once connected, Intentsly can:
- Send connection requests
- Send messages via campaigns
- Display your LinkedIn conversations in the Unibox

## Notes
- You can see your connected accounts in the LinkedIn tab of Settings
- Disconnect at any time from Settings
- The connection status is also shown on the Dashboard`,
      },
      {
        id: "linkedin-connection-failed",
        title: "LinkedIn connection failed — what should I do?",
        content: `This is a common issue and is usually easy to fix.

## 1. Wrong email or password

Sometimes the LinkedIn email or password entered is slightly incorrect.

**How to fix it:**
- Try again with the right credentials
- Log in directly on LinkedIn first to verify, then retry inside Intentsly

## 2. LinkedIn triggered a verification

LinkedIn might:
- Ask for a verification code via email
- Send a confirmation email
- Block the login attempt temporarily

**How to fix it:**
- Check your email for a code from LinkedIn
- Check your LinkedIn app for a notification
- Enter the code in Intentsly when prompted

## 3. You're using a VPN

VPNs can trigger security checks from LinkedIn.

**How to fix it:**
- Turn off your VPN and try again

## 4. Too many attempts

Multiple rapid attempts may temporarily block login.

**How to fix it:**
- Wait 10–15 minutes and try again`,
      },
      {
        id: "why-linkedin-access",
        title: "Why does Intentsly need access to my LinkedIn?",
        content: `Intentsly uses your LinkedIn account to:
- Send connection requests to detected leads
- Send messages as part of campaigns
- Run follow-up sequences
- Display your conversations in the Unibox

Without LinkedIn connected, Intentsly can still detect leads — but it **cannot start conversations or run campaigns**.

Your data is secure:
- Passwords are not stored
- Information is encrypted
- You can disconnect at any time from **Settings → LinkedIn**`,
      },
      {
        id: "is-linkedin-safe",
        title: "Is connecting LinkedIn to Intentsly safe?",
        content: `Yes. Intentsly is built with account safety in mind.

It uses:
- Human-like delays between actions
- Action limits aligned with LinkedIn guidelines
- Natural sequencing (view → connect → message)
- Randomized timing

Intentsly does **not**:
- Share your LinkedIn data
- Perform aggressive or unsafe actions

You stay in control at all times. You can set daily connection and message limits in **Settings → LinkedIn**.`,
      },
      {
        id: "safety-limits",
        title: "Safety & Limits on LinkedIn",
        content: `## Recommended Activity Limits

### Connection Requests
- **Standard LinkedIn**: max 80–100/week
- **Sales Navigator**: max 100–180/week
- Start with 5–10/day when warming up a new account

### Messages (DMs + follow-ups)
- Max 100–150 messages/day
- Keep messages short and personalized
- Avoid links in first messages

## Best Practices for Staying Safe

- Use a real, professional profile photo
- Have a complete LinkedIn profile
- Be active naturally (like posts, comment occasionally)
- Start slowly and increase volume gradually
- Use only one automation tool (Intentsly)

## How Intentsly Protects Your Account

- Randomized timing between actions
- Human-like delays
- Daily and weekly action caps (configurable in Settings)
- Natural sequencing (view → connect → message)`,
      },
    ],
  },
  {
    id: "signal-agents",
    title: "Signal Agents",
    description: "How to create and manage AI Signal Agents",
    icon: "folder",
    articles: [
      {
        id: "how-agents-work",
        title: "How Signal Agents find leads automatically",
        content: `Signal Agents work in the background to detect **high-intent prospects** based on the signals and ICP you configured.

## How it works

1. Go to **Signals** from the sidebar
2. Click **Create Agent** to set up a new agent
3. Configure your ICP: job titles, industries, company sizes, locations
4. Select which signals to track
5. The Agent runs automatically — detecting matching leads

## Agent statuses

- **Active** — the agent is running and detecting leads
- **Paused** — the agent is stopped and won't detect new leads

You can toggle between Active and Paused at any time from the Signals page.

## Managing agents

From the three-dot menu on each agent, you can:
- **Edit** — modify the agent's configuration
- **Pause / Activate** — toggle the agent on or off
- **Delete** — permanently remove the agent

## Limits

You can have up to **2 Signal Agents** active at a time. Delete an existing one to create a new one.`,
      },
      {
        id: "create-agent-wizard",
        title: "Creating a Signal Agent (step-by-step)",
        content: `## Step 1 — Enter your website

Provide your company website URL. Intentsly will analyze it to understand your business and suggest ICP parameters.

## Step 2 — Connect LinkedIn

Make sure your LinkedIn account is connected. This is needed for the agent to find leads on LinkedIn.

## Step 3 — Define your ICP

Configure your Ideal Customer Profile:
- **Job titles** — e.g., CEO, CTO, Head of Marketing
- **Industries** — e.g., SaaS, FinTech, E-commerce
- **Company sizes** — e.g., 1-10, 11-50, 51-200
- **Locations** — e.g., United States, United Kingdom
- **Exclude keywords** — filter out irrelevant results

## Step 4 — Set Precision Mode

Choose how strictly leads must match your ICP:
- **Broad** — more leads, less precise
- **Balanced** — recommended for most users
- **Exact** — fewer leads, highly targeted

## Step 5 — Configure Intent Signals

Select which signals the agent should monitor. More signals = more leads.

## Step 6 — Set Objectives

Define your campaign goal and value proposition. This helps the AI generate better outreach messages.

After completing all steps, your agent will start running automatically.`,
      },
    ],
  },
  {
    id: "reddit-signals",
    title: "Reddit AI Agent",
    description: "Monitor Reddit for intent signals",
    icon: "folder",
    articles: [
      {
        id: "reddit-agent-overview",
        title: "What is the Reddit AI Agent?",
        content: `The Reddit AI Agent monitors Reddit posts and discussions for keywords that match your intent signals.

## How it works

1. You add **intent keywords** (e.g., "looking for CRM", "need automation tool")
2. The agent scans relevant subreddits for posts matching those keywords
3. Matching posts appear in the **Reddit Signals** page
4. You can review each post, see the author, subreddit, and original content

## Why use it?

Reddit is full of people actively looking for solutions. By monitoring specific keywords, you can:
- Find people who are actively looking for your type of product
- Discover pain points in your market
- Identify potential customers before your competitors do`,
      },
      {
        id: "reddit-add-keywords",
        title: "How to add and manage Reddit keywords",
        content: `## Adding keywords

1. Go to **Reddit Signals** from the sidebar
2. Enter your keyword in the input field at the top
3. Optionally specify subreddits (comma-separated) — if empty, defaults are used
4. Click **Add Keyword**

Default subreddits monitored: SaaS, startups, Entrepreneur, smallbusiness, marketing, sales.

## Managing keywords

Each keyword card shows:
- The keyword text
- Status (active or inactive)
- Number of subreddits being monitored

You can:
- **Toggle active/inactive** — pause or resume monitoring
- **Delete** — remove the keyword entirely

## Tips for good keywords

- Use phrases people would actually search for: "looking for a tool to..."
- Be specific: "B2B lead generation software" works better than just "leads"
- Add variations of the same intent: "need CRM", "CRM recommendation", "best CRM for"`,
      },
      {
        id: "reddit-reviewing-mentions",
        title: "Reviewing Reddit mentions",
        content: `When the agent finds matching posts, they appear in the Reddit Signals page.

## What you see for each mention

- **Post title** — the Reddit post title
- **Subreddit** — which subreddit it was found in
- **Author** — the Reddit username
- **Keyword matched** — which of your keywords triggered the match
- **Body preview** — a snippet of the post content
- **Posted time** — when the post was published
- **Link** — click to open the original Reddit post

## Filtering mentions

Use the keyword filter at the top to see mentions for a specific keyword only.

## Scanning for new mentions

Click the **Scan Now** button to trigger an immediate scan. The agent also runs automatically twice a day (8:00 AM and 6:00 PM UTC).

## Dismissing mentions

Click the X on any mention to dismiss it — it won't appear in your feed again.`,
      },
    ],
  },
  {
    id: "contacts-lists",
    title: "Contacts & Lists",
    description: "Manage your leads and contact lists",
    icon: "folder",
    articles: [
      {
        id: "contacts-overview",
        title: "How the Contacts page works",
        content: `The **Contacts** page is your central hub for all detected and imported leads.

## What you see

- **Contact cards** with name, company, title, and AI score
- **Relevance tier** — each contact is classified as Hot 🔥, Warm, or Cold
- **Signal indicators** — which intent signals were matched
- **LinkedIn URL** — direct link to the contact's profile

## Tabs

Filter contacts by tier:
- **All** — see every contact
- **Hot** — highest intent, most likely to convert
- **Warm** — moderate intent signals
- **Cold** — lower signals but still relevant

## Search & Filter

- Use the **search bar** to find contacts by name, company, or title
- Filter by **list** using the dropdown
- Adjust **items per page** (10, 25, 50, 100)`,
      },
      {
        id: "creating-lists",
        title: "How to create and manage lists",
        content: `Lists help you organize contacts into groups for campaigns.

## Creating a list

1. Go to **Contacts** from the sidebar
2. Click the **Create List** button (folder icon)
3. Enter a name and optional description
4. Click **Create**

## Adding contacts to lists

Contacts are automatically added to lists by your Signal Agents. You can also manually organize contacts into different lists.

## Using lists with campaigns

When creating a campaign, you select a list as the source. The campaign will target all contacts in that list.

## Filtering by list

Use the list dropdown filter on the Contacts page to see only contacts in a specific list.`,
      },
    ],
  },
  {
    id: "campaigns-outreach",
    title: "Campaigns & Outreach",
    description: "Create and manage LinkedIn campaigns",
    icon: "folder",
    articles: [
      {
        id: "how-campaigns-work",
        title: "How campaigns work in Intentsly",
        content: `A campaign is what turns leads into real conversations on LinkedIn.

## The flow

**Signal Agent → Contacts → List → Campaign → LinkedIn actions**

1. Your **Signal Agent** detects high-intent leads
2. Leads appear in your **Contacts**
3. They are grouped into **Lists**
4. A **Campaign** targets a list and sends LinkedIn actions

## Campaign statuses

- **Active** — campaign is running and sending actions
- **Paused** — campaign is stopped
- **Pending** — waiting for LinkedIn connection

## Campaign limits

You can have up to **2 campaigns** at a time. Delete an existing one to create a new one.`,
      },
      {
        id: "create-campaign",
        title: "How to create a campaign",
        content: `## Steps

1. Go to **Campaigns** from the sidebar
2. Click **Start a campaign**
3. Follow the campaign wizard:
   - Set your campaign goal
   - Configure your target audience
   - Set up your outreach sequence (connection request, messages, follow-ups)
   - Choose your daily limits
   - Select the source list
4. Review and launch

## Tips for better campaigns

- Start with low daily limits (5–10 connections/day) and increase gradually
- Use short, personalized messages (2–3 lines max)
- Avoid links in your first message
- Focus on the prospect's situation, not your product`,
      },
      {
        id: "campaign-stats",
        title: "Understanding campaign statistics",
        content: `Each campaign shows key metrics:

- **Invitations sent** — connection requests sent
- **Invitations accepted** — connections that accepted
- **Messages sent** — follow-up messages delivered
- **Messages replied** — responses received

## Where to see stats

- **Campaigns page** — overview cards for each campaign
- **Campaign detail** — click a campaign to see full statistics
- **Dashboard** — top-level summary of all campaign activity

## Improving results

If your acceptance/reply rates are low:
- Review your ICP — make sure you're targeting the right people
- Improve your message — make it shorter, more personal
- Use stronger intent signals
- Check your LinkedIn profile — a professional profile gets more acceptances`,
      },
      {
        id: "when-campaigns-run",
        title: "When campaigns run",
        content: `Campaigns run automatically at scheduled times.

- Actions are triggered in scheduled windows
- Delays are **randomized** to mimic real human behavior
- No robotic or spam-like patterns

This keeps your LinkedIn account safe and natural.

## Daily limits

You can configure daily limits for:
- **Connection requests** per day
- **Messages** per day

Set these in **Settings → LinkedIn** to control the pace of your campaigns.`,
      },
    ],
  },
  {
    id: "unibox",
    title: "Unibox",
    description: "Your unified LinkedIn messaging inbox",
    icon: "folder",
    articles: [
      {
        id: "unibox-overview",
        title: "What is the Unibox?",
        content: `The **Unibox** is your unified LinkedIn messaging inbox inside Intentsly.

It shows all your LinkedIn conversations in one place, so you don't need to switch between Intentsly and LinkedIn to reply to prospects.

## Requirements

To use the Unibox, you need:
- A **LinkedIn account connected** in Settings
- An active LinkedIn session

## Features

- **Conversation list** — see all your LinkedIn chats
- **Search** — find specific conversations
- **Reply** — send messages directly from Intentsly
- **Real-time updates** — new messages appear automatically`,
      },
      {
        id: "unibox-replying",
        title: "How to reply to messages in the Unibox",
        content: `## Replying to a conversation

1. Go to **Unibox** from the sidebar
2. Select a conversation from the left panel
3. Type your reply in the message input at the bottom
4. Click **Send** or press Enter

## Tips

- Reply quickly to warm leads — timing matters
- Keep messages short and relevant
- Reference the prospect's specific situation or intent signal
- If you need to see their full profile, click the LinkedIn icon to open it externally`,
      },
    ],
  },
  {
    id: "dashboard",
    title: "Dashboard",
    description: "Understanding your dashboard overview",
    icon: "folder",
    articles: [
      {
        id: "dashboard-overview",
        title: "Understanding the Dashboard",
        content: `The Dashboard is your main overview of everything happening in Intentsly.

## What you see

### Stats cards
- **Active Campaigns** — number of running campaigns
- **Contacts** — total contacts in your database
- **Messages Sent** — total outreach messages sent

### Activity Overview
A chart showing your campaign activity over the last 30 days.

### Hot Leads
A quick view of your highest-intent contacts with their AI score and company.

### Latest Replies
Shows recent responses from your prospects. When active, these appear in the Unibox.

### Get Started Checklist
A step-by-step guide to set up your account:
1. ✅ Create an account
2. Connect your LinkedIn
3. Create a Signal Agent
4. Launch your first campaign

## Navigation

From the Dashboard, you can quickly access:
- **Campaigns** — start or manage campaigns
- **Contacts** — review your leads
- **Unibox** — read and reply to messages`,
      },
    ],
  },
  {
    id: "settings",
    title: "Settings",
    description: "Configure your account and preferences",
    icon: "folder",
    articles: [
      {
        id: "settings-overview",
        title: "Settings overview",
        content: `The Settings page lets you configure everything about your Intentsly account.

## Tabs

### Organization
- Manage your workspace name
- Invite team members (up to 2 invitations)
- View current team members

### Company
- Set your company name, industry, country
- Add your website URL and value proposition
- This information is used by the AI for message generation

### Account
- View and update your email
- Change your display name

### LinkedIn
- Connect/disconnect LinkedIn accounts
- Set daily connection request limits
- Set daily message limits
- View connection status

### Security
- Change your password
- Manage account security

### Billing
- View current plan
- Upgrade or downgrade
- Access billing portal`,
      },
      {
        id: "invite-team",
        title: "How to invite team members",
        content: `You can invite team members to your Intentsly workspace.

## Steps

1. Go to **Settings** from the sidebar
2. Click the **Organization** tab
3. Enter the email and name of your team member
4. Click **Send Invite**

## Limits

- You can send up to **2 team invitations**
- Each invitation is valid for 7 days
- The invitee will receive an email with a link to join

## Managing invitations

You can see pending invitations in the Organization tab. Expired invitations don't count toward your limit.`,
      },
      {
        id: "daily-limits",
        title: "How to set daily LinkedIn limits",
        content: `Control how many actions Intentsly performs per day on your LinkedIn account.

## Steps

1. Go to **Settings → LinkedIn**
2. Adjust the **Daily connections limit** slider
3. Adjust the **Daily messages limit** slider
4. Changes are saved automatically

## Recommended limits

- **New accounts**: Start with 5–10 connections/day
- **Established accounts**: 20–40 connections/day
- **Messages**: 50–100/day maximum

Starting low and gradually increasing is the safest approach.`,
      },
    ],
  },
  {
    id: "troubleshooting",
    title: "Troubleshooting & FAQ",
    description: "Common issues and solutions",
    icon: "folder",
    articles: [
      {
        id: "no-leads-normal",
        title: "I don't see any leads — is this normal?",
        content: `It can be normal during the first hours.

Before leads start appearing, make sure that:
- Your **LinkedIn account is connected** (check in Settings → LinkedIn)
- Your **Signal Agent is active** (check in Signals page)
- You have configured your ICP with enough breadth
- Your agent has at least one signal type selected

Most users see their first leads within **a few minutes** of activating an agent.

## If nothing appears after 24h

- Expand your ICP — add more job titles, industries, or locations
- Make sure your Signal Agent status is **Active**
- Check that LinkedIn shows as **Connected** in Settings`,
      },
      {
        id: "campaign-not-sending",
        title: "My campaign isn't sending anything",
        content: `Check the following:

1. Is your **LinkedIn connected**? (Settings → LinkedIn)
2. Does your campaign have a **source list** with contacts?
3. Is the campaign status **Active** (not Paused)?
4. Are your **daily limits** set above 0? (Settings → LinkedIn)

A campaign cannot send messages without contacts in its source list and an active LinkedIn connection.`,
      },
      {
        id: "no-replies",
        title: "My campaign is live but I'm getting no replies",
        content: `Reply rate depends on:
- Your **targeting** (ICP quality)
- Your **message** (length, personalization)
- The **intent signal** strength
- **Timing**

## Tips to improve

- Shorten your message (2–3 lines max)
- Make it specific to the lead's role or company
- Don't include links in the first message
- Use stronger intent signals
- Ensure your LinkedIn profile looks professional`,
      },
      {
        id: "reddit-no-results",
        title: "My Reddit AI Agent isn't finding any posts",
        content: `If no mentions are appearing:

1. Check that your **keywords are active** on the Reddit Signals page
2. Try broader keywords — "CRM software" instead of "specific-niche CRM for dental clinics"
3. Make sure the subreddits you're monitoring are active communities
4. Click **Scan Now** to trigger an immediate scan
5. The agent runs automatically twice daily (8:00 AM and 6:00 PM UTC)

## Default subreddits

If you don't specify subreddits, these are monitored by default:
- r/SaaS, r/startups, r/Entrepreneur, r/smallbusiness, r/marketing, r/sales`,
      },
      {
        id: "unibox-empty",
        title: "My Unibox is empty",
        content: `The Unibox requires an active LinkedIn connection to display conversations.

## Check these:

1. Go to **Settings → LinkedIn** and verify your account shows as **Connected**
2. Make sure you have existing LinkedIn conversations
3. If you just connected, wait a few moments for conversations to sync

If your LinkedIn connection expired, reconnect it from Settings.`,
      },
      {
        id: "error-connecting-linkedin",
        title: "I get an error when connecting LinkedIn",
        content: `This is usually caused by:
- Wrong credentials
- LinkedIn security verification (check your email for a code)
- Too many login attempts
- VPN usage

## How to fix it:

1. Wait 5–10 minutes before retrying
2. Turn off your VPN
3. Check your email/SMS for LinkedIn verification codes
4. If 2FA is enabled, make sure to enter the code when prompted
5. Try logging into LinkedIn directly first, then retry in Intentsly`,
      },
      {
        id: "common-mistakes",
        title: "Common mistakes new users make",
        content: `Avoid these to get better results faster:

- **Not connecting LinkedIn** — required for campaigns and Unibox
- **Creating agents without enough signals** — more signals = more leads
- **Using very narrow ICP** — start broad, then narrow down
- **Not checking Contacts** — review leads regularly
- **Sending too many connections too fast** — start with 5–10/day
- **Long, generic messages** — keep them short and personal
- **Not giving enough time** — allow 2–3 days to see patterns

## The system works best with:

✅ Correct setup (LinkedIn + Agent + Campaign)
✅ Good intent signals
✅ Short, personal messages
✅ Patience to optimize over a few days`,
      },
    ],
  },
  {
    id: "billing-plans",
    title: "Billing & Plans",
    description: "Plans, payments, and subscription management",
    icon: "folder",
    articles: [
      {
        id: "pricing-explained",
        title: "Intentsly pricing explained",
        content: `Intentsly offers different plans based on your usage.

You can view the current pricing at **Settings → Billing** or by visiting the Billing Plans page.

Plans include access to:
- Signal Agents (up to 2)
- LinkedIn Campaigns (up to 2)
- Contacts management with AI scoring
- Reddit AI Agent
- Unibox for LinkedIn messaging
- Team invitations (up to 2)

You can upgrade or downgrade anytime from Settings → Billing.`,
      },
      {
        id: "change-plan",
        title: "Can I change my plan?",
        content: `Yes. You can change your plan at any time.

Go to: **Settings → Billing**

From there, you can:
- Upgrade to a higher plan
- Downgrade to a lower plan
- View your current usage

Changes are applied automatically.`,
      },
      {
        id: "cancel-subscription",
        title: "How do I cancel my subscription?",
        content: `You can cancel your subscription from your account.

1. Go to **Settings → Billing**
2. Click on the billing portal link
3. Follow the steps to cancel

Once cancelled:
- You will not be charged again
- Your account stays active until the end of the billing period
- Your data (contacts, lists, campaigns) is preserved
- You can reactivate at any time`,
      },
    ],
  },
];

// ─────────────────────────────────────────
// CATEGORY ICON MAP
// ─────────────────────────────────────────
const categoryIcons: Record<string, { icon: React.ElementType; gradient: string; shadow: string }> = {
  "getting-started": { icon: Rocket, gradient: "bg-gradient-to-br from-md-primary to-md-secondary", shadow: "shadow-md-primary/20" },
  "connecting-linkedin": { icon: Link, gradient: "bg-gradient-to-br from-md-secondary to-md-primary-container", shadow: "shadow-md-secondary/20" },
  "signal-agents": { icon: Radio, gradient: "bg-gradient-to-br from-[hsl(var(--md-tertiary-fixed))] to-[hsl(46,100%,50%)]", shadow: "shadow-[hsl(var(--md-tertiary))]/20" },
  "reddit-signals": { icon: Sparkles, gradient: "bg-gradient-to-br from-[hsl(18,95%,58%)] to-[hsl(5,90%,65%)]", shadow: "shadow-[hsl(5,90%,65%)]/20" },
  "contacts-lists": { icon: UserPlus, gradient: "bg-gradient-to-br from-md-primary-container to-md-secondary", shadow: "shadow-md-primary/20" },
  "campaigns-outreach": { icon: BarChart3, gradient: "bg-gradient-to-br from-md-primary to-md-secondary", shadow: "shadow-md-primary/20" },
  "unibox": { icon: MessageSquare, gradient: "bg-gradient-to-br from-md-secondary to-[hsl(var(--md-tertiary))]", shadow: "shadow-md-secondary/20" },
  "dashboard": { icon: BarChart3, gradient: "bg-gradient-to-br from-[hsl(var(--md-tertiary))] to-md-primary", shadow: "shadow-[hsl(var(--md-tertiary))]/10" },
  "settings": { icon: Settings, gradient: "bg-gradient-to-br from-md-primary-container to-md-primary", shadow: "shadow-md-primary/10" },
  "troubleshooting": { icon: Shield, gradient: "bg-gradient-to-br from-destructive to-md-secondary", shadow: "shadow-destructive/10" },
  "billing-plans": { icon: CreditCard, gradient: "bg-gradient-to-br from-md-primary to-md-secondary", shadow: "shadow-md-primary/20" },
};

// ─────────────────────────────────────────
// MARKDOWN RENDERER (simple)
// ─────────────────────────────────────────
function renderMarkdown(text: string) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Heading 2
    if (line.startsWith("## ")) {
      elements.push(
        <h2 key={i} className="text-lg font-bold mt-8 mb-3 pb-2 border-b border-border/40" style={{ color: "hsl(var(--md-on-surface))" }}>
          {renderInline(line.slice(3))}
        </h2>
      );
      i++;
      continue;
    }

    // Heading 3
    if (line.startsWith("### ")) {
      elements.push(
        <h3 key={i} className="text-base font-semibold mt-6 mb-2" style={{ color: "hsl(var(--md-on-surface))" }}>
          {renderInline(line.slice(4))}
        </h3>
      );
      i++;
      continue;
    }

    // Table (starts with |)
    if (line.startsWith("|")) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].startsWith("|")) {
        tableLines.push(lines[i]);
        i++;
      }
      const rows = tableLines.filter((l) => !l.match(/^\|[-| ]+\|$/));
      elements.push(
        <div key={`table-${i}`} className="overflow-x-auto my-4">
          <table className="w-full text-xs border-collapse">
            {rows.map((row, ri) => {
              const cells = row.split("|").filter((c) => c.trim() !== "");
              return (
                <tr key={ri} className={ri === 0 ? "bg-card" : "border-t border-border"}>
                  {cells.map((cell, ci) => (
                    <td
                      key={ci}
                      className={`px-3 py-2 ${ri === 0 ? "font-semibold" : ""}`}
                      style={{ color: "hsl(var(--goji-dark))" }}
                    >
                      {renderInline(cell.trim())}
                    </td>
                  ))}
                </tr>
              );
            })}
          </table>
        </div>
      );
      continue;
    }

    // Bullet list item
    if (line.startsWith("- ")) {
      const items: string[] = [];
      while (i < lines.length && lines[i].startsWith("- ")) {
        items.push(lines[i].slice(2));
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} className="list-none my-3 space-y-2 pl-1">
          {items.map((item, ii) => (
            <li key={ii} className="flex items-start gap-3 text-[15px] leading-relaxed" style={{ color: "hsl(var(--md-on-surface-variant))" }}>
              <span className="mt-2 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "hsl(var(--md-primary))" }} />
              <span>{renderInline(item)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Numbered list item
    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s/, ""));
        i++;
      }
      elements.push(
        <ol key={`ol-${i}`} className="my-3 space-y-2.5 pl-1">
          {items.map((item, ii) => (
            <li key={ii} className="flex items-start gap-3 text-[15px] leading-relaxed" style={{ color: "hsl(var(--md-on-surface-variant))" }}>
              <span
                className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5"
                style={{ background: "hsl(var(--md-primary) / 0.1)", color: "hsl(var(--md-primary))" }}
              >
                {ii + 1}
              </span>
              <span>{renderInline(item)}</span>
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // Code block
    if (line.startsWith("`") && line.endsWith("`") && !line.startsWith("``")) {
      elements.push(
        <code key={i} className="block my-2 px-3 py-2 rounded text-xs font-mono bg-muted" style={{ color: "hsl(var(--goji-dark))" }}>
          {line.slice(1, -1)}
        </code>
      );
      i++;
      continue;
    }

    // Horizontal rule
    if (line === "---" || line === "* * *") {
      elements.push(<hr key={i} className="my-4 border-border" />);
      i++;
      continue;
    }

    // Empty line
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Paragraph
    elements.push(
      <p key={i} className="text-[15px] leading-[1.75] my-2.5" style={{ color: "hsl(var(--md-on-surface-variant))" }}>
        {renderInline(line)}
      </p>
    );
    i++;
  }

  return elements;
}

function renderInline(text: string): React.ReactNode {
  // Bold: **text**
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold" style={{ color: "hsl(var(--md-on-surface))" }}>
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={i} className="px-1 py-0.5 rounded text-xs font-mono bg-muted" style={{ color: "hsl(var(--goji-dark))" }}>
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

// ─────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────
type View = "home" | "category" | "article";

export default function HelpCenter() {
  const [search, setSearch] = useState("");
  const [view, setView] = useState<View>("home");
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [activeArticleId, setActiveArticleId] = useState<string | null>(null);
  const navigate = useNavigate();

  const activeCategory = helpData.find((c) => c.id === activeCategoryId) ?? null;
  const activeArticle = activeCategory?.articles.find((a) => a.id === activeArticleId) ?? null;

  // Search across all articles
  const searchResults =
    search.length >= 2
      ? helpData.flatMap((cat) =>
          cat.articles
            .filter(
              (a) =>
                a.title.toLowerCase().includes(search.toLowerCase()) ||
                a.content.toLowerCase().includes(search.toLowerCase())
            )
            .map((a) => ({ ...a, categoryTitle: cat.title, categoryId: cat.id }))
        )
      : [];

  const filteredCategories =
    search.length >= 2
      ? helpData.filter(
          (c) =>
            c.title.toLowerCase().includes(search.toLowerCase()) ||
            c.articles.some(
              (a) =>
                a.title.toLowerCase().includes(search.toLowerCase()) ||
                a.content.toLowerCase().includes(search.toLowerCase())
            )
        )
      : helpData;

  function openCategory(id: string) {
    setActiveCategoryId(id);
    setView("category");
    setSearch("");
  }

  function openArticle(categoryId: string, articleId: string) {
    setActiveCategoryId(categoryId);
    setActiveArticleId(articleId);
    setView("article");
    setSearch("");
  }

  function goBack() {
    if (view === "article") {
      setView("category");
      setActiveArticleId(null);
    } else {
      setView("home");
      setActiveCategoryId(null);
    }
  }

  return (
    <div className="min-h-screen font-body text-foreground" style={{ background: "hsl(var(--md-surface))" }}>
      {/* ── Hero Section ── */}
      <section
        className="relative pt-16 pb-20"
        style={{
          background: "radial-gradient(circle at top left, hsl(var(--md-primary) / 0.05), transparent), radial-gradient(circle at bottom right, hsl(var(--md-secondary) / 0.05), transparent)",
        }}
      >
        {/* Top nav */}
        <div className="flex items-center justify-between px-8 py-5 max-w-6xl mx-auto">
          <button onClick={() => navigate("/")} className="flex items-center gap-2">
            <img src={intentslyIcon} alt="Intentsly" className="w-7 h-7 object-contain" />
            <span className="text-xl font-light tracking-tighter text-md-on-surface">Intentsly</span>
          </button>
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-full transition-all hover:opacity-80 text-md-on-surface"
            style={{
              background: "rgba(255,255,255,0.7)",
              boxShadow: "0 1px 6px hsl(0 0% 0% / 0.08)",
            }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>
        </div>

        {/* Title + Search */}
        <div className="max-w-4xl mx-auto px-6 text-center mt-8 mb-4">
          <h1 className="text-4xl md:text-5xl font-light tracking-tight text-md-on-surface mb-8">
            Advice and answers
          </h1>

          {/* Glass Search Bar */}
          <div className="relative max-w-2xl mx-auto">
            <div
              className="rounded-full flex items-center px-6 py-4 transition-all focus-within:ring-2 focus-within:ring-md-primary/20"
              style={{
                background: "rgba(255,255,255,0.4)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: "1px solid rgba(255,255,255,0.3)",
                boxShadow: "0 8px 32px 0 rgba(0,0,0,0.05)",
              }}
            >
              <Search className="w-5 h-5 text-md-outline mr-4 shrink-0" />
              <input
                type="text"
                placeholder="Search for articles, guides, or keywords..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent border-none focus:ring-0 focus:outline-none w-full text-lg font-light placeholder:text-md-outline-variant text-md-on-surface"
              />
              <button
                className="px-6 py-2 rounded-full font-medium text-sm text-white hover:opacity-90 active:scale-[0.98] transition-all shrink-0"
                style={{ background: "linear-gradient(135deg, hsl(var(--md-primary)) 0%, hsl(var(--md-secondary)) 100%)" }}
              >
                Search
              </button>
            </div>

            {/* Popular suggestions */}
            <div className="mt-4 flex justify-center gap-3 flex-wrap">
              <span className="text-xs font-light text-md-on-surface-variant">Popular:</span>
              <button onClick={() => { openCategory("connecting-linkedin"); }} className="text-xs font-medium text-md-primary hover:underline">Connecting LinkedIn</button>
              <button onClick={() => { openCategory("reddit-signals"); }} className="text-xs font-medium text-md-primary hover:underline">Reddit AI Agent</button>
              <button onClick={() => { openCategory("campaigns-outreach"); }} className="text-xs font-medium text-md-primary hover:underline">Campaigns</button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Main content ── */}
      <section className="max-w-7xl mx-auto px-6 md:px-10 pb-24 -mt-4">

        {/* Search results */}
        {search.length >= 2 && (
          <div className="max-w-4xl mx-auto">
            <p className="text-xs mb-4 text-md-on-surface-variant">
              {searchResults.length} result{searchResults.length !== 1 ? "s" : ""} for "{search}"
            </p>
            {searchResults.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-sm text-md-on-surface-variant">No articles found.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {searchResults.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => openArticle(a.categoryId, a.id)}
                    className="w-full text-left flex items-center justify-between p-5 rounded-xl transition-all duration-200 group hover:-translate-y-0.5"
                    style={{
                      background: "rgba(255,255,255,0.65)",
                      backdropFilter: "blur(20px)",
                      border: "1px solid rgba(255,255,255,0.5)",
                      boxShadow: "0 2px 12px -2px rgba(0,0,0,0.06), 0 4px 20px -4px rgba(0,0,0,0.05)",
                    }}
                  >
                    <div>
                      <p className="text-sm font-semibold text-md-on-surface">{a.title}</p>
                      <p className="text-xs mt-0.5 text-md-on-surface-variant">{a.categoryTitle}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 shrink-0 opacity-40 group-hover:opacity-100 transition-opacity text-md-primary" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* HOME: category bento grid */}
        {!search && view === "home" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCategories.map((cat) => {
              const iconConfig = categoryIcons[cat.id] || categoryIcons["getting-started"];
              const IconComponent = iconConfig.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => openCategory(cat.id)}
                  className="flex flex-col items-start text-left p-8 rounded-2xl transition-all duration-300 group cursor-pointer hover:-translate-y-1"
                  style={{
                    background: "rgba(255,255,255,0.65)",
                    backdropFilter: "blur(20px)",
                    WebkitBackdropFilter: "blur(20px)",
                    border: "1px solid rgba(255,255,255,0.5)",
                    boxShadow: "0 4px 24px -4px rgba(0,0,0,0.08), 0 12px 40px -8px rgba(0,0,0,0.06)",
                  }}
                >
                  <div className={`w-12 h-12 rounded-xl ${iconConfig.gradient} flex items-center justify-center mb-6 shadow-lg ${iconConfig.shadow}`}>
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex justify-between items-center w-full mb-2">
                    <h3 className="text-xl font-normal text-md-on-surface">{cat.title}</h3>
                    <span className="text-[10px] uppercase tracking-widest px-2 py-1 rounded-full bg-md-surface-container text-md-on-surface-variant">
                      {cat.articles.length} Articles
                    </span>
                  </div>
                  <p className="text-md-on-surface-variant font-light text-sm leading-relaxed mb-6">
                    {cat.description}
                  </p>
                  <div className="mt-auto flex items-center text-md-primary text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    Explore Collection <ChevronRight className="w-4 h-4 ml-1" />
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* CATEGORY: article list */}
        {!search && view === "category" && activeCategory && (
          <div className="max-w-4xl mx-auto">
            <button onClick={goBack} className="flex items-center gap-1.5 text-sm mb-6 hover:opacity-70 transition-opacity text-md-primary">
              <ArrowLeft className="w-4 h-4" />
              All categories
            </button>
            <div className="flex items-center gap-3 mb-8">
              {(() => {
                const iconConfig = categoryIcons[activeCategory.id] || categoryIcons["getting-started"];
                const IconComponent = iconConfig.icon;
                return (
                  <div className={`w-10 h-10 rounded-xl ${iconConfig.gradient} flex items-center justify-center shadow-lg ${iconConfig.shadow}`}>
                    <IconComponent className="w-5 h-5 text-white" />
                  </div>
                );
              })()}
              <div>
                <h2 className="text-xl font-bold text-md-on-surface">{activeCategory.title}</h2>
                <p className="text-sm text-md-on-surface-variant">{activeCategory.description}</p>
              </div>
            </div>
            <div className="space-y-2">
              {activeCategory.articles.map((article) => (
                <button
                  key={article.id}
                  onClick={() => openArticle(activeCategory.id, article.id)}
                  className="w-full text-left flex items-center justify-between p-5 rounded-xl transition-all duration-200 group hover:-translate-y-0.5"
                  style={{
                    background: "rgba(255,255,255,0.65)",
                    backdropFilter: "blur(20px)",
                    border: "1px solid rgba(255,255,255,0.5)",
                    boxShadow: "0 2px 12px -2px rgba(0,0,0,0.06), 0 4px 20px -4px rgba(0,0,0,0.05)",
                  }}
                >
                  <span className="text-sm font-medium text-md-on-surface">{article.title}</span>
                  <ChevronRight className="w-4 h-4 shrink-0 opacity-40 group-hover:opacity-100 transition-opacity text-md-primary" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ARTICLE: full content */}
        {!search && view === "article" && activeCategory && activeArticle && (
          <div className="max-w-2xl mx-auto">
            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 text-xs mb-6 text-md-on-surface-variant">
              <button onClick={() => { setView("home"); setActiveCategoryId(null); }} className="hover:opacity-70">
                Help Center
              </button>
              <ChevronRight className="w-3 h-3" />
              <button onClick={goBack} className="hover:opacity-70">
                {activeCategory.title}
              </button>
              <ChevronRight className="w-3 h-3" />
              <span className="text-md-on-surface">{activeArticle.title}</span>
            </div>

            <button onClick={goBack} className="flex items-center gap-1.5 text-sm mb-6 hover:opacity-70 transition-opacity text-md-primary">
              <ArrowLeft className="w-4 h-4" />
              Back to {activeCategory.title}
            </button>

            <h1 className="text-3xl font-bold mb-8 text-md-on-surface leading-tight">
              {activeArticle.title}
            </h1>

            <div
              className="p-10 rounded-2xl"
              style={{
                background: "rgba(255,255,255,0.7)",
                backdropFilter: "blur(24px)",
                border: "1px solid rgba(255,255,255,0.5)",
                boxShadow: "0 4px 24px -4px rgba(0,0,0,0.08), 0 12px 40px -8px rgba(0,0,0,0.06)",
              }}
            >
              {renderMarkdown(activeArticle.content)}
            </div>

            {/* Related articles */}
            <div className="mt-10 pt-6 border-t border-md-outline-variant/30">
              <p className="text-xs font-semibold uppercase tracking-wide mb-3 text-md-on-surface-variant">
                More in {activeCategory.title}
              </p>
              <div className="space-y-1.5">
                {activeCategory.articles
                  .filter((a) => a.id !== activeArticle.id)
                  .slice(0, 4)
                  .map((a) => (
                    <button
                      key={a.id}
                      onClick={() => { setActiveArticleId(a.id); }}
                      className="w-full text-left flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-white/40 transition-colors group"
                    >
                      <span className="text-sm text-md-on-surface">{a.title}</span>
                      <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-30 group-hover:opacity-80 text-md-primary" />
                    </button>
                  ))}
              </div>
            </div>

          </div>
        )}
      </section>

      {/* ── Footer ── */}
      <footer className="w-full py-12 border-t border-md-outline-variant/20" style={{ background: "hsl(var(--md-surface-container) / 0.5)", backdropFilter: "blur(12px)" }}>
        <div className="flex flex-col md:flex-row justify-between items-center px-10 w-full max-w-screen-2xl mx-auto">
          <p className="font-body text-xs font-light uppercase tracking-widest text-md-on-surface-variant mb-6 md:mb-0">
            © 2025 Intentsly. Help Center.
          </p>
          <div className="flex gap-8">
            <button onClick={() => navigate("/privacy")} className="font-body text-xs font-light uppercase tracking-widest text-md-on-surface-variant hover:text-md-primary transition-all">Privacy Policy</button>
            <button onClick={() => navigate("/terms")} className="font-body text-xs font-light uppercase tracking-widest text-md-on-surface-variant hover:text-md-primary transition-all">Terms of Service</button>
            <a href="mailto:support@intentsly.com" className="font-body text-xs font-light uppercase tracking-widest text-md-primary font-medium hover:opacity-80 transition-all">Contact Expert</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
