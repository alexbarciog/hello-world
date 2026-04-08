

# Fix AI SDR First Message Quality: Too Generic, Ignores Lead Signal

## Problem

The AI generates messages like:
> "Most founders I talk to get stuck when their MVP hits 1,000 users and starts lagging. We usually get custom AI tools or SaaS dashboards live in about 30 days to stop that. Ever feel like your current tech stack is holding back your growth at Cubo?"

This is bad because:
1. It fabricates a scenario ("MVP hits 1,000 users") that has nothing to do with the lead
2. It ignores the actual buying signal entirely
3. It reads like a generic template, not a personalized message
4. "Ever feel like your current tech stack is holding back your growth?" is a textbook AI/marketing line

## Root Cause

The prompt in `generate-step-message` has good guidelines but:
- Too many instructions dilute focus. The AI has 50+ rules and defaults to safe, generic patterns
- The signal isn't enforced as the structural backbone of the message. It's mentioned but not required as the opening
- No concrete examples showing good vs bad output for this specific company's context
- The prompt says "mirror their exact words" but doesn't enforce it structurally

## Solution: Restructure the Prompt to Force Signal-First Messages

### Changes to `supabase/functions/generate-step-message/index.ts`

**1. Simplify and restructure `buildOutreachPrompts`**

Replace the current sprawling system prompt with a tighter, example-driven prompt that forces the AI to:

- **Sentence 1**: Reference what the lead did (liked/commented/engaged) with specific details
- **Sentence 2**: Connect that to what the sender does, using ONE pain point
- **Sentence 3**: End with a simple yes/no question

The restructured prompt will:
- Move the signal to the TOP of the prompt, not buried in a list
- Add 2-3 concrete good/bad examples directly in the prompt
- Remove redundant psychology instructions (the AI doesn't use them well anyway)
- Keep the banned words list and style rules but consolidate them
- Add a "SELF-CHECK" instruction: "Before outputting, verify: does sentence 1 mention what the lead engaged with? If not, rewrite."

**2. Add thin-signal detection logic**

Before calling the AI, parse the signal string to determine how much context is available:
- Rich signal: "Commented on [Person]'s post about [topic]" → full personalization
- Medium signal: "Liked [Company]'s post" → reference the company + what they're known for
- No signal: just name/title/company → skip signal reference, focus on role-specific pain point

Pass a `signalRichness` field to the prompt so the AI adapts its opening accordingly.

**3. Add few-shot examples in the prompt**

Include 2 concrete examples:
```
GOOD: "You liked Pangea's post about tech staffing. We help companies find people showing buying intent on LinkedIn so your team spends less time searching. Worth a look?"

BAD: "Most founders I talk to get stuck when their MVP hits 1,000 users and starts lagging. We usually get custom AI tools live in about 30 days. Ever feel like your tech stack is holding back growth?"
```

### File changes

- `supabase/functions/generate-step-message/index.ts` — rewrite `buildOutreachPrompts` function (system prompt + user prompt for step 2 and follow-ups)

### What stays the same
- Conversational reply handler (separate path, already working)
- `sanitizeMessage` function
- The caller in `process-campaign-followups` (payload structure unchanged)
- All other edge functions

