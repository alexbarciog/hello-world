

# Add SnowUI Colors to Design System

## What

The SnowUI color reference image shows additional color scales not yet captured: **Primary** (with Color 1/Color 2 variants), **White scale** (100%–4%), and proper Tailwind integration so these colors are usable via classes like `text-snow-purple`, `bg-snow-surface-2`, etc.

## Changes

### 1. Update `src/lib/design-system.ts`

Add the missing color scales:
- **Primary**: primary color, color1, color2 (from SnowUI-Light theme)
- **White scale**: white-100 (#FFFFFF) through white-4 (#F5F5F5) — the inverse of the black scale

### 2. Update `src/DESIGN_SYSTEM.md`

Add the White scale table and Primary section to the Colors documentation.

### 3. Add SnowUI colors to `tailwind.config.ts`

Register a `snow` color namespace so all SnowUI colors are available as Tailwind utilities:
```
snow-black-100, snow-black-80, snow-black-40, ...
snow-white-100, snow-white-80, ...
snow-bg-1, snow-bg-2, snow-bg-3
snow-surface-1, snow-surface-2, snow-surface-3
snow-purple, snow-indigo, snow-blue, snow-cyan, snow-mint, snow-green, snow-yellow, snow-orange, snow-red
```

This means you can write `bg-snow-purple`, `text-snow-black-80`, `border-snow-surface-3` etc. anywhere in the app.

### Files changed

| File | Change |
|------|--------|
| `src/lib/design-system.ts` | Add `white` scale and `primary` color group |
| `src/DESIGN_SYSTEM.md` | Add White scale and Primary color docs |
| `tailwind.config.ts` | Add `snow` color namespace using design-system hex values |

