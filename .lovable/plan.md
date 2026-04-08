

# Upgrade AI Outreach Messages: Lead-Aware Personalization

## Problem
The AI generates messages that reference the signal correctly but ignores the lead's background — their role, industry, company context. This makes messages feel one-dimensional. A VP of Sales at a logistics company should get a very different message than a CTO at a SaaS startup, even if both liked the same post.

## Root Cause
1. **The contacts table doesn't store industry or company description** — only `first_name`, `last_name`, `title` (headline), `company`, `signal`
2. **The AI prompt receives title and company but doesn't instruct the AI to deeply use them** — it focuses almost entirely on the signal, with the lead's role treated as metadata
3. **No company/industry context is captured at lead creation** — the LinkedIn profile data has `industry`, `company.industry`, and headline details, but they're discarded during insert

## Solution (3 parts)

### 1. Store lead industry on the contacts table
Add an `industry` column to contacts so we capture it at discovery time.

**Migration**: `ALTER TABLE contacts ADD COLUMN industry text;`

**Update `signal-keyword-posts/index.ts`**: When inserting a contact, also store:
```
industry: profile.industry || profile.current_company?.industry || null
```

### 2. Rewrite the AI prompt to deeply leverage lead context
The current prompt treats `Title` and `Company` as flat labels. Rewrite the `buildOutreachPrompts` system prompt in `generate-step-message/index.ts` to:

- Add a **LEAD INTELLIGENCE** section that instructs the AI to infer the lead's daily challenges from their title + industry + company
- Add explicit instructions: "Before writing, think about what keeps this person up at night given their role and industry. Your message must show you understand THEIR world."
- Add role-specific framing rules:
  - If title contains "CEO/Founder/Owner" → frame around growth/scaling
  - If title contains "VP/Director/Head of Sales" → frame around pipeline/revenue
  - If title contains "CTO/VP Engineering" → frame around efficiency/technical debt
  - If title contains "Marketing" → frame around lead gen/ROI
- Update sentence S2 to explicitly connect the signal to a pain point **specific to their role and industry**, not a generic value prop
- Add bad examples showing role-ignorant messages vs good examples that demonstrate role-awareness

### 3. Pass industry data through the full chain
Update the data flow so `industry` reaches the AI prompt:

- **`process-campaign-followups/index.ts`**: Change contact select from `first_name, last_name, company, title, signal` → add `industry`. Pass it as `leadIndustry` in the payload.
- **`generate-step-message/index.ts`**: Accept `leadIndustry` field in the request body. Add it to the `LeadContext` type and use it in the prompt as:
  ```
  Lead's industry: ${lead.industry || 'unknown'}
  ```
- **`CampaignDetail.tsx` (frontend regenerate)**: Pass `leadIndustry` when available from the scheduled message data.
- **`process-ai-replies/index.ts`**: Same — pass `leadIndustry` when invoking generate-step-message.

### Files changed
- `supabase/migrations/XXXX_add_industry_to_contacts.sql` (new)
- `supabase/functions/signal-keyword-posts/index.ts` (store industry on insert)
- `supabase/functions/generate-step-message/index.ts` (rewrite prompt, accept leadIndustry)
- `supabase/functions/process-campaign-followups/index.ts` (pass industry)
- `supabase/functions/process-ai-replies/index.ts` (pass industry)
- `src/pages/CampaignDetail.tsx` (pass industry on regenerate)

### What the lead experiences (before → after)

**Before** (signal-only):
> "You liked Pangea's post about tech staffing. We help companies find warm leads through intent signals. Curious?"

**After** (signal + role + industry aware):
> "You liked Pangea's post about tech staffing. Running sales at a logistics company means your team probably wastes hours chasing cold lists instead of people already looking. Worth a quick look?"

