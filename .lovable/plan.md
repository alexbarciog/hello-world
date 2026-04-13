

# Add Right-Side Panel to Dashboard

## What

Add a right sidebar panel to the dashboard that shows three sections matching the SnowUI reference: **Notifications**, **Activities**, and **Contacts** — each with avatar/icon, title text, and timestamp. The existing `RecentActivity` component will be replaced by this new unified sidebar.

## Layout Change

The dashboard layout shifts from full-width to a two-column layout:
- **Left (main)**: metrics, chart, quick start, leads, replies (existing content)
- **Right (sidebar)**: new `DashboardSidebar` component with Notifications, Activities, and Contacts sections

```text
┌─────────────────────────────┬──────────────┐
│  Metrics (4 cards)          │              │
├─────────────────────────────┤ Notifications│
│  Chart        │ QuickStart  │              │
├───────────────┴─────────────┤ Activities   │
│  Leads  │ Replies           │              │
│         │                   │ Contacts     │
└─────────────────────────────┴──────────────┘
```

## New Component: `src/components/dashboard/DashboardSidebar.tsx`

Three sections with section headers in `text-sm font-semibold text-gray-900`:

1. **Notifications** — fetches recent signal agent alerts and campaign events; each item has a round icon (light purple/blue bg) + bold text + grey timestamp
2. **Activities** — reuses existing RecentActivity logic (recent leads, campaigns) with avatar-style icons matching the SnowUI design
3. **Contacts** — shows top 5-6 recent contacts with avatar circles (initials), name in `text-sm font-medium`

All items follow the SnowUI pattern: 40px avatar/icon circle, title in dark text, subtitle/time in `text-snow-black-40`.

## Changes

| File | Change |
|------|--------|
| `src/components/dashboard/DashboardSidebar.tsx` | New — unified sidebar with Notifications, Activities, Contacts sections |
| `src/pages/Dashboard.tsx` | Wrap main content in a two-column flex layout; add sidebar on the right; remove standalone `RecentActivity` from the bottom grid |

