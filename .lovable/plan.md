

## Lookalike Leads — Find decision-makers from your best clients

Add a new flow in **Contacts** that lets the user paste 3–4 LinkedIn profiles of their best customers, then automatically:
1. Profile those seed leads (industry, company size, role pattern, AI-summarised "why they're a fit")
2. Find similar companies on LinkedIn
3. Inside each company, return only the top decision-makers
4. Save them as new contacts with a per-lead AI-generated signal

---

### 1. UI — `Contacts.tsx`

Add a new button next to "Import from Sales Navigator":

```
[ + Find Lookalikes ]   [ ↓ Import from Sales Navigator ]
```

New dialog `FindLookalikesDialog.tsx` with 3 steps:

**Step 1 — Seed leads** (3 to 4 LinkedIn profile URLs)
- Textarea with one URL per line (validated as `linkedin.com/in/...`)
- Min 3, max 4

**Step 2 — Targeting filters** (auto-prefilled from Step 1, all editable)
- Industries (multi-select, prefilled from seed leads' industries)
- Company size: 1-10, 11-50, 51-200, 201-500, 501-1k, 1k-5k, 5k+ (multi)
- Locations (countries, multi)
- Decision-maker seniority: `Owner / Founder / C-level / VP / Director / Head of` (multi, default = all)
- Decision-maker functions: `Sales / Marketing / Operations / Engineering / Product / Finance / HR / Other` (multi)
- Max companies: 10 / 25 / 50 / 100 (default 25)
- Max decision-makers per company: 1 / 2 / 3 (default 2)
- Destination list (existing or new — same UX as Sales Nav dialog)
- Signal mode toggle:
  - `Industry signal` → e.g. *"Works in Marketing & Advertising (lookalike of [Seed Name])"*
  - `AI-generated signal` → per-lead AI sentence based on their LinkedIn headline/about + the user's offer

**Step 3 — Review & launch**
- Shows summary, expected lead count = `companies × per_company`, "Find leads" CTA
- Submits to new edge function `find-lookalike-leads`

After submit: dialog stays open with a progress strip ("Profiling seeds → Searching companies → Scraping decision-makers"), polls `lookalike_runs` row, then closes with a toast and refreshes contacts.

---

### 2. Edge function — `find-lookalike-leads`

Long-running orchestrator (90s budget, same pattern as `import-sales-nav`).

**Input:** `seed_urls[]`, filters object, `list_id` or `new_list_name`, `signal_mode` ('industry' | 'ai').

**Pipeline:**

1. **Seed enrichment** — for each seed URL, resolve `public_id` then call Unipile `GET /api/v1/users/{id}` to get `headline`, `industry`, `company`, `summary`. Persist into `lookalike_seeds` rows for traceability.

2. **ICP synthesis** — call Lovable AI Gateway (`google/gemini-2.5-flash`) with the seed profiles + the user's offer (pulled from `organizations.company_description` / `services`) to produce:
   - canonical industry list (matched to user-selected ones)
   - role keyword list per function (e.g. Marketing → "CMO", "Head of Growth", "Demand Gen Lead")
   - one-sentence "why this is your ICP" string

3. **Company search** — Unipile `POST /api/v1/linkedin/search` with `api: 'classic'`, `category: 'companies'`, applying:
   - `keywords` from synthesized industries
   - `company_size`, `location` filters
   - paginate via `cursor` until `max_companies` reached
   - dedupe against `contacts.company` already in the org

4. **Decision-maker extraction per company** — for each company, Unipile `POST /api/v1/linkedin/search` with `api: 'classic'`, `category: 'people'`, filters:
   - `company` = current company id
   - `seniority` ∈ user-selected (mapped to Unipile codes: `cxo`, `vp`, `director`, `owner`, `partner`, `senior`)
   - `function` ∈ user-selected (mapped to Unipile function codes)
   - sort by seniority rank (Owner > C-level > VP > Director > Head of)
   - keep top `max_per_company`

5. **Signal generation** — per resulting lead:
   - if `signal_mode = 'industry'`: `"Works in {industry} — lookalike of {seed first name}"`
   - if `signal_mode = 'ai'`: batch call Lovable AI Gateway with `{lead headline, lead company, user offer, matched seed}` → 1-sentence signal (≤ 140 chars). Batched 10 leads per AI call to control cost.

6. **Insert** into `contacts` (mirrors `import-sales-nav` insert shape):
   - `signal` = generated string
   - `signal_a_hit = true`, `ai_score = 7` (mid-tier so they go to "warm")
   - `relevance_tier = 'warm'`, `approval_status = 'auto_approved'`
   - `list_name` = new list name, plus `contact_lists` join
   - dedupe by `linkedin_profile_id` and `linkedin_url` within the org

7. Return `{ inserted, duplicates, companies_scanned, decision_makers_found, list_id }`.

Add `[functions.find-lookalike-leads]` with `verify_jwt = false` in `supabase/config.toml` (auth validated in code via `getClaims`, same pattern as `import-sales-nav`).

---

### 3. Database

New table `lookalike_runs` (lightweight, for progress polling and history):

```
id uuid pk
user_id uuid
organization_id uuid
status text       -- 'profiling' | 'searching_companies' | 'extracting_dms' | 'completed' | 'failed'
seed_urls jsonb
filters jsonb
inserted int default 0
duplicates int default 0
companies_scanned int default 0
list_id uuid
error text
created_at timestamptz default now()
updated_at timestamptz default now()
```

RLS: only members of the run's organization can select; only owner can insert. Triggers: existing `autofill_organization_id` and `handle_updated_at`.

No schema change to `contacts` — reuse existing columns.

---

### 4. Memory

After implementation, save `mem://features/contacts/lookalike-leads` documenting:
- Trigger UI in Contacts toolbar
- Pipeline stages
- Default `relevance_tier = warm`, `ai_score = 7`
- Signal modes (industry vs AI)
- Limits: max 4 seeds, max 100 companies, max 3 DMs/company

---

### Files touched

| File | Change |
|---|---|
| `src/pages/Contacts.tsx` | Add button + dialog wiring |
| `src/components/contacts/FindLookalikesDialog.tsx` | New 3-step dialog |
| `supabase/functions/find-lookalike-leads/index.ts` | New orchestrator |
| `supabase/config.toml` | Add `verify_jwt = false` for the function |
| `supabase/migrations/<ts>_lookalike_runs.sql` | New table + RLS + triggers |
| `mem://features/contacts/lookalike-leads` | New memory file + index update |

