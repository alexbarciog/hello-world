

## Scheduled Tab UI Redesign

### Current State
The scheduled tab has three main sections:
1. **Today's Schedule** header card with date, status badge, progress bar, and remaining contacts
2. **Accordions** for LinkedIn Connections and Today's Messages (each with lead cards inside)
3. **Full Sequence Overview** at the bottom showing workflow steps

The current design uses emoji icons (📅, ⚡, 👥, 📋), generic rounded cards, and a somewhat cluttered layout. It works but feels more like a prototype than a polished product.

### Proposed Changes

**1. Today's Schedule Header Card** (lines 2514-2552)
- Replace emoji icons with proper Lucide icons (`Calendar`, `Zap`, `Users`)
- Use a cleaner two-column stat layout: status badge + daily progress on the left, contacts remaining on the right
- Upgrade the progress bar with a subtle animated gradient and percentage label
- Add a subtle left-accent border stripe (indigo) instead of the gradient background
- Tighter spacing, remove the gradient-to-primary tint

**2. Connections & Messages Accordions** (lines 2564-2869)
- Replace the flat `bg-muted/20` accordion headers with a cleaner design: subtle left color stripe (violet for connections, teal for messages)
- Simplify lead cards inside: remove the heavy `shadow-md` and glass overlay, use a clean flat card with `bg-muted/30` and `border-border/40`
- Tighten the layout: reduce padding from `p-4` to `p-3`, smaller avatars from `w-9 h-9` to `w-8 h-8`
- Make status badges more consistent: use dot indicators instead of emoji (✓, ✗, ⏳)

**3. Empty State** (lines 2871-2884)
- Replace the 📋 emoji with a proper `CalendarOff` or `Inbox` Lucide icon in a soft circle
- Add a subtle illustration-style empty state

**4. Full Sequence Overview** (lines 2891-2928)
- Convert from a plain list to a vertical timeline with a connecting line between steps
- Each step gets a numbered circle on the timeline
- Add delay badges as pills between steps on the timeline line
- Cleaner typography: remove "Step X:" prefix, use the step number in the circle

**5. General Polish**
- Remove all emoji usage in favor of Lucide icons throughout the tab
- Consistent use of the snow design system colors
- Smoother motion transitions

### Files to Edit
- `src/pages/CampaignDetail.tsx` — the scheduled tab section (lines ~2510-2930)

### No Functional Changes
All data fetching, state management, edit/regenerate logic, and accordion behavior remain identical. This is purely a visual refresh.

