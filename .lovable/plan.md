

# UseCases — premium visual upgrade

The current cards feel "cheap" because: flat grey shells, tiny inner mocks floating in white boxes, weak typographic hierarchy, no depth, and an icon-chip-next-to-title pattern that reads like a generic SaaS template. This pass redesigns the card system to look like a premium B2B product showcase.

## Visual direction

Move from *"flat grey card with a tiny mock inside"* to a **bento-style dark/light card system with full-bleed visuals**, depth, and stronger typography — closer to Linear, Vercel, and Attio marketing pages than to a generic Tailwind template.

## New card anatomy (`src/components/landing/UseCases.tsx`)

```text
┌──────────────────────────────────┐
│                                  │
│    FULL-BLEED VISUAL             │
│    (gradient bg, larger mock,    │
│     floating depth, soft glow)   │
│                                  │
│ ─────────────────────────────────│
│  B2B SaaS teams                  │  ← title big, no inline icon chip
│  Find companies entering your    │  ← muted one-liner
│  category.                       │
│                                  │
│  ↗ Use case  →                   │  ← tiny footer meta row
└──────────────────────────────────┘
```

Each card becomes:

- **Outer shell**: `bg-white rounded-[28px] border border-black/5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(0,0,0,0.08)]` — subtle layered shadow instead of flat grey. No more `bg-[#f5f5f5]` shells.
- **Visual zone (top, ~180px)**: full-bleed, no inner white card. Each gets its own tinted gradient background (e.g. sky, lime, slate, indigo) with a soft radial highlight. Mock sits centered, larger (~140% of current size), with a soft drop shadow so it feels like a floating UI surface, not an embedded chip.
- **Divider**: hairline `border-t border-black/[0.06]` between visual and copy.
- **Copy zone (bottom, p-6)**:
  - Title: `text-lg font-semibold tracking-tight` (bigger than now), no icon chip beside it.
  - One-liner: `text-sm text-muted-foreground leading-relaxed`.
  - Footer meta row: tiny `text-[11px] uppercase tracking-wider text-muted-foreground` label like *"Use case · SaaS"* + a small lucide arrow on the right.

## Per-card visual treatment

Each visual zone gets a distinct backdrop + upgraded mock so the grid reads as a curated bento, not 6 identical tiles:

| Card | Backdrop | Mock upgrade |
|---|---|---|
| **B2B SaaS teams** | Soft sky→white gradient + faint grid pattern | Bigger signal card: company logo placeholder, "Hiring 3 AEs · last week", dual badges (`+42 intent`, `Hot`) |
| **Lead-gen agencies** | Lime-tinted gradient (`#C8FF00` ~8% radial) | Three client rows with mini avatars + lead counters + a tiny sparkline per row |
| **Sales teams** | Slate/indigo gradient | Larger lead row: avatar, name, role, **prominent red Hot · 92 pill**, plus a "replied 2h ago" subline |
| **Founders** | Warm off-white + subtle noise | Single hero stat: huge `12` meetings + caption "from 1 founder, last 30 days" |
| **B2B service businesses** | Lime gradient (accent) | Larger sparkline (full width, taller) + 3 micro-stats below: `Hiring +28%`, `Mentions ↑`, `Open roles 4` |
| **RevOps / GTM operators** | Indigo→white gradient | Two larger progress bars (Fit, Intent) with numeric values + a third row "Recommendation: ✓ Add to outreach" |

All mocks: same family, but rendered at a size that *fills* the visual zone instead of floating tiny in the middle. Mock surfaces use `bg-white rounded-2xl shadow-[0_8px_24px_-8px_rgba(15,23,42,0.18)]` to feel like a real product UI surface.

## Bento rhythm

- Grid stays `lg:grid-cols-3`, but the **first card spans 2 columns on lg+** (`lg:col-span-2`) — gives B2B SaaS (the primary persona) a wide hero treatment with a horizontally-laid-out mock. The other 5 stay 1-column.
- Result on `lg+`:
  ```
  [  B2B SaaS (wide)         ] [ Sales teams ]
  [ Agencies ] [ Founders   ] [ B2B services ]
  [ RevOps   ] (last row left-aligned, 1 col)
  ```
- On `md`: 2 cols, all equal. On mobile: 1 col.
- Optional: keep current 6-equal-cards layout if the asymmetric bento feels off — single boolean at the top of the file to toggle.

## Section header polish

- Eyebrow: keep `section-label` "Who Intentsly is for".
- Headline: keep, but bump to `text-5xl md:text-6xl` and tighten to `tracking-[-0.02em]`.
- Subheadline: shorten to *"One product. Six teams. Same edge: timing."*
- Add a tiny right-aligned meta line above the grid on `md+`: *"6 use cases"* in muted small caps — gives the section an editorial feel.

## Motion

- Keep framer-motion stagger but switch to a softer `y: 12, opacity: 0 → 1` with `duration: 0.5` and `ease: [0.22, 1, 0.36, 1]` for a more premium feel.
- Add a subtle hover: `hover:shadow-[0_2px_4px_rgba(0,0,0,0.04),0_16px_40px_-16px_rgba(0,0,0,0.12)]` and `hover:-translate-y-[2px]` (no border change, per SnowUI rule).

## Files

**Modified**
- `src/components/landing/UseCases.tsx` — full rewrite of the card shell + bento grid + 6 upgraded mock components + new typography.

**Untouched**
- All other landing sections, navbar, hero, pricing, FAQ, ProblemSection, HowItWorks, WhyIntentsly, Comparison.

## Out of scope

- Real product screenshots (mocks stay JSX).
- Adding/removing personas (still 6).
- Restyling the section background or page rhythm above/below.

