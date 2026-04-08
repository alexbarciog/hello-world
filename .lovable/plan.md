

# Admin-Only Pipeline Diagnostics: See Rejected Posts

## Problem
Signal agents find zero leads for clients, but there's no visibility into what posts were fetched and why they were rejected. The diagnostic data (rejected posts, AI scores, rejection reasons) is logged to console only and lost after execution.

## Solution
1. Persist the full `pipelineStats` (including all rejected post samples) to the database after each task run
2. Show an expandable diagnostics panel in the Run History UI, visible only to admins

## Technical Plan

### 1. Database Migration: Add `diagnostics` column to `signal_agent_tasks`

```sql
ALTER TABLE signal_agent_tasks ADD COLUMN diagnostics jsonb DEFAULT NULL;
```

### 2. Edge Function Changes

**`signal-keyword-posts/index.ts`**:
- Increase `sample_ai_rejections` and `sample_prefilter_rejections` limits from 3 to 50 (capture all rejections, not just samples)
- After the pipeline completes, save `pipelineStats` to the task's `diagnostics` column:
  ```ts
  await supabase.from('signal_agent_tasks')
    .update({ diagnostics: pipelineStats })
    .eq('run_id', run_id).eq('task_key', task_key);
  ```

**`signal-competitor/index.ts`**: Same pattern -- save competitor pipeline stats to the `diagnostics` column.

### 3. Frontend: Admin-only diagnostics viewer in `Signals.tsx`

When a task row is expanded and the user is an admin (`useAdminCheck`):
- Fetch the task's `diagnostics` jsonb
- Render a collapsible "Pipeline Diagnostics" section showing:
  - **Funnel summary**: posts fetched -> after dedup -> passed prefilter -> sent to AI -> passed AI -> profile fetched -> inserted
  - **Rejected posts table** with columns: Post excerpt (first 200 chars), Rejection stage (prefilter/AI/profile), Reason, Score (if AI)
- Non-admin users see nothing extra -- the existing task view stays unchanged

### Files Changed
- `supabase/migrations/XXXX_add_diagnostics_to_tasks.sql` (new)
- `supabase/functions/signal-keyword-posts/index.ts` (persist stats, increase sample limits)
- `supabase/functions/signal-competitor/index.ts` (persist stats)
- `src/pages/Signals.tsx` (admin-only diagnostics panel in run history)

