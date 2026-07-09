# Fix Step 2 messages that ship with no greeting and no question

## What's actually broken (from Julia's screenshot)

The sent message reads:
> "Your point about sales needing to be human-led to actually drive revenue really hit home… behind every business goal is a person just trying to solve a specific problem."

No "Hey Julia! Thanks for connecting." No question. Two causes:

1. **`sanitizeMessage` caps cold outreach at 300 characters.** A proper greeting + signal reference + question is 320–420 chars. Sanitizer cuts at the last period before the cap, silently deleting the closing question. The `?` guard then can't retry because the *pre-sanitize* draft did have `?`, but by the time it's stored/sent, sanitize has stripped it.
2. **No structural enforcement.** The prompt asks for the 3-part shape (greeting → signal ref → question) but only the "must end in `?`" and "must be ≤60 words" rules are enforced in code. When the model drops the greeting to sound casual (as it did here), nothing catches it.

## Fix

Scope: `supabase/functions/generate-step-message/index.ts` only. No UI, no other functions, no schema changes.

### 1. Stop truncating Step 2 mid-message

- In `sanitizeMessage`, raise the cap for Step 2 to `500` chars (add an `isStep2` flag alongside `isConversational`). Keep 300 for Step 3+ and 150 for conversational.
- Word cap (≤60) already enforced in the retry loop — that's the real length guard; character cap only needs to prevent runaway output.
- Pass `isStep2` from the two call sites (retry check + final sanitize).

### 2. Enforce the greeting in code, not just in the prompt

Add a helper `ensureGreeting(msg, firstName)`:
- If the message does not start with `hey|hi|hello` (case-insensitive) within the first ~15 chars, prepend `Hey ${firstName || 'there'}! Thanks for connecting. ` and return it.
- Applied *before* the `?` / word-count / banned-phrase guard, so the prepended greeting doesn't count against banned-word regex and is included in retry decisions.

### 3. Tighten the Step 2 retry guard

Current guard triggers rewrite on: banned phrases, >60 words, missing `?`. Add two more triggers:

- **Missing greeting** — if after `ensureGreeting` the message *still* has no `hey/hi/hello` opener (paranoia guard for edge cases like the model returning JSON), retry.
- **Missing signal reference** — if the message body (after the greeting sentence) contains none of a small set of anchor phrases (`saw`, `caught`, `noticed your`, `your post`, `you engaged`, `you shared`, `you commented`), retry with an instruction to explicitly reference the post. This is a soft check — one anchor is enough.

The retry prompt lists all violations at once (already does this) so it stays a single extra model call, not a loop.

### 4. Prompt tweaks (small, targeted)

In `buildOutreachPrompts` for `stepNumber <= 2`:
- Move the greeting from "STRUCTURE line 1" to a **mandatory first line** shown *in the user prompt*, not just the system prompt: `The message MUST start with exactly: "Hey ${firstName}! Thanks for connecting."` — models follow user-prompt directives more reliably than system-prompt structure lists.
- Raise the target length to **40–65 words** (was 30–55). The current range squeezes out either the greeting or the question. 40–65 fits all three parts comfortably.
- Update the retry `wc > 60` cap to `wc > 70` to match.

### 5. No changes to

- Step 3 / Step 4 prompts.
- Conversational reply handler.
- `process-campaign-followups`, `process-ai-replies`, `CampaignDetail.tsx` — they already pass `signalPostText` correctly.
- DB schema, RLS, migrations.

## Files touched

- `supabase/functions/generate-step-message/index.ts` (only file)

## Verification after build

- Redeploy the edge function.
- Trigger a Step 2 generation on a test contact with a real `signal_post_excerpt`; confirm the stored `scheduled_messages.message` starts with "Hey {name}! Thanks for connecting." and ends with `?`.
- Confirm word count is 40–65 and no banned phrases.
- Old already-scheduled messages won't retroactively fix — user can regenerate them from the campaign scheduled queue if needed (existing UI supports it).
