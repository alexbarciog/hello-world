# LinkedIn Profile Analyzer

A public, SEO-optimized landing page that captures a LinkedIn URL + a one-line service description, forces account creation, then reveals a full AI-generated profile report. Also drops 2 emails/week to the user with fake "new opportunity" alerts to drive re-engagement.

## 1. Public page — `/linkedin-profile-analyzer`

Same visual language as the landing page (`Navbar`, sky hero, Space Grotesk, sky/lime accents, glassmorphism, `CTASection`/`Footer`).

**Structure:**
- **Hero** — H1 "Free LinkedIn Profile Audit. See what's silently killing your inbound.", sub "Paste your profile. Tell us what you sell. Get a brutal, specific, 100% free report in 30 seconds." → the form.
- **The form (single card):**
  1. LinkedIn profile URL (validated `linkedin.com/in/…`)
  2. "What's the one service you mainly sell?" (short textarea, 200 char cap)
  3. Big "Analyze my profile — free" button
- **Social proof strip** — "2,431 profiles audited this month" style counter, 3 testimonial cards.
- **What you'll get** — 6 bento tiles: Headline score, Hook rewrite, About-section teardown, Missing keywords, Trust signals gap, "Why nobody DMs you" section.
- **Trust bar** — "No credit card. No spam. Report ready in under a minute."
- **FAQ** — 5 items (SEO long-tail).
- **CTASection + Footer**.

**Copywriting angle (psychological):**
- Loss framing ("You're losing 3-5 inbound leads/week to a weak headline").
- Specificity ("audit checks 27 conversion signals").
- Curiosity gap ("The 4 words in your About section that make buyers scroll past").
- Zero-risk anchor ("Free forever. No credit card.").

**SEO:**
- `index.html`-level route registered.
- Real `<title>`, meta description, og/twitter tags injected via component (matching what other public pages already do).
- H1/H2 structure, alt text, JSON-LD `FAQPage` + `SoftwareApplication`.

## 2. Analysis flow

**Click "Analyze":**
- Validate URL + description.
- Store `{ linkedin_url, service_description }` in `localStorage` under `pending_profile_analysis`.
- Navigate to `/register?redirect=/profile-report&source=analyzer`.

**Register page (`Register.tsx`):**
- Detect `source=analyzer`. After successful signup, instead of navigating to `/onboarding`, navigate to the `redirect` param. Also mark the profile so `AuthGuard` doesn't kick them to onboarding for that one route.
- Simplest safe approach: add `/profile-report` to `AuthOnlyGuard` (auth-only, no onboarding check). User can still hit onboarding later when they visit `/dashboard`.

**Report page (`/profile-report`, AuthOnlyGuard):**
- Reads `pending_profile_analysis` from `localStorage`.
- Inserts a row in `linkedin_profile_analyses` (status `pending`) and calls the edge function.
- Shows a live status stepper (Fetching profile → Scoring → Writing rewrites) with skeleton cards.
- When done, renders the full report.
- Also creates a row in a `weekly_opportunity_emails_queue` config so the biweekly emails start.

**Edge function `analyze-linkedin-profile`:**
- Auth: JWT required.
- Input: `{ linkedin_url, service_description }`.
- Fetch public profile HTML via **Firecrawl** (already have `FIRECRAWL_API_KEY`).
- Send extracted text + service description to Lovable AI (`google/gemini-3-flash-preview`) with a structured-output schema:
  ```
  {
    detected_services: string[],           // what we think they sell
    headline_score: 0-100,
    about_score: 0-100,
    banner_score: 0-100,
    social_proof_score: 0-100,
    overall_score: 0-100,
    top_3_issues: [{ title, why, fix }],
    rewritten_headline: string,
    rewritten_about_hook: string,          // first 3 lines
    missing_keywords: string[],
    conversion_signals_missing: string[],
    quick_wins: string[]                   // 5-7 items
  }
  ```
- Save JSON in `linkedin_profile_analyses.report` (jsonb), status `ready`.
- Return report.

**Report UI:**
- Big overall score ring at top.
- 4 sub-score cards.
- "What you're actually selling (per our AI)" — the `detected_services` chips — reassures them the analysis is grounded.
- Rewritten headline + About hook in copy-to-clipboard cards.
- Top 3 issues, each as a solution card (issue → why it costs you → exact fix).
- Missing keywords & conversion signals.
- Quick wins checklist.
- Persistent "Rerun analysis" button.

## 3. Fake weekly opportunity emails (2/week)

Purpose: retention hook. Every analyzer signup gets 2 emails per week with fake-but-plausible "new opportunity" counters to pull them back into the app.

**Table `profile_analyzer_subscribers`:**
- `user_id`, `service_description`, `linkedin_url`, `enabled bool default true`, `unsubscribe_token uuid`, timestamps.
- Auto-inserted when the report is generated.

**Edge function `send-fake-opportunity-email`:**
- Iterates over enabled subscribers.
- Picks a random template with a randomized count (3–9):
  - "Found {n} people interested to work with you"
  - "Got you {n} new leads interested in {service}"
  - "{n} decision-makers just engaged with content in your space"
  - "{n} warm prospects matched your ICP this week"
  - "{n} founders posted about {service} in the last 48h"
- Renders via Resend with brand template, CTA "See your leads" → `/dashboard`.
- Includes 1-click unsubscribe link that flips `enabled=false`.

**Schedule:** `pg_cron` job Tuesday + Friday 10:00 UTC calls the edge function via `pg_net` with anon key + service headers. Created via `supabase--insert` (not migration) since it embeds project-specific URL + key.

## 4. Nav + discovery

- Add "Free LinkedIn Audit" link in the public Navbar's Tools/Resources area.
- Sitemap entry in `public/sitemap.xml`.

## Technical notes

- Route added to `src/App.tsx` (public + AuthOnlyGuard variant).
- Files: `src/pages/LinkedInProfileAnalyzer.tsx` (public), `src/pages/ProfileReport.tsx` (gated).
- Migration: new tables `linkedin_profile_analyses`, `profile_analyzer_subscribers` (both with GRANTs + RLS scoped to `auth.uid()`).
- No new secrets needed (Firecrawl, Lovable AI, Resend all already present).
- Reuses existing `Navbar`, `CTASection`, `Footer`, `sky` tokens.

## Out of scope

- Real "opportunities" — emails are intentionally fake counter-based (per your call).
- Bulk profile scanning, competitor comparison, PDF export — future.
- No onboarding change beyond letting the analyzer signup skip it once.