

# HowItWorks — premium "I want this" upgrade

The current 3-card grid feels like a generic feature recap: identical grey shells, tiny mocks crammed at the bottom, copy on top of visual. To create desire, we flip the section into a **scroll-driven product narrative** — bigger visuals up front, sharper outcome-led copy, and a unified "before → during → after" story that makes the user picture themselves using it.

## New structure (`src/components/landing/HowItWorks.tsx`)

```text
HOW IT WORKS
From cold list to qualified pipeline — in 3 moves.        [meta: 3 steps · ~5 min setup]

┌─────────────────────────────────────────────────────────────────┐
│ STEP 01 ─────────────────────  [tinted gradient bg, sky]        │
│                                                                  │
│   You define who matters.        ┌────────────────────────┐     │
│   Industry, role, company        │   ICP MOCK (large,     │     │
│   shape — in 60 seconds.         │   floating, shadow)    │     │
│                                  │                        │     │
│   ✓ No CSV uploads               │                        │     │
│   ✓ Edit anytime                 └────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│ STEP 02 ─────────────────────  [tinted gradient bg, indigo]     │
│                                                                  │
│  ┌────────────────────────┐   We watch LinkedIn for you.         │
│  │   SIGNALS MOCK (large, │   Hiring spikes, competitor moves,   │
│  │   live counter pulse,  │   problem-aware posts — 24/7.        │
│  │   floating signal      │                                      │
│  │   chips)               │   ⚡ 127 signals/day per ICP avg     │
│  └────────────────────────┘   🟢 Updates every hour              │
└─────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│ STEP 03 ─────────────────────  [tinted gradient bg, lime]       │
│                                                                  │
│   You get a daily shortlist.     ┌────────────────────────┐     │
│   People showing intent right    │  PRIORITIZED MOCK      │     │
│   now — ranked, scored, ready.   │  (large, hot/warm pills│     │
│                                  │   + "Book meeting" CTA │     │
│   → 12 hot leads today           │   on top lead)         │     │
│   → Avg 8 min to outreach        └────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘

         ─────  Closing line  ─────
   "Stop hunting. Start replying."
        [Start for $97 →]
```

## What changes

### 1. Layout: stacked, alternating, hero-sized rows

- **Drop the 3-column grid.** Replace with 3 stacked full-width cards. Each card is `grid-cols-12` on `md+`:
  - Step 01: copy left (col-span-5), visual right (col-span-7).
  - Step 02: visual left (col-span-7), copy right (col-span-5). *(alternating creates rhythm)*
  - Step 03: copy left, visual right.
- Cards become tall (`min-h-[420px]`), giving each mock real estate to breathe — matches the premium UseCases bento we just built.
- On mobile: copy on top, visual below, stacked normally.

### 2. Card shell upgrade

- Outer: `rounded-[32px] border border-black/5 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_24px_48px_-24px_rgba(0,0,0,0.10)] overflow-hidden`.
- Visual zone: full-bleed tinted gradient backdrop per step (sky for 01, indigo for 02, lime for 03) with a soft radial highlight + faint dot pattern — same family as UseCases for visual coherence.
- Mocks scaled up ~1.6× (currently `h-44`, becomes `h-[300px]`+), with a stronger floating shadow `shadow-[0_20px_40px_-16px_rgba(15,23,42,0.25)]` so they read as real product surfaces.

### 3. Copy: outcome-led, shorter, desire-driven

Replace feature descriptions with outcome statements + proof points.

| Step | Old title | New title | New subtitle | Proof bullets |
|---|---|---|---|---|
| 01 | Define who you want to find | **You define who matters.** | Industry, role, company shape — in 60 seconds. | ✓ No CSV uploads · ✓ Edit anytime |
| 02 | Track intent signals on LinkedIn | **We watch LinkedIn for you.** | Hiring spikes, competitor moves, problem-aware posts — 24/7. | ⚡ 127 signals/day per ICP avg · 🟢 Updates hourly |
| 03 | Focus on the best opportunities | **You get a daily shortlist.** | People showing intent right now — ranked, scored, ready to reach out. | → 12 hot leads/day · → ~8 min to first outreach |

- Step number becomes a large outline numeral (`text-[88px] font-light text-[#1A8FE3]/15`) sitting *behind* the title — editorial feel, used by Linear/Stripe.
- Title bumps to `text-3xl md:text-4xl font-medium tracking-[-0.02em]`.
- Proof bullets use small icon + value + label, not full sentences.

### 4. Mock upgrades (make them feel "live")

- **Step 01 ICP mock**: add a subtle "✓ Saved" pill that fades in on view, plus a second floating chip behind it ("12,400 matches") to imply scale.
- **Step 02 Signals mock**: animate the `127` counter ticking up on view (framer-motion `animate` from 100→127). Add a pulsing green dot next to "Live signals". Add one more floating signal chip (e.g. "Funding round announced") with a stagger entrance.
- **Step 03 Prioritized mock**: add a hover-state "Book meeting" mini-button on the top lead row, and a small "+9 more" affordance below to imply depth. Promote tier pills to gradient fills (red→orange for Hot) for more visual punch.

### 5. Section header polish

- Eyebrow: `How it works` (kept).
- Headline: change to **"From cold list to qualified pipeline — in 3 moves."** (outcome-driven, not "How Intentsly works").
- Right-aligned meta on `md+`: `3 steps · ~5 min setup` in muted small caps — editorial.
- Drop the existing closing sentence under the grid; replace with a stronger CTA block.

### 6. Closing CTA block (new)

Below the 3 cards, add a compact centered block:
- One-liner: **"Stop hunting. Start replying."** (`text-2xl font-medium`).
- Primary button: `Start for $97 →` linking to `/register` (matches FinalCTA).
- Tiny sub-line: `No contracts · Cancel anytime`.

This converts the section from "informational" to "active" — the user finishes reading and the next thing in their eye is a button.

### 7. Motion

- Each row enters with `y: 24, opacity: 0 → 1`, `duration: 0.6`, `ease: [0.22, 1, 0.36, 1]`, staggered by `index * 0.1`.
- Mocks inside each row get a secondary delayed entrance (`delay: 0.2 + index * 0.1`) so the card frame appears first, then the "product" lands inside it — gives a satisfying micro-reveal.
- The `127` counter animates only when in view (framer-motion `useInView` + `animate`).

## Files

**Modified**
- `src/components/landing/HowItWorks.tsx` — full rewrite of grid → stacked rows, upgraded mocks, new copy, closing CTA.

**Untouched**
- All other landing sections, `Index.tsx` order, navbar, hero, pricing, FAQ, ProblemSection, UseCases, WhyIntentsly, Comparison, FinalCTA.

## Out of scope

- Replacing JSX mocks with real screenshots.
- Adding/removing steps (still 3).
- Background changes to the section itself (stays `bg-background`).
- Wiring the proof numbers (`127`, `12 hot leads`) to real data — stays as illustrative mock copy.

