

# Save SnowUI Design System as Reusable Reference

## What

Create a formal SnowUI design system file (`src/lib/design-system.ts`) with exported constants for colors, spacing, corner radius, typography, and effect styles. Also create a markdown reference doc at `src/DESIGN_SYSTEM.md` for developer reference. Update `src/index.css` to add SnowUI-specific CSS utility classes.

## Plan

### 1. Create `src/DESIGN_SYSTEM.md` — human-readable reference

Document extracted from the uploaded SnowUI images:
- **Font**: Inter (primary). Recommended alternates: SF Pro, Roboto, Averta
- **Text styles**: 64/48/32/24/18/16/14/12 px, Semibold or Regular
- **Spacing** (multiples of 4): 0, 4, 8, 12, 16, 20, 24, 28, 32, 40, 48, 80
- **Icon sizes**: 16, 20, 24, 32, 40, 48, 80
- **Corner radius**: 0, 4, 8, 12, 16, 20, 24, 28, 32, 40, 48, 80 (most used: 4, 8, 12, 16)
- **Colors**: Primary (black scale 100/80/40/20/10/4%), White scale, Secondary palette (Purple, Indigo, Blue, Cyan, Mint, Green, Yellow, Orange, Red), Background 1/2/3, Surface 1/2/3
- **Effect styles**: Glass 1, Glass 2, Glow, Focus, Inner shadow, Drop shadow 1/2, Image hover, Background blur 40/100
- **90% principle**: If a token is used less than 10%, don't add it to the system
- **Component philosophy**: Minimize component count, reuse base components

### 2. Create `src/lib/design-system.ts` — exportable constants

```ts
export const snowui = {
  colors: {
    black: { 100: '#000', 80: '#333', 40: '#666', 20: '#999', 10: '#ccc', 4: '#f5f5f5' },
    background: { 1: '#FFFFFF', 2: '#F7F8FA', 3: '#F0F1F3' },
    surface: { 1: '#FFFFFF', 2: '#F7F8FA', 3: '#EDEDF0' },
    secondary: { purple: '#7B61FF', indigo: '#6366F1', blue: '#3B82F6', cyan: '#06B6D4', mint: '#34D399', green: '#22C55E', yellow: '#EAB308', orange: '#F97316', red: '#EF4444' },
  },
  radius: { none: 0, xs: 4, sm: 8, md: 12, lg: 16, xl: 20, '2xl': 24 },
  spacing: { 0: 0, 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 7: 28, 8: 32, 10: 40, 12: 48, 20: 80 },
  text: { xs: 12, sm: 14, base: 16, lg: 18, xl: 24, '2xl': 32, '3xl': 48, '4xl': 64 },
  shadows: {
    dropShadow1: '0 1px 2px rgba(0,0,0,0.05)',
    dropShadow2: '0 4px 12px rgba(0,0,0,0.08)',
    innerShadow: 'inset 0 1px 2px rgba(0,0,0,0.06)',
  },
}
```

### 3. Add SnowUI utility classes to `src/index.css`

Add reusable CSS classes:
- `.snow-card` — white bg, border-gray-200/60, rounded-[12px], drop-shadow-1
- `.snow-card-lg` — same but rounded-[20px]
- `.snow-surface` — bg `#F7F8FA`
- `.snow-text-primary` — text-gray-900
- `.snow-text-secondary` — text-gray-500
- `.snow-btn-primary` — bg-gray-900, text-white, rounded-lg
- `.snow-input` — bg-white, border border-gray-200, rounded-lg, no focus ring

### Files changed

| File | Change |
|------|--------|
| `src/DESIGN_SYSTEM.md` | New — full SnowUI design system reference |
| `src/lib/design-system.ts` | New — exported constants for programmatic use |
| `src/index.css` | Add SnowUI utility classes at the end |

