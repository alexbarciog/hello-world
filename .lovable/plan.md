# Animated Desktop Navbar

Four layered animations on `src/components/Navbar.tsx` (desktop pill only — mobile burger untouched).

## 1. Staggered entrance (first load)

Replace the single `motion.div` fade-in with a Framer Motion parent `variants` container and child variants so each element pops in sequentially:

- Container: fades + slides down over 0.5s
- Children stagger: logo → each nav link → login → CTA button, `staggerChildren: 0.06`, each child `y: -8 → 0`, opacity `0 → 1`, ease `[0.22, 1, 0.36, 1]`
- Runs once on mount (no re-trigger on scroll state change)

## 2. Shrink & morph on scroll

Extend the existing `scrolled` boolean (already toggles at `scrollY > 20`) to also drive size:

- Pill max-width: `max-w-5xl` → `max-w-3xl` when scrolled
- Vertical padding: `py-3` → `py-2`
- Logo image height: `h-10` → `h-8`
- Nav link gap: `gap-8` → `gap-6`
- CTA padding shrinks one step
- All transitioned via `transition-all duration-300 ease-out` (framer `layout` prop on the pill for smooth width morph)
- Shadow deepens slightly when scrolled (`shadow-md` instead of `shadow-sm`) for lift

## 3. Animated link underline + magnetic hover

Rewrite each nav link as a `<a>` wrapping the label with an absolutely-positioned underline span:

- Underline: `absolute left-0 -bottom-1 h-[1.5px] w-full bg-current origin-left scale-x-0 transition-transform duration-300 ease-out`
- On `group-hover`: `scale-x-100`
- Also add a subtle `whileHover={{ y: -1 }}` micro-lift on the link via `motion.a`
- Login button gets the same underline treatment

## 4. CTA glow + arrow motion

`Start for $97` button (desktop + mobile menu variant):

- Wrap in `motion.button`, add `whileHover={{ scale: 1.03 }}` and `whileTap={{ scale: 0.97 }}`
- Add a persistent soft lime glow via a pseudo layer: `after:absolute after:inset-0 after:rounded-full after:bg-[#C8FF3B] after:blur-xl after:opacity-40 after:-z-10 after:animate-pulse` (2.5s pulse)
- Arrow icon: wrap in a span with `transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5` so on hover the `ArrowUpRight` slides up-right
- Add `group` class to the button so children respond

## Technical notes

- All animations use Framer Motion (already imported) + Tailwind utilities; no new deps.
- `prefers-reduced-motion` respected by using Framer's built-in `useReducedMotion` to disable stagger + hover lift when set.
- Mobile burger and mobile overlay menu are unchanged except the mobile CTA gets the same arrow-slide + scale hover.
- No changes to routing, link targets, or the `forceDark` / `showCampaigns` props.

## Files touched

- `src/components/Navbar.tsx` (only file edited)
