

## Add Competitor Detection to All Buying-Intent Classifiers

### Problem
The AI classifier currently checks if a post shows buying intent — but it doesn't check whether the AUTHOR (or engager) is themselves a competitor selling the same service the user does. This causes "fake signals": e.g. a rival lead-gen agency posting "anyone need help with outbound?" gets flagged as a hot buyer, when really they're a competitor fishing for clients. The same problem exists for the post-engagement signal type, where engagers (likers/commenters on competitor or hashtag posts) are not currently filtered for competitor status at all.

### Solution
Extend the AI classifier in BOTH `signal-keyword-posts` and `signal-post-engagers` so that, in addition to scoring buying intent, it also evaluates whether the analyzed person (post author OR post engager) is a competitor / service provider in the same space as the user. Reject any lead flagged as a competitor, regardless of intent score.

### Changes

**File 1: `supabase/functions/signal-keyword-posts/index.ts`**

1. Extend `IntentClassification` interface — add `is_competitor: boolean` and `competitor_reason: string`.
2. Update the system prompt in `classifyIntentBatch`:
   - Add a "COMPETITOR CHECK" layer. Given the COMPANY CONTEXT (what the user sells), instruct the AI to analyze the AUTHOR's headline + post content and decide if they offer the SAME or substantially similar services.
   - Examples: User sells AI lead-gen → reject "Founder @ OutreachAgency", "We help B2B companies book more meetings", "Lead-gen consultant". User sells SEO → reject SEO agencies posting promotional questions.
   - Soft-promotional posts ("Anyone need help scaling outbound? DM me") from service-providers must be flagged as `is_competitor=true`, NOT as buyers.
3. Update the `classify_intent` tool schema to require `is_competitor` and `competitor_reason`.
4. Post-classification logic: if `is_competitor === true` → reject and store under `rejected:` with reason `"competitor: <reason>"`. Add `[AI] 🚫 competitor` log line.
5. Extend `[AI_OUTPUT]` log to include the new fields.

**File 2: `supabase/functions/signal-post-engagers/index.ts`**

1. Add an equivalent AI competitor-classification step for each engager BEFORE they are inserted as a contact.
   - Build a lightweight classifier call (reusing the same Lovable AI gateway pattern) that takes: company context (what the user sells) + engager's headline/title + company name.
   - Returns `{ is_competitor: boolean, reason: string }`.
2. Batch engagers (e.g. 10 per call) to keep token usage low — engagers don't have post content, only profile metadata, so the prompt is much shorter than the keyword-posts classifier.
3. If `is_competitor === true` → skip the engager, log `[engagers] 🚫 competitor: <name> — <reason>`, increment a `competitors_filtered` counter for the run diagnostic summary.
4. Add the counter to the existing diagnostic summary persisted on `signal_agent_tasks`.

### Technical notes
- No DB schema changes required.
- No frontend changes required.
- Pre-existing `competitorCompanies` ICP exclusion (profile-based, after Unipile enrichment) remains untouched — these new AI checks operate on the raw signal data BEFORE expensive Unipile profile enrichment, saving credits.
- Backward compatible: if AI omits the new fields, default `is_competitor=false`.
- For `signal-post-engagers`, the AI call adds latency; we batch to amortize it and keep the model small (`google/gemini-3-flash-preview`).

### Out of scope
- Not adding to X / Reddit signal agents in this pass (different classifier path). Can be added in a follow-up.

