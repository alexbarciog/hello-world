

# Add Sales Opportunity Email Notifications

## Goal
Notify users via email (from `no-reply@intentsly.com` via Resend) when a lead reaches a sales-opportunity milestone: meeting booked or positive intent detected (e.g., agreed to learn more).

## Approach
Reuse the existing `send-notification-email` edge function which already uses Resend and looks up the user's email. Just change the `from` address to `no-reply@intentsly.com` and add email triggers at the right points in `process-ai-replies`.

## Changes

### 1. Update `send-notification-email/index.ts` — change sender address
- Change `from: 'Intentsly <onboarding@resend.dev>'` to `from: 'Intentsly <no-reply@intentsly.com>'`
- Add support for an optional `body` field to include lead details in the email body (name, company, signal)
- Update the email HTML template to show lead details when provided

### 2. Update `process-ai-replies/index.ts` — add email notification triggers

Add a call to `send-notification-email` at two key moments:

**a) Meeting booked** (after the meeting auto-creation at ~line 452):
```ts
await supabase.functions.invoke('send-notification-email', {
  body: {
    user_id: cr.user_id,
    title: `🎯 Meeting booked with ${contact.first_name} ${contact.last_name || ''}`,
    body: `${contact.first_name} from ${contact.company || 'Unknown'} agreed to a meeting. Scheduled for ${scheduledAt.toLocaleDateString()}.`,
    link: `/contacts`,
    type: 'meeting',
  }
});
```

**b) Positive intent / interested lead** (when `aiIntent === 'interested'` or similar positive classification — after the AI reply is sent successfully):
```ts
await supabase.functions.invoke('send-notification-email', {
  body: {
    user_id: cr.user_id,
    title: `🔥 ${contact.first_name} ${contact.last_name || ''} is interested`,
    body: `${contact.first_name} from ${contact.company || 'Unknown'} showed buying intent: "${leadMessage.slice(0, 150)}"`,
    link: `/contacts`,
    type: 'lead',
  }
});
```

### 3. Add a `meeting` type to `getSubjectFromType` in `send-notification-email`
```ts
case 'meeting':
  return `🎯 ${cleanTitle} — Intentsly`;
```

### 4. Enhance the email HTML body
When `notifBody` is provided, render it as a paragraph below the title in the email, so the user gets context without needing to open the app.

### Files changed
- `supabase/functions/send-notification-email/index.ts` (sender address, body rendering, meeting type)
- `supabase/functions/process-ai-replies/index.ts` (add email triggers for meeting_booked and interested leads)

### What stays the same
- The existing `notifications` table insert flow (in-app notifications)
- The notification email HTML template structure/branding
- All other edge functions

