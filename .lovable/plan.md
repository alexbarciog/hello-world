

# Replace Fake Testimonials with Value Proposition on Register Page

## Summary
Replace the fake G2/Capterra ratings and fabricated testimonials on the right panel of the Register page with a clean value proposition section that explains what Intentsly does.

## What Changes

### Remove (lines 18-34, 438-510)
- The `testimonials` array with fake quotes and authors
- The G2/Capterra rating badges with fake "100+ reviews" and "4.5" stars
- The testimonial carousel with dots and arrows
- The `activeTestimonial` state and auto-rotate logic

### Replace With: Value Proposition Panel
A visually clean section on the right side (keeping the gradient background) with:

1. **Headline**: "Find buyers before your competitors do"
2. **3 value pillars** — each with an icon and short description:
   - **Detect Intent Signals** — "Our AI monitors Reddit, X, and LinkedIn to find people actively looking for your services."
   - **Score & Qualify Leads** — "Every prospect is scored against your ICP so you only talk to the right people."
   - **Automate Outreach** — "Start relevant conversations on LinkedIn automatically and book more demos on autopilot."
3. **Small footer line**: "Trusted by 500+ B2B founders and sales teams"

### Style
- Uses existing foreground/background CSS variables to match the current panel
- Icons from lucide-react (Radar, Target, Zap or similar)
- Minimal, editorial layout — no fake social proof

### Files Modified
- `src/pages/Register.tsx` — remove testimonials array, activeTestimonial state, auto-rotate useEffect, and replace the right panel content

