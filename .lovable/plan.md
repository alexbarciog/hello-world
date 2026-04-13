

## Plan: Align Campaigns Page with Dashboard SnowUI Design

The Dashboard uses `bg-white`, SnowUI `bg-[#F7F8FA]` surfaces with `rounded-[20px]`, pastel MetricCards, no borders/shadows, and neutral typography. The Campaigns page currently uses `glass-card`, `ghost-border`, Material Design tokens (`md-*`), gradient stat cards, and `font-headline` styling. This plan brings it in line.

### Changes (single file: `src/pages/Campaigns.tsx`)

**1. Page container**
- Change `rounded-2xl m-3 md:m-4 p-6 md:p-10 font-body` to `px-6 py-6` (matching Dashboard)

**2. Header**
- Title: `text-lg font-semibold text-gray-900` (like Dashboard "Overview")
- Subtitle: `text-sm text-gray-500`
- "Start a campaign" button: `bg-black text-white rounded-xl` flat style, remove inline gradient

**3. Summary stat cards**
- Replace gradient/glass cards with `MetricCard` component (already used in Dashboard)
- Use pastel backgrounds: `bg-[#EDEEFC]`, `bg-[#E6F1FD]`, `bg-[#e8f0fb]`, `bg-[#E6F1FD]`
- Remove all `md-*` color tokens, icon overlays, and ring effects

**4. "Active Outreach Streams" section header**
- Style as `text-sm font-semibold text-gray-900`
- Sort text: `text-sm text-gray-500`

**5. Campaign cards (`CampaignCard`)**
- Replace `glass-card ghost-border rounded-2xl` with `bg-[#F7F8FA] rounded-[20px]` (no border, no shadow)
- Hover: `hover:bg-[#F0F1F3]` (subtle surface shift, no shadow)
- Icon container: `bg-white rounded-xl` instead of gradient
- Stats labels: `text-xs text-gray-500` instead of `md-outline`
- Stats values: `text-lg font-semibold text-gray-900`; remove `md-primary`/`md-secondary` colored values
- "View Leads" button: `bg-black text-white rounded-xl px-4 py-2 text-xs font-medium`
- Goal badge: `bg-[#F7F8FA] text-gray-600` instead of white/emerald border

**6. Empty state**
- Step icons: `bg-[#F7F8FA] rounded-[20px]` instead of `glass-card ghost-border`
- Icon colors: use gray-600 instead of `md-primary`/`md-secondary`/`md-tertiary`
- CTA button: `bg-black text-white rounded-xl` flat style

**7. Loading skeletons**
- Replace `glass-card ghost-border` with `bg-[#F7F8FA] rounded-[20px]`

### Files Modified
- `src/pages/Campaigns.tsx` -- styling updates only, no logic changes

