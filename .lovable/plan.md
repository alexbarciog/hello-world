## Goal

Make `/linkedin-profile-analyzer` rank for the terms actual buyers search for. Semrush shows the winnable, on-topic queries are: **linkedin profile optimization** (720/mo, KD low), **linkedin profile review** (110/mo, KD 22), **linkedin profile audit** (20/mo, KD 0), **linkedin summary generator** (590/mo), **how to improve linkedin profile** (320/mo), **linkedin profile optimization services** (320/mo), **profile analyzer** (320/mo). Right now the page targets "audit" only, has no canonical, isn't in the sitemap, and its H1 is split across animated `<span>`s (crawlers still read the text, but it's not keyword-loaded).

## Changes

### 1. `src/pages/LinkedInProfileAnalyzer.tsx` — head + on-page keywords

- **Title** (≤60): `Free LinkedIn Profile Review & Optimization Audit | Intentsly`
- **Meta description** (≤160): `Free AI LinkedIn profile review. Get an instant audit, conversion score, rewritten headline & About in 45 seconds. No credit card.`
- Add **`<link rel="canonical" href="https://intentsly.com/linkedin-profile-analyzer">`** (currently missing → duplicate-content risk with the root canonical baked in `index.html`).
- Set **`og:url`** to the same absolute URL (currently inherits site root).
- Keep existing FAQPage + SoftwareApplication JSON-LD, add a **BreadcrumbList** (Home → LinkedIn Profile Review).
- Add an SEO H2 line just under the animated H1 (visible, small `sr-only` if we don't want to alter design) so the primary keyword phrase appears verbatim: e.g. `<p className="sr-only">Free LinkedIn profile review, audit, and optimization tool.</p>`
- Rework the "What you get" H2 to include a keyword: `A brutally specific LinkedIn profile review.`
- Rework "How it works" H2: `How the LinkedIn profile audit works.`
- Add descriptive `aria-label`s / alt text where images/icons carry meaning (currently mostly decorative — fine to leave `aria-hidden`).

### 2. `public/robots.txt`

Add sitemap directive:
```
Sitemap: https://intentsly.com/sitemap.xml
```

### 3. Create `public/sitemap.xml` (static)

Include public routes only (root, features/*, pricing, case-studies, playbook, signal-playbook, partners, privacy, terms, help, linkedin-profile-analyzer, try-ai). Bump `linkedin-profile-analyzer` priority to `0.9`.

### 4. Head-collision fix

`index.html` has a hard-coded `og:image`, `og:title`, `og:description`. `useSeoHead` in the analyzer overwrites title/description/og:title/og:description via `document.head.querySelector` — good. Extend it to also set/overwrite `og:url` and inject `<link rel="canonical">` on mount and restore on unmount so other routes aren't polluted.

## Not doing

- No `react-helmet-async` install — this is a one-page SEO fix, useSeoHead pattern already exists.
- No new `og:image` (per head-meta rules, hosting injects a preview).
- No route changes, no copy overhaul beyond H2 tweaks.

## Verification

- View-source the built page → confirm title/description/canonical/og:url present.
- Confirm sitemap loads at `/sitemap.xml` and robots references it.
- Trigger SEO scan afterwards so findings refresh.
