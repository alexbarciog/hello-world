

## Enhanced AddCardDialog Design

**Goal**: Elevate the dialog to feel more polished, trust-building, and aligned with the SnowUI design system.

### Changes

**1. Dialog container**
- Apply SnowUI tokens: `rounded-2xl` (component radius), `bg-white`, remove default border, add subtle shadow
- Widen slightly to `sm:max-w-lg` for breathing room

**2. Header with visual anchor**
- Add a top illustration area: a gradient banner strip (blue-to-purple, matching the AI action gradient `#0057bd → #4647d3`) with a centered credit card icon in a white circle
- Title centered below the banner, using `text-xl font-semibold text-snow-black`
- Add a `DialogDescription` beneath: the "free until first meeting" copy moves here (fixes accessibility — currently no `DialogDescription`)

**3. Benefit rows**
- Wrap the three benefits inside a `bg-[#f9f9fa] rounded-xl p-4` card (SnowUI surface)
- Replace colored circles with a unified style: `w-9 h-9 rounded-lg bg-white border border-snow-white-300` with the icon in `text-snow-primary`
- Add subtle separator lines between rows (`border-b border-snow-white-300` on first two)
- Tighten text: title `text-sm font-medium text-snow-black`, description `text-xs text-snow-black-100`

**4. Footer / CTA**
- Primary button: apply the signature AI gradient (`bg-gradient-to-r from-[#0057bd] to-[#4647d3]`) with white text, `rounded-xl`, `py-2.5`
- Secondary "Maybe later" button: `ghost` variant, text only, no border — reduces visual weight
- Stack footer as `flex-col gap-2` (CTA on top, dismiss below) for more impact

**5. Minor polish**
- Add a `$0 today` badge/pill near the CTA to reinforce zero-charge messaging
- Smooth open/close animation (already handled by Radix)

### Files to edit
- `src/components/AddCardDialog.tsx` — all visual changes

### Technical notes
- No new dependencies needed
- Uses existing Tailwind classes + SnowUI design tokens
- Adds `DialogDescription` for accessibility compliance

