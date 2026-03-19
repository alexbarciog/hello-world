

# Unibox — LinkedIn Inbox Implementation

## Overview
Build a full LinkedIn messaging inbox within the app, powered by Unipile's messaging API. Users will see all their LinkedIn conversations and can read/send messages directly from Intentsly.

## Architecture

```text
┌─────────────┐       ┌──────────────────────┐       ┌─────────────┐
│  Unibox.tsx  │──────▶│  Edge Function        │──────▶│  Unipile    │
│  (Frontend)  │◀──────│  linkedin-messaging   │◀──────│  API        │
└─────────────┘       └──────────────────────┘       └─────────────┘
```

## Changes

### 1. New Edge Function: `supabase/functions/linkedin-messaging/index.ts`
A single edge function handling 3 actions via POST body `{ action }`:

- **`list_chats`** — calls `GET /api/v1/chats?account_id={account_id}` to list all LinkedIn conversations. Supports cursor-based pagination.
- **`get_messages`** — calls `GET /api/v1/chats/{chat_id}/messages` to fetch messages for a selected chat.
- **`send_message`** — calls `POST /api/v1/chats/{chat_id}/messages` with `{ text }` to send a reply.

Authentication: validates JWT, looks up `unipile_account_id` from the user's profile.

### 2. New Page: `src/pages/Unibox.tsx`
Split-pane inbox layout:
- **Left panel**: conversation list with avatar, name, last message preview, timestamp, unread indicator
- **Right panel**: message thread with input field to compose and send replies
- Empty state when no LinkedIn account is connected (link to Settings)
- Real-time feel via `react-query` with refetch intervals

### 3. Route Registration in `App.tsx`
Add `/unibox` route wrapped in `AuthGuard` + `DashboardLayout`.

### 4. Config Update: `supabase/config.toml`
Add `[functions.linkedin-messaging]` with `verify_jwt = false` (validation done in code).

## Technical Details

**Unipile API endpoints used:**
- `GET https://{DSN}/api/v1/chats?account_id={id}&limit=50` — returns `{ items: Chat[], cursor }` 
- `GET https://{DSN}/api/v1/chats/{chat_id}/messages` — returns `{ items: Message[] }`
- `POST https://{DSN}/api/v1/chats/{chat_id}/messages` — body: `{ text: string }`, sends message

**UI components:** Uses existing shadcn components (ScrollArea, Input, Button, Avatar). Two-column layout on desktop, stacked with back-button on mobile.

