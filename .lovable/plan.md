

# Fix Keyword Posts Timeout: Split Keywords Across Multiple Function Calls

## Problem

`signal-keyword-posts` has a 145s runtime limit. With 36 keywords fetching up to 5 pages each, it times out after processing ~14 keywords (39%), leaving 22 keywords unprocessed. The keywords and AI filtering are good — the bottleneck is purely execution time.

## Solution: Batch Keywords in the Orchestrator

Instead of sending all keywords in one function call, split them into batches of ~8 keywords each and invoke `signal-keyword-posts` multiple times sequentially. Each batch gets a fresh 145s runtime window.

**File**: `supabase/functions/process-signal-agents/index.ts`

### Change: Split keyword_posts into multiple sequential invocations

In the task-building section (lines 197-205), instead of creating one task with all keywords:

1. Split keywords into batches of 8
2. Invoke `signal-keyword-posts` for each batch sequentially (not parallel — to avoid Unipile rate limits)
3. Sum up leads from all batches

For example, 36 keywords becomes 5 batches: 8+8+8+8+4. Each batch processes ~8 keywords in ~80s (well within 145s), and total runtime is ~7 minutes — fine for `EdgeRuntime.waitUntil`.

### Implementation detail

Replace the single `tasks.push(...)` for keyword_posts with a loop that creates multiple tasks like `keywords_batch_1(8)`, `keywords_batch_2(8)`, etc. Then in the parallel execution section, run keyword batches sequentially while other signal types (competitors, hashtags, engagers) still run in parallel.

```text
Current:  [keywords(36)] ──timeout at keyword 14──X
Proposed: [keywords_b1(8)] → [keywords_b2(8)] → [keywords_b3(8)] → [keywords_b4(8)] → [keywords_b5(4)]
          Each batch: ~80s, fresh 145s window
```

**File**: `supabase/functions/signal-keyword-posts/index.ts`

No changes needed to the keyword function itself — it already handles partial keyword lists and the `hasTime()` guard. We just need to send it fewer keywords per call.

## What stays the same

- All keywords are kept (no reduction)
- AI filtering logic unchanged
- 5-page pagination per keyword unchanged
- No people search added
- All other signal types (competitors, hashtags, engagers) unchanged

