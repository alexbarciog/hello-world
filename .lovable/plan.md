

# UseCases section — visual upgrade

Make the "Who Intentsly is for" section feel more like a product showcase than a flat icon grid. Each use case becomes a richer card with a small visual artifact (mini-mock) instead of a bare icon, while keeping the section short and scannable.

## New layout (`src/components/landing/UseCases.tsx`)

```text
┌────────────────────────────────────────────────────────────────┐
│  WHO INTENTSLY IS FOR                                           │
│  Built for B2B teams that care about timing                     │
│  Different teams. Same goal: buyers worth your attention now.   │
└────────────────────────────────────────────────────────────────┘

┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
│ 🚀 B2B SaaS         │  │ 🏢 Lead-gen agencies │  │ 👥 Sales teams      │
│ ─────────────────── │  │ ─────────────────── │  │ ─────────────────── │
│ [mini signal chip]  │  │ [mini client list]  │  │ [hot lead row]      │
│ "Hiring 3 AEs"      │  │ Acme · Globex · …   │  │ ● Hot · 92          │
│ Find companies      │  │ Stronger angles     │  │ Timing > ICP fit    │
│ entering your cat.  │  │ for client outreach │  │                     │
└─────────────────────┘  └─────────────────────┘  └─────────────────────┘
┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
│ 👤 Founders         │  │ 🔧 B2B services     │  │ ⚙️ RevOps / GTM     │
│ ─────────────────── │  │ ─────────────────── │  │ ─────────────────── │
│ [solo mock]         │  │ [growth chart up]   │  │ [score gauge]       │
│ "1 founder, 12 mtg" │  │ Hiring +28% · MRR ↑ │  │ Fit 8.4 / Intent 9 │
│ Lean outbound       │  │ Spot demand triggs. │  │ Better inputs.      │
└─────────────────────┘  └─────────────────────┘  └─────────────────────┘
```

## What changes

**Card structure** — each card is now a 2-zone composition inside a `bg-[#f5f5f5] rounded-3xl p-5` shell:

1. **Top zone (visual):** small white inner card (`bg-white rounded-xl shadow-sm p-3`) holding a tiny themed mock — same family as the `HowItWorks`/`ProblemSection` mocks for visual consistency. ~110px tall.
2. **Bottom zone (copy):** icon chip (`w-9 h-9 rounded-lg bg-[#1A8FE3]/10`) inline with title, then a single tight one-liner (max ~10 words). Descriptions trimmed.

**Per-card mini-mocks** (all pure JSX, no images):

| Card | Mini-mock |
|---|---|
| **B2B SaaS teams** | A "signal chip" row: green dot + `"Hiring 3 AEs · last week"` + small `+42` intent badge. |
| **Lead gen agencies** | 3 stacked client pills (`Acme`, `Globex`, `Initech`) each with a tiny "12 leads" counter. |
| **Sales teams** | One lead row: avatar circle "JD", name, red "● Hot · 92" badge on the right. |
| **Founders** | Single centered "founder" avatar + caption `"1 founder · 12 meetings booked"`. |
| **B2B service businesses** | Mini up-trending sparkline (svg polyline) + label `"Hiring +28%"`. |
| **RevOps / GTM operators** | Two stacked progress bars: `Fit 8.4` and `Intent 9.1` (lime fill for intent, blue for fit). |

**Bento accent** — the first card (B2B SaaS) and the fifth (B2B service businesses) get a subtle lime-tinted top border (`border-t-2 border-[#C8FF00]/40`) to break the grid rhythm and signal "primary fit" without changing layout.

**Tighter copy** — descriptions reduced to single short lines:
- B2B SaaS: *"Find companies entering your category."*
- Lead-gen agencies: *"Stronger angles for client outreach."*
- Sales teams: *"Prioritize by timing, not just ICP."*
- Founders: *"Lean outbound, no full SDR stack."*
- B2B services: *"Spot demand triggers as they happen."*
- RevOps / GTM: *"Better inputs for account selection."*

**Hover** — soft lift only (`hover:-translate-y-0.5 transition-transform`), no border change (per SnowUI rule of no hover borders).

**Animation** — keep existing framer-motion stagger (`delay: (i % 3) * 0.06`).

## Responsive

- `lg+`: 3 columns (unchanged grid).
- `md`: 2 columns (unchanged).
- mobile: 1 column, mini-mocks stay full width inside each card.

## Files

**Modified**
- `src/components/landing/UseCases.tsx` — replace the cards array with richer objects (each carrying a `Mock` component), restructure the card JSX to the 2-zone layout, add the 6 inline mini-mock components at the top of the file.

**Untouched**
- All other landing sections, navbar, hero, pricing, FAQ, ProblemSection, HowItWorks, WhyIntentsly, Comparison.

## Out of scope

- Real product screenshots (mocks stay JSX for performance + consistency with other sections).
- Adding/removing use case cards (still 6).
- Changing the section heading or the section's background.

