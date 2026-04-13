

# Sidebar Redesign — Pixel-Perfect SnowUI Match

## Reference Analysis (from uploaded image)

The SnowUI sidebar has these specific characteristics:
- **Width**: ~240px, pure white background, no visible border-right (or very subtle one)
- **Logo area**: Top-left, logo + "SnowUI" text, generous top padding (~24px)
- **Nav items**: Large touch targets (~44px height), icon + label, generous left padding (~16px)
- **Active state**: Light gray pill/rounded background (`bg-gray-100`), full-width rounded-lg
- **Inactive state**: No background, `text-gray-600` weight, clean spacing
- **Icons**: 20px, consistent gray tone, left-aligned with ~12px gap to label
- **Spacing between items**: Tight — ~2-4px vertical gap between nav buttons
- **No collapse toggle visible** in the reference — clean, no chevron arrows cluttering the header
- **Bottom user area**: Avatar (photo/initials) + name, pinned to bottom with generous padding
- **No "Go Premium" card, no Help/Support links** — just clean nav + user at bottom
- **No top header bar** — the SnowUI reference has no horizontal header strip

## Plan

### 1. Sidebar structure overhaul (`DashboardLayout.tsx`)

**Logo area:**
- Remove the collapse chevron button from the logo row
- Increase padding: `px-5 pt-6 pb-4`
- Logo 28px + brand name in `text-base font-semibold`
- Keep collapse functionality but move trigger to a subtle hover-only button or remove entirely for clean look (add it back on icon hover)

**Nav items:**
- Increase icon size to 20px (`w-5 h-5`)
- Increase item height: `py-2.5 px-3`
- Gap between icon and label: `gap-3`
- Font: `text-[14px]` (not `text-sm` which is 14px already, but ensure consistent)
- Active: `bg-gray-100 text-gray-900 font-medium rounded-lg`
- Inactive: `text-gray-500 hover:bg-gray-50 hover:text-gray-700`
- Remove badge pills (Beta tags) — or keep them very subtle
- Vertical spacing: `space-y-1`

**Bottom section:**
- Remove the "Go Premium" / subscription card entirely from the sidebar
- Remove Help Center and Support buttons from the sidebar
- Keep only the user avatar + name + email at the very bottom
- User row: avatar (rounded-full, 36px) + name + email, clean divider above
- Remove the dropdown chevron — just show user info; clicking opens the menu

**Sidebar width:**
- Expand to `w-[240px]` (from 230px) for better breathing room

### 2. Top header bar simplification
- Keep the minimal header with just the notification bell on the right
- On desktop, remove the empty `<div className="hidden md:block" />` placeholder

### 3. Files changed

| File | Change |
|------|--------|
| `src/components/DashboardLayout.tsx` | Redesign sidebar: larger spacing, remove premium card/help/support from sidebar, clean user section, match SnowUI proportions |

### Result
A sidebar that matches the SnowUI reference: clean white surface, well-spaced nav items with rounded active states, minimal chrome, and a simple user profile pinned at the bottom.

