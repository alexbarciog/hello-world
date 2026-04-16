// Drains the signal_agent_tasks queue: claims one due keyword task per agent,
// invokes the keyword fetcher, then schedules the next batch with a cooldown.
//
// Designed to run every minute via pg_cron. Idempotent and lease-based —
// multiple invocations cannot double-claim a task because of optimistic locking
// on `lease_expires_at`.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// How long a worker is allowed to hold a task before another worker may steal it.
const LEASE_DURATION_MS = 6 * 60 * 1000; // 6 min — keyword fetch usually < 4 min

// Cooldown between consecutive keyword batches of the SAME run.
const NEXT_BATCH_COOLDOWN_MS = 75_000; // ~75s — paces against Unipile rate limits.

// Max number of tasks to dispatch per cron tick (across all runs).
const MAX_DISPATCH_PER_TICK = 8;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const now = new Date();
  const nowIso = now.toISOString();

  let dispatched = 0;
  const dispatchedTasks: Array<{ run_id: string; task_key: string }> = [];

  try {
    // ── 1. Find due pending keyword tasks (one per run, oldest first) ──
    // We dispatch at most one keyword task per run per tick to keep pacing.
    const { data: dueTasks, error: dueErr } = await supabase
      .from('signal_agent_tasks')
      .select('id, run_id, agent_id, task_key, signal_type, payload, attempt_count')
      .eq('signal_type', 'keyword_posts')
      .eq('status', 'pending')
      .lte('available_at', nowIso)
      .order('available_at', { ascending: true })
      .limit(50);
    if (dueErr) throw dueErr;
    if (!dueTasks?.length) {
      return new Response(JSON.stringify({ dispatched: 0, message: 'no due tasks' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // De-dup by run_id — only one in-flight keyword task per run at a time.
    const seenRuns = new Set<string>();
    const candidates: typeof dueTasks = [];
    for (const t of dueTasks) {
      if (seenRuns.has(t.run_id)) continue;
      seenRuns.add(t.run_id);
      candidates.push(t);
      if (candidates.length >= MAX_DISPATCH_PER_TICK) break;
    }

    // ── 2. For each candidate, verify no other keyword task for the same run is already running ──
    for (const task of candidates) {
      // Skip if another keyword task is currently running/leased for the same run
      const { data: inflight } = await supabase
        .from('signal_agent_tasks')
        .select('id, lease_expires_at')
        .eq('run_id', task.run_id)
        .eq('signal_type', 'keyword_posts')
        .eq('status', 'running')
        .limit(1);
      const leaseStillValid = inflight?.[0]?.lease_expires_at
        && new Date(inflight[0].lease_expires_at) > now;
      if (inflight?.length && leaseStillValid) {
        console.log(`[DRAIN] Run ${task.run_id} already has in-flight keyword task — skipping`);
        continue;
      }

      // ── 3. Optimistic claim: set status=running, lease_expires_at, attempt_count++ ──
      const lease = new Date(now.getTime() + LEASE_DURATION_MS).toISOString();
      const { data: claimed, error: claimErr } = await supabase
        .from('signal_agent_tasks')
        .update({
          status: 'running',
          started_at: nowIso,
          lease_expires_at: lease,
          last_heartbeat_at: nowIso,
          attempt_count: (task.attempt_count || 0) + 1,
        })
        .eq('id', task.id)
        .eq('status', 'pending') // optimistic guard
        .select('id')
        .single();
      if (claimErr || !claimed) {
        // Another worker beat us to it
        continue;
      }

      // Make sure the parent run is still active
      const { data: run } = await supabase
        .from('signal_agent_runs')
        .select('status')
        .eq('id', task.run_id)
        .single();
      if (!run || ['done', 'failed', 'partial'].includes(run.status)) {
        // Parent run already finalized — release the task as failed (it shouldn't run anymore)
        await supabase.from('signal_agent_tasks').update({
          status: 'failed', error: 'Parent run finalized', completed_at: nowIso,
        }).eq('id', task.id);
        continue;
      }

      // Make sure the run is marked running (might still be 'queued' if dispatched fast)
      if (run.status === 'queued') {
        await supabase.from('signal_agent_runs').update({ status: 'running' }).eq('id', task.run_id);
      }

      // ── 4. Fire-and-forget the keyword fetcher ──
      const payload = {
        ...(task.payload || {}),
        run_id: task.run_id,
        task_key: task.task_key,
      };

      // We do NOT await the response — signal-keyword-posts self-reports completion
      // and finalizes the run when all tasks are done.
      fetch(`${SUPABASE_URL}/functions/v1/signal-keyword-posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify(payload),
      }).catch(err => {
        console.error(`[DRAIN] kickoff for ${task.task_key} failed:`, err);
      });

      // ── 5. Schedule the NEXT pending keyword task for this run with a cooldown ──
      // This is what enforces the pacing across batches without the orchestrator
      // having to stay alive.
      const nextAvailable = new Date(now.getTime() + NEXT_BATCH_COOLDOWN_MS).toISOString();
      const { data: nextTasks } = await supabase
        .from('signal_agent_tasks')
        .select('id, available_at')
        .eq('run_id', task.run_id)
        .eq('signal_type', 'keyword_posts')
        .eq('status', 'pending')
        .order('task_key', { ascending: true })
        .limit(5);
      if (nextTasks?.length) {
        // Push out any sibling pending task whose available_at is sooner than the cooldown.
        for (const nt of nextTasks) {
          if (!nt.available_at || new Date(nt.available_at) < new Date(nextAvailable)) {
            await supabase.from('signal_agent_tasks')
              .update({ available_at: nextAvailable })
              .eq('id', nt.id);
          }
        }
      }

      dispatched++;
      dispatchedTasks.push({ run_id: task.run_id, task_key: task.task_key });
      console.log(`[DRAIN] ✅ Dispatched ${task.task_key} for run ${task.run_id} (lease until ${lease})`);
    }

    return new Response(JSON.stringify({ dispatched, tasks: dispatchedTasks }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[DRAIN] error:', error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
