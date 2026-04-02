

## Plan: Add "Meeting Booked" Status + Meeting Prep Research

### What we're building
1. A new `meeting_booked` lead status with an optional meeting date/time
2. A new database table to store meeting details
3. UI to mark a lead as "meeting booked" and set the date
4. A "Meeting Prep" feature that generates AI research/insights about the lead before the meeting
5. A new tab in Contacts to filter leads with meetings booked

### Database Changes

**New table: `meetings`**
```sql
create table public.meetings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  contact_id uuid not null,
  campaign_id uuid,
  scheduled_at timestamptz not null,
  notes text,
  prep_research jsonb,
  prep_generated_at timestamptz,
  status text not null default 'scheduled',
  created_at timestamptz not null default now()
);
alter table public.meetings enable row level security;
-- RLS policies for authenticated users on own data
```

**Columns in `prep_research` (jsonb):**
- `company_summary` — what the company does, size, funding
- `lead_bio` — role, background, LinkedIn activity
- `talking_points` — personalized conversation starters based on signals/pain points
- `potential_objections` — likely concerns and how to address them
- `recent_activity` — recent LinkedIn posts/engagement if available

### UI Changes

**File: `src/pages/Contacts.tsx`**
- Add a new tab: "📅 Meeting Booked" that filters contacts with `lead_status === 'meeting_booked'`
- In the Last Action column, show a calendar icon + meeting date for contacts with meetings
- Add a right-click or button action "Book Meeting" that opens a dialog to set date/time

**File: `src/components/contacts/BookMeetingDialog.tsx`** (new)
- Simple dialog with date/time picker and optional notes field
- On save: inserts into `meetings` table and updates `contacts.lead_status` to `meeting_booked`

**File: `src/components/contacts/MeetingPrepPanel.tsx`** (new)
- Slide-out panel or dialog showing AI-generated research for a specific meeting
- Sections: Company Overview, Lead Background, Talking Points, Potential Objections
- "Generate Insights" button that calls the edge function
- Loading state while generating, then displays structured results

**File: `src/pages/Contacts.tsx`** — status config update
- Add `meeting_booked` to the `statusConfig` map with a Calendar icon and appropriate color
- Update tier counts to include meeting_booked count

**File: `src/pages/CampaignDetail.tsx`**
- Show meeting status badge in campaign contacts tab
- Add "Book Meeting" action for accepted/messaged leads

### Edge Function

**File: `supabase/functions/generate-meeting-prep/index.ts`** (new)
- Accepts: `contactId`, `meetingId`, `userId`
- Fetches: contact data, campaign data (company info, value prop, pain points), conversation history from Unipile (if chat_id exists)
- Calls AI (via Lovable API key) with a structured prompt to generate:
  - Company research summary (uses Firecrawl to scrape company website if available)
  - Lead background analysis based on title/signal/LinkedIn
  - 5 personalized talking points
  - 3 potential objections with rebuttals
  - Conversation summary (from chat history)
- Saves result to `meetings.prep_research` jsonb column
- Returns the research to the frontend

### Files to Create/Modify
1. **Migration** — `meetings` table + RLS policies
2. **`supabase/functions/generate-meeting-prep/index.ts`** — new edge function
3. **`src/components/contacts/BookMeetingDialog.tsx`** — new booking dialog
4. **`src/components/contacts/MeetingPrepPanel.tsx`** — new research panel
5. **`src/pages/Contacts.tsx`** — add Meeting Booked tab, booking action, prep button
6. **`src/pages/CampaignDetail.tsx`** — add meeting status + booking action in contacts tab
7. **`src/components/contacts/types.ts`** — update Contact type if needed

