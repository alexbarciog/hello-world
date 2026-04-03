

# Fix: Run AI Relevance Filter on ALL Posts

## Problem
The current `filterIrrelevantPosts()` function has a bypass: if the keyword that matched a post is NOT in the generic blacklist, the post is automatically marked as relevant without any AI check (lines 228-235 in `signal-keyword-posts/index.ts`). This means the AI filter only ever runs on posts found via single generic words like "sales" — but never on posts found via multi-word phrases, which can still match completely irrelevant content (like the wolf/straw metaphor post).

## Fix
Remove the blacklist-bypass logic and run the AI relevance check on **every** post with text, regardless of which keyword matched it. The AI call is cheap (~1-2 seconds per batch of 10) and the only reliable way to catch metaphorical/irrelevant posts.

## Changes

### File: `supabase/functions/signal-keyword-posts/index.ts`

**In `filterIrrelevantPosts()`** (lines 215-348):
- Remove the `needsAICheck` / `isBlacklistOnlyMatch` bypass logic (lines 228-237)
- Send ALL posts with text directly to the AI batch classifier
- Keep the short-text skip (< 20 chars) as-is

The same fix applies to:

### File: `supabase/functions/signal-hashtag-engagement/index.ts`
- Apply the identical change if it has the same bypass pattern

### Summary
- 2 edge functions modified
- No database changes
- No UI changes
- The AI filter cost remains minimal (1 extra API call per 10 posts, ~1-2s)

