# Add "Send Email" step to Campaign Workflow

A new workflow step type that sends a real email (via Resend) to leads who have an email address on file. Leads without an email are automatically skipped. Sits alongside existing LinkedIn steps — no changes to invitation/message/comment/visit behavior.

## 1. Workflow builder UI (`src/pages/CampaignDetail.tsx`)

**Add step picker** — new option in the "Add new step" dialog:
- Icon: `Mail` (lucide)
- Label: "Send Email"
- Description: "Send a personalised email to leads that have an email on file. Leads without an email are skipped."
- Color: `hsl(25 95% 53%)` (orange, matches email accent)

**Step type:** `"email"` added to `newStepType` union and to `workflow_steps` schema:
```
{ type: "email", subject: string, message: string, ai_sdr: boolean, delay_hours: number, custom_instructions?: string }
```

**Edit panel** for email step:
- Subject line input (required, personalisation vars supported: `{first_name}`, `{company}`, `{signal}`)
- Body textarea (or "AI SDR Mode" toggle — same pattern as existing message step; when AI SDR is on, body is generated per-lead)
- Delay control (reuses existing delay UI)
- Custom instructions field (when AI SDR on)

**Step card rendering** in the workflow visualization:
- Same visual style as Send Message card, but with Mail icon + orange accent
- Shows metrics: `X contact(s) with email · Y sent · Z skipped (no email)`
- "View Contacts" and "Edit" / "Instructions" buttons (parity with message step)

## 2. Execution (`supabase/functions/process-campaign-followups/index.ts`)

Add a branch for `step.type === "email"`:
1. Load contact; if `contact.email` is null/empty → mark scheduled_message as `skipped` with reason `"no_email"` and continue to next step.
2. If AI SDR mode: call existing `generate-step-message` (add `channel: "email"` param so it produces subject + body suitable for email, longer/more formal than LI DM).
3. Send via existing `send-email` edge function (Resend). From address: verified sender configured per workspace (fallback `onboarding@resend.dev` for tests).
4. On success: increment `messages_sent`, log to `scheduled_messages` with `channel: "email"`, `status: "sent"`.
5. On failure: `status: "failed"` with error text.
6. Respect Reply Guard: if lead already replied on any channel, halt subsequent email steps too.

## 3. AI SDR generation (`supabase/functions/generate-step-message/index.ts`)

Extend to accept `channel: "linkedin" | "email"`. For email:
- Generate `{ subject, body }` JSON
- Body: 4–6 sentences, still peer-to-peer, banned-terms rules preserved
- Return both fields so caller can pass them to Resend

## 4. Scheduled tab

Scheduled messages of `channel: "email"` render with a Mail icon and show subject + body preview. Editable pre-send, read-only after sent (existing pattern).

## 5. Contacts view (per step)

"View Contacts" for an email step filters to contacts whose email is populated (or shows both, with a "Skipped (no email)" badge on those without).

## 6. Data / secrets

- Reuse existing `RESEND_API_KEY` secret (already configured).
- `scheduled_messages` table already exists; add `channel` and `subject` handling in code — if columns don't exist, plan a migration to add `channel text default 'linkedin'` and `subject text`.
- No new tables required.

## Files touched

- `src/pages/CampaignDetail.tsx` — add option, edit panel, step card, scheduled/contacts filters
- `supabase/functions/process-campaign-followups/index.ts` — email branch + skip-on-no-email
- `supabase/functions/generate-step-message/index.ts` — channel-aware output
- `supabase/functions/send-email/index.ts` — already exists, reused as-is
- Migration (only if `scheduled_messages.channel`/`subject` are missing)

## Out of scope

- No changes to existing LinkedIn step types, delays, Reply Guard, or Conversational AI logic.
- No inbox / reply parsing for email (LinkedIn Unibox stays LinkedIn-only for now).
- No domain verification UI — user configures Resend sender via existing settings/secrets.

## Questions before build

1. **AI SDR by default for the email step, or manual template by default?** (Message step defaults to AI SDR; I'd mirror that.)
2. **Sender address**: use a single global verified sender for now, or add a per-campaign "From" field in this step's config?
3. **Reply detection for email**: skip for v1 (email steps only send, don't listen), or wire a Resend inbound webhook now?
