
Goal: fix the Unibox chat list so each row shows the real LinkedIn contact name, profile image, and latest message preview instead of fallback placeholders.

What I found
- The Unibox page calls the `linkedin-messaging` edge function with:
  - `action: "list_chats"`
  - `limit: 50`
  - but no `enrich: true`
- In `supabase/functions/linkedin-messaging/index.ts`, the real-name lookup, avatar lookup, and latest-message lookup only happen when `body.enrich === true`.
- Because Unibox does not request enrichment, the response currently comes back with:
  - `_resolved_name: "LinkedIn User"`
  - `_resolved_avatar: null`
  - `_resolved_msg_text: ""`
  - `attendees: []`
- The network response confirms this is exactly what the page is rendering now.

Implementation plan
1. Update the Unibox chat-list request
- Change `src/pages/Unibox.tsx` so `list_chats` requests `enrich: true`.
- Keep the existing rendering helpers, since they already know how to use `_resolved_name`, `_resolved_avatar`, and `_resolved_msg_text`.

2. Tighten the Unibox fallback logic
- Improve the helper functions in `src/pages/Unibox.tsx` so they never prefer placeholder values like `"LinkedIn User"` or empty message strings when a better fallback exists.
- Make the preview row rely on `chatLastText(chat)` instead of checking only `chat.last_message` presence, so fetched preview text still displays correctly.

3. Make unread styling accurate in the list
- Replace the current “first row looks special” behavior with actual unread-driven UI using `_is_unread` / `unread_count`.
- Apply bold/semi-bold text and unread indicator only when the chat is truly unread.

4. Improve thread status labeling
- Remove the hardcoded `SEEN` label in the message thread unless there is a real seen/read signal available from the API.
- This avoids showing incorrect delivery/read status.

5. Verify end to end
- Confirm the list now shows:
  - real contact names
  - LinkedIn avatars
  - latest message preview text
  - correct unread emphasis
- Re-check the network payload and edge-function logs if any row still falls back.

Technical details
- Files to update:
  - `src/pages/Unibox.tsx`
- Likely no edge-function code change is required for the main bug, because enrichment logic already exists and logs show it can fetch real names/avatar data when enabled.
- Optional improvement after the main fix:
  - increase the edge function’s list limit cap (currently it forces max 15 even when the client asks for 50), if you want the full inbox to load beyond the first 15 chats.
