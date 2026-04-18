
## Redesign AI Insights Modal — Intentsly Brand

Refactor `src/components/contacts/AIInsightsModal.tsx` to remove all violet/indigo gradients, drop colored left borders, and align with brand: sky blue (#1A8FE3), lime CTA (#C8FF00), Inter with tight tracking, frosted-grey container.

### Visual changes

**Container & backdrop**
- Backdrop: `bg-slate-900/40 backdrop-blur-md` (lighter, more frosted, less opaque)
- Modal surface: `bg-slate-50/80 backdrop-blur-xl border border-slate-200/70` — frosted grey glass, no shadow-2xl (use `shadow-sm` only)
- Rounded `rounded-2xl`, no gradient backgrounds anywhere

**Typography**
- Apply `font-sans tracking-tight` (Inter is already default sans) at the modal root
- Headings: `tracking-tight`, body kept default; small uppercase labels switched to normal-case `tracking-tight` (no more uppercase tracking-wide)

**Header**
- Remove violet gradient strip (`from-violet-500/10...`) → plain `bg-white/40` with thin `border-b border-slate-200/60`
- "AI Insights Report" label: switch violet → sky `text-[#1A8FE3]`
- Avatar circle kept but flatten (remove shadow)

**Tabs**
- Active underline: `border-[#1A8FE3]` (sky) instead of violet
- Inactive: `text-slate-500 hover:text-slate-900`

**Intent tab**
- Remove colored left border on "Suggested Action" card → flat card `bg-white/60 border border-slate-200/70 rounded-xl`
- Section labels (Summary, Key Insights, Suggested Action): `text-slate-500 text-xs font-medium tracking-tight` (no uppercase, no violet)
- Cards: uniform `bg-white/60 border border-slate-200/60`

**Personality tab**
- DISC hero: remove gradient bg + gradient badge. Use flat `bg-white/70 border border-slate-200/60 rounded-2xl`. The DISC initials badge becomes solid sky `bg-[#1A8FE3] text-white`, no shadow
- Trait pills: `border-slate-200 text-slate-700 bg-white/60` (drop violet tint)
- "How to communicate" card: remove `border-l-4 border-l-violet-500`. Flat card `bg-white/60 border border-slate-200/60`. Label color → slate
- Do/Don't: keep emerald check / rose X icons (semantic, not brand) but labels neutral slate; cards flat
- Three info cards: flat `bg-white/60 border border-slate-200/60`, icon + title in slate (no violet)
- Confidence pill: keep semantic colors (emerald/amber/rose) — they convey meaning

**Footer CTA**
- Replace violet→indigo gradient with **lime CTA**: `bg-[#C8FF00] text-slate-900 hover:bg-[#b8ef00]`, no shadow, `rounded-xl`, `font-semibold tracking-tight`
- Keeps LinkedIn icon

### What stays
- Layout structure, tab logic, data flow, edge function calls — unchanged
- Semantic colors for Do/Don't (emerald/rose) and confidence pill (intentional signal)
- Skeleton loaders (just retinted to slate)

### Files
- `src/components/contacts/AIInsightsModal.tsx` — single-file refactor

### Out of scope
- No edge function changes
- No new fields or interactions
- No mobile layout changes (already responsive)
