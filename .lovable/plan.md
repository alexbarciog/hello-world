

## Plan: Replace Hero Image with Two Glossy Feature Cards

### Problem
1. The `@rolldown/binding-linux-x64-musl` dependency on line 45 of `package.json` is still present and causing the build to fail. It must be removed.
2. The hero image needs to be replaced with two modern, glossy cards.

### Changes

**1. Fix build error (`package.json`)**
- Remove `"@rolldown/binding-linux-x64-musl": "1.0.0-rc.9"` from dependencies (line 45).

**2. Replace image with two cards (`src/components/Hero.tsx`)**

Replace the `<img>` block (lines 108-114) with two side-by-side cards:

- **Card 1 — "Setup Your Signals"**: Icon (e.g., `Settings` or `Radar` from lucide), short description about configuring intent signals and ICP criteria. Glassmorphism style with backdrop-blur, subtle border, and gradient background.

- **Card 2 — "We Spy The Internet For You"**: Icon (e.g., `Search` or `Globe` from lucide), short description about AI scanning LinkedIn/X/Reddit to find people actively looking for what you offer.

**Card styling:**
- Glassmorphism: `bg-white/60 backdrop-blur-xl border border-white/30`
- Subtle shadow: `shadow-lg`
- Rounded: `rounded-2xl`
- Each card gets a small colored accent icon area with a gradient background
- Grid layout: `grid grid-cols-1 md:grid-cols-2 gap-6`
- Keeps existing `animate-fade-in-up` animation

**3. Clean up unused import**
- Remove the `appPreviewImg` import since the image is no longer used.
- The `AppPreviewMockup` component (lines 120-215) is already unused and can be removed for cleanliness.

