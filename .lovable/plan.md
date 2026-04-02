

## Plan: Fix AI SDR Conversational Reply Quality

### Problem
The conversational AI reply is terrible because of an architectural shortcut: `process-ai-replies` builds a good conversational prompt but then passes it via the `customTraining` field to `generate-step-message`, which wraps it with its own **cold outreach system prompt** (50-word outreach rules, "anchor in buying signal", etc.). The conversational instructions end up buried as "EXTRA USER INSTRUCTIONS" and the AI defaults to writing a sales pitch.

The example proves this — "Hi, Alexandru" gets a 3-paragraph sales pitch about "automating buying intent" instead of a natural 1-line reply.

### Root Cause
`generate-step-message/index.ts` has no separate code path for conversational replies. It always uses the cold outreach system prompt, ignoring the `conversationHistory` and `leadMessage` fields entirely.

### Solution: Add a dedicated conversational reply path in `generate-step-message`

When `isConversationalReply === true`, bypass the cold outreach prompt entirely and use a purpose-built conversational prompt.

#### New Conversational Prompt Design

**System prompt principles:**
- You are replying in an ongoing LinkedIn DM conversation, NOT writing cold outreach
- Mirror the lead's energy and length — if they wrote 3 words, reply with ~10-15 words
- Maximum 30 words (not 50) — shorter is always better
- ONE short paragraph only, no double paragraph structure
- Never pitch unprompted — only mention your product if the lead asks
- If the lead says "Hi" or a greeting, just greet back warmly and ask a simple question
- Goal: keep the conversation alive naturally, steer toward a call only when the moment is right
- No buzzwords, no value propositions unless asked, no pain points monologues

**Greeting detection:** If the lead's message is a simple greeting (hi, hello, hey, etc.), the AI should respond with a warm greeting + a light conversational question — no product mention at all.

**Reply calibration by reply count:**
- Reply 1-2: Pure relationship building, zero sales
- Reply 3-4: Light mention of what you do IF relevant
- Reply 5+: Gentle call suggestion

#### Example behavior after fix

Lead: "Hi, Alexandru"
AI: "Hey Shruti! How's your week going?"

Lead: "Good thanks, what do you do?"
AI: "We help growth teams spot buying signals on social. Curious what channels you're focused on right now?"

### Technical Changes

**File: `supabase/functions/generate-step-message/index.ts`**

1. Add a new code branch after input parsing: if `isConversationalReply === true`, use a completely separate system prompt and user prompt
2. The conversational system prompt will be ~15 lines focused on natural DM replies
3. Include greeting detection logic in the prompt
4. Use `conversationHistory` and `leadMessage` directly (they're already passed but ignored)
5. Reduce `sanitizeMessage` max length to 150 chars for conversational replies (instead of 300)
6. Remove the "Open to a quick chat?" auto-append for conversational replies — the prompt handles CTA timing based on reply count

**File: `supabase/functions/process-ai-replies/index.ts`**

1. Stop stuffing the prompt into `customTraining` — pass `conversationHistory` and `leadMessage` as dedicated fields (already done, but now they'll actually be used)
2. Remove the local `systemPrompt` and `userPrompt` construction from `generateConversationalReply` since the logic moves to `generate-step-message`
3. Pass `repliesCount` and `maxReplies` so the message generator can calibrate sales intensity
4. Pass `isFollowUp` flag for the 24h follow-up case

### Impact
- Conversational replies will be 10-30 words instead of 50-80
- Greetings get greeting responses, not sales pitches
- Sales intensity scales with conversation depth
- No prompt collision between cold outreach and conversation modes

