

# Visual-first Problem section redesign

The current Problem section is text-heavy and visually thin. Replace it with a tighter, more visual layout that mirrors the polish of `HowItWorks` but stays scannable.

## New layout (`src/components/landing/ProblemSection.tsx`)

```text
┌─────────────────────────────────────────────────────────────┐
│  THE PROBLEM                                                 │
│  Cold prospecting is broken                                  │
│  You're chasing names. Your competitors are catching timing. │
└─────────────────────────────────────────────────────────────┘

┌──────────────────┐  ┌──────────────────────────────────────┐
│ BIG VISUAL       │  │  ❌ Guesswork targeting              │
│ "Cold list"      │  │     Lists ≠ buyers                   │
│ mock — leads     │  ├──────────────────────────────────────┤
│ greyed out, low  │  │  ❌ Low-response outreach            │
│ scores, "0 in-   │  │     2% reply rate, burned domains    │
│ market" badge    │  ├──────────────────────────────────────┤
│                  │  │  ❌ Missed buying windows            │
│                  │  │     Deals close before you call      │
└──────────────────┘  └──────────────────────────────────────┘
```

## What changes

**Drop heavy copy.** Two long body paragraphs are removed. Replaced with a one-line subhead: *"You're chasing names. Your competitors are catching timing."*

**New left visual (≈55% width, sticky feel):** A "Cold prospecting" mock card matching the `HowItWorks` mini-dashboard style:
- Header: small chip "Cold list — 2,418 leads"
- 5 row mini-table of leads with greyed avatars, muted names ("J. Doe", "M. Smith", "A. Patel"…), and a faded "—" intent column
- Footer strip with two stats:
  - **0** in-market right now (red dot)
  - **3** competitors already reached out (amber dot)
- A subtle red diagonal "no-signal" overlay/watermark to imply the list is dead weight
- Same `bg-white shadow-md rounded-xl` treatment + outer `bg-[#f0f0f0] p-2` frame used in `HowItWorks` for consistency

**Right pain stack (≈45% width):** 3 stacked rows (instead of 3 wide cards). Each row: small red-tinted icon circle (`bg-destructive/10`), bold short title (2–3 words), one tight 5-word descriptor. Rows separated by hairline dividers, all inside one `bg-[#f5f5f5] rounded-3xl` panel — so the right column reads as one visual block, not three loud cards.

**Pain content (compressed):**
| Title | One-liner |
|---|---|
| Guesswork targeting | Lists aren't buyers. |
| Low-response outreach | 2% reply rates, burned domains. |
| Missed buying windows | Deals close before you call. |

**Bottom transition line (optional, single line, centered, muted):** *"Intent fixes all three. ↓"* — visually pulls the eye into the next section (`HowItWorks`). No extra paragraph.

## Responsive behavior

- `md+`: 2-column grid (`grid-cols-12`, visual `col-span-7`, pain stack `col-span-5`).
- Mobile: visual stacks on top, pain rows below; pain rows stay compact (no per-card padding bloat).

## Files

**Modified**
- `src/components/landing/ProblemSection.tsx` — replace contents with the new layout + inline mock visual component.

**Untouched**
- All other landing sections, navbar, hero, pricing, FAQ.

## Out of scope

- Replacing the static cold-list mock with a real screenshot.
- Animating the "X" overlays (kept static for performance).
- Touching the `HowItWorks` or `WhyIntentsly` sections in this pass.

