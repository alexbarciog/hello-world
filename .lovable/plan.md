

# Overhaul AI SDR Cold Outreach — Make It Undetectable as AI

## Problem

The AI SDR writes messages that leads can tell are AI-generated. Messages are generic, repetitive across steps, and lack genuine sales psychology. A lead literally said "it's awful." The AI also hallucinates engagement when leads haven't replied, and force-appends "Open to a quick chat?" robotically.

## Design Principles

Instead of telling the AI to "try a different angle" across steps (which makes follow-ups feel disconnected), the AI should **deepen the same angle** — like a real salesperson who keeps building the case from the same core insight, adding layers of proof, urgency, or social context each time.

The AI should embody elite sales psychology: pattern interrupts, loss aversion, social proof, curiosity gaps, and mirroring the lead's own words back to them.

## Changes — Single File

**File**: `supabase/functions/generate-step-message/index.ts`

### 1. Remove auto-append "Open to a quick chat?" (lines 57-60)

Delete the block that force-appends a generic CTA when the message doesn't end with `?`. The AI prompt already instructs ending with a question — let it choose naturally. This is the #1 tell that it's automated.

### 2. Rewrite the system prompt (lines 213-248) — Sales Psychology Identity

Replace the current system prompt with one that gives the AI a **sales psychology persona**. Key additions:

- **Identity**: "You are an elite B2B salesperson who has closed thousands of deals. You understand cognitive biases: loss aversion, social proof, curiosity gaps, the Zeigarnik effect. You use these naturally, never mechanically."
- **Voice rule**: "Write exactly like a busy founder would text a peer on LinkedIn. Short. Imperfect. Real. Use contractions. Start mid-thought sometimes. Never sound like marketing copy."
- **Signal mirroring**: "Use the lead's EXACT words from the buying signal. If they said 'looking for lead gen channels', you say 'lead gen channels' — not 'growth strategies' or 'pipeline solutions'."
- **Anti-detection rules**: "Never start with 'Hi [Name],' followed by 'I saw/noticed/came across'. Vary your opener: start with a question, a stat, a bold claim, or jump straight into value. Real people don't always greet first."
- Keep existing rules about no placeholders, no buzzwords, no em-dashes, word limits.

### 3. Rewrite step-specific prompts (lines 255-262) — Deepen, Don't Pivot

**Step 2 (first message)**: 
- "Open with a pattern interrupt — something unexpected that makes them stop scrolling. Reference their signal using their exact words. Connect to ONE sharp outcome. End with a question that's easy to answer (yes/no or 'curious?')."

**Step 3 (follow-up, no reply)**:
- Explicitly state: "The lead has NOT replied to your previous message. Do NOT assume they engaged."
- "Deepen the SAME angle from your last message. Add a layer: a specific number/stat, a competitor reference, or a 'most [titles] I talk to struggle with X' social proof. Keep it to 2 sentences. End with a different question than Step 2."

**Step 4 (final, no reply)**:
- Explicitly state: "The lead has NOT replied to any of your messages."
- "Last shot. Ultra-short (2 sentences max). Use loss aversion or a curiosity gap. Example patterns: 'Totally fine if this isn't a priority — just didn't want you to miss [specific thing]' or 'Last thing — [one-line value hook]?'. No guilt-tripping, no passive-aggression."

### 4. Handle thin/vague signals better (inside system prompt)

Add: "If the buying signal is vague (e.g., 'Reacted to [Company] post' with no detail), do NOT pretend you know what the post said. Instead, reference what the competitor company is known for and connect it to a challenge relevant to the lead's title. Example: 'Saw you follow [Competitor] — they're big on [topic]. Curious how you're handling [related challenge] at [Company]?'"

## What This Does NOT Change

- The conversational reply handler (lines 66-193) — already has its own style rules
- The step generation architecture — still uses the same `buildOutreachPrompts` function
- Message sanitization — still enforces length limits, removes placeholders, strips em-dashes
- The overall flow — still generates one message per step, still uses previous messages as context

## Expected Outcome

- Messages sound like a real person who happens to be great at sales
- Each follow-up builds on the previous one instead of feeling like a separate template
- No more hallucinated engagement ("appreciate the positive vibes")
- No more robotic "Open to a quick chat?" on every message
- Leads can't easily tell it's AI because the voice is natural, varied, and psychologically sharp

