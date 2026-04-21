

## Plan: Two-Stage Company-Level ICP Match (High Precision only)

### Goal
For **High Precision** signal agents, fetch the lead's employer LinkedIn page and validate it against the agent's ICP using a **two-stage OR gate**:

1. **Stage 1 — Industry match (cheap, deterministic).** If the company's LinkedIn industry matches one of `icp.industries` → **accept immediately**, skip AI.
2. **Stage 2 — AI ICP match (only on industry miss).** Compare the company's `{ name, industry, description }` against the agent's `ideal_lead_description` + `business_context`. Accept if AI says the company fits. Reject otherwise.

Also persist the verified `company` and `industry` on the contact row so downstream UI shows real data instead of empty fields.

### Where it plugs in

```text
For each candidate lead (HIGH_PRECISION agents only):
  1. Existing pre-filter (headline/role)         ← unchanged
  2. Existing AI intent / perfect-lead gate      ← unchanged
  3. NEW: enrichLeadCompany(profile)             ← Unipile /linkedin/company/{slug}
       └─ soft-fail → fall back to current behavior, do not reject
  4. NEW: Stage 1 — fuzzy industry match
       ├─ MATCH  → accept, skip Stage 2 (no AI cost)
       └─ MISS   → Stage 2
  5. NEW: Stage 2 — AI company-vs-ICP-description check
       ├─ matches_icp = true  → accept
       └─ matches_icp = false → reject (diag.company_icp_mismatch++)
  6. insertContact(... enriched company, industry ...)
```

Discovery-mode agents skip steps 3–5 entirely (zero new cost, zero behavior change).

### Changes

**1. New helper — `enrichLeadCompany(profile, accountId, cache)`** (inline in each signal function)
- Extract company slug from the Unipile profile (`current_company.public_id` / `linkedin_url` / `name`).
- Call `GET /api/v1/linkedin/company/{slug}?account_id=...` (same endpoint already used by `signal-competitor`).
- Cache by slug in a `Map<string, CompanyData|null>` per run (companies repeat across leads).
- Return `{ name, industry, description, slug }` or `null` on failure.
- Soft-fail: Unipile errors / unknown company → return `null`, fall back to old behavior, increment `diag.company_enrichment_failed`.

**2. New helper — `fuzzyIndustryMatch(companyIndustry, icpIndustries)`**
- Lowercase + token-overlap match (e.g. "Computer Software" matches "Software" / "SaaS / Software").
- Returns `true` on any token overlap or substring hit, `false` otherwise.
- Pure function, no AI cost.

**3. New AI helper — `companyMatchesICP(companies[], icp, idealLeadDescription, businessContext)`**
- Single batched call (batch size ~10 companies) — only invoked for companies that **failed** Stage 1.
- Tool schema: `{ matches_icp: boolean, reason: string }` per company.
- Prompt receives: agent's `icp.industries` (as context), `ideal_lead_description`, `business_context`, plus each company's `{ name, industry, description }`.
- Default to **accept** when AI is unsure (consistent with existing perfect-lead gate philosophy).

**4. Wire into the four signal functions (HIGH_PRECISION branch only)**
- `signal-keyword-posts/index.ts` → after existing perfect-lead gate, before `insertContact`.
- `signal-post-engagers/index.ts` → in both `runOwnPostEngagers` and `runProfileEngagers` paths, after existing competitor + perfect-lead gates.
- `signal-hashtag-engagement/index.ts` → after existing AI relevance filter.
- `signal-competitor/index.ts` → before its existing `insertContact` calls in both engagers + followers branches.

All four functions: when enrichment succeeds, pass `{ name, industry }` into `insertContact` so `contacts.company` and `contacts.industry` get the **real** values from the company page (not the often-empty profile fields).

**5. `insertContact` signature update (all 4 functions)**
- Accept optional `enrichedCompany?: { name, industry }`.
- When present, persist `contacts.company = enrichedCompany.name`, `contacts.industry = enrichedCompany.industry`. Otherwise fall back to current behavior.

**6. Diagnostics**
- Add three counters to the diagnostic JSON on `signal_agent_tasks` (alongside existing `perfect_lead_mismatch`):
  - `company_enrichment_failed` — Unipile lookup failed
  - `company_industry_matched` — passed Stage 1 (cheap path)
  - `company_icp_mismatch` — failed Stage 2 (AI rejected)

### Cost & safety
- Discovery agents: **zero new calls**, **zero new AI tokens**.
- High-precision agents:
  - **+1 Unipile call per unique company per run** (cached).
  - **AI call ONLY when Stage 1 misses** — most leads in a tightly-scoped agent will share industries that pass Stage 1, so AI cost stays low.
  - Batched at ~10 companies per AI call to keep token overhead flat.
- Soft-fail on Unipile errors → never blocks a lead due to infra hiccups.
- Default-accept on AI uncertainty → no false negatives on edge cases.

### Backward compatibility
- No DB schema changes — `contacts.company` and `contacts.industry` already exist.
- Discovery-mode agents and existing leads behave exactly as today.
- If `ideal_lead_description` is empty, Stage 2 falls back to a lighter prompt comparing only against `icp.industries` + `business_context`.

### What stays the same
- All existing pre-filters, AI gates, perfect-lead check, exclusion logic, deduplication.
- Unipile API key, account_id passing, rate-limit handling.
- Frontend / `CreateAgentWizard` / contacts table UI.

### Out of scope
- Reddit / X signal agents (different profile shape; can mirror later).
- Backfilling already-saved contacts (only applies to new leads going forward; one-off backfill script can ship separately if requested).
- Cross-run company cache table (defer until we measure repeat rate).

