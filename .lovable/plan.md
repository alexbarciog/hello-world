

## Add Integrations Tab with Calendar Connections

### Overview
Add an "Integrations" tab to the sidebar navigation that lets users connect their calendar providers (Calendly, Google Calendar, Outlook Calendar, Cal.com). When a lead books a meeting through any connected calendar, the system detects it and the AI sends a LinkedIn follow-up 1 hour before the meeting.

### 1. Database: New Tables

**`calendar_integrations`** — stores each user's connected calendar accounts:
- `id` (uuid, PK)
- `user_id` (uuid, FK auth.users, ON DELETE CASCADE)
- `provider` (text: `calendly`, `google_calendar`, `outlook_calendar`, `cal_com`)
- `access_token` (text, encrypted)
- `refresh_token` (text, nullable)
- `token_expires_at` (timestamptz, nullable)
- `webhook_id` (text, nullable — for provider-side webhook reference)
- `calendar_email` (text, nullable)
- `is_active` (boolean, default true)
- `created_at` / `updated_at`
- RLS: users can only read/update their own rows

**`calendar_events`** — stores detected meeting bookings from webhooks:
- `id` (uuid, PK)
- `user_id` (uuid, FK)
- `integration_id` (uuid, FK calendar_integrations)
- `provider_event_id` (text)
- `attendee_email` (text)
- `contact_id` (uuid, FK contacts, nullable — matched lead)
- `meeting_id` (uuid, FK meetings, nullable — linked meeting record)
- `event_title` (text)
- `event_start` (timestamptz)
- `event_end` (timestamptz)
- `pre_meeting_followup_sent` (boolean, default false)
- `created_at`
- Unique on `(user_id, provider_event_id)`

### 2. Frontend: Integrations Page

**New file: `src/pages/Integrations.tsx`**
- Card-based layout showing 4 calendar providers
- Each card: provider logo, name, description, Connect/Disconnect button, connection status
- Connected state shows the linked email and a toggle to enable/disable
- Uses the existing DashboardLayout wrapper

**Sidebar update: `src/components/DashboardLayout.tsx`**
- Add `{ label: "Integrations", icon: Plug, path: "/integrations" }` to `baseNavItems` (after Unibox, before Settings)

**Route: `src/App.tsx`**
- Add `/integrations` route wrapped in AuthGuard + DashboardLayout

### 3. Edge Functions

**`connect-calendar/index.ts`** — initiates OAuth flow for each provider:
- Accepts `{ provider }`, returns the OAuth authorization URL
- Stores a pending integration row
- Handles token exchange on callback

**`calendar-webhook/index.ts`** — receives webhook events from providers:
- Calendly: event created/canceled webhooks
- Google Calendar: push notifications
- Cal.com: booking created webhooks
- On new booking: matches attendee email against `contacts` table, creates `calendar_events` row, optionally creates a `meetings` row, creates a notification

**`pre-meeting-followup/index.ts`** — cron job (runs every 15 min):
- Queries `calendar_events` where `event_start` is within 45-75 min from now and `pre_meeting_followup_sent = false`
- For matched contacts with an active campaign connection request, sends a LinkedIn message via Unipile (e.g., "Looking forward to our call in an hour!")
- Marks `pre_meeting_followup_sent = true`

### 4. Files to Create/Edit

| Action | File |
|--------|------|
| Create | `src/pages/Integrations.tsx` |
| Create | `supabase/functions/connect-calendar/index.ts` |
| Create | `supabase/functions/calendar-webhook/index.ts` |
| Create | `supabase/functions/pre-meeting-followup/index.ts` |
| Edit   | `src/components/DashboardLayout.tsx` — add nav item |
| Edit   | `src/App.tsx` — add route |
| Migration | Create `calendar_integrations` and `calendar_events` tables with RLS |
| Migration | Add pg_cron job for `pre-meeting-followup` every 15 min |

### 5. Important Notes
- OAuth secrets for each provider (Google Client ID/Secret, Calendly API key, etc.) will need to be added as Supabase secrets. I will guide you through obtaining these credentials for each provider you want to enable.
- The pre-meeting LinkedIn follow-up uses the existing Unipile integration already in place for campaign messaging.
- The AI message for the follow-up will be generated using the existing `generate-step-message` pattern, personalized to the meeting context.

