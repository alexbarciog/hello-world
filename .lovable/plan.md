

## Plan: Enhance Onboarding UI/UX with Landing Page Design Patterns

### Current State
The onboarding steps use a functional but plain form-based design -- standard inputs, basic labels, and minimal visual hierarchy. The landing page, meanwhile, has a polished design system with distinct patterns: `rounded-3xl` cards with `hsl(0 0% 96%)` backgrounds and `border-2 border-background`, hover animations (`opacity-80 → 100`, `scale-[1.02]`), animated gradient border spins on signal pills, `btn-cta` black pill buttons, `fadeInUp` reveal animations, and rich sub-cards with connectors and icons.

### What We'll Adopt from the Landing Page

1. **Card shell pattern** -- Use the landing page's `rounded-3xl` + `hsl(0 0% 96%)` + `border-2 border-background` + `shadow-sm` card style for grouping form sections (replacing flat `space-y` layouts).

2. **Step headers** -- Use the landing page's `font-normal` (light) large heading style instead of `font-bold` for step titles, matching the Features/HowItWorks sections.

3. **CTA buttons** -- Replace the coral/berry gradient buttons with the `btn-cta` class (black pill, `rounded-full`, shadow) used throughout the landing page, keeping disabled states.

4. **Animated reveal** -- Apply the `animate-fade-in-up` CSS class with staggered `animationDelay` to step content sections instead of the current custom inline `AnimatedField` approach.

5. **Tag pills with animated borders** -- Apply the landing page's `conic-gradient` spinning border animation to ICP/signal tags on hover (the `borderSpin` keyframe already exists in CSS).

6. **Info boxes as landing-page-style sub-cards** -- Restyle the tip/info boxes (e.g., "Think of this ICP as your starting point") using the landing page's sub-card pattern with the `intentslySmile` icon badge and `#F5F5F5` rows.

7. **Progress bar refinement** -- Use the landing page's large step numbers (`text-[40px] font-normal`, `letterSpacing: -2px`) for the active step, making the progress bar more visually distinctive.

### Files to Modify

| File | Changes |
|------|---------|
| `OnboardingProgressBar.tsx` | Restyle active step with large number treatment from HowItWorks |
| `Step1Website.tsx` | Wrap expanded fields in landing-page card shells; swap Next button to `btn-cta` style; use `animate-fade-in-up` |
| `Step2LinkedIn.tsx` | Wrap LinkedIn connect area in card shell; use `btn-cta` for Next; restyle info box with sub-card pattern |
| `Step3ICP.tsx` | Wrap each field group in card shells; add animated border spin to tags on hover; `btn-cta` for navigation |
| `Step4Precision.tsx` | Restyle mode cards with landing-page card pattern; `btn-cta` for Next |
| `Step5IntentSignals.tsx` | CardShell already close -- align to exact landing-page card styles (rounded-3xl, bg, border); add spin borders to keyword tags |
| `Step6Objectives.tsx` | Wrap sections in card shells; restyle goal/tone selectors with landing-page card hover patterns; `btn-cta` for final button |
| `Onboarding.tsx` | Update outer card container to use `rounded-3xl` + landing page shadow; update step title to `font-normal` |

### Design Details

- **Card shell CSS**: `rounded-3xl p-5 border-2 border-background` with `background: hsl(0 0% 96%)` and `box-shadow: var(--shadow-card)`
- **CTA button**: Apply `btn-cta` class (black, pill-shaped, `font-normal`) for primary actions; secondary/prev buttons stay as text links
- **Tags**: Add `group` class to tag containers, apply the existing `borderSpin` conic-gradient animation on hover to each tag pill
- **Headings**: Step titles use `text-2xl font-normal tracking-tight` (lighter weight, matching landing page aesthetic)
- **Transitions**: Replace inline AnimatedField with `animate-fade-in-up` + `animationDelay` for staggered reveals

