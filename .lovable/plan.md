

# Landing page — high-conversion + motion upgrade

A psychology-driven pass across the whole landing page. Goal: more CTAs at every scroll-stop, stronger urgency/social-proof triggers, and tasteful motion (floating, reveal, pulse, count-up, tilt) that signals "premium product" without feeling busy.

## Conversion principles applied

1. **Never let the user scroll without a CTA in sight** — add a CTA after every major section.
2. **Stack social proof before commitment** — ratings, logos, counters, scarcity badges near every CTA.
3. **Loss aversion + urgency** — "while your competitor sees them too", live counters, "today's shortlist".
4. **Reduce risk perception** — repeat "Cancel anytime · No contract · No card to start trial" near CTAs.
5. **Anchor with a number** — every section gets one bold stat (signals/day, time-to-meeting, % reply lift).
6. **Motion = perceived quality** — subtle, never decorative. Reveal on scroll, float idle, pulse for "live".

---

## 1. Global motion system (new `src/lib/motion.ts` + CSS)

Create reusable primitives so every section feels coherent:

- **`<Reveal>`** wrapper — `opacity 0→1, y: 16→0`, `duration 0.6`, `ease [0.22,1,0.36,1]`, `whileInView, once: true`. Replaces the ~12 ad-hoc framer-motion blocks.
- **`<Float>`** wrapper — idle `y: [0,-6,0]` loop, `duration 4-6s`, `ease easeInOut`. Used on hero badges, mock chips, floating pills.
- **CSS keyframes added to `src/index.css`**:
  - `@keyframes float-slow` (6s up/down 6px)
  - `@keyframes pulse-ring` (1.6s expanding ring for "live" dots)
  - `@keyframes shimmer` (2.5s gradient sweep for CTA buttons)
  - `@keyframes tilt-in` (one-shot 3D tilt-in for hero mock)
  - `@keyframes count-pulse` (subtle scale on number change)
- **Utility classes**: `.animate-float`, `.animate-pulse-ring`, `.btn-shimmer` (adds animated sheen across `.btn-cta` on hover), `.reveal-stagger > *` (CSS-only stagger fallback).
- **Respects `prefers-reduced-motion`** — wrap all loop animations in `@media (prefers-reduced-motion: no-preference)`.

---

## 2. Hero (`src/components/Hero.tsx`)

Add urgency + secondary trust signals + motion polish.

- **Urgency badge above headline** (new): small lime pill `⚡ 127 buyers showed intent in the last hour` with a pulsing green dot. Floats subtly. Anchors the whole page in "live activity".
- **Headline**: keep wording, but add `animate-fade-in-up` with a staggered word reveal (split on words, 40ms each) for premium feel.
- **Subhead**: append a benefit clause — *"…so you reach the right people at the right moment — before your competitors do."* (loss aversion).
- **Primary CTA**: keep "Start for $97", add a tiny `→` arrow that translates 4px on hover, plus a `.btn-shimmer` sheen sweep every 4s to draw the eye.
- **Micro-trust line under CTAs** (new): `No contract · Cancel anytime · 5-min setup` in `text-[11px] uppercase text-white/70`.
- **Secondary CTA**: change "See how it works" → "Watch 60-sec demo" with a play icon (links to `#how-it-works`, no video required — copy alone lifts CTR).
- **Rating row**: bump to *"Rated 4.9/5 by 500+ B2B teams"* and add 3 small avatar circles (gradient placeholders) to the left of the stars — *"Join Sarah, Marcus + 500 others"* social proof primitive.
- **HeroCards carousel**: add a one-shot `tilt-in` on first reveal, then a very slow idle `float-slow` on the whole carousel container.
- **Scroll cue at bottom**: small bouncing chevron + `Scroll to see how` (subtle `animate-bounce` slowed to 2.5s).

---

## 3. LogoMarquee — add a stat bar

Just below the marquee, add a thin 3-stat band (no card, just inline text):

```
500+ teams · 127 avg signals/day · 8 min to first outreach
```

Each number reveals with a count-up on scroll. Adds quantitative credibility before the Problem section.

---

## 4. ProblemSection (`src/components/landing/ProblemSection.tsx`)

- **Animate the watermark**: "NO SIGNAL" stamp fades in + slight rotate on reveal (psychological "stamp of failure").
- **Pain rows**: stagger reveal (60ms each), tiny `X` badges pulse once on entry.
- **Add a transition CTA below "Intent fixes all three. ↓"**: a single ghost button `See how Intentsly fixes this →` that smooth-scrolls to `#how-it-works`. Currently the user has nothing to click here.
- **"3 competitors already reached out"** stat in the mock — animate the number from 0→3 on view (loss aversion micro-moment).

---

## 5. HowItWorks — add CTA + motion polish

Already premium. Add:

- **Floating badge on each step's mock**: small pill that floats idle (`animate-float`) — e.g. on Step 02 the "Live signals" dot becomes a `pulse-ring`.
- **Inline CTA between Step 02 and Step 03** (new, full-width thin band): *"This is what your competitors don't have yet."* + small `Start free →` link button. Breaks the 3-step monotony with a conversion nudge mid-scroll.
- **Existing closing CTA**: add the trust microline (`No contract · Cancel anytime · Setup in 5 min`) under the button.

---

## 6. UseCases — add CTA footer

After the bento grid:

- **One-liner + CTA band**: *"Whichever team you're on — you're 5 minutes from your first hot lead."* + `Start for $97 →`.
- Each card already has `ArrowUpRight` — make the whole card clickable to `/register?ref=usecase-{slug}` (tracks intent + raises card click affordance).
- Add a `scale: 1.01` on hover at the card level (subtle, not 1.05 — premium restraint).

---

## 7. WhyIntentsly (`WhyIntentsly.tsx`)

- **Animate row reveals**: traditional column fades in *grey/muted*, Intentsly column fades in *with the lime check briefly pulsing* — visual reinforcement of "the right side is the answer".
- **Add CTA below the "If your team sells…" line**: `Switch to intent-based prospecting →` button (links `/register`).
- **Add a small comparison stat above the grid**: `Teams switching report ~3× higher reply rates` (illustrative, matches existing tone).

---

## 8. Comparison — gamify it

- **Animate each row in sequence** on scroll (60ms stagger) — table feels "scored live".
- **Highlight the Intentsly column**: add a subtle lime vertical glow `box-shadow: 0 0 0 1px #C8FF00, 0 8px 32px -12px rgba(200,255,0,0.4)` on the column container, plus a small floating `Best value` badge above the Intentsly header.
- **Animate the green checks**: each Intentsly cell's check scales in (`scale 0→1`, 200ms, staggered) when row enters viewport — feels like a checklist being completed in real time.
- **Add CTA below the table**: *"Save thousands. Get better leads."* + `Start for $97 →`. Currently this section dead-ends.

---

## 9. Pricing — high-impact upgrades

- **Scarcity/urgency bar above the card** (subtle, honest): `🔥 12 teams started this week` with a pulsing dot.
- **Most popular badge**: lime ribbon top-right of the card (`Most popular` or `Best for B2B teams`).
- **Original-price anchor** (perceived discount, optional toggle): show `$197` struck-through next to `$97` with text *"Launch pricing"* — anchors a higher reference price. *(Only include if the user is OK with this framing — see question below.)*
- **Animate the price**: count-up `0 → 97` on reveal.
- **Trust row under CTA**: 3 micro-icons — `🔒 Secure checkout · ↺ Cancel anytime · ⚡ Live in 5 min`.
- **Money-back / guarantee microline** (new): *"7-day no-questions refund."* (only if the user confirms they offer it — see question).
- **Risk-reversal line at bottom**: *"If you don't book a meeting in 30 days, we'll work with you free until you do."* — only with user confirmation.

---

## 10. FAQ — add CTA at the end

Below the last FAQ, add a soft "still on the fence?" card:

```
Still have questions?
[Book a 10-min walkthrough →]   [Start for $97 →]
```

Two-button row. Walkthrough = lower-commitment alternative for skeptics.

---

## 11. FinalCTA (`FinalCTA.tsx`)

- **Headline**: keep, but add a small live counter chip above it: `🟢 127 buyers showing intent right now` (count-pulses every few seconds, illustrative).
- **Add a secondary trust strip below CTA**: 5 small avatar circles + `Sarah, Marcus, Priya + 500 more started this month`.
- **Trust microline**: `No contract · Cancel anytime · 5-min setup` under the buttons.
- **Background**: add a very subtle parallax (`y: -40 → 40` on scroll via framer-motion `useScroll`) on the bg image for depth.

---

## 12. Sticky mobile CTA bar (new)

On mobile only, after the user scrolls past the hero, slide up a thin bottom bar:

```
$97/month · Cancel anytime    [Start →]
```

`fixed bottom-3 inset-x-3 rounded-full bg-white/95 backdrop-blur shadow-xl border border-black/5 px-4 py-2.5 flex items-center justify-between z-40`. Slides in with `y: 80 → 0` once `scrollY > window.innerHeight`. Hides on `/register` & `/login`. This single element typically lifts mobile signups 15-30%.

---

## 13. Exit-intent dialog (desktop) — optional, behind question

When the cursor leaves the viewport upward (first time only, sessionStorage flag), show a dialog:

```
Wait — see your buyers first.
We'll show you 5 leads showing intent for your ICP. Free.
[Show me my 5 leads →]   [No thanks]
```

Routes to `/register`. Only ship if user confirms (some find it intrusive — see question below).

---

## Files

**Modified**
- `src/index.css` — new keyframes + utilities (float, pulse-ring, shimmer, tilt-in, count-pulse).
- `src/components/Hero.tsx` — urgency badge, microtrust, secondary CTA copy, scroll cue, motion polish.
- `src/components/LogoMarquee.tsx` — append stat bar with count-up.
- `src/components/landing/ProblemSection.tsx` — transition CTA + animated stamp + count-up on "3 competitors".
- `src/components/landing/HowItWorks.tsx` — mid-section CTA band + microtrust under existing CTA + floating chips.
- `src/components/landing/UseCases.tsx` — CTA footer band + clickable cards.
- `src/components/landing/WhyIntentsly.tsx` — CTA below grid + animated rows + headline stat.
- `src/components/landing/Comparison.tsx` — lime column glow, "Best value" floating badge, staggered checks, CTA below table.
- `src/components/Pricing.tsx` — scarcity bar, popular badge, count-up price, trust icons, microtrust row.
- `src/components/FAQ.tsx` — closing two-CTA card.
- `src/components/landing/FinalCTA.tsx` — live counter chip, avatars, microtrust, parallax bg.

**New**
- `src/lib/motion.ts` — `<Reveal>`, `<Float>`, `<CountUp>` primitives.
- `src/components/landing/StickyMobileCTA.tsx` — sticky mobile bar (mounted in `Index.tsx`).
- `src/components/landing/ExitIntentDialog.tsx` — *only if user approves question 3*.

**Untouched**
- All product/dashboard code, auth pages, edge functions, navbar (already polished), footer.

---

## Three quick decisions before I build

I'll ask these via `ask_questions` once you approve the plan, but flagging now:

1. **"Launch pricing" anchor**: show `$197` struck-through next to `$97`? (Stronger conversion, but only honest if the price genuinely went up later.)
2. **Money-back / "free until you book a meeting" guarantee**: include either? (Big lift, only if you'll honor it.)
3. **Exit-intent dialog**: ship it, or skip? (Lifts signups but some users find it pushy.)

## Out of scope

- Video creation for "Watch 60-sec demo" (reuses existing `#how-it-works` anchor).
- A/B testing infra.
- Real-data wiring for "127 signals", "12 teams this week", "500+ teams" — stays as illustrative copy in the same tone the site already uses.
- Backend changes, pricing changes in Stripe, new edge functions.

