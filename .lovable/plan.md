

## Plan: Use "Perfect Lead Description" as a Pre-Check Filter

### Goal
Use the free-text **"Describe Your Perfect Lead"** field (`signal_agents.ideal_lead_description`) as an additional AI gate. Before a discovered lead is saved as a contact, an AI compares their LinkedIn **headline + company/title** against the user's free-text description and rejects them if they don't match.

### Where it plugs in

The four signal source functions all already receive `business_context` from `process-signal-agents`. We extend the same payload with a new `ideal_lead_description` field, and each function uses it to enrich the existing AI classifier (no extra round-trip — same call, extra check).

```text
process-signal-agents
  └── builds basePayload (adds: ideal_lead_description)
       ├── signal-keyword-posts        ← extend classifyIntentBatch prompt + schema
       ├── signal-post-engagers        ← extend classifyEngagersForCompetitors prompt + schema
       ├── signal-hashtag-engagement   ← extend filterIrrelevantPosts prompt + schema
       └── signal-competitor           ← add lightweight classifier (currently no AI gate)
```

### Changes

**1. `supabase/functions/process-signal-agents/index.ts`**
- Pass `agent.ideal_lead_description` through `basePayload` to all 4 child functions.
- Truncate to 800 chars to keep prompts lean.

**2. `supabase/functions/signal-keyword-posts/index.ts`**
- Accept `ideal_lead_description` from request body.
- In `classifyIntentBatch` system prompt, add a new section: **"PERFECT LEAD MATCH (ICP fit check)"** that instructs the AI to compare each post AUTHOR's headline against the user's perfect-lead description.
- Extend the `classify_intent` tool schema with two fields: `matches_perfect_lead: boolean`, `match_reason: string`.
- Post-classification: if `ideal_lead_description` is set AND `matches_perfect_lead === false` → reject the lead, store under `rejected:perfect_lead_mismatch`, log `[AI] 🚫 perfect-lead-mismatch: <reason>`.
- Skip the new check entirely when `ideal_lead_description` is empty (backward compatible).

**3. `supabase/functions/signal-post-engagers/index.ts`**
- Accept `ideal_lead_description` from request body.
- Extend the existing `classifyEngagersForCompetitors` batched call: rename internally to `classifyEngagers`, augment prompt to also evaluate "is this person a fit for the user's ideal customer description?", and return both `is_competitor` AND `matches_perfect_lead` per engager.
- In the engager loop (both `runOwnPostEngagers` and `runProfileEngagers` branches), after the existing competitor reject, add: if `ideal_lead_description` is set AND `matches_perfect_lead === false` → skip + increment new `perfect_lead_mismatch` diagnostic counter.

**4. `supabase/functions/signal-hashtag-engagement/index.ts`**
- Accept `ideal_lead_description` from request body.
- Extend the existing `filterIrrelevantPosts` AI prompt to also evaluate the AUTHOR against the perfect-lead description (one extra boolean field in the same tool schema). Reject if mismatch.

**5. `supabase/functions/signal-competitor/index.ts`**
- Currently has no AI gate. Add a lightweight batched AI classifier (mirroring `signal-post-engagers`) that runs only when `ideal_lead_description` is set, before insertion. Skipped entirely otherwise to avoid added cost when the field is empty.

**6. Diagnostic summary**
- Add `perfect_lead_mismatch` counter to the diagnostic JSON persisted on `signal_agent_tasks` for each function, so admins can see how many leads were rejected by this new gate.

### Backward compatibility & cost
- If `ideal_lead_description` is empty (existing agents), the new check is skipped entirely — zero behavior change, zero extra tokens.
- For agents that DO use the field, the check piggybacks on the AI calls that are already being made (no additional round-trips for keyword-posts, post-engagers, hashtags). Only `signal-competitor` adds a new call, gated on the field being set.
- Default to **accept** (`matches_perfect_lead=true`) when the AI is unsure — false negatives on a free-text field are worse than false positives, since structured ICP filters already enforce hard requirements.

### What stays the same
- No DB schema changes (column already exists from previous turn).
- No frontend changes — the textarea is already wired up and persisting.
- Existing structured ICP filters (job titles, industries, locations, restricted roles, competitor companies) keep working exactly as today; this is an additive layer.

### Out of scope
- X / Reddit signal agents (different classifier path; can mirror later).
- Re-running the check against already-saved contacts (only applies to newly discovered leads going forward).

