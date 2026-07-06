# Limitless Access — Conversion Rewrite + Motion Pass

Target: the section at `src/components/landing/montera/MonteraLanding.tsx` (`LimitlessAccess`, ~lines 270–354). Scope is copy + animation only; layout, colors, and structure stay identical.

## 1. Copywriting rewrite (conversion-first)

Rewrite around a single promise: **"Every buyer raising their hand on LinkedIn, in your inbox before your competitors see them."** Every line reinforces speed, specificity, or proof.

**Eyebrow**: `LIVE BUYER INTENT` (replaces "Limitless Access" — signals urgency, not features).

**H2** (benefit + outcome, not adjectives):
> Buyers are posting about their pain right now. We put them in front of you first.

**Subhead** (one line, quantified):
> Scanning 12M+ LinkedIn posts, comments, and job changes every day — surfacing only the people ready to buy what you sell.

**Four feature cells** — rewrite each as `Metric/Proof headline` + `outcome-focused body` (not feature description). Icons stay the same, order stays the same:

| Cell | New headline | New body |
|---|---|---|
| 1 (Globe2) | `Signals in 80+ countries` | Track buying intent wherever your ICP posts — no geo blind spots, no missed pipeline. |
| 2 (LayoutGrid) | `12M posts scanned daily` | Our engine reads every relevant LinkedIn post, comment, and Reddit thread so you don't have to scroll. |
| 3 (ShieldCheck) | `93% noise filtered out` | AI scores each signal for buying intent — only leads with real budget and timing reach your dashboard. |
| 4 (Timer) | `Under 4 min from post to alert` | The moment a buyer raises their hand, you get their profile, the trigger, and an AI-drafted opener. |

**Globe card** — add a small overlay label so the visual sells the promise, not just decorates: `"Live signals · updated every 60s"` pill at top-center of the globe card, and rename the "Global" pill to `"+76 more"` to imply scale.

## 2. Animation pass

Add scroll-triggered and ambient motion using the existing `framer-motion` import already in the file. Nothing new to install.

**Section entrance** — wrap header block in `motion.div` with `whileInView`, fade-up 16px, 0.6s ease-out, `viewport={{ once: true, margin: "-80px" }}`.

**Feature cells** — convert `FeatureCell` into a `motion.div` with staggered `whileInView`: fade + rise 20px, delay = index × 0.08s. On hover: icon square scales to 1.08 and rotates 3°, card border shifts from `black/[0.06]` → `black/[0.12]`, subtle `y: -2` lift with `transition-transform` (200ms). Keep it snappy — no shadow bloom (site is minimal).

**Metric numbers in headlines** — the numeric prefixes (`80+`, `12M`, `93%`, `4 min`) get a `CountUp`-style animation on first view. Implement inline with framer-motion's `useMotionValue` + `useTransform` + `useInView` (no new dep). 1.2s duration, ease-out.

**Globe card** — three additive motions:
- Concentric rings: slow continuous rotation (rings 1 & 2 rotate at 60s/40s, opposite directions) via `animate={{ rotate: 360 }}` infinite linear.
- Country pills: gentle floating loop — each pill animates `y: [0, -4, 0]` on a 3–4s loop, staggered phases so they don't move in sync.
- Center dot: pulsing glow — `boxShadow` animates between `0 0 20px` and `0 0 32px` on 2s loop; add a second expanding ring (scale 1→2, opacity 1→0, 2s infinite) to visually broadcast "live."

**Prefers-reduced-motion**: gate the continuous loops (rings, pulse, floating pills) behind `useReducedMotion()` — one-shot entrance animations still play.

## 3. Files touched

- `src/components/landing/montera/MonteraLanding.tsx` — only the `LimitlessAccess`, `FeatureCell`, and `Eyebrow` usage in this section. No other sections modified. No new files, no new deps.

## Out of scope

- No layout, grid, spacing, or color changes.
- No changes to hero, bento, or other sections.
- No new icons or images.
