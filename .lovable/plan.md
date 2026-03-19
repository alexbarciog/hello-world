
## Dashboard Premium Polish — Cosmetic Redesign

### What's changing
Purely visual upgrades to `src/pages/Dashboard.tsx`. Zero layout, data, or functionality changes. Every element stays in its exact position.

### Techniques applied per section

**Outer container**
- Switch from `bg-card` flat white to a very subtle warm-tinted background (`bg-[hsl(30_20%_98%)]`) so cards pop against the surface
- Keep `rounded-2xl m-2 md:m-4 px-4 md:px-8 py-6`

**All stat/content cards** (the flat `bg-white rounded-xl border border-gray-100 shadow-sm` pattern)
- Replace flat `shadow-sm` with a multi-layer ambient shadow: `shadow-[0_2px_4px_hsl(220_14%_10%/0.04),0_8px_24px_hsl(220_14%_10%/0.08),0_1px_2px_hsl(220_14%_10%/0.06)]`
- Replace `border-gray-100` with `border-white/80` — micro-thin semi-transparent white border for glass edge effect
- Add `relative overflow-hidden` + an inset shine overlay div: `<div className="absolute inset-0 bg-gradient-to-br from-white/60 via-transparent to-transparent pointer-events-none rounded-xl" />`
- Increase padding slightly: `p-5` → `p-6`

**Header badges** (0 Active Signals, 2 LinkedIn Accounts)
- Add subtle inner shadow and slightly elevated background
- LinkedIn badge: `bg-emerald-50/80 border-emerald-200/60 backdrop-blur-sm`
- Signals badge: `bg-red-50/80 border-red-200/60 backdrop-blur-sm`

**"Start a campaign" button**
- Replace flat solid color with a gradient: `from-[hsl(18_95%_58%)] to-[hsl(5_90%_65%)]`
- Add box-shadow glow: `shadow-[0_4px_16px_hsl(5_90%_65%/0.45)]`
- Hover: `hover:shadow-[0_6px_24px_hsl(5_90%_65%/0.55)] hover:scale-[1.02]`
- Add `transition-all duration-200`

**Stats numbers** (3, 0, 0)
- Upgrade to `text-[hsl(222_28%_12%)] font-black` for more visual weight

**Activity Overview chart card**
- Chart line: add `strokeWidth={2.5}` + custom `activeDot` with fill and glow stroke
- Chart tooltip: upgrade to glass-style `background: rgba(255,255,255,0.95)`, `boxShadow: "0 4px 20px rgba(0,0,0,0.12)"`, `backdropFilter: "blur(8px)"`
- Legend dot: `bg-[hsl(var(--goji-coral))]` (coral, not green, to match the line color)
- "Last 30 days" filter pill: add subtle border and rounded-lg

**Hot Leads card**
- Lead name color: change `text-blue-500` → `text-[hsl(222_28%_15%)] font-semibold` (no blue per directive)
- "View More" button: `text-[hsl(var(--goji-coral))]` instead of blue
- Lead avatar container: add a subtle ring `ring-1 ring-white/50`
- Each lead row: add `hover:bg-[hsl(5_90%_65%/0.04)] rounded-lg px-2 -mx-2 transition-colors`

**Latest Replies card**
- Icon container background: `hsl(var(--goji-coral) / 0.10)` with coral icon instead of blue
- MessageSquare icon: `text-[hsl(var(--goji-coral))]`
- "Activate your Unibox" link: coral instead of blue
- Empty state icon: `text-[hsl(220_14%_88%)]`

**Get Started panel**
- Accordion button hover: `hover:bg-[hsl(5_90%_65%/0.03)]` (warm tint instead of cold gray)
- Checkmark circle for completed step: keep emerald/teal-green
- Incomplete circles: `border-[hsl(220_20%_75%)]`
- Border separator: `border-[hsl(220_14%_93%)]`

**Floating action button**
- Upgrade gradient to `from-[hsl(18_95%_58%)] to-[hsl(5_90%_65%)]`
- Shadow: `shadow-[0_8px_32px_hsl(5_90%_65%/0.5),0_2px_8px_hsl(0_0%_0%/0.15)]`
- Hover: `hover:shadow-[0_12px_40px_hsl(5_90%_65%/0.6)] hover:scale-110`

### Files changed
- `src/pages/Dashboard.tsx` only — purely inline style/className upgrades, no structural changes
