

## Plan: Add Analytics Section (Traffic by Device + Traffic by Location)

Add two new chart cards below the Chart + Quick Start row (line 221) in the Dashboard, matching the reference screenshot and the SnowUI design system.

### Layout
- A `grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6` row with two cards
- Each card: `bg-snow-bg-2 rounded-[20px] p-6` (same surface as PerformanceChart)

### Card 1: Traffic by Device (Bar Chart)
- Bold title "Traffic by Device" (text-sm font-bold text-snow-black-100)
- Vertical bar chart using Recharts `BarChart` with 6 bars: Linux, Mac, iOS, Windows, Android, Other
- Bar colors from the design system secondary palette: muted lavender (#C4C6F7), mint (#34D399), black (#000000), blue (#3B82F6), purple (#7B61FF), green (#22C55E)
- Y-axis with K formatter, no axis lines, light tick text
- Static/mock data (since there's no real analytics source yet)

### Card 2: Traffic by Location (Donut Chart)
- Bold title "Traffic by Location"
- Recharts `PieChart` with `Pie` (innerRadius ~60, outerRadius ~90) — donut style
- 4 segments: United States (dark gray #333), Canada (#3B82F6), Mexico (#34D399), Other (#C4C6F7)
- Legend on the right side with dot + label + percentage

### Files to Create/Modify
1. **Create** `src/components/dashboard/TrafficByDevice.tsx` — bar chart component with mock data
2. **Create** `src/components/dashboard/TrafficByLocation.tsx` — donut chart component with mock data
3. **Modify** `src/pages/Dashboard.tsx` — import both components and add a new grid row after line 221

### Technical Details
- Uses existing Recharts dependency (already used in PerformanceChart)
- Uses SnowUI design tokens for colors, radii, typography
- Mock data hardcoded; can be swapped for real analytics later
- Tooltip styling matches existing pattern (white bg, rounded-lg, border, shadow)

