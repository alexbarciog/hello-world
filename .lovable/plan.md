

# Lightning Onboarding + In-Dashboard Setup Wizard

Slash onboarding from 6 forms to **2 screens**: scan website → see services + AI pain points → "Get Buyers". Then guide setup inside the real app via a prominent top-of-dashboard wizard.

## New onboarding flow (2 screens, ~30 seconds)

**Screen 1 — Scan Website**
- Single input: website URL.
- Big "Analyze my website" CTA. Same Firecrawl scrape as today.
- Loading state with animated steps: "Reading your site… → Identifying services… → Generating buyer pain points…".

**Screen 2 — Services & Pain Points Preview**
- Top card: company name + 1-line description (editable inline if user wants).
- Two side-by-side bento blocks:
  - **What you sell** — 3-5 service bullets (AI-extracted from site).
  - **Buyer pain points** — 3 pain points your buyers feel (AI-generated).
- Big primary CTA: **"Get Buyers →"**.
- Tiny secondary link below: "Edit later in settings".

Clicking **Get Buyers** does the minimum:
1. Create/update the user's `campaigns` row with `{ website, company_name, description, industry, language, services[], pain_points[], status: 'paused', current_step: 6 }`. No agent, no scoring, no discovery yet.
2. Set `profiles.onboarding_complete = true`.
3. `navigate('/dashboard')`.

## New AI extraction: services

New edge function **`generate-services`** (mirror of `generate-pain-points`):
- Input: `{ companyName, industry, description, markdown }` (markdown already returned from `firecrawl-scrape`).
- Lovable AI Gateway, `google/gemini-3-flash-preview`, tool-calling for `{ services: string[] }` (3-5 items, each ≤ 8 words).
- Stored on `campaigns` in a new `services text[]` column.

**Pain points** reuse the existing `generate-pain-points` function but called with no ICP (industry only), so we get reasonable results without forcing the user to define ICP.

Both edge functions are called **in parallel** from screen 1's loading transition so the preview is ready the moment scrape finishes.

## In-dashboard setup wizard (replaces QuickStartPanel)

New component `src/components/dashboard/SetupWizardBanner.tsx` — full-width hero card pinned to the top of `/dashboard`, above `SubscriptionBanner`.

Layout:

```text
┌──────────────────────────────────────────────────────────────┐
│  Set up your AI SDR — 0 of 3 done           ▓▓░░░░░░░░  33% │
│                                                              │
│  ① Connect LinkedIn         ② Create signal agent  ③ Launch │
│     Required to send invites   AI finds buyers     campaign │
│     [Connect LinkedIn →]       [disabled]          [disabled]│
└──────────────────────────────────────────────────────────────┘
```

- Three numbered cards in a row (stack on mobile).
- Each card: number circle, title, one-line desc, primary action button.
- Steps unlock sequentially. Locked cards show a small lock icon and a muted tooltip "Complete previous step first".
- When a step is `done`, its card collapses to a single line with a green check + "Done — Edit".
- When **all 3 done**, the banner collapses into a thin success bar: `✓ Setup complete — your AI SDR is live`. Dismissable with an X (saves `localStorage.intentsly_setup_dismissed`).

**Step targets:**
1. **Connect LinkedIn** → `navigate('/settings?tab=linkedin')`. Done when `profiles.unipile_account_id` is set.
2. **Create signal agent** → `navigate('/signals?create=1')`. Done when at least one row exists in `signal_agents` for the org. Signals page already has `CreateAgentWizard`; we read the `?create=1` param and auto-open it.
3. **Launch campaign** → `navigate('/campaigns?autoStart=true')` (already wired). Done when at least one campaign has `status='active'`.

Removes the right-side `QuickStartPanel` from the dashboard grid; `PerformanceChart` becomes full-width on the row it shared.

## Files

**New**
- `src/pages/Onboarding.tsx` — replaced with 2-screen flow (keep file, replace contents). Old multi-step components stay on disk untouched (unused) so we don't risk breaking drafts.
- `src/components/onboarding/Step1Scan.tsx` — URL input + scan trigger.
- `src/components/onboarding/Step2Preview.tsx` — services + pain points preview + Get Buyers CTA.
- `src/components/dashboard/SetupWizardBanner.tsx` — the new top-of-dashboard 3-step wizard.
- `supabase/functions/generate-services/index.ts` — AI services extractor.

**Modified**
- `src/contexts/OnboardingContext.tsx` — slimmed: only `website`, `companyName`, `description`, `industry`, `language`, `services`, `painPoints`. Drop ICP/precision/signals/objectives state. Existing draft loader gracefully ignores unknown fields.
- `src/lib/api/firecrawl.ts` — `scrapeWebsite` returns the raw `markdown` too, so we can pass it to `generate-services`.
- `src/pages/Dashboard.tsx` — remove `QuickStartPanel` import + grid slot; mount `<SetupWizardBanner />` above `<SubscriptionBanner />`; expand `PerformanceChart` to full row.
- `src/pages/Signals.tsx` — read `?create=1` query param and auto-open `CreateAgentWizard`.
- `supabase/config.toml` — register `[functions.generate-services]` with `verify_jwt = false`.

**Database**
- Migration: add `services text[] default '{}'::text[]` to `public.campaigns`. Nullable, no default trigger needed.

## Out of scope

- Touching `Step3ICP`/`Step4Precision`/`Step5IntentSignals`/`Step6Objectives` (kept as orphan files for now; can delete in a follow-up).
- Auto-creating signal_agents during onboarding — user creates them in-app via the wizard.
- Re-running scrape on edit — user edits inside dashboard later.
- Mobile-specific redesign of the setup banner — uses the same stack-on-narrow pattern as existing banners.

