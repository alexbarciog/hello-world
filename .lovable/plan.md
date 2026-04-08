

# Make All Campaign Steps Use AI-Personalized Messages

## Problem
Only Step 2 (first message after connection) uses the AI engine (`generate-step-message`) with full lead intelligence (role, industry, signal). Steps 3 and 4 fall back to generic templates from `generate-outreach-messages` with simple placeholder substitution (`{{first_name}}`, `{{company}}`). This means follow-up messages ignore the lead's background entirely.

**Root cause**: In `generate-outreach-messages/index.ts`, only Step 2 gets `ai_icebreaker: true`. Steps 3 and 4 are set to false, so `process-campaign-followups` uses the raw template text instead of calling the AI.

## Solution

Set `ai_icebreaker: true` on ALL message steps (Steps 2, 3, and 4) so every message goes through `generate-step-message` with full lead context.

### Changes

**1. `supabase/functions/generate-outreach-messages/index.ts`**
Change the normalized steps so Steps 3 and 4 also have `ai_icebreaker: true`:
```
// Step 3
{ type: 'message', message: steps[2]?.message || '', delay_days: ..., ai_icebreaker: true }
// Step 4
{ type: 'message', message: steps[3]?.message || '', delay_days: ..., ai_icebreaker: true }
```

**2. `src/components/campaigns/CreateCampaignWizard.tsx`**
Update the `DEFAULT_WORKFLOW` fallback to also set `ai_icebreaker: true` on all message steps, so even if the AI generation fails, the fallback still triggers per-lead AI generation at send time.

### What changes for the user
- Steps 3 and 4 will now be generated fresh for each lead at send time, using the same role-aware, industry-aware prompt that already powers Step 2
- Follow-ups will reference the lead's actual title, industry, and previous messages instead of using generic templates
- The template messages shown in the campaign editor become preview-only placeholders (they always were for Step 2, now consistently so for all steps)

### Files changed
- `supabase/functions/generate-outreach-messages/index.ts` (add `ai_icebreaker: true` to steps 3 and 4)
- `src/components/campaigns/CreateCampaignWizard.tsx` (update DEFAULT_WORKFLOW fallback)

