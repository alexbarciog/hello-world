## Why the current generation feels disconnected

Looking at `superscale-generate-image`:
- It sends raw post content (truncated to 500 chars) + up to 4 ref image URLs to `google/gemini-2.5-flash-image` in a single shot.
- Flash image is the cheapest/fastest tier and is weak at *style transfer* from references — it tends to generate generic LinkedIn-looking visuals and largely ignores the refs.
- The prompt never describes WHAT visual style the refs actually have (palette, type, layout, mood), so the model has nothing structured to imitate.
- Only one image is produced, no way to regenerate or compare, so a single bad result = "the worst I've seen".

## New system

### 1. One-time "Style DNA" extraction from design refs

New edge function `superscale-analyze-style`:
- Triggered automatically when refs change (debounced from `DesignRefs.tsx` after upload/delete) and on-demand via a "Re-analyze style" button.
- Sends up to 8 ref image URLs to a vision model (`google/gemini-2.5-flash`) with a structured-output prompt that returns JSON:
  ```
  { palette: [...hex], accent_colors: [...], typography: {style, weight, casing},
    layout_patterns: [...], composition: "...", mood: "...", recurring_motifs: [...],
    text_treatment: "...", background_style: "...", do: [...], dont: [...] }
  ```
- Stored in a new table `superscale_style_profile` (one row per user/org), with `updated_at` and `refs_hash` so we know when to re-run.

### 2. Two-stage generation

New flow inside `superscale-generate-image`:

**Stage A — Visual brief (cheap text call):**
Given the post content + the cached Style DNA, ask `google/gemini-2.5-flash` to return a tight visual brief:
- Single sentence "what to depict"
- Headline text overlay (≤6 words, only if the user's refs typically have text)
- Color palette to use (pulled from Style DNA)
- Layout reference (e.g. "centered bold type on solid color block, like ref #2")

**Stage B — Image generation:**
Call `google/gemini-3-pro-image-preview` (Nano Banana Pro — much higher fidelity than 2.5 flash image) with:
- The structured brief as text
- 3 most-relevant ref images (selected by similarity tag, fall back to first 3)
- Explicit instruction: "Match the visual style, palette, and typography of the reference images exactly. Do not invent unrelated styles."

Allow the user to choose model tier later via a setting; default to Nano Banana Pro for quality.

### 3. Pick from variants

Update `Compose.tsx` "Generate from design refs" to open a modal:
- Generates **3 variants in parallel** (3 stage-B calls, same brief).
- Shows them in a grid with a one-click "Use this" + "Regenerate all" + a small editable text field to tweak the brief and regenerate.
- Only the chosen variant is uploaded to storage and attached to the post (others are discarded — no extra storage cost).
- Loading skeletons + per-variant error handling so one failure doesn't kill the set.

### 4. UX polish in Compose

- Show a small "Style: 12 refs analyzed · updated 2d ago" chip under the Generate button so users trust the system is using their refs.
- If `superscale_style_profile` is missing, the button surfaces "Analyze your design refs first" and offers a one-click trigger.
- If <5 refs, keep the existing nudge.

### 5. Keep edge function within compute limits

- Stage A is a tiny text call (cheap).
- Stage B uses URL-based image inputs (already done) — no base64 fetching.
- Run the 3 variant calls in parallel via `Promise.allSettled`, and use `EdgeRuntime.waitUntil` only if we move to a job-queue pattern later. For now 3 parallel Pro calls fit well under wall-clock limits and avoid CPU work in the function itself.

## Technical changes

**DB migration:**
- `superscale_style_profile` (user_id pk, organization_id, style_json jsonb, refs_hash text, updated_at). RLS: owner-only select/insert/update.

**Edge functions:**
- New: `supabase/functions/superscale-analyze-style/index.ts`
- Rewrite: `supabase/functions/superscale-generate-image/index.ts` to do Stage A + B and accept `?n=3` for variants. Returns `{ variants: [{image_url}, ...] }` instead of a single `image_url` (also keeps backward-compat single field).

**Frontend:**
- `src/components/superscale/Compose.tsx`: replace inline generate with a `GenerateImageDialog` showing 3 variants, brief editor, regenerate.
- `src/components/superscale/DesignRefs.tsx`: after upload/delete, fire-and-forget call to `superscale-analyze-style`; show a "Style analyzed" badge.
- New: `src/components/superscale/GenerateImageDialog.tsx`.

**Models used:**
- `google/gemini-2.5-flash` for Style DNA + brief
- `google/gemini-3-pro-image-preview` for final image (Nano Banana Pro)

## Out of scope (future)
- Per-post fine-tuning loop ("more like this" feedback).
- Storing rejected variants for later A/B.
- Brand kit (logo overlay) — would slot in cleanly as Stage C.
