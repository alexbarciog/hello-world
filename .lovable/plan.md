

# Lead Discovery Pipeline Plan

## Overview

Build an automated pipeline that finds real LinkedIn leads matching users' campaign criteria, using Unipile's LinkedIn API. The pipeline runs weekly per campaign.

## Architecture

```text
┌──────────────────────────────────────────────────────┐
│                     Weekly Cron                       │
│         (pg_cron → calls discover-leads)             │
└──────────────┬───────────────────────────────────────┘
               ▼
┌──────────────────────────────────────────────────────┐
│          Edge Function: discover-leads                │
│                                                      │
│  1. Load all active campaigns                        │
│  2. For each campaign:                               │
│     a. Generate 5 keywords (AI, from company info)   │
│     b. Search LinkedIn posts via Unipile (per keyword)│
│     c. Extract post authors / engagers               │
│     d. Filter against ICP criteria                   │
│     e. Score and insert into contacts table           │
└──────────────────────────────────────────────────────┘
```

## Implementation Steps

### 1. Unipile Secret + LinkedIn Account Connection

- Add `UNIPILE_API_KEY` and `UNIPILE_DSN` as Supabase secrets
- Add a `unipile_account_id` column to the `profiles` table so each user stores their connected LinkedIn account
- Add a LinkedIn connection step in Settings (or onboarding) where users provide their Unipile account credentials (li_at cookie flow or username/password via Unipile's account creation API)

### 2. Edge Function: `discover-leads`

Single edge function that processes all active campaigns:

**Step A -- Generate keywords**: Use the existing AI gateway to produce 5 short keyword phrases from the campaign's `company_name`, `description`, `industry`, `icp_job_titles`, and `icp_industries`. Cache keywords on the campaign row (new `discovery_keywords` text[] column).

**Step B -- Search LinkedIn posts**: For each keyword, call Unipile's LinkedIn search API:
```
POST https://{DSN}/api/v1/linkedin/search?account_id={user_account_id}
Body: { "api": "classic", "category": "posts", "keywords": "{keyword}", "date_posted": "past-week" }
```
Collect up to 5 posts total across all keywords.

**Step C -- Extract people from posts**: For each post, retrieve the post author's profile via Unipile's profile endpoint. Collect name, title, company, industry, location, LinkedIn URL.

**Step D -- Filter against ICP**: Match each person against the campaign's ICP criteria:
- Job title matches `icp_job_titles`
- Industry matches `icp_industries`
- Location matches `icp_locations`
- Company size matches `icp_company_sizes` (if available from profile)
- Apply signal flags: `trigger_job_changes` (check if recently changed roles), `trigger_top_active` (post engagement level)

**Step E -- Score and insert**: Calculate an AI score (signal A/B/C hits), assign a signal description string, and insert qualifying leads into the `contacts` table with `user_id`, `list_name` = campaign name, and full profile data.

### 3. Database Changes

- Add `discovery_keywords` (text[]) column to `campaigns` table -- caches generated keywords
- Add `unipile_account_id` (text) column to `profiles` table -- stores user's Unipile LinkedIn account ID
- Add `source_campaign_id` (uuid, nullable) column to `contacts` table -- links contact back to the campaign that found them
- Add `linkedin_profile_id` (text, nullable) column to `contacts` -- deduplication key

### 4. Weekly Cron Job

Use `pg_cron` + `pg_net` to call the `discover-leads` function every Monday at 8:00 AM UTC:
```sql
SELECT cron.schedule('weekly-lead-discovery', '0 8 * * 1', $$
  SELECT net.http_post(
    url := 'https://uwwajlezgeurnvvrvdvb.supabase.co/functions/v1/discover-leads',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer {ANON_KEY}"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
$$);
```

### 5. LinkedIn Account Connection UI

Add a section in the **Settings** page where users can connect their LinkedIn account via Unipile:
- Input for LinkedIn `li_at` cookie (or email/password)
- Call Unipile's `POST /api/v1/accounts` to create the account
- Store returned `account_id` in `profiles.unipile_account_id`
- Show connection status (connected / not connected)

### 6. Contacts Page Updates

- Remove demo seed data logic
- Show real leads from the `contacts` table
- Add a `list_name` filter to show leads grouped by campaign
- Show the `signal` text explaining why this lead was surfaced

## Technical Details

- The `discover-leads` function uses `SUPABASE_SERVICE_ROLE_KEY` to read all active campaigns across users, then uses each user's `unipile_account_id` to make LinkedIn API calls on their behalf
- Deduplication: before inserting a contact, check if `linkedin_profile_id` already exists for that user
- Rate limiting: process max 5 campaigns per invocation, with 2-second delays between Unipile calls to respect API limits
- The function is idempotent -- re-running it won't duplicate contacts

