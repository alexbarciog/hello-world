# Fix the terrible Step 2 "Send message"

The first outreach message reads like AI slop because two things are broken:

1. **It has no idea what the post actually said.** `generate-step-message` expects a `signalPostText` field, but none of the callers (`process-campaign-followups`, `process-ai-replies`, `CampaignDetail.tsx`) pass it. It silently falls back to `lead.signal` — a summary string like *"liked Acme's post about lending"*. So the AI writes about a hashtag/topic instead of a real reaction.
2. **The prompt is generic.** It says "reference something specific" but gives the model nothing specific to reference, and its anti-AI rules are soft.

## Plan

### 1. Persist the actual post text on the contact
- Add column `contacts.signal_post_excerpt text` (nullable, ~500 chars).
- Backfill nothing; new signals fill it going forward.
- Save the post body in the four signal ingestors that already have `p.text` in hand:
  - `signal-keyword-posts`
  - `signal-post-engagers`
  - `signal-hashtag-engagement`
  - `signal-competitor`
  - `discover-leads`
  - `ai-chat-search-leads` (already computes it — just persist)
- Store `text.trim().slice(0, 500)`.

### 2. Pass it into the message generator
- `process-campaign-followups`, `process-ai-replies`, and both `CampaignDetail.tsx` invoke sites: include `signalPostText: contact.signal_post_excerpt` in the payload.
- `generate-step-message` already reads `req.signalPostText` — no change needed there beyond the new prompt.

### 3. Rewrite the Step 2 prompt (`buildOutreachPrompts`, `stepNumber <= 2`)
New structure, tight and psychology-driven:

**Inputs given to the model, clearly labeled:**
- `POST_EXCERPT` (the real text, or `(none)` fallback)
- `POST_SUMMARY` (the old signal string, as backup)
- `FIRST_NAME`, `HEADLINE`, `COMPANY`
- `WHAT_WE_DO` (one-liner)
- `PAIN_POINTS` (bullets)

**Message rules (replaces the current block):**
- **Length:** 35–55 words. Never over 60. 2–3 short sentences.
- **Reading level:** 6th grade. Simple words a non-native English speaker gets instantly.
- **Formatting:** all lowercase openers OK, no emojis, no em-dashes, no semicolons, no bullet lists, no line breaks unless natural.
- **Opener (line 1):** quote or paraphrase ONE concrete detail from `POST_EXCERPT`. If no excerpt, reference the specific thing in `POST_SUMMARY` (never the hashtag, never the industry). Never start with "I noticed / I saw / I came across / Hope you're well / Great post".
- **Middle (line 2):** one honest human reaction — agreement, a small counter-take, or a "we hear the same thing from X" observation. Uses "I / we", not "our platform".
- **Close (line 3):** ONE curious question about their situation. Never a CTA, never "open to a call", never a calendar link, never "would love to connect". The question must be answerable in one sentence.
- **Psychology levers to use (pick 1, never name them):**
  - *Specificity* → proves it's not a template.
  - *Curiosity gap* → question implies you might know something useful without saying so.
  - *Low-stakes reciprocity* → offering a small observation before asking anything.
  - *Peer framing* → "founder to founder", not "vendor to prospect".
- **Hard bans (regex-checked in `sanitizeMessage`, see step 4):** *leverage, utilize, synergy, streamline, ecosystem, delighted, thrilled, empower, resonate, spearhead, bandwidth, circle back, touch base, deep dive, game-changer, cutting-edge, robust, seamless, holistic, actionable, hope this finds you well, saw your post, came across your profile, engaging with #, as someone in the \<industry\> space*.
- **Never mention:** the product name, any statistic/percentage, "we built / our solution / our platform", any hashtag, any CTA.

**Two labeled examples in the prompt** — one GOOD (post-grounded, human, ends in one question), one BAD (generic, pitchy, statistic-laden) — so the model has a clear target.

### 4. Tighten `sanitizeMessage` for step 2
- Add a banned-phrase regex sweep; if any hit, log and regenerate once (single retry with a "you used a banned phrase, rewrite" nudge). If still bad, keep the output but strip the offending phrase.
- Enforce word cap 60; if over, trim to last full sentence under the cap.
- Reject messages that don't contain `?` (step 2 must end in a question) → one retry.

### 5. No changes to
- Step 3 (soft follow-up) and Step 4 (polite exit) prompts — user only asked about step 1.
- Conversational reply handler.
- UI / campaign wizard.

## Technical notes

- Migration: `ALTER TABLE public.contacts ADD COLUMN signal_post_excerpt text;` (RLS already covers it via existing policies; no grant changes needed since column inherits table grants).
- `sanitizeMessage` gets a new `isStep2` flag; retry loop lives in the outreach handler, capped at 1 retry to stay within latency budget.
- `signal_post_excerpt` also becomes available to the personality-prediction and lead-insights functions later, but that's out of scope here.

## Files touched

- `supabase/migrations/<new>.sql` (add column)
- `supabase/functions/generate-step-message/index.ts` (prompt + sanitizer + retry)
- `supabase/functions/process-campaign-followups/index.ts` (pass `signalPostText`)
- `supabase/functions/process-ai-replies/index.ts` (pass `signalPostText`)
- `supabase/functions/signal-keyword-posts/index.ts`
- `supabase/functions/signal-post-engagers/index.ts`
- `supabase/functions/signal-hashtag-engagement/index.ts`
- `supabase/functions/signal-competitor/index.ts`
- `supabase/functions/discover-leads/index.ts`
- `supabase/functions/ai-chat-search-leads/index.ts` (persist excerpt on save path)
- `src/pages/CampaignDetail.tsx` (two invoke sites pass `signalPostText`)
