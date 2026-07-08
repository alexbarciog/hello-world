
# Dashboard Design Enhancement Plan

Bring the "alive" landing-page feel into `/dashboard` without changing any queries, data shape, or business logic. Purely visual + motion polish, using the same `framer-motion` vocabulary already used across `src/components/landing/*` (EASE `[0.22, 1, 0.36, 1]`, `SectionReveal`, `Reveal`, `CountUp`, `Float` from `src/lib/motion.tsx`).

## Design Language (borrowed from landing)

- Motion easing: `[0.22, 1, 0.36, 1]`, durations 0.5–0.9s.
- Scroll-in staggered reveal for every section (`Reveal` / `SectionReveal`).
- Hover: `y: -4`, subtle `scale: 1.01`, spring `stiffness: 260, damping: 20`.
- Soft animated color blobs (like `FinalCTA`) as ambient background — very low opacity, non-distracting.
- Rounded 20–24px cards, `border-gray-200/60`, add a hairline animated gradient sheen on hover.
- Keep SnowUI palette + `#EDEEFC` / `#E6F1FD` pastel metric cards.

## Sections & Changes

### 1. Page shell (`src/pages/Dashboard.tsx`)
- Wrap main container with an ambient background: two low-opacity radial blobs (indigo `#EDEEFC`, sky `#E6F1FD`) animated slowly (`x/y/scale` loop, 18–22s), absolutely positioned behind content.
- Animate header: `Reveal` on H1, fade-in on "Today" button with subtle hover scale.
- Stagger children with `motion` container using `fadeStagger` variants so metric row → chart → activity → leads cascade in.

### 2. Metric cards (`src/components/dashboard/MetricCard.tsx`)
- Wrap in `motion.div` with `whileHover={{ y: -4 }}` spring.
- Replace static number with `CountUp` (from `src/lib/motion.tsx`) when numeric.
- Add hover sheen: radial-gradient overlay fading in on hover.
- Entrance: `initial opacity 0, y 20, scale 0.96` → `whileInView` visible, staggered 60ms.

### 3. Performance chart (`src/components/dashboard/PerformanceChart.tsx`)
- Wrap card in `Reveal`, add hover lift.
- Recharts `<Line>` / `<Area>` uses `isAnimationActive` + `animationDuration={1200}` `animationEasing="ease-out"` so lines draw in on mount and when data changes.
- Add subtle gradient fill under line via `<defs><linearGradient>` in indigo → transparent.

### 4. Daily Activity (`src/components/dashboard/DailyActivityChart.tsx`)
- Same reveal + hover lift.
- Bars: `animationDuration={900}`, staggered per series via `animationBegin`.
- Legend chips get hover scale.

### 5. Leads by Tier (`src/components/dashboard/LeadsByTier.tsx`)
- Donut `animationDuration={1100}` sweep-in, center number using `CountUp`.
- Legend rows fade-in with 80ms stagger.

### 6. Hot Leads + Latest Replies (`HotLeadsList`, `LatestReplies`)
- Card reveal with hover lift.
- Each row: staggered fade/slide-in (`y: 8`, 50ms stagger).
- Avatar hover scale 1.06, name gets subtle `story-link` underline animation on hover.
- "Open Inbox" / "View all" buttons: magnetic hover (shadow + slight y-shift).

### 7. Banners (`SetupWizardBanner`, `SubscriptionBanner`, `AgencyWelcomeBanner`)
- Slide-down entrance (`y: -12` → 0).
- Progress ring/segments in Setup Wizard get animated stroke-dashoffset draw-in.

### 8. Shared micro-interactions
- Add a reusable `DashCard` wrapper (or apply inline) that composes `Reveal` + hover lift + optional sheen — keeps code DRY across all six card components.

## Technical Notes

- No changes to `useQuery` calls, edge functions, or Supabase schema.
- Reuse existing helpers from `src/lib/motion.tsx` (`Reveal`, `CountUp`, `fadeStagger`, `fadeStaggerItem`).
- Respect `prefers-reduced-motion`: framer-motion honors it by default; keep transitions short and avoid infinite spinners near text.
- Keep bundle impact zero — `framer-motion` already used across landing.
- No color tokens hardcoded outside existing SnowUI + pastels already in use.

## Files to Touch

- `src/pages/Dashboard.tsx` — shell, ambient blobs, staggered container.
- `src/components/dashboard/MetricCard.tsx` — CountUp, hover, sheen.
- `src/components/dashboard/PerformanceChart.tsx` — reveal, animated line, gradient fill.
- `src/components/dashboard/DailyActivityChart.tsx` — reveal, animated bars.
- `src/components/dashboard/LeadsByTier.tsx` — reveal, animated donut, CountUp center.
- `src/components/dashboard/HotLeadsList.tsx` — reveal, row stagger, hover.
- `src/components/dashboard/LatestReplies.tsx` — reveal, row stagger, hover.
- `src/components/dashboard/SetupWizardBanner.tsx` — entrance + progress draw-in.
- `src/components/dashboard/SubscriptionBanner.tsx` — entrance slide.
- `src/components/dashboard/AgencyWelcomeBanner.tsx` — entrance slide.

## Out of Scope

- Sidebar (`DashboardSidebar`) — not visible in current view; can be a follow-up.
- Data model, routing, permissions, copy changes.
