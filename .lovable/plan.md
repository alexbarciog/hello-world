

## Plan: Align Settings Page Styling with Dashboard Design System

The Dashboard uses white page background, SnowUI Background 2 (`#F7F8FA` / `bg-snow-bg-2`) surfaces with `rounded-[20px]`, no borders/shadows, and the SnowUI color tokens. The Settings page currently uses `bg-card`, `border-border`, `rounded-2xl`, and generic foreground/muted-foreground colors. This plan brings Settings in line with the Dashboard.

### Changes (single file: `src/pages/Settings.tsx`)

**1. Outer container**
- Change `bg-card rounded-2xl m-3 md:m-4` to `bg-white px-6 py-6` (matching Dashboard wrapper)

**2. Header section**
- Remove `border-b border-border` wrapper
- Style title as `text-lg font-semibold text-gray-900` (like Dashboard's "Overview" heading)
- Subtitle: `text-sm text-gray-500`
- Remove gradient icon effect, use plain gray icon

**3. Sidebar nav (desktop)**
- Remove `border-r border-border`
- Surface: `bg-snow-bg-2 rounded-[20px] p-4 mr-6`
- Active tab pill: `bg-black text-white rounded-xl` (keep current pattern, already close)
- Inactive: `text-gray-500 hover:bg-gray-100 rounded-xl`

**4. SectionCard component**
- Change from `rounded-2xl border border-border bg-card p-6` to `bg-snow-bg-2 rounded-[20px] p-6` (no border, no shadow — matching Dashboard cards)

**5. Input styling**
- Update `inputCls` focus ring from coral to plain gray or blue (`focus:ring-gray-200 focus:border-gray-300`) to remove the branded coral accent and stay neutral like the Dashboard

**6. SaveButton**
- Replace `btn-cta` with a simple `bg-black text-white rounded-xl px-5 py-2.5 text-sm font-medium hover:bg-gray-800` to match the flat Dashboard aesthetic

**7. Mobile tab nav**
- Remove `border-b border-border`, keep pill grid but update active state to `bg-black text-white`

### Files Modified
- `src/pages/Settings.tsx` — styling updates only, no logic changes

