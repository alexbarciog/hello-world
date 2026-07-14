
## Goal
Let each user connect their own sending mailbox — Gmail/Google Workspace via OAuth, or any custom domain via SMTP — and have campaign emails (`execute-email-step`) sent from that mailbox instead of the shared Resend `onboarding@resend.dev` / `no-reply@intentsly.com` sender.

## UX (Integrations page)
Add a new "Email accounts" section on `src/pages/Integrations.tsx`, styled to match the existing CRM/Calendars cards:

- **Gmail / Google Workspace** card → "Connect" button opens Google OAuth (App User Connector, `google_mail` connector, scope `gmail.send`). Once connected, shows connected email + Disconnect. Marked as default sender.
- **Custom email (SMTP)** card → "Connect" opens a dialog collecting: from email, from name, SMTP host, port, username, password, TLS toggle. On save we verify credentials via an edge function (test connection) before storing.
- Only one account can be marked "Default sender" at a time; per-campaign step can still override.

## Data model (one migration)
New table `public.email_accounts`:
- `id uuid pk`, `user_id uuid`, `organization_id uuid`
- `provider text` ('gmail' | 'smtp')
- `from_email text`, `from_name text`
- `is_default bool`
- `smtp_host`, `smtp_port int`, `smtp_username`, `smtp_password_encrypted text`, `smtp_secure bool` (null for gmail)
- `gmail_connected_at timestamptz` (gmail token lives in App User Connector storage, not this table)
- `verified_at`, `last_error`, timestamps

RLS: user can CRUD own rows (scoped by `user_id` / org membership). Standard GRANTs. Unique partial index enforcing one default per user.

SMTP passwords stored encrypted using `pgsodium`/`vault` OR a symmetric key held in edge function secret (`EMAIL_ACCOUNT_ENCRYPTION_KEY`, generated via `generate_secret`). Plan: use edge-function-side AES-GCM with the generated key — DB just stores ciphertext + iv.

## Backend

**App User Connector setup**
- Call `connector_app_user--list_connectors` → `google_mail`, then `connect_client` so the workspace has a Google OAuth client wired to the connector gateway. Follow `google_mail-connector-app-user-setup` (scopes: `openid`, `email`, `profile`, `https://www.googleapis.com/auth/gmail.send`).

**New edge functions**
1. `email-account-connect-gmail` — starts App User OAuth flow (`connectAppUser`), on callback stores `{ provider: 'gmail', from_email }` in `email_accounts`.
2. `email-account-save-smtp` — validates SMTP creds by opening a connection (use `denomailer` from `https://deno.land/x/denomailer`), encrypts password, upserts row.
3. `email-account-send-test` — sends a test email to the user's own address using the stored account.
4. `email-account-disconnect` — deletes row (and disconnects app-user connection for gmail).

**Update `execute-email-step`**
- Before sending, resolve the sender:
  1. If the campaign step has an explicit `email_account_id` → use it.
  2. Else use the campaign owner's default `email_accounts` row.
  3. Else fall back to current Resend behavior (unchanged) so existing campaigns keep working.
- Branch on `provider`:
  - `gmail` → call Gmail API `users/me/messages/send` via connector gateway (`callAsAppUser`, connectorId `google_mail`), base64url-encoded RFC 2822 message (subject, from, to, html body). Handle 403 insufficient scope by writing `skip_reason='gmail_scope_missing'`.
  - `smtp` → decrypt password, send via `denomailer` SMTPClient.
  - fallback → existing Resend path.
- On send failure, mark `scheduled_messages.status='failed'` with provider error (already the pattern).

## Frontend

- `src/pages/Integrations.tsx`: add `EmailAccountsSection` component with the two cards, wired to a `useEmailAccounts` hook (`supabase.from('email_accounts')`).
- New `src/components/integrations/ConnectSmtpDialog.tsx` — form + "Send test email" button.
- New `src/components/integrations/GmailConnectButton.tsx` — invokes `email-account-connect-gmail` and handles the popup.
- Campaign create wizard (`CreateCampaignWizard.tsx`) email step: add a "Send from" dropdown listing connected accounts (default preselected). Non-blocking — if none connected, keep current behavior and show a hint linking to `/integrations`.

## Out of scope
- Inbound email / reply parsing (Gmail history API, IMAP) — not touched now; Reply Guard still relies on LinkedIn Unipile for LI, and existing Resend transactional emails remain as-is.
- Microsoft Outlook OAuth — can be added later using `microsoft_outlook` connector following the same pattern.

## Rollout order
1. Migration + secrets (`generate_secret EMAIL_ACCOUNT_ENCRYPTION_KEY`).
2. `connect_client` for `google_mail` App User Connector.
3. Edge functions (connect/save/test/disconnect) + update to `execute-email-step`.
4. Integrations page UI + campaign wizard dropdown.
5. Manual test: connect Gmail → send test → run a live email step in a campaign; same for SMTP with a personal domain.
