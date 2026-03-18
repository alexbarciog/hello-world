
## Plan: Redesign CTASection to match landing page harmony

### Goal
Completely redesign the `CTASection` in `CTAFooter.tsx` to feel cohesive with the Hero section's video-background aesthetic while adding:
1. A subtle animated background (floating orbs / soft pulsing gradient blobs using CSS keyframes)
2. A glass-effect CTA button (frosted glass with backdrop-blur, subtle border, white text)
3. Better typography hierarchy and visual polish

### Approach

**Background**: Instead of a flat radial gradient + grid, use:
- A dark-to-rich gradient base (`hsl(228 38% 8%)` → `hsl(228 38% 14%)`) — deep navy/dark matching `goji-dark` 
- Two large blurred animated gradient orbs (coral + orange brand colors) that slowly float/pulse using CSS `@keyframes`
- Subtle grid overlay (same `hero-grid-bg` pattern but lower opacity on dark bg)
- This dark section creates a strong visual "closing statement" contrast before the white footer

**Typography**: White headings on the dark bg, softer muted subtitle

**Glass CTA button**: 
- `backdrop-blur-md` + `bg-white/10` + `border border-white/20`
- Inner glow on hover: `shadow-[0_0_30px_rgba(255,255,255,0.15)]`
- White text + ArrowUpRight icon
- Smooth `transition-all` on hover with slight scale

### Files to Edit

1. **`src/components/CTAFooter.tsx`** — Redesign `CTASection`:
   - Replace background with dark navy + two animated orbs (absolute divs with `animate-[float1_8s_ease-in-out_infinite]` + `animate-[float2_10s_ease-in-out_infinite_1s]`)
   - Add inline `<style>` tag with the two float keyframes (to avoid touching the global CSS, or add to index.css)
   - Replace `.btn-cta` button with a glass button component inline
   - Keep the Footer unchanged

2. **`src/index.css`** — Add two new keyframe animations:
   - `@keyframes float1` — slow vertical + horizontal drift for orb 1
   - `@keyframes float2` — inverse drift for orb 2

### Visual Design

```
┌─────────────────────────────────────────────────────────────┐
│  [dark navy bg]                                             │
│    🟠 large blurred coral orb (top-left, slow float)        │
│              🟡 large blurred orange orb (bottom-right)     │
│                                                             │
│         subtle grid overlay (low opacity white lines)       │
│                                                             │
│   More High-Intent Leads =                                  │
│   Your New Growth Engine.          ← white, extrabold       │
│                                                             │
│   Start Now and Get New High Intent Leads...               │
│                         ← white/60 muted                   │
│                                                             │
│   [ ✦ Launch your AI Agent for free  ↗ ]                   │
│     ← glass button: blur bg, white border, white text      │
└─────────────────────────────────────────────────────────────┘
```

### Details

- Orb 1: `w-[600px] h-[400px]` positioned top-left, `bg-[hsl(5_90%_65%/0.35)]` (coral), `blur-[120px]`, `rounded-full`
- Orb 2: `w-[500px] h-[350px]` positioned bottom-right, `bg-[hsl(18_95%_58%/0.25)]` (orange), `blur-[100px]`, `rounded-full`
- Glass button: `inline-flex items-center gap-2 px-7 py-3.5 rounded-full backdrop-blur-md bg-white/10 border border-white/20 text-white font-medium text-base hover:bg-white/20 hover:shadow-[0_0_40px_rgba(255,255,255,0.12)] transition-all duration-300 hover:scale-[1.02]`
- Float animation: gentle translateX + translateY sinusoidal movement, ~8-12s duration
