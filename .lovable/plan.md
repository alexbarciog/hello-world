

## Plan: Redesign Campaign Stats Cards

The current stats cards use the MD3 blue palette with glass-card styling. The goal is to restyle them to match the landing page's warm, elegant aesthetic — peach/coral/orange tones, smooth gradients, and refined typography.

### Changes (single file: `src/pages/Campaigns.tsx`)

**1. Stats container** — Add a warm gradient background wrapper matching the hero's `--goji-bg-hero` / `--goji-bg-hero-2` tones, with rounded corners and subtle padding.

**2. Individual stat cards** — Replace `glass-card ghost-border` with:
- Solid white cards with a subtle warm border (`border-goji-coral/15`)
- Rounded `rounded-2xl` with a soft warm shadow
- Icon circles using the goji gradient (`from-goji-orange to-goji-coral`) instead of blue MD3 tones
- Icon color changed from `text-md-primary` to white (on gradient background)

**3. Typography** — Stat values get a warm gradient text treatment (`bg-gradient-to-r from-goji-berry to-goji-coral bg-clip-text text-transparent`) for the numbers, keeping labels in a warm muted tone (`text-goji-dark`).

**4. Wrapper section** — The entire stats grid gets wrapped in a container with:
- `bg-gradient-to-br from-[hsl(5,85%,96%)] to-[hsl(20,90%,94%)]` (matching hero gradient)
- `rounded-3xl p-8` with a subtle `border border-goji-coral/10`

This creates a visually distinct "warm zone" that mirrors the landing page's personality while keeping the dashboard functional.

