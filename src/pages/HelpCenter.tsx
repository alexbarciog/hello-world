import { useState } from "react";
import { Search, ArrowLeft, ChevronRight, ExternalLink, Rocket, Link, UserPlus, BarChart3, Shield, Code2, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import intentslyIcon from "@/assets/intentsly-icon.png";

// ─────────────────────────────────────────
// DATA
// ─────────────────────────────────────────
const helpData = [
  {
    id: "getting-started",
    title: "Getting Started",
    description: "Anything you need to know about how to start on intentsly AI",
    icon: "folder",
    articles: [
      {
        id: "what-is-intentsly",
        title: "What is intentsly & How Does It Work?",
        content: `intentsly is an AI-powered sales engine that turns intent signals into real sales opportunities.

Instead of guessing who might be interested in your service, intentsly **detects intent signals** (profile visits, competitor interactions, job changes, content engagement, etc.) and automatically turns them into **warm prospects you can reach out to**.

## The intentsly workflow (simple version)

intentsly works in 4 steps:

**1. Your AI Agent monitors intent signals**

It scans for signals like:
- People interacting with competitors on LinkedIn
- LinkedIn Profile visits
- Hiring signals
- Content engagement on LinkedIn
- People following your company on LinkedIn
- People interacting with key opinion leaders in your niche

**2. Hot prospects are added to your Leads Inbox**

These are people already showing interest in your space.

**3. You review and approve them**

You decide who to contact — no spam, no guesswork.

**4. intentsly launches personalized campaigns**

AI-generated messages are sent automatically from your LinkedIn account.

## Why people use intentsly

- They're tired of cold outreach with 0% reply rates
- They want to reach warm leads — people who are already showing interest
- They want to automate prospecting without spending hours on LinkedIn
- They want personalized messages at scale`,
      },
      {
        id: "quick-start-guide",
        title: "Your First 15 Minutes with intentsly (Quick Start Guide)",
        content: `This is the fastest way to see value from intentsly.

## Step 1 — Connect your LinkedIn account (5 min)

intentsly uses your LinkedIn account to send automated campaigns.

1. Go to **Settings → LinkedIn Accounts**
2. Click "Connect account"
3. Choose your connection method: "Credentials Login" or "Infinite Login"
4. Follow the prompts

## Step 2 — Define ICP and choose your signals (5 min)

Your ICP (Ideal Customer Profile) tells intentsly who to target.

1. Go to **AI Agents → Create Agent**
2. Enter your website URL — the AI will analyze it and suggest your ICP
3. Select the signals you want to track (competitor interactions, profile visits, job changes, etc.)
4. Launch your agent

## Step 3 — Create your first campaign (3 min)

1. Go to **Campaigns → Start a campaign**
2. Choose "AI Campaign" — intentsly builds it for you automatically
3. Connect it to a List (your agent will fill this)
4. Launch the campaign

## Step 4 — Go to the Leads Inbox (5 min)

1. Open **Leads → Leads Inbox**
2. Review the leads detected by your agent
3. Mark bad fits as "Not a fit" (they won't be contacted)
4. The rest will be automatically handled by your campaign

That's it. Your AI is now prospecting for you 24/7.`,
      },
      {
        id: "results-timeline",
        title: "What Results Should I Expect (And When)?",
        content: `## When will I see leads?

Most users see their **first warm prospects within a few minutes — it can take up to 24 hours maximum** after:
- LinkedIn is connected
- At least 4 signals are activated

High-volume niches can see results in minutes.

## How many warm leads should I expect?

This depends on:
- Your market size
- Your ICP
- The signals selected

It can be 3–5 per day or 100+ per day depending on your criteria.

**Common mistake:** expecting instant demos.

intentsly doesn't magically replace your sales skills or your offer. It gets you more warm conversations — but you still need to close deals yourself.

## If you see no leads or if the targeting isn't right after 48h

- Broaden your ICP (more industries, more job titles, more locations)
- Add more signals (the more signals, the more leads)
- Check that your LinkedIn is properly connected
- Contact support if you're still stuck`,
      },
      {
        id: "intentsly-vs-tools",
        title: "intentsly vs Traditional Prospecting Tools",
        content: `Here's the difference:

| Traditional tools | intentsly |
|---|---|
| Static contact lists | Live buying signals |
| Cold emails | Warm LinkedIn conversations |
| Guesswork targeting | Behavior-based targeting |
| Low reply rate | Higher reply rate |
| Manual scraping | AI-powered detection |

intentsly does **not** replace your CRM.

It replaces the boring, ineffective "prospecting grind".

It plugs directly into:
- LinkedIn
- CRM
- Your outreach workflows

Think of it as: **An AI SDR watching LinkedIn for you 24/7**.`,
      },
      {
        id: "glossary",
        title: "intentsly Glossary (Key Terms)",
        content: `**Signals Agent**
Your automated assistant that tracks prospects showing buying intent.

**Signals**
Triggers your agent looks for:
- Competitor engagement
- Profile visits
- Job changes
- Posts, comments, likes

**Leads Inbox**
Where all detected prospects appear.

**Campaign**
A sequence of LinkedIn actions (connect, message, follow-up).

**Warm lead**
A person already showing signs of interest.

**Enrichment**
Adding email / extra data to a lead.`,
      },
    ],
  },
  {
    id: "connecting-linkedin",
    title: "Connecting LinkedIn",
    description: "How to connect LinkedIn accounts",
    icon: "folder",
    articles: [
      {
        id: "connect-linkedin-steps",
        title: "How to connect your LinkedIn account (step-by-step)",
        content: `Connecting your LinkedIn account is required to send campaigns directly from intentsly.

Here's how to do it safely and correctly in under 2 minutes:

## Step-by-step

1. Go to **Settings → LinkedIn Accounts**
2. Click on "Connect account"
3. Choose your connection method: "Credentials Login" or "Infinite Login"

## If "Credentials Login":
- Enter your LinkedIn email and password
- Click **Connect**
- If LinkedIn sends a verification code, enter it

## If "Infinite Login":
- Click the link provided
- Log into LinkedIn in the new window
- Copy the token shown and paste it in intentsly

## What this allows
Once connected, intentsly can:
- Send connection requests
- Send messages
- Run follow-up sequences

## Notes
- You can connect multiple accounts (depending on your plan)
- Disconnect at any time from Settings`,
      },
      {
        id: "linkedin-connection-failed",
        title: "I tried to connect LinkedIn but it failed — what should I do?",
        content: `This is a common issue and is usually easy to fix.

## 1. Wrong email or password

Sometimes the LinkedIn email or password entered is slightly incorrect.

**How to fix it:**
- Try again with the right credentials
- If it fails again: try logging in directly on LinkedIn to make sure the credentials are working, then retry connecting inside intentsly

## 2. LinkedIn triggered a verification

If LinkedIn asks for a verification, they might:
- Ask for a verification code
- Send a confirmation email
- Block the login attempt temporarily

This is a normal process.

**How to fix it:**
- Check your email for a message from LinkedIn with a code
- Check your LinkedIn app for a notification
- Enter the code in intentsly when prompted

## 3. You're using a VPN

VPNs can trigger security checks from LinkedIn.

**How to fix it:**
- Turn off your VPN
- Try again

## 4. Too many attempts

If you've tried multiple times in a row, LinkedIn might temporarily block the login.

**How to fix it:**
- Wait 10–15 minutes
- Try again`,
      },
      {
        id: "right-password-not-working",
        title: "I entered the right password but it's still not working",
        content: `If you're sure your password is correct, here are the most common reasons:

## Two-factor authentication (2FA)

LinkedIn may require an additional approval step.

**What to do:**
- Check your email
- Check your phone (SMS)
- Check your LinkedIn app notifications
- Approve the login, then try again

If you don't have any verification code OR if the code doesn't work:
- Try again after 5–10 minutes
- Deactivate the 2FA on your LinkedIn account and try again

## Temporary LinkedIn restriction

Sometimes LinkedIn blocks new logins temporarily.

**What to do:**
- Wait 15–30 minutes
- Try again later
- Avoid repeated attempts

## Session conflict

Too many active LinkedIn sessions can cause errors.

**What to do:**
- Log out of LinkedIn everywhere
- Restart your browser
- Retry the connection`,
      },
      {
        id: "why-linkedin-access",
        title: "Why does intentsly need access to my LinkedIn account?",
        content: `intentsly uses your LinkedIn account to:
- Send connection requests
- Send messages
- Launch automated campaigns
- Follow up with leads found by your AI Agent

Without LinkedIn connection, intentsly can still detect leads — but it **cannot start conversations or run campaigns**.

Your data is secure:
- Passwords are not stored
- Information is encrypted
- You can disconnect at any time`,
      },
      {
        id: "is-linkedin-safe",
        title: "Is connecting LinkedIn to intentsly safe?",
        content: `Yes. intentsly is built with account safety in mind.

It uses:
- Human-like delays
- Action limits aligned with LinkedIn guidelines
- Natural sequencing (view → connect → message)
- Randomized timing
- Proxy with IPs in your country

intentsly does **not**:
- Share your LinkedIn data
- Perform aggressive or unsafe actions

You stay in control at all times.`,
      },
      {
        id: "linkedin-restricted",
        title: "Could my LinkedIn account get restricted or banned?",
        content: `The risk is extremely low if you follow best practices.

Most LinkedIn restrictions happen when:
- Sending hundreds of requests per day
- Spamming identical messages
- Using unsafe automation
- Using several automation tools at the same time

intentsly is specifically designed to prevent that by:
- Limiting activity
- Adding delays
- Simulating real human behavior

For best results:
- Use a real profile photo
- Have at least 100–500 connections
- Stay active (like, comment, post occasionally)
- Warm up your account: start low and increase
- Stay under the limits (100 connection requests / week maximum for LinkedIn users with an active & solid account and 100–180 per week for Sales Navigator users with a very solid account)`,
      },
      {
        id: "check-linkedin-connected",
        title: "How to check if your LinkedIn is properly connected",
        content: `To confirm your status:

1. Go to **Settings → LinkedIn Connection**
2. Make sure you see:
   - ✅ "Connected"
   - Your LinkedIn name
   - Your profile picture

If it shows "Disconnected":
- Click **Connect**
- Then reconnect again`,
      },
      {
        id: "safety-limits",
        title: "Safety & Limits on LinkedIn",
        content: `## How to keep your LinkedIn account safe while using intentsly

## Overview

Using automation on LinkedIn requires following certain safety practices to protect your account. Here's everything you need to know.

## 1. Recommended Activity Limits

### 🔗 Connection Requests
- **Standard LinkedIn**: max 80–100/week
- **Sales Navigator**: max 100–180/week
- Start with 5–10/day when warming up a new account

### 💬 Messages (DMs + follow-ups)
- Max 100–150 messages/day
- Keep messages short and personalized
- Avoid links in first messages

### 👀 Other Actions (views, likes, follows)
- Profile views: up to 80–100/day
- Likes: up to 50–100/day
- Follows: up to 50/day

## 2. Behaviors LinkedIn Flags

- Sending hundreds of connection requests rapidly
- Sending identical messages to many people
- Logging in from multiple IPs in the same day
- Using multiple automation tools simultaneously

## 3. Best Practices for Staying Safe

- Use a real, professional profile photo
- Have a complete LinkedIn profile
- Be active naturally (like posts, comment occasionally)
- Start slowly and increase volume gradually
- Use only one automation tool (intentsly)

## 4. What Happens if LinkedIn Flags You?

LinkedIn may send a warning, temporarily restrict actions, or in rare cases, suspend the account. This is usually reversible.

## 5. How intentsly Helps Protect Your Account

### Built-in protections:
- Randomized timing between actions
- Human-like delays
- Proxy with IPs matching your country
- Daily and weekly action caps
- Natural sequencing (view → connect → message)

## 6. Quick Safety Checklist

✅ LinkedIn properly connected
✅ Country/proxy set correctly in Settings
✅ Starting with low volume (5–10/day)
✅ Real profile photo
✅ Not using other automation tools simultaneously`,
      },
    ],
  },
  {
    id: "finding-leads",
    title: "Finding & Adding Leads",
    description: "How to find & add leads",
    icon: "folder",
    articles: [
      {
        id: "ai-agent-finds-leads",
        title: "How your AI Agent finds leads automatically",
        content: `intentsly's AI Agent works in the background to detect **high-intent prospects** on LinkedIn, based on the signals you selected.

These signals include:
- People interacting with competitors
- People engaging with content in your niche
- Profile visits
- Job changes
- Activity from specific LinkedIn pages
- Company followers

## How it works

1. You define your ICP (Ideal Customer Profile) when creating an Agent
2. You select which signals to track (competitor pages, keywords, influencers, etc.)
3. The Agent runs automatically — typically every few hours
4. Matched leads appear in your Leads Inbox

## What happens next?

Once a lead appears in the Inbox, you can:
- Review their profile
- Mark them as a good fit or not
- Add them to a List for campaigns
- Enrich their data (email, phone)`,
      },
      {
        id: "manually-add-leads",
        title: "How to manually add warm leads (step-by-step)",
        content: `To manually add leads to intentsly, you need to use the **intentsly Chrome Extension**.

If you don't have it yet, install it first from the Chrome Web Store and log in with your intentsly account.

Once installed, you can add leads directly from LinkedIn in one click.

Go to: **Leads → Leads Inbox → Add Leads** to see the installation link and status.

## Add leads via LinkedIn Search

1. Go to LinkedIn and run a people search
2. Open the intentsly extension
3. Click "Add all" or click on individual profiles
4. Leads are added to your Leads Inbox

## Add leads via Sales Navigator

1. Open Sales Navigator and run a search
2. Activate the intentsly extension
3. Use the bulk-add option to import the list

## Add leads from LinkedIn Events

1. Go to a LinkedIn event page
2. Click on "Attendees"
3. Use the extension to import attendees

## Add leads from your existing connections

1. Go to your LinkedIn connections
2. Filter by criteria (location, company, etc.)
3. Use the extension to bulk-add them

## Important notes

- Leads added manually go directly to your Leads Inbox
- You can then add them to any List and connect them to a campaign
- Avoid adding the same person multiple times`,
      },
      {
        id: "import-leads-csv",
        title: "How to import leads from a list or CSV",
        content: `You can upload a list of leads directly.

Accepted formats: **CSV**

## Steps

1. Go to **Leads → Leads Inbox**
2. Click **Add leads**
3. Select **Import a CSV**
4. Upload your file
5. Map the columns if needed
6. Start import

Once imported, the leads can be:
- Enriched
- Added to campaigns
- Filtered
- Exported

## CSV format requirements

Your CSV should ideally include:
- First name
- Last name
- LinkedIn URL (recommended)
- Company
- Job title`,
      },
      {
        id: "export-leads",
        title: "How to export leads from intentsly",
        content: `You can download your leads at any time.

## Steps

1. Go to **Leads → Leads Inbox** or to a specific **List**
2. Apply your filters (signal, list, status, etc.)
3. Click **Export**
4. Download the file (CSV)

You can also export leads with our integrations:
- Your CRM
- Zapier
- Webhook / API
- Other outreach tools`,
      },
    ],
  },
  {
    id: "campaigns-outreach",
    title: "Campaigns & Outreach",
    description: "How to use campaigns",
    icon: "folder",
    articles: [
      {
        id: "leads-inbox-how-it-works",
        title: "How the Leads Inbox works (and how to use it properly)",
        content: `The **Leads Inbox** is your central hub for all detected and imported leads.

This is where you can:
- See who matched your signals
- Filter by signal type or list
- Enrich leads (email, phone, company data)
- Add them to a specific list
- Reject bad fits
- Export your data

## Best workflow

**Automatic:**
1. Open **Leads Inbox**
2. Check new leads
3. Put the ones you don't want as "not a fit" (red cross)
4. The good ones will be sent to your specific campaign

**Manual:**
1. Open **Leads Inbox**
2. Check new leads
3. Review each lead
4. Add the good ones to a List manually
5. The campaign will contact them`,
      },
      {
        id: "how-campaigns-work",
        title: "How campaigns work in intentsly",
        content: `A campaign is what turns leads into real conversations on LinkedIn.

In intentsly, the real flow is:

**Signals Agent → List → Campaign → LinkedIn actions**

Here's how it works:
1. Your **Signals Agent** detects high-intent leads based on your ICP and signals
2. These leads are **sent to a List** (automatically or manually)
3. That List is used as the **source of a Campaign**
4. The Campaign sends LinkedIn actions and messages

A campaign never pulls leads directly from LinkedIn.

It always pulls from a **List** inside intentsly.`,
      },
      {
        id: "best-automated-workflow",
        title: "The best automated workflow (recommended)",
        content: `This is the most powerful and scalable setup:

1. Your **Signals Agent** finds warm leads based on your ICP
2. intentsly **scores each lead automatically** using AI
3. Leads are **sent into a List automatically**
4. That List is **connected to a Campaign**
5. The Campaign automatically contacts the best leads

Inside a campaign, intentsly will **prioritize**:
- Leads with **recent activity**
- Leads with the **highest AI score**

This ensures your best opportunities are contacted first.`,
      },
      {
        id: "create-campaign",
        title: "How to create a campaign",
        content: `Go to: **Campaigns → Start a campaign**

You will see two options:

## 🤖 AI Campaign (recommended)

Choose this if you want intentsly to build the campaign for you.

The AI will:
- Analyze your website
- Analyze your ICP
- Use detected intent
- Generate the sequence automatically
- Optimize tone, timing and structure

This is the best option for:
- First-time users
- Founders
- Fast setup
- Best performance

Select **AI Campaign**, review the steps, and launch.

## ✍️ Manual Campaign

Choose this if you want full control over every step.

You can:
- Set custom messages for each step
- Define delays between steps
- Choose exact actions (connect, message, follow-up)
- Set daily limits

This is best for experienced users who want full customization.`,
      },
      {
        id: "list-as-campaign-source",
        title: "How to use a List as a Campaign source",
        content: `Every campaign needs a **List** as its source.

There are 3 ways to create a List:

## 1. Automatically (from your Agent)

This is the recommended method.
- Go to your **Signals Agent settings**
- Select a target **List**
- All detected leads will be added automatically

That List can then be connected to a Campaign.

## 2. Manually (using filters)

You can create your own List at any time:
1. Go to **Leads Inbox**
2. Apply filters (score, intent, company, job title, etc.)
3. Click **Create List from filter**
4. Name your List

## 3. With the Chrome Extension

When adding leads manually from LinkedIn:
1. Use the Chrome extension to add leads
2. Select which List to add them to
3. The leads will immediately appear in that List`,
      },
      {
        id: "ai-messages-work",
        title: "How AI Messages work (very important)",
        content: `AI Messages are unique, hyper-personalized messages created for each lead.

intentsly generates them using:
- The person's LinkedIn profile
- Their activity / intent signal
- Their company + role
- Your ICP and offer

These messages are:
- Only available for **Message 1 (the icebreaker)**
- **Different for every single contact**
- Much more natural and contextual than generic messages

This is one of intentsly's most powerful features.

## How to preview an AI message before sending

You can preview what a lead will receive.

Steps:
1. Open a lead in the Leads Inbox
2. Click **"AI LinkedIn Message"** on the right
3. Click **Generate**
4. Read the message — if it looks good, keep it; if not, regenerate

## How to change the language of AI messages

Go to **Settings → Account → Preferred language**

All future AI messages will use that language.

## How to set your AI Outreach Template for Campaigns

When creating or editing a campaign:
1. Select **"AI Message"** for Step 1
2. Optionally add a custom context or instruction
3. The AI will use your ICP + the lead's profile to write the message`,
      },
      {
        id: "editing-campaign",
        title: "Editing an existing campaign",
        content: `You can edit your campaign at any time, with one limitation:

## ✅ You CAN:
- Edit messages
- Add new steps at the end
- Change delays
- Update limits

## ⚠️ You CANNOT:
- Remove a step **if contacts are already inside it**

To remove steps, the Campaign must contain **0 leads**.

If leads are already inside the campaign and you need to make major changes:
- Create a new campaign with the correct setup
- Pause the old campaign`,
      },
      {
        id: "when-campaigns-run",
        title: "When campaigns run",
        content: `Campaigns run automatically at a scheduled time.

- Actions are triggered in scheduled windows
- Delays are **randomized** to mimic real human behavior
- No robotic or spam-like patterns

This keeps your LinkedIn account safe and natural.`,
      },
      {
        id: "location-proxy",
        title: "About location & proxy",
        content: `intentsly uses a proxy based on your **LinkedIn country**.

To make sure it's correctly configured:
1. Go to **Settings → LinkedIn Account**
2. Select your **Country**
3. Save

This helps:
- Improve safety
- Improve deliverability
- Avoid suspicious activity

Using the correct country proxy reduces the chances of LinkedIn triggering security checks.`,
      },
      {
        id: "filter-remove-leads",
        title: "How to filter or remove leads from a campaign",
        content: `If you want to stop certain leads from being contacted by a campaign, you have several options.

## 1. From a List or the Leads Inbox

1. Go to your **List** or **Leads Inbox**
2. Find the contact you want to remove
3. Choose one of the following:
   - **Remove from list**
   - Click **"Not a fit"** (this will freeze the contact)

Once a contact is marked as **Not a fit**, they will no longer receive any campaign actions.

## 2. From inside the Campaign (Next Actions)

You can preview and control who will be contacted next.

1. Go to **Campaigns**
2. Open the campaign
3. Click on **Next Actions**
4. You'll see:
   - Who is scheduled to receive a connection request
   - Who is scheduled to receive a message
5. Find the contact and click **Remove**`,
      },
    ],
  },
  {
    id: "troubleshooting",
    title: "Troubleshooting & FAQ",
    description: "Need help?",
    icon: "folder",
    articles: [
      {
        id: "no-leads-normal",
        title: "I don't see any leads — is this normal?",
        content: `Yes, it can be normal during the first **hours.**

Before leads start appearing, make sure that:
- Your **LinkedIn account is connected**
- Your **Signals Agent is active**
- You have selected **at least one signal**
- Your targeting is not too narrow

Most users see their first leads within **the first minutes.**

## Check your Agent activity in "Insights"

You can see exactly when your Agent last ran and how many leads were found.

1. Go to **Insights**
2. Look at the most recent Agent launches
3. Check how many leads were detected

If you see:
- **0 leads found** → your targeting may be **too narrow**
- **Very few leads** → consider **broadening your signals or ICP**

If nothing appears after that, try:
- Expanding your signals
- Using broader job titles
- Increasing your company size range`,
      },
      {
        id: "campaign-not-sending",
        title: "I connected LinkedIn but my campaign isn't sending anything",
        content: `This usually means one of the steps is missing.

Check the following:

1. Do you have **at least one List** connected to your campaign?
2. Are there **leads inside that List**?
3. Is the campaign **active** (not paused)?
4. Have you selected **at least one step** (connection, message, etc.)?

Remember: A campaign cannot send messages without leads inside its source List.`,
      },
      {
        id: "no-replies",
        title: "My campaign is live but I'm getting no replies",
        content: `Reply rate depends on 4 things:
- Your **targeting**
- Your **message**
- The **intent signal**
- The **timing**

To improve results:
- Use **AI Message** for step 1
- Shorten your message (2–3 lines max)
- Make it more specific to the lead's role or situation
- Use stronger intent signals
- Filter out low-score leads`,
      },
      {
        id: "ai-message-not-generating",
        title: "My AI Message is not showing or generating",
        content: `AI Messages only work for **Message 1 (the first message)** in a campaign.

Make sure that:
- The AI Message is placed at **Step 1**
- Your preferred language is set in **Settings → Account**
- The lead has enough data (profile + intent)

To preview it:
1. Open a lead
2. Click **"AI LinkedIn Message"** on the right
3. Click **Generate**`,
      },
      {
        id: "added-someone-mistake",
        title: "I added someone by mistake — how do I remove them?",
        content: `You have two options:

**Option 1:** Go to your **List** or **Leads Inbox**
- Click **Remove**, or
- Click **"Not a fit"** (this will freeze the contact)

**Option 2:** Go to the **Campaign → Next Actions**
- Find the contact
- Remove them from the queue

Once frozen or removed, the lead will no longer receive actions.`,
      },
      {
        id: "campaign-wrong-edit",
        title: "I created a campaign wrong — can I edit it?",
        content: `Yes, but with one important rule:

✅ You can:
- Edit messages
- Change delays
- Add steps at the end

❌ You cannot:
- Remove a step if **leads are already inside it**

If there are **0 leads**, you can fully edit the campaign.

Otherwise, create a new campaign for major changes.`,
      },
      {
        id: "chrome-extension-not-working",
        title: "My Chrome extension is not working",
        content: `Try these steps:

1. Make sure you are **logged in** to intentsly
2. Refresh the LinkedIn page
3. Click the extension icon again
4. Restart your browser
5. Make sure Chrome is updated
6. Check that you are on a **LinkedIn / Sales Nav / Events** page

If it still doesn't work, reinstall it and reconnect your account.`,
      },
      {
        id: "error-connecting-linkedin",
        title: "I get an error when connecting LinkedIn",
        content: `This is usually caused by:
- Wrong credentials
- LinkedIn security verification
- Too many attempts
- VPN usage

To fix it:
- Retry after 5–10 minutes
- Turn off your VPN
- Check your email, SMS, app etc. — LinkedIn can send you a verification code
- If nothing works: turn off your 2FA on LinkedIn and start again
- Contact our support with the chat`,
      },
      {
        id: "results-too-low",
        title: "My results are too low",
        content: `If your account is set up correctly but results are still low, the most common reasons are:

- Signals too weak or too broad
- ICP not clear enough or too specific
- Message not specific, too long
- Offer not attractive
- Too few steps in campaign

Best fix:
- Use stronger/more intent signals
- Add AI Message in step 1
- Review your ICP (add more location / job titles / industries for example)
- Tighten your targeting`,
      },
      {
        id: "common-mistakes",
        title: "Common mistakes new users make",
        content: `Avoid these to get better results faster:

- Not creating a campaign
- Not connecting a List to the campaign
- Using very generic messages
- Putting links in their campaign messages
- Choosing weak signals
- Never checking the Leads Inbox
- Never checking if the leads are good
- Not warming up their campaign (start at 5/10 connection requests per day)
- Not giving the system enough time to see which signals work

The system is powerful, but it needs:

✅ Correct setup
✅ Good signals
✅ A clear message
✅ A few days so you can see which signals perform`,
      },
      {
        id: "hubspot-integration",
        title: "How to Integrate with Hubspot",
        content: `This integration allows intentsly to push leads and their data into your HubSpot CRM.

To make this possible, HubSpot requires a **Legacy App** with specific permissions (scopes).

## How to Generate an API Key for HubSpot

### Why Use a Legacy App?
A Legacy App gives you a single, stable API key (called a private app token) that you paste directly into intentsly. It's simpler than OAuth and works great for this integration.

### Step-by-Step Tutorial

**1. Log into HubSpot**
- Go to [app.hubspot.com](https://app.hubspot.com) and log in

**2. Navigate to the "Legacy Apps" Section**
- Click your profile icon (top right)
- Go to **Account Settings → Integrations → Legacy API Key**
- Or go to **Settings → Account Setup → Integrations → Private Apps**

**3. Configure Your Legacy App**
- Click "Create a Private App"
- Give it a name (e.g., "intentsly Integration")

**4. Assign the Correct Scopes (Permissions)**

Required scopes:
- \`crm.objects.contacts.read\`
- \`crm.objects.contacts.write\`
- \`crm.objects.companies.read\`
- \`crm.objects.companies.write\`

**5. Create the App and Get the Token**
- Click "Create app"
- Copy the token shown

**6. Add the token in intentsly**
- Go to **Settings → Integrations → HubSpot**
- Paste your token
- Click Connect`,
      },
    ],
  },
  {
    id: "billing-plans",
    title: "Billing & plans",
    description: "More information on our plans",
    icon: "folder",
    articles: [
      {
        id: "pricing-explained",
        title: "intentsly pricing explained",
        content: `intentsly offers different plans based on your usage and level of automation.

Plans vary depending on:
- Number of signals tracked
- Number of LinkedIn accounts connected
- Email enrichment credits
- Team / workspace size

You can view the current pricing inside your dashboard or on the pricing page.

Each paid plan includes:
- Access to AI Agents
- Lead detection & scoring
- Campaign creation
- Chrome extension
- AI messages
- Leads Inbox + Lists

You can upgrade or downgrade anytime.`,
      },
      {
        id: "free-trial-ends",
        title: "What happens when my free trial ends?",
        content: `When your free trial ends:

- If a payment method is added → your plan automatically starts
- If no payment method is added or if you canceled your trial → your account is paused

Your data (leads, lists, campaigns) is **not deleted**.

You can reactivate your account at any time by choosing a plan.`,
      },
      {
        id: "change-plan",
        title: "Can I change my plan later?",
        content: `Yes. You can change your plan at any time.

Go to: **Settings → Billing**

From there, you can:
- Upgrade to a higher plan
- Downgrade to a lower plan
- Switch from monthly to annual
- Switch from annual to monthly

Changes will be applied automatically.`,
      },
      {
        id: "discounts",
        title: "Do you offer discounts?",
        content: `We regularly offer:
- Discounts on **quarterly and annual plans**
- Custom plans for agencies & teams

If you're managing multiple clients or many LinkedIn accounts, contact support to discuss a tailored plan.`,
      },
      {
        id: "update-payment",
        title: "How do I update my payment method?",
        content: `To update your payment method:

1. Go to **Settings → Billing**
2. Click **View Invoices**
3. Add your new card
4. Save

Your next invoice will use the updated card.`,
      },
      {
        id: "payment-failed",
        title: "My payment failed — what should I do?",
        content: `If your payment fails:
- Your account may be temporarily paused
- Campaigns may stop running

To fix it:
1. Go to **Settings → Billing**
2. Click on "View Invoices"
3. Update your payment method
4. Retry the payment if needed

If you run into issues, contact support in the chat and we'll help.`,
      },
      {
        id: "refund",
        title: "Can I get a refund?",
        content: `Because intentsly is a software and data-based service, we do not offer standard refunds.

However, if there has been a clear technical issue or an error, contact support and we will review the situation on a case-by-case basis.`,
      },
      {
        id: "forgot-to-cancel",
        title: "I forgot to cancel and got charged",
        content: `If you were charged but no longer want to use the service:

1. Contact support as quickly as possible
2. Explain your situation
3. Include your account email

We'll review your request and let you know what's possible.`,
      },
      {
        id: "cancel-subscription",
        title: "How do I cancel my subscription?",
        content: `You can cancel your subscription directly from your account.

1. Go to **Settings → Billing**
2. Click **Cancel subscription**
3. Follow the steps

Once cancelled:
- You will not be charged again
- Your account stays active until the end of the billing period
- Your data remains saved

You can come back and reactivate at any time.`,
      },
    ],
  },
  {
    id: "technical-api",
    title: "Technical & API",
    description: "API, webhooks, authentication...",
    icon: "wrench",
    articles: [
      {
        id: "using-the-api",
        title: "Using the API",
        content: `This page explains where to get your API key, how to use the API reference, how rate limiting works, and what you can do with the API.

## 1. Where to find your API key

To authenticate against the intentsly API, you need an API key tied to your workspace.

- In the intentsly app, go to **Settings → API**
- Create a new API key if you don't have one yet
- Copy the key and store it in a secure place (env var, secret manager, etc.)
- Use different keys per environment (dev / staging / prod) when possible

⚠️ Never expose your API key in client-side code or public repositories.

## 2. How to use the API documentation

All endpoints, parameters, and models are documented in the external API reference:

- API reference: \`https://ext.intentsly.ai/documentation\`

From this documentation, you can:
- Browse all available endpoints
- See request/response examples
- Try requests directly from the browser

## 3. Rate limiting

The API uses rate limiting to ensure fair usage:
- **100 requests per minute** per API key
- **5,000 requests per day** per API key

If you exceed the limit, you'll receive a \`429 Too Many Requests\` response.

## 4. What you can do with the API

### Contacts
- List all contacts
- Get a specific contact by ID
- Create a new contact
- Update a contact
- Delete a contact

### Campaigns
- List all campaigns
- Get campaign details
- Add contacts to a campaign
- Remove contacts from a campaign

## 5. Putting it all together

A typical workflow using the API:

1. Import contacts via \`POST /contacts\`
2. Get a list of your campaigns via \`GET /campaigns\`
3. Add imported contacts to a campaign via \`POST /campaigns/{id}/contacts\`
4. Monitor results via \`GET /contacts?campaign_id={id}\``,
      },
      {
        id: "webhooks",
        title: "Webhooks",
        content: `intentsly allows you to receive real-time notifications when new contacts are created or updated by configuring a webhook URL.

## How to Configure Webhooks

1. **Log in to your intentsly AI account** at [https://app.intentsly.ai](https://app.intentsly.ai)
2. **Navigate to the Integrations page** at [https://app.intentsly.ai/integrations](https://app.intentsly.ai/integrations)
3. **Add a Webhook integration** by clicking the Webhook option
4. **Enter your webhook URL** where you want to receive notifications
5. **Save the configuration**

Once configured, intentsly will send POST requests to your webhook URL whenever:
- A new contact is created
- A contact is updated
- Other relevant events occur in your account

The webhook payload will include the full contact data in JSON format.

Each webhook request includes a custom header \`x-intentsly-user-id\` containing your user ID for verification purposes.

## How to test the webhook?

Use a webhook inspection tool like [https://webhook.site](https://webhook.site/) to preview and debug your payloads.

Simply paste the generated URL into your webhook configuration, trigger an event in intentsly, and inspect the exact body, headers, and structure being sent.

## How to manually trigger an event?

1. Go to **Integrations → Webhooks**
2. Find your webhook configuration
3. Click **"Test webhook"**
4. A sample payload will be sent to your URL

This lets you verify your endpoint is working correctly before relying on it in production.`,
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
  "finding-leads": { icon: UserPlus, gradient: "bg-gradient-to-br from-[hsl(var(--md-tertiary-fixed))] to-[hsl(46,100%,50%)]", shadow: "shadow-[hsl(var(--md-tertiary))]/20" },
  "campaigns-outreach": { icon: BarChart3, gradient: "bg-gradient-to-br from-md-primary-container to-md-secondary", shadow: "shadow-md-primary/20" },
  "troubleshooting": { icon: Shield, gradient: "bg-gradient-to-br from-destructive to-md-secondary", shadow: "shadow-destructive/10" },
  "billing-plans": { icon: Sparkles, gradient: "bg-gradient-to-br from-md-primary to-md-secondary", shadow: "shadow-md-primary/20" },
  "technical-api": { icon: Code2, gradient: "bg-gradient-to-br from-[hsl(var(--md-tertiary))] to-md-primary", shadow: "shadow-[hsl(var(--md-tertiary))]/10" },
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
              <button onClick={() => setSearch("CSV")} className="text-xs font-medium text-md-primary hover:underline">Importing CSV</button>
              <button onClick={() => { openCategory("campaigns-outreach"); }} className="text-xs font-medium text-md-primary hover:underline">Campaign Metrics</button>
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

            <h1 className="text-2xl font-bold mb-6 text-md-on-surface">
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

            {/* External link */}
            <div className="mt-6">
              <a
                href="https://help.intentsly.ai/en/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs hover:opacity-70 transition-opacity text-md-on-surface-variant"
              >
                <ExternalLink className="w-3 h-3" />
                View original on help.intentsly.ai
              </a>
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
