## Goal
Replace the current "Who Intentsly is for" section in `src/components/landing/UseCases.tsx` with a clearer, more persuasive section focused on what Intentsly actually does for the user — using simple, non-jargon language that anyone can understand.

## Proposed direction: "What Intentsly does for you"
Instead of segmenting by team type (SaaS, Sales, Agency, etc.), the new section will lead with outcomes and everyday benefits. The reference screenshot shows a clean headline + subheadline + bento feature-card layout; we will follow that same rhythm while keeping Intentsly's existing SnowUI visual system.

## Copy approach
- **Eyebrow:** something light and benefit-oriented, e.g. "Why it works" or "Everything you get"
- **Headline:** plain-language promise, e.g. "Turn signals into meetings — without hiring a sales team"
- **Subheadline:** one sentence explaining the outcome, avoiding jargon like "ICP", "GTM", "intent scoring"
- **Cards:** 4–6 short benefit cards with simple titles and one-sentence descriptions

Example card themes:
1. **Find ready-to-buy companies** — See who is already showing buying signals, before your competitors do.
2. **Write messages people actually reply to** — AI drafts personalized outreach based on what each lead cares about.
3. **Book meetings while you sleep** — Automated follow-ups keep conversations moving without manual work.
4. **Stop chasing cold leads** — Focus only on people who have recently signaled interest.
5. **One tool, no sales team needed** — Everything from discovery to reply in a single workflow.
6. **Gets smarter over time** — Learns from replies and improves your next outreach.

## Visual approach
- Keep the existing bento grid structure and rounded-card aesthetic from the current section.
- Replace the team-specific mini-mocks with small, abstract UI illustrations or icon-led cards that match each benefit.
- Use the existing brand colors (#1A8FE3 sky blue, #C8FF00 lime, dark text) and gradients.
- Keep the CTA footer band at the bottom, updated to match the new benefit framing.

## Scope
- Edit only `src/components/landing/UseCases.tsx`.
- No backend, routing, or new dependencies.
- Preserve animation and responsive behavior.

## Implementation steps
1. Rewrite the section header (eyebrow, headline, subheadline).
2. Replace the `cases` array with a new `benefits` array: title, description, icon/visual, gradient background.
3. Build new mini-visual components (or reuse simple icon + badge patterns) for each benefit card.
4. Update the bento grid mapping to render the new benefit cards.
5. Update the CTA footer copy to match the benefit framing.
6. Verify the build and preview the section.

## Outcome
A cleaner, more immediately understandable section that answers "What do I get?" instead of "Which team is this for?", while matching the reference image's calm, benefit-card layout and the existing Intentsly brand.