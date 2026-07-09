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
    // ── Cheap short-circuit: if no run has been touched in the last 30 min, exit. ──
    // The orchestrator kicks off a fresh drain inline when it queues a new run,
    // so the cron tick is just a safety net for paced batches that are already
    // mid-flight. When nothing is in flight, this saves a full task scan.
    const cutoffIso = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const { count: activeRunCount } = await supabase
      .from('signal_agent_runs')
      .select('id', { count: 'exact', head: true })
      .in('status', ['queued', 'running'])
      .gte('started_at', cutoffIso);
    if (!activeRunCount || activeRunCount === 0) {
      return new Response(JSON.stringify({ dispatched: 0, message: 'no active runs' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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

    // ── 2. Batch-fetch in-flight guard + parent-run status for ALL candidates ──
    const candidateRunIds = candidates.map(c => c.run_id);
    const [inflightRes, runsRes] = await Promise.all([
      supabase
        .from('signal_agent_tasks')
        .select('run_id, lease_expires_at')
        .in('run_id', candidateRunIds)
        .eq('signal_type', 'keyword_posts')
        .eq('status', 'running'),
      supabase
        .from('signal_agent_runs')
        .select('id, status')
        .in('id', candidateRunIds),
    ]);
    console.log(`[BATCH] drain: fetched ${inflightRes.data?.length ?? 0} inflight + ${runsRes.data?.length ?? 0} runs in 2 queries for ${candidateRunIds.length} candidates`);

    const inflightByRun = new Map<string, string | null>();
    for (const row of inflightRes.data || []) {
      // Keep the freshest lease we've seen for the run
      const prev = inflightByRun.get(row.run_id);
      if (!prev || (row.lease_expires_at && row.lease_expires_at > prev)) {
        inflightByRun.set(row.run_id, row.lease_expires_at);
      }
    }
    const runStatusById = new Map<string, string>();
    for (const r of runsRes.data || []) runStatusById.set(r.id, r.status);

    // ── 3. For each candidate: claim + dispatch ──
    const queuedForCooldown: string[] = []; // run_ids that got a dispatch this tick
    for (const task of candidates) {
      const lease = inflightByRun.get(task.run_id);
      const leaseStillValid = lease && new Date(lease) > now;
      if (leaseStillValid) {
        console.log(`[DRAIN] Run ${task.run_id} already has in-flight keyword task — skipping`);
        continue;
      }

      const parentStatus = runStatusById.get(task.run_id);
      if (!parentStatus || ['done', 'failed', 'partial'].includes(parentStatus)) {
        // Parent already finalized — mark task failed without claiming.
        await supabase.from('signal_agent_tasks').update({
          status: 'failed', error: 'Parent run finalized', completed_at: nowIso,
        }).eq('id', task.id).eq('status', 'pending');
        continue;
      }

      // Optimistic claim
      const leaseIso = new Date(now.getTime() + LEASE_DURATION_MS).toISOString();
      const { data: claimed, error: claimErr } = await supabase
        .from('signal_agent_tasks')
        .update({
          status: 'running',
          started_at: nowIso,
          lease_expires_at: leaseIso,
          last_heartbeat_at: nowIso,
          attempt_count: (task.attempt_count || 0) + 1,
        })
        .eq('id', task.id)
        .eq('status', 'pending')
        .select('id')
        .single();
      if (claimErr || !claimed) continue; // another worker won

      if (parentStatus === 'queued') {
        await supabase.from('signal_agent_runs').update({ status: 'running' }).eq('id', task.run_id);
      }

      // Fire-and-forget the keyword fetcher
      const payload = { ...(task.payload || {}), run_id: task.run_id, task_key: task.task_key };
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

      queuedForCooldown.push(task.run_id);
      dispatched++;
      dispatchedTasks.push({ run_id: task.run_id, task_key: task.task_key });
      console.log(`[DRAIN] ✅ Dispatched ${task.task_key} for run ${task.run_id} (lease until ${leaseIso})`);
    }

    // ── 4. Bulk-push cooldown on the next pending sibling of every dispatched run ──
    if (queuedForCooldown.length) {
      const nextAvailable = new Date(now.getTime() + NEXT_BATCH_COOLDOWN_MS).toISOString();
      const { data: siblings } = await supabase
        .from('signal_agent_tasks')
        .select('id, run_id, available_at')
        .in('run_id', queuedForCooldown)
        .eq('signal_type', 'keyword_posts')
        .eq('status', 'pending');
      const toBump = (siblings || [])
        .filter(s => !s.available_at || new Date(s.available_at) < new Date(nextAvailable))
        .map(s => s.id);
      console.log(`[BATCH] drain: cooldown bump on ${toBump.length}/${siblings?.length ?? 0} sibling tasks`);
      if (toBump.length) {
        await supabase.from('signal_agent_tasks')
          .update({ available_at: nextAvailable })
          .in('id', toBump);
      }
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
