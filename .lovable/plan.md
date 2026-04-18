

## AI Chat — Conversational Lead Finder

A two-pane chat experience matching the reference UX, where users describe who they want to reach and the AI returns LinkedIn lead cards they can save into a contact list. Reuses the existing Unipile + ICP infra.

### Layout (mirrors reference, restyled to SnowUI / Intentsly)

**Empty state** (no messages yet)
- Centered greeting: "Hey {firstName}!" + "Let's find your next customers."
- Big input card (textarea + Search button) styled with sky-blue accent on the send button
- 6 prompt chips below: Industry, Role, Location, Company size, Pain point, Recent funding → click prefills the textarea

**Active state** (after first message)
- 30 / 70 split, full-height inside DashboardLayout
- **Left (30%)**: chat thread, typing indicator, search-progress + enrichment-progress widgets, ChatInput at bottom
- **Right (70%)**: status tabs `To Review · Saved · Skipped` then a vertical scrollable list of lead cards
- Mobile: tabs swap between Chat and Leads
- "New Search" button top-right resets the conversation

### Lead card (right pane)

Per lead, in SnowUI style (white card, 12px radius, no big shadows):
- Avatar + Name + Title + Company + Location + LinkedIn link
- Match score (0–100) and 2–3 short "why this lead" bullets
- Buttons: lime green **Add to Outreach** + ghost **Skip**

### Conversation flow

1. User describes target: e.g. "Find me founders of seed-stage SaaS in the US who recently posted about hiring SDRs."
2. AI extracts structured criteria via tool-calling and replies with quick-reply chips: `Start search` / `Refine` / `Add a filter`.
3. AI may ask 1–2 clarifying questions if criteria are too vague (location? company size? job titles?).
4. On `Start search`: progress widget → call `ai-chat-search-leads` edge function → render lead cards.
5. User saves/skips. On **Add to Outreach**, a small dialog asks: pick existing list or create new → lead is inserted into `contacts` + `contact_lists`.
6. User can keep chatting to refine ("only in Europe", "exclude agencies") → re-runs search appending or replacing.

### Technical design

**New components** (under `src/components/ai-chat/`)
- `ChatMessage.tsx` — markdown renderer (react-markdown), quick-reply chips, attachments
- `ChatInput.tsx` — textarea + send, Enter-to-send
- `TypingIndicator.tsx` — three dots
- `SearchProgress.tsx` — animated "Searching LinkedIn…" card
- `LeadCard.tsx` — the right-pane lead card with Save/Skip
- `SaveLeadDialog.tsx` — choose existing list or type a new one (reuses lookups against `lists`)

**Page**: rewrite `src/pages/AiChat.tsx` to match reference structure (initial state vs split view), wired to the new components. Keep within `DashboardLayout`.

**Edge functions** (two new, both `verify_jwt = true`)
1. `ai-chat-converse` — receives full message history, calls Lovable AI Gateway (`google/gemini-3-flash-preview`) with a system prompt for a friendly sales copilot. Uses tool-calling with two tools:
   - `update_search_criteria(role, industries, locations, company_sizes, exclude_keywords, intent_keywords)` — server merges into the session's criteria
   - `ready_to_search()` — signals frontend to show "Start search" CTA
   Streams SSE response. Persists assistant + user messages.
2. `ai-chat-search-leads` — takes the accumulated criteria + `excludeLinkedInUrls`, calls Unipile search (same logic as `discover-leads`), scores each profile against ICP, returns up to 15 ranked leads with match reasons. No DB writes — frontend decides what to save.

**Save flow**: client-side. On confirm in `SaveLeadDialog`, insert one row in `contacts` (with `user_id`, name, title, company, linkedin_url, list_name, `relevance_tier` derived from match score) and one in `contact_lists` linking to the chosen `lists.id`. If "Create new", insert into `lists` first.

### Database

One new table for single-session persistence:

```sql
create table public.ai_chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role text not null check (role in ('user','assistant','system')),
  content text not null,
  quick_replies jsonb,
  attachment jsonb,        -- { type: 'leads', data: [...] }
  criteria_snapshot jsonb, -- accumulated criteria at this point
  created_at timestamptz not null default now()
);
-- RLS: user can read/insert own; service role full access
create index on public.ai_chat_messages (user_id, created_at);
```

A small `ai_chat_state` row per user (or a single jsonb column on `profiles`) holds the latest accumulated `criteria` for resuming sessions. Plan picks: add `ai_chat_criteria jsonb` to `profiles` (one column, no new table needed).

### Out of scope (v1)
- Multi-conversation history sidebar — single ongoing session per user
- Recurring Signal Agent creation from chat
- Reddit/X intent posts as a source
- Voice input, file upload (icons rendered but disabled)
- Editing already-saved leads from chat

### Files

- New: `src/pages/AiChat.tsx` (rewrite)
- New: `src/components/ai-chat/{ChatMessage,ChatInput,TypingIndicator,SearchProgress,LeadCard,SaveLeadDialog}.tsx`
- New: `supabase/functions/ai-chat-converse/index.ts`
- New: `supabase/functions/ai-chat-search-leads/index.ts`
- Migration: create `ai_chat_messages` table + RLS, add `ai_chat_criteria jsonb` to `profiles`
- `supabase/config.toml`: register both functions

