# Dashboard Redesign — Match reference layout

Adopt the reference screenshot's structure and visual language for the dashboard, left navigation, and top bar — while keeping all existing Intentsly data (hot leads, campaigns, LinkedIn replies, signals).

## Reference takeaways

- **Left nav (persistent, ~260px)**: Logo top, search input, `Menu` group (Dashboard, Leads, Signals, Campaigns, Unibox, Meetings), `Settings` group (Integrations, Billing, Settings). Bottom "Current Plan" card with upgrade CTA. Pure white surface, subtle gray dividers, active item = light gray pill with blue text + blue icon.
- **Top bar (sticky, ~64px)**: Back/forward chevrons, breadcrumb (Intentsly › Dashboard), right side: theme toggles, notifications bell, avatar.
- **Main canvas**: Soft blue-tinted gradient background top-left. Page title + subtitle on the left, period selector + primary CTA on the right.
- **KPI row**: 4 rounded cards (radius ~20px) with icon chip on the left, big number + delta chip, "View details →" footer link. Subtle inner border, ultra-light shadow.
- **Charts row**: Wide "Performance Overview" line chart card (title + big value + delta) with hover tooltip pill; right-side donut card with legend.
- **Bottom card**: Payments-style table (search, filter, period, then table rows) — reuse for a "Latest activity" table.
- Typography: display sizes bumped up, tracking-tight, ample white space, thin dividers.

## Files to change

- `src/pages/Dashboard.tsx` — reshape layout: header (title + subtitle + period + CTA), 4-card KPI row using the new visual, chart row (2/3 + 1/3), latest-activity table card. Remove the dark "Your pipeline, live." hero.
- `src/components/dashboard/DashboardSidebar.tsx` — replace the right-side "notifications/activities/contacts" panel with the new **left** nav: logo, search, menu groups, plan card. Move to left of content.
- `src/components/dashboard/MetricCard.tsx` — new variant: soft white card, icon chip left, number + delta chip right, "View details →" footer.
- `src/components/dashboard/PerformanceChart.tsx` — restyle: title top-left, big total + delta below, period pill top-right, custom tooltip pill matching reference.
- `src/components/dashboard/LeadsByTier.tsx` — restyle donut card: title, big value + delta, donut center label, colored legend dots below.
- New `src/components/dashboard/DashboardTopBar.tsx` — breadcrumb + back/forward, theme toggle, bell, avatar.
- New `src/components/dashboard/DashboardShell.tsx` (or inline in `Dashboard.tsx`) — flex layout with sidebar + main column + top bar.
- Reuse `LatestReplies` styled as a table for the bottom card (or a new `RecentActivityTable`).

## Technical notes

- Keep all Supabase queries and animations (`fadeStagger`, `Reveal`, `CountUp`, `framer-motion` hover-lift) intact — this is presentation only.
- No changes to routes, business logic, or edge functions.
- Colors: white surfaces `bg-white`, borders `border-neutral-200/70`, background gradient `from-sky-50/40 via-white to-white`, primary CTA blue `bg-[#3B82F6]`, active nav `bg-blue-50 text-[#3B82F6]`.
- Sidebar is dashboard-only (does not affect other app pages).

## Out of scope

- Renaming Intentsly to the reference brand.
- Reworking other pages (Leads, Campaigns, etc.).
- Backend/data changes.
