

# Share leads via link → public read-only Contacts clone with login wall

Add a **Share** button to the Contacts page selection bar that creates a share token covering the selected leads and copies a public link like `/shared/leads/<token>`. Anyone with the link gets a Contacts-page clone (sidebar + table) showing only those leads. All interactions (sidebar nav, LinkedIn click, signal click) trigger a login/signup popup. After signup, the shared leads are automatically copied into the new user's organization.

## Database

New migration creates two tables.

**`shared_lead_links`** — one row per share
- `id uuid pk`, `token text unique not null default encode(gen_random_bytes(24), 'hex')`
- `created_by uuid not null` (sharer's user_id), `organization_id uuid not null`
- `name text` (auto: "Shared by <name> · 12 leads"), `lead_count int not null`
- `expires_at timestamptz` (default `now() + 30 days`), `revoked boolean default false`
- `created_at timestamptz default now()`
- RLS: owner can `select/update/delete` own rows; service role full access. **No public select** — public access goes through the SECURITY DEFINER RPC below.

**`shared_lead_link_contacts`** — join table
- `id uuid pk`, `link_id uuid not null`, `contact_id uuid not null`, `created_at timestamptz default now()`
- Unique `(link_id, contact_id)`
- RLS: service role only. Reads happen via RPC.

**RPC `get_shared_leads(_token text)`** — `SECURITY DEFINER`, returns the masked, read-safe contact rows for a valid (non-revoked, non-expired) token. Columns: `id, first_name, last_name, title, company, industry, linkedin_url, signal, signal_post_url, ai_score, signal_a_hit, signal_b_hit, signal_c_hit, relevance_tier, lead_status, imported_at, list_name`. Excludes `email`, `intent_insights`, `personality_prediction`, `linkedin_profile_id`, internal IDs unrelated to display. Granted `EXECUTE` to `anon` and `authenticated`.

**RPC `claim_shared_leads(_token text)`** — `SECURITY DEFINER`, callable by `authenticated`. Validates the token, then for each linked contact inserts a copy into `contacts` scoped to the caller's `current_organization_id` (skipping duplicates by `linkedin_url`), and assigns them to a new list named "Shared with me · <date>". Returns `{ inserted: int, list_id: uuid }`.

## Routes & files

**New route** `/shared/leads/:token` → `src/pages/SharedLeads.tsx` (no `AuthGuard`). Renders inside a new `PublicLayout` (sidebar clone + content area).

**New components**
- `src/components/shared/PublicDashboardLayout.tsx` — visual clone of `DashboardLayout` (logo, nav items, pricing card, help/support). Every nav item, every bottom button, and the user slot all call `requireAuth()` instead of navigating. Bottom user slot is replaced by a single **"Login / Sign up"** button. No `useSubscription`, no `useAdminCheck`, no Supabase user fetch.
- `src/components/shared/AuthPromptDialog.tsx` — shadcn `Dialog` with copy "Create a free Intentsly account to view this lead's profile and signal." Two buttons: **Sign up free** → `/register?redirect=/shared/leads/<token>&claim=1`, **Log in** → `/login?redirect=/shared/leads/<token>&claim=1`. Stores `intentsly_pending_share_token` in `localStorage` so the claim survives the OAuth/email round-trip.
- `src/components/contacts/ShareLeadsDialog.tsx` — opens from the Contacts selection bar; calls `supabase.functions.invoke('create-shared-lead-link', { selected_ids })`, shows the resulting URL with a Copy button.

**Modified**
- `src/pages/Contacts.tsx` — add a **Share** button (Share2 icon) in the desktop selection bar at line ~545, visible only when `selectedIds.size > 0`. Wires `showShareDialog` state.
- `src/App.tsx` — add `<Route path="/shared/leads/:token" element={<SharedLeads />} />` (no guard).
- `src/pages/Login.tsx` and `src/pages/Register.tsx` — read `redirect` and `claim` from URL params; after successful auth, if `claim=1` and a `pending_share_token` is present, invoke `claim-shared-leads` then `navigate(redirect)`. Existing session restore (`localStorage`-backed Supabase auth) already keeps users logged in across reloads, so requirement #10 is satisfied.

## Edge functions

- **`create-shared-lead-link`** (`verify_jwt = false`, JWT-validate in code): body `{ contact_ids: uuid[], expires_in_days?: number }`. Verifies caller owns each contact (org check), inserts a `shared_lead_links` row + N `shared_lead_link_contacts` rows, returns `{ token, url }`.
- **`claim-shared-leads`** (`verify_jwt = false`, JWT-validate in code): body `{ token }`. Calls the `claim_shared_leads` RPC and returns its result.

Public read of leads on the share page does **not** need an edge function — the page calls `supabase.rpc('get_shared_leads', { _token })` directly with the anon key. The RPC enforces token validity.

## SharedLeads page behavior

- On mount: `supabase.rpc('get_shared_leads', { _token })`. If empty/error → show "This share link is invalid or has expired" card.
- Renders the **same table layout** as `/contacts` (avatar + initials, name, title, company, signal pill, AI score, tier badge, list name, imported time-ago). Reuses `Contact` type, `avatarColor`, `getInitials`, `timeAgo`, `LinkedInIcon`. **No** Approve/Reject, Book, Delete, AI Insights, Stop SDR, or Import buttons. **No** filters/tabs/pagination toolbar — single flat list.
- Behavior:
  - LinkedIn icon click → if logged in, `window.open(linkedin_url)`; else open `AuthPromptDialog`.
  - Signal pill click → same gate. When logged in, opens `signal_post_url` in a new tab.
  - Any sidebar nav button → `AuthPromptDialog`.
  - Bottom "Login / Sign up" button → `/login?redirect=...&claim=1`.
- Banner at top: "Shared with you · {N} leads. Sign up to save them to your account." with a **Save to my account** CTA (visible whether logged in or not). Logged-in users get an inline "Save to my account" that calls `claim-shared-leads` and toasts "Saved to your Contacts under list 'Shared with me · …'".

## Auth + claim flow (requirements 9 & 10)

1. User clicks **Sign up free** in the prompt → we set `localStorage.intentsly_pending_share_token = token` and navigate to `/register?redirect=/shared/leads/<token>&claim=1`.
2. After `signUp` succeeds, Register reads `claim=1`, invokes `claim-shared-leads` with the stored token, clears the localStorage flag, then navigates to `redirect`.
3. Supabase auth already persists the session in `localStorage` (`persistSession: true`, `autoRefreshToken: true` in `src/integrations/supabase/client.ts`). So on next visit, the `SharedLeads` page sees the user as logged in and skips the auth gate. No additional work needed for "keep session active".

## Security notes

- `shared_lead_links` rows are never directly readable by anon. Token validation lives inside `get_shared_leads` and `claim_shared_leads` (SECURITY DEFINER, with `revoked = false AND (expires_at IS NULL OR expires_at > now())` guard).
- The RPC returns only display-safe columns — emails, internal IDs, AI insights, personality predictions are never exposed to anon.
- Claim RPC scopes inserts to the caller's `current_organization_id` and dedupes by `linkedin_url` to prevent abuse.
- Share token is 48 hex chars (192 bits) — unguessable.

## Out of scope

- Editing/revoking share links from a UI (DB columns exist; admin/UI later).
- Email-gated sharing (recipient email restriction).
- Mobile sidebar variant of the public layout — desktop layout reused on mobile via existing responsive classes; full mobile slide-in menu skipped.
- Analytics on link views.

