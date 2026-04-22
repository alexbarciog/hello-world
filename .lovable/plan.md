

# Import leads from Sales Navigator (paste search URL)

Add an **Import** button in the Contacts page header that opens a dialog where the user pastes a Sales Navigator **lead search URL** and picks (or names) a list. The backend uses Unipile's LinkedIn Sales Navigator search to walk pages of results and insert each profile as a contact.

## UX

**New "Import" button** in the Contacts page header (next to the existing actions on line 500), Plus icon + label. Visible only on the `all` tab so it doesn't clutter filtered views.

**Dialog: "Import from Sales Navigator"**
1. Big textarea for the Sales Nav search URL, with a one-line example placeholder (`https://www.linkedin.com/sales/search/people?...`).
2. Helper text: "Paste a Sales Navigator lead search URL. We'll import up to 500 leads from the first ~20 result pages."
3. Slider/select: **Max leads to import** — 50 / 100 / 250 / 500 (default 100). Caps protect Unipile budget.
4. **Destination list** — a select listing the user's existing lists + an "Create new list…" option that reveals a name input. Default = create new with auto-name `Sales Nav — <today>`.
5. URL validation: must start with `https://www.linkedin.com/sales/search/` (regex). Error inline if not.
6. Primary button: **Import** (disabled while running, shows spinner + "Importing… X / Y").
7. On success: toast `Imported N leads (skipped M duplicates)`, close dialog, refetch contacts.

The dialog is non-blocking on background — once it returns, results show in the table immediately.

## Backend: new edge function `import-sales-nav`

Lives in `supabase/functions/import-sales-nav/index.ts`. Registered in `supabase/config.toml` with `verify_jwt = false` (we validate the JWT in code, like other Unipile-touching functions).

**Input** (JSON body):
- `search_url` (string, required) — Sales Nav search URL
- `max_leads` (number, default 100, max 500)
- `list_id` (uuid, optional) — existing list to add to
- `new_list_name` (string, optional) — create this list and add leads to it

**Flow**:
1. Validate JWT, resolve `user_id` + `current_organization_id` from `profiles`.
2. Look up the org's `unipile_account_id` from `organizations`.
3. If `new_list_name` is provided, insert a row into `lists` and use that id; else use `list_id`.
4. Call Unipile classic-style search with the Sales Navigator API:
   - `POST https://${UNIPILE_DSN}/api/v1/linkedin/search?account_id=${account_id}`
   - body: `{ api: 'sales_navigator', url: search_url, limit: 50 }` (Unipile resolves the search URL server-side and returns paginated results).
5. Page through results using the returned `cursor` until either `max_leads` reached or no `cursor`. Hard cap at 20 pages.
6. For each profile returned (`items[]`):
   - Skip if `linkedin_profile_id` already exists in `contacts` for this `organization_id` (single batched `select` per page).
   - Insert into `contacts` with:
     - `first_name`, `last_name`, `title` (headline), `company` (current company name), `industry` (if present), `linkedin_url` (built from `public_id`/`public_identifier`), `linkedin_profile_id`
     - `relevance_tier: 'cold'`, `approval_status: 'auto_approved'`, `signal: 'Imported from Sales Navigator'`, `signal_a_hit: true`, `ai_score: 1`
     - `user_id`, `organization_id`
   - On success, insert a `contact_lists` row linking the new contact to the chosen list.
7. Track `inserted` and `duplicates` counters; return them in the response.

**Auth header**: standard `Authorization: Bearer <jwt>`. We use `createClient(SUPABASE_URL, SERVICE_ROLE_KEY)` server-side after JWT verification to bypass RLS for the bulk insert.

**Rate-friendly**: 250 ms delay between Unipile pages; 30 s overall timeout via `AbortController`.

## Files

**New**:
- `supabase/functions/import-sales-nav/index.ts` — edge function
- `src/components/contacts/ImportSalesNavDialog.tsx` — the dialog component

**Modified**:
- `src/pages/Contacts.tsx` — add `Import` button in header (line ~500), wire `showImport` state + dialog mount; on success call `fetchData()`
- `supabase/config.toml` — register `[functions.import-sales-nav]` with `verify_jwt = false`

## Out of scope

- CSV upload, profile-URL list paste, AI scoring on import, email enrichment — explicitly skipped per your choices.
- Deduping across organizations (we only dedupe within the current org).
- Resuming an interrupted import — single-shot only; user can re-paste the same URL and dedup will skip already-imported leads.

