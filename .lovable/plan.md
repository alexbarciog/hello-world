

## Integrations Tab Redesign — High-Tech Silicon Valley Aesthetic

### Current State
The Integrations page uses a basic white card layout with simple borders, standard badges, and flat styling. It doesn't match the high-density glassmorphism, gradient accents, and premium feel of the landing page.

### Design Direction
Align with the landing page's aesthetic: glassmorphism cards, gradient accents, subtle glows, Space Grotesk typography cues, and the SnowUI design system tokens.

### Changes

**1. Page container & header**
- Replace plain white `bg-white rounded-2xl` with `bg-snow-white-100` surface + subtle noise/gradient background
- Restyle the header icon with a larger frosted-glass badge and gradient shimmer
- Use `font-[Space_Grotesk]` for the page title

**2. Info banner upgrade**
- Add `backdrop-blur-xl bg-white/60` glassmorphism treatment
- Increase the glow effect (dual radial gradients, indigo + purple tints)
- Refine the "Auto" badge with a soft animated pulse ring

**3. Provider cards — glassmorphism treatment**
- `bg-white/70 backdrop-blur-lg` with `border border-white/20` and soft box-shadow
- On hover: scale-[1.02] with increased glow shadow
- Connected state: subtle green gradient border glow instead of flat green background
- Logo containers: frosted circle/rounded-square with inner shadow
- "Connect" button: gradient fill (`from-primary to-indigo-600`) with subtle shadow, matching the landing page CTA style
- "Connected" badge: glass pill style (bg-green-500/10 backdrop-blur) with dot ping

**4. Grid layout refinement**
- Switch to a responsive grid that breathes more: `gap-6` with slightly larger card padding
- Add staggered fade-in entrance animations using CSS `@keyframes` + `animation-delay`

**5. API key dialog**
- Glassmorphism overlay (`bg-black/40 backdrop-blur-sm`)
- Dialog card with frosted glass background and gradient accent stripe on top
- Gradient "Connect" button consistent with the card buttons

### Technical Details
- Single file edit: `src/pages/Integrations.tsx`
- All styling via Tailwind utility classes — no new dependencies
- Uses existing design tokens from `index.css` and `design-system.ts`
- Preserves all existing logic (connect, disconnect, toggle, API key flow) unchanged

