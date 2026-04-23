

# Mobile optimization for the landing page

The desktop landing page is dialed in, but on mobile (≤768px) several sections feel cramped, the hero hits an awkward second-screen, the comparison table forces horizontal scrolling, and the sticky CTA collides with browser chrome. This pass tightens spacing, swaps a few heavy desktop layouts for mobile-native variants, and fixes the readability issues — without changing copy, brand, or animation language.

## Goals

1. Every section legible on a 375px screen without zoom.
2. No horizontal scroll anywhere except where intentional (logo marquee).
3. Sticky mobile CTA is always tappable, never blocking content or browser bars.
4. Smaller, lighter motion on mobile (perf + battery).
5. Hero fits in one viewport on phones (no awkward CTA-below-fold).

---

## 1. Hero (`src/components/Hero.tsx`)

Currently the hero is `min-h-screen` then immediately renders a tilted carousel + rating + scroll cue, all of which push the CTA below fold on phones. Fix:

- Drop `min-h-screen` on mobile (use `min-h-[88vh] md:min-h-screen`) so the page doesn't feel padded with empty sky.
- Reduce top padding: `pt-24 md:pt-36` (was `pt-28 md:pt-36`).
- Headline: `text-4xl` on mobile (currently `text-5xl`), tighter `leading-[1.08]`. The inline LinkedIn glyph is `w-12 h-12` — drop to `w-9 h-9` on mobile so the second line doesn't break awkwardly.
- Urgency badge copy is too long ("127 buyers showed intent in the last hour"). On mobile, shorten to **"127 buyers showed intent today"** via a `hidden sm:inline` / `sm:hidden` swap.
- CTA row: stack vertically full-width on mobile (`flex-col w-full` with both buttons `w-full justify-center`), keep side-by-side from `sm:` up.
- Microtrust line: shrink letter-spacing on mobile so it doesn't wrap.
- Rating row: collapse to a single line — avatar stack + "500+ teams · 4.9★" — currently it's 2 rows, takes too much vertical space.
- Scroll cue: hide on mobile (`hidden sm:flex`). On phones the page is already visibly scrollable.
- HeroCards carousel margin: `mt-8` on mobile (was `mt-12`).

## 2. HeroCards (`src/components/HeroCards.tsx`)

The 3-card grid stacks vertically on mobile (`grid-cols-1 md:grid-cols-3`), so users scroll through three full cards with `mx-6` inner padding inside an already-padded section — too dense.

- Switch mobile to a **horizontal snap carousel**: `flex overflow-x-auto snap-x snap-mandatory gap-4 -mx-4 px-4 pb-4` with each card `min-w-[85%] snap-center`. From `md:` up, keep current 3-col grid.
- Reduce inner mock padding on mobile (`mx-3` instead of `mx-6`).
- Add a small dot indicator under the carousel showing 1/3 · 2/3 · 3/3.
- Disable the idle `animate-float` wrapper on mobile (no `animate-float` class below `md:`) — it makes horizontal scroll feel wobbly.

## 3. LogoMarquee (`src/components/LogoMarquee.tsx`)

Stat bar wraps awkwardly on small screens (3 stats + dots).

- Stats: switch to a `grid grid-cols-3` on mobile (no dots, no wrap), each cell stacked (`flex-col`) with the number on top and label below. From `sm:` up keep the inline row with dots.
- Marquee gap: `gap-10` on mobile (was `gap-16`).

## 4. ProblemSection (`src/components/landing/ProblemSection.tsx`)

ColdListMock has 5 fake leads + footer stats, which on a 360px screen overflows the right column when stacked.

- Reduce fake leads to 4 on mobile (slice).
- Footer stats grid: keep 2-col but tighten — already fine.
- Pain stack: spacing reduces from `p-4 md:p-5` → `p-3 md:p-5`.
- Watermark "NO SIGNAL": shrink to `text-[44px]` on mobile (was 64px) — currently overflows the card horizontally.

## 5. HowItWorks (`src/components/landing/HowItWorks.tsx`)

Each step card is `min-h-[420px]` and the visual zone is `min-h-[320px]` — on mobile this means each step is ~740px tall before content. Plus the absolute `[88px]` step-number watermark collides with the `Step 02` label on narrow screens.

- Card padding mobile: `p-6 md:p-12` (was `p-8`).
- Step number watermark: `text-[64px] md:text-[88px]` and reposition `top-4 right-5` on mobile.
- Visual zone min-height mobile: `min-h-[260px] md:min-h-[420px]`.
- Inside each Visual mock, internal padding `px-4 py-6 md:px-6 md:py-8`.
- Cards go to `border-radius: 24px` on mobile (the `[32px]` looks oversized at 360px width).
- The mid-section nudge band: stack vertically on mobile (`flex-col items-start`) so the CTA sits under the line, not squished beside it.
- Section header right-side meta ("3 steps · ~5 min setup") stays `hidden md:block`.

## 6. UseCases (`src/components/landing/UseCases.tsx`)

Mostly fine — already collapses to 1 column. Two fixes:

- Visual zone height: `h-[170px] md:h-[200px]` (mocks have plenty of breathing room and shorter cards make the bento feel less endless).
- CTA footer band: stack vertically on mobile (`flex-col text-left`) with the CTA `w-full justify-center` — currently it wraps strangely with the green check + 2 lines + button.
- Hero headline `text-5xl md:text-6xl` → `text-4xl md:text-6xl` (currently overruns on iPhone SE width).

## 7. WhyIntentsly (`src/components/landing/WhyIntentsly.tsx`)

Container is `p-8 md:p-12` and the two-column grid has `gap-10` on mobile when stacked — too much vertical air.

- Container: `p-5 md:p-12`.
- Stacked column gap: `gap-8 md:gap-16`.
- The Intentsly column has a `md:border-l md:pl-12` which is correct — also add a thin `border-t border-border/60 pt-8 md:border-t-0 md:pt-0` to visually separate the two stacks on mobile.
- Headline stat pill: `text-[11px]` on mobile so it doesn't wrap "Teams switching report ~3× higher reply rates" onto 3 lines.

## 8. Comparison (`src/components/landing/Comparison.tsx`) — **biggest mobile fix**

Currently the table is `min-w-[720px]` inside `overflow-x-auto`, so mobile users get a horizontal scrollbar inside the section. The "Best value" badge and lime glow are already `hidden md:block`. Fix with a **mobile-native card stack**:

- Below `md:`, replace the table entirely with a **stacked card per row**:
  ```
  ┌────────────────────────────┐
  │  Intent-based targeting    │
  │  ✅ Intentsly  ❌ Apollo    │
  │  ❌ Clay      ❌ Sales Nav  │
  │  Manual Agencies           │
  └────────────────────────────┘
  ```
  Each feature row becomes a card with a 2×3 grid of competitor pills (logo + value/check/X). The Intentsly pill gets the lime border + glow.
- From `md:` up, keep the current table.
- This kills the horizontal scroll, makes every value glanceable, and the Intentsly highlight stays visible without absolute positioning.
- CTA below stays as-is.

## 9. Pricing (`src/components/Pricing.tsx`)

- Card padding: `p-6 md:p-10` (was `p-8 md:p-10`).
- "Most popular" ribbon: position changes from `right-6` to `right-4 -top-2.5` on mobile so it doesn't overhang the section edge.
- Trust row (`Secure checkout · Cancel anytime · Live in 5 min`) currently squeezes 3 items in a row — on iPhone SE the dots and items overlap. Switch to `flex-col gap-2 sm:flex-row sm:gap-4` and hide the · dots on mobile (`hidden sm:inline`).
- Price `text-5xl` is fine; keep.

## 10. FAQ (`src/components/FAQ.tsx`)

- Question text `text-lg md:text-xl` → `text-base md:text-xl` so long questions don't wrap into 3 lines beside the +/- button on 360px.
- Card padding `p-6 md:p-7` → `p-5 md:p-7`.
- Closing CTA card buttons stack full-width on mobile (`w-full sm:w-auto`).

## 11. FinalCTA (`src/components/landing/FinalCTA.tsx`)

- Section outer padding: `px-2 md:px-4` is fine.
- Inner padding `py-28 px-8` → `py-20 px-6 md:py-28 md:px-12` (currently feels like a lot of vertical air on phones).
- Headline `text-3xl md:text-5xl lg:text-6xl` → `text-[28px] md:text-5xl lg:text-6xl` to prevent 4-line wrap on small phones.
- CTA row + secondary link: stack on mobile (`flex-col items-start sm:flex-row sm:items-center`).
- Avatar trust strip: shrink avatars to `w-6 h-6` on mobile, allow text to wrap onto a second line cleanly.

## 12. StickyMobileCTA (`src/components/landing/StickyMobileCTA.tsx`)

Three issues to fix:

- Currently triggers at `scrollY > window.innerHeight * 0.9` — on tall hero pages this is correct, but feels late. Trigger at `0.6` so the bar is present early in the journey.
- Pad bottom: add `safe-area-inset-bottom` support — `bottom-3` becomes `bottom-[max(0.75rem,env(safe-area-inset-bottom))]` so the bar clears the iOS home indicator.
- Add a small lime "live" dot before "$97/month" to match brand language.
- Add 60–70px of padding at the very bottom of `Index.tsx` (a single spacer `<div className="md:hidden h-16" />` before `<Footer />`) so the FinalCTA's last line isn't hidden under the sticky bar.
- Hide the bar when the in-page Pricing card is in view (use `IntersectionObserver` on `#pricing`) — the bar becomes redundant if the user is already looking at price + CTA.

## 13. Global motion / perf

In `src/lib/motion.tsx` `<Reveal>` and `<Float>`, gate decorative loop animations under `prefers-reduced-motion: no-preference` (already partly done in CSS — extend to JS hooks). Specifically:

- `animate-float`, `animate-pulse-ring`, `animate-tilt-in`, `animate-slow-bounce`: wrap in a single class `motion-safe:animate-float` etc. via Tailwind's `motion-safe` variant — replace direct `animate-*` with `motion-safe:animate-*` in Hero, FinalCTA, ProblemSection.
- Skips noise on iOS Low Power Mode and respects user accessibility settings.

---

## Files to modify

- `src/components/Hero.tsx` — sizes, stacking, hide scroll cue, shorten urgency copy
- `src/components/HeroCards.tsx` — mobile snap carousel + dot indicators
- `src/components/LogoMarquee.tsx` — stat bar grid on mobile
- `src/components/landing/ProblemSection.tsx` — fewer rows, smaller watermark
- `src/components/landing/HowItWorks.tsx` — padding, watermark size, stack mid-CTA
- `src/components/landing/UseCases.tsx` — headline size, footer stack
- `src/components/landing/WhyIntentsly.tsx` — padding, divider, pill size
- `src/components/landing/Comparison.tsx` — replace table with stacked cards on mobile
- `src/components/Pricing.tsx` — ribbon position, trust row stack
- `src/components/FAQ.tsx` — question size, button stack
- `src/components/landing/FinalCTA.tsx` — padding, headline size, stack
- `src/components/landing/StickyMobileCTA.tsx` — earlier trigger, safe-area, hide near pricing
- `src/pages/Index.tsx` — mobile spacer above footer

## Out of scope

- Copy rewrites (only shortening one badge line).
- Navbar (mobile burger already works well).
- Any new sections, illustrations, or animations.
- Tablet-specific tuning between 768–1024px (handled by existing `md:` breakpoints).
- Backend / data wiring.

