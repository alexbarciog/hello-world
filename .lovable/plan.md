## Goal

Two changes to how AI SDR messages are generated in campaign workflows:

1. **When a step has a custom prompt, that prompt becomes the primary directive** — the built-in 6-part cold-outreach template is bypassed. Only universal safety rails (greeting, hard-banned words/phrases, length ceiling, no emojis/em-dashes, ends with `?` for outreach, language) remain.
2. **`generate-step-message` gets the lead's full LinkedIn profile** (headline, about, current + past experience, education, location) so the AI can reference concrete details instead of just title/company/signal.

## Behavior spec

### Custom prompt priority
- In `supabase/functions/process-campaign-followups/index.ts`, stop concatenating `campaign.custom_training + step.step_instructions` into `customTraining`. Send them as two separate fields: `customTraining` (campaign-wide) and `stepCustomPrompt` (step-level).
- In `generate-step-message`, when `stepCustomPrompt` is present and non-empty for stepNumber ≥ 2:
  - Build a **custom-mode prompt** instead of `buildOutreachPrompts`. The system prompt contains: lead context block, full LinkedIn profile block, campaign context (short), the step's custom prompt verbatim as the *primary* instructions, then a short "universal rails" section (greeting `Hey {first},`, hard-banned words list, no emojis/em-dashes/semicolons, max ~70 words, must end with `?`, language).
  - Skip the 6-part structural rewrite guard (banned-words + length + ending-question guards still run, but the "missing signal reference" guard is dropped since the custom prompt may not want signal-anchored openers).
- When `stepCustomPrompt` is empty, current behavior is unchanged.

### Full LinkedIn profile context
- Add nullable columns on `public.contacts`:
  - `linkedin_headline text`
  - `linkedin_about text`
  - `linkedin_experience jsonb` (array of `{title, company, start, end, description}`)
  - `linkedin_education jsonb`
  - `linkedin_location text`
  - `linkedin_profile_fetched_at timestamptz`
- New helper edge function `enrich-linkedin-profile` (or inline helper in `_shared/`) that, given a `contact_id`, calls Unipile `GET /users/{provider_id}` using the campaign owner's `unipile_account_id`, maps the response, and updates the row. Cached: skip if `linkedin_profile_fetched_at` is within 30 days.
- In `process-campaign-followups`, before invoking `generate-step-message`, call the enrichment helper (best-effort; failures are logged and generation proceeds without profile).
- `generate-step-message` accepts new optional payload fields (`leadHeadline` already used; add `leadAbout`, `leadExperience` [array], `leadEducation`, `leadLocation`). Both the default and custom-mode prompts include a `===== LEAD PROFILE =====` block summarizing them (experience trimmed to top 3 roles, about trimmed to ~600 chars).

### Callers touched
- `process-campaign-followups/index.ts` — pass new fields, split custom prompts, invoke enrichment.
- `generate-step-message/index.ts` — new custom-mode branch, new profile block, guard adjustments.
- Migration for the new contact columns + GRANTs unchanged (existing table).

## Out of scope
- Conversational reply path (`isConversationalReply`) untouched.
- Email step / `execute-email-step` custom prompt priority — same idea could apply, but only address if you also want it there (say the word).
- Backfilling profile data for existing contacts — will populate lazily on next generation.

## Technical notes
- Unipile endpoint: `GET {UNIPILE_DSN}/api/v1/users/{provider_id}?account_id={unipile_account_id}` returns `headline`, `summary`/`about`, `work_experience[]`, `education[]`, `location`. Same auth pattern already used in `extract-linkedin-post-leads`.
- Custom-mode system prompt skeleton:
  ```
  You are writing a LinkedIn {message|email} in an outreach sequence.
  ===== LEAD =====
  {name, title, company, industry, signal}
  ===== LEAD LINKEDIN PROFILE =====
  {headline, about, top 3 experiences, education, location}
  ===== CAMPAIGN CONTEXT =====
  {companyName, valueProposition (short)}
  ===== YOUR PRIMARY INSTRUCTIONS (follow these exactly) =====
  {stepCustomPrompt verbatim}
  ===== UNIVERSAL RAILS (never violate) =====
  - Start with "Hey {first},"
  - Language: {language}
  - Max 70 words. No emojis, em-dashes, semicolons, bullet points.
  - Banned words: leverage, utilize, synergy, ... (full list)
  - Must end with a question mark.
  Return ONLY the message body.
  ```
