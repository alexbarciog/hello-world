

## AI SDR Banner UI Redesign

### Current State
The "Conversational AI Banner" (lines 1204-1230 in CampaignDetail.tsx) is a simple horizontal bar with a blue gradient background, a Bot icon in a white/60 glass circle, text, and a green "Live" dot badge. It works but feels generic and doesn't match the premium aesthetic of the landing page.

### Design Direction
Align with the landing page's visual language: glassmorphism, subtle depth, clean neutrals with a signature accent. The banner should feel like a premium status indicator, not a basic info bar.

### Changes

**1. Background Treatment**
- Replace the blue gradient with a neutral frosted-glass card: `bg-white border border-border/50` with a very subtle inner glow or left-accent stripe using the brand indigo (`#4F46E5`)
- Add a faint decorative gradient blob in the top-right corner (indigo/purple, blurred) for depth, similar to the Contacts unlock banner

**2. Icon Upgrade**
- Replace the plain `bg-white/60` icon container with a gradient icon badge: `bg-gradient-to-br from-[#4F46E5] to-[#6366F1]` with a white Bot icon inside
- Slightly larger: `w-11 h-11` with `rounded-xl` and a subtle shadow

**3. Typography Polish**
- Title: `font-semibold text-sm text-foreground` (keep)
- Subtitle: lighter muted color, add a subtle "sparkle" or activity indicator phrase
- Both using tighter letter spacing

**4. Live Badge Refinement**
- Keep the animated green ping dot
- Upgrade the pill: `bg-green-50 border border-green-200/60 text-green-700` for a cleaner, more intentional look instead of `bg-white/50`

**5. Optional: Subtle shimmer animation**
- Add a very subtle CSS shimmer/shine animation on the gradient icon to draw attention without being distracting

### File to Edit
- `src/pages/CampaignDetail.tsx` (lines 1204-1230 only)

### No Functional Changes
Pure visual refresh. All conditional rendering logic stays the same.

