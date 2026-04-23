

# Landing page restructure — intent-focused, single $97 plan

Rebuild the homepage around one message ("find B2B buyers showing intent on LinkedIn"), one CTA ("Start for $97"), and a tighter section flow. Hero stays exactly as it is today.

## New page order (`src/pages/Index.tsx`)

```text
Navbar → Hero (unchanged) → LogoMarquee (kept) →
ProblemSection → HowItWorks → WhyIntentsly (comparison) →
UseCases → Pricing (single $97) → FAQ → FinalCTA → Footer
```

Removed from landing: `AboutStats`, `ServicesSection`, `ExpertiseSection` (files left on disk; only unimported from `Index.tsx` so case-study/feature pages that may use them keep working).

## Navbar changes (`src/components/Navbar.tsx`)

Desktop links replaced with: **How it Works · Use Cases · Pricing · FAQ · Login**. Top-right CTA changes from "Get Started" → **"Start for $97"** (still routes to `/register`). Same change mirrored in the mobile sheet. Features dropdown and Case Studies link removed from the top nav (still reachable via footer).

## New components

**`src/components/landing/ProblemSection.tsx`**
Section label "The problem". Headline: *"Most B2B teams are still targeting too early or too broadly."* Two-paragraph body. 3-column card grid below: *Guesswork targeting / Low-response outreach / Missed buying windows*. Same `bg-[#f5f5f5]` rounded cards used elsewhere for visual consistency.

**`src/components/landing/HowItWorks.tsx`** (new file — replaces the unused old one if name collides; we'll namespace under `landing/`)
Section label "How it works". Headline: *"How Intentsly works"*. 3 numbered cards in a row, each with a small mockup visual reusing the mini-dashboard style from `ServicesSection`:
1. **Define who you want to find** — small ICP form mock.
2. **Track intent signals on LinkedIn** — reuse the live-signals chip mock.
3. **Focus on the best opportunities** — reuse the prioritized leads list mock.

**`src/components/landing/WhyIntentsly.tsx`**
Section label "Why Intentsly". Headline: *"Better than building another cold list."* Two-column comparison table inside a single rounded `[#f5f5f5]` panel:
- Left column "Traditional prospecting" (muted/gray bullets with × icons).
- Right column "With Intentsly" (lime check icons, dark text).
Bottom line: *"If your team sells to B2B buyers, timing matters."*

**`src/components/landing/UseCases.tsx`**
Section label "Who Intentsly is for". Headline: *"Built for B2B teams that care about timing."* 6-card grid (3×2 on desktop, 1-col mobile): B2B SaaS teams, Lead-gen agencies, Sales teams, Founders, B2B service businesses, RevOps / GTM operators. Each card: small icon, bold title, 1-line description. Same rounded `bg-[#f5f5f5]` look.

**`src/components/landing/FinalCTA.tsx`**
Replaces current `CTASection` content (we re-export `Footer` from the existing file unchanged). Headline: *"Spot likely buyers on LinkedIn before everyone else does."* Sub: *"Stop relying on broad prospect lists and start focusing on the people already showing movement."* Primary CTA **Start for $97** → `/register`. Secondary text link **See how it works** → `#how-it-works`. Reuses existing `cta-bg.avif`.

## Pricing rewrite (`src/components/Pricing.tsx`)

Replace the 3-column grid with **a single centered card** at max-width ~480px:

- Plan name: **Intentsly**
- Price: **$97/month**
- 5 bullets: LinkedIn intent discovery · Buyer/company targeting workflows · Signal-based prospect identification · Fast setup · Cancel anytime
- CTA: **Start for $97** → calls `handleCheckout(PRO_PRICE_ID, "Intentsly", 97)`. Uses existing Growth Stripe price ID under the hood (real charge will be $99 — visual mismatch noted; you'll align Stripe later).
- Caption below the card: *"A simple monthly subscription for B2B teams that want better timing and sharper targeting. Cancel anytime."*

Section label "Pricing". Headline: *"Simple pricing"*. Subheadline: *"One plan. Everything you need to find buyers showing intent on LinkedIn."*

The `useSubscription` "Active / Upgrade / Downgrade" logic is preserved for the single card so existing customers still see their state.

## FAQ rewrite (`src/components/FAQ.tsx`)

Replace the current 5 entries with the 7 from the wireframe (What does Intentsly actually do? · Is this just another lead database? · Who is Intentsly best for? · Do I need a large outbound team? · Does this replace my CRM? · How quickly can I get value? · Is there a contract?). Component structure (accordion) untouched.

## Section IDs for nav anchors

Add `id="how-it-works"`, `id="use-cases"`, `id="pricing"` (already), `id="faq"` (already) so the new navbar anchor links work.

## Files

**New**
- `src/components/landing/ProblemSection.tsx`
- `src/components/landing/HowItWorks.tsx`
- `src/components/landing/WhyIntentsly.tsx`
- `src/components/landing/UseCases.tsx`
- `src/components/landing/FinalCTA.tsx`

**Modified**
- `src/pages/Index.tsx` — new section order, drop AboutStats/ServicesSection/ExpertiseSection imports.
- `src/components/Navbar.tsx` — link list + CTA label (desktop + mobile).
- `src/components/Pricing.tsx` — single-card layout, $97 display, new copy.
- `src/components/FAQ.tsx` — replace `faqs` array with new 7 questions.
- `src/components/CTAFooter.tsx` — `CTASection` body rewritten (footer untouched).

**Untouched**
- `Hero.tsx`, `HeroCards.tsx`, `LogoMarquee.tsx`, `Footer` (in `CTAFooter.tsx`), all feature subpages, all dashboard code, all Stripe/edge functions.

## Notes / known mismatches

- Display says **$97**, real Stripe checkout still charges **$99** via the existing Growth `price_1TCpq6FsgTpFMX56cX4ufXJo`. Fix when ready by either updating the Stripe price or creating a new $97 product (separate request).
- Old `AboutStats`, `ServicesSection`, `ExpertiseSection`, `Testimonials` files stay on disk untouched (orphaned) so we don't break anything if they're referenced elsewhere.

## Out of scope

- Adding real testimonials/logos (left as the existing `LogoMarquee` only).
- Mobile-specific redesign beyond what the existing responsive classes already give.
- Changing the Hero in any way.
- Stripe price creation.

