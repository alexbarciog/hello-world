// Reaper: lease-based cleanup for signal_agent_runs and signal_agent_tasks.
//
// Designed to be called by pg_cron every minute. Idempotent.
//
// New model (queue-based):
//   - Tasks have a `lease_expires_at` and `last_heartbeat_at`.
//   - A task is "stuck" if its lease has expired AND it hasn't heartbeated recently.
//   - Runs are no longer reaped purely on `started_at` age — we use a much larger
//     safety window (30 min) for keyword runs because they can legitimately take
//     10–20 min when there are 30+ keywords.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Hard ceiling — runs older than this are reaped no matter what.
const RUN_HARD_TIMEOUT_MS = 30 * 60 * 1000; // 30 min

// A task is considered stuck if lease has expired by this much.
const TASK_LEASE_GRACE_MS = 60 * 1000; // 1 min after lease expiry

// A task without a heartbeat for this long is considered dead, even if its lease
// hasn't formally expired (worker probably crashed mid-claim).
const TASK_HEARTBEAT_TIMEOUT_MS = 10 * 60 * 1000; // 10 min

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const now = new Date();
  const nowIso = now.toISOString();

  let reapedTasks = 0;
  let reapedRuns = 0;

  try {
    // ── 1. Reap individual stuck TASKS (lease expired or no heartbeat) ──
    const leaseDeadlineIso = new Date(now.getTime() - TASK_LEASE_GRACE_MS).toISOString();
    const heartbeatDeadlineIso = new Date(now.getTime() - TASK_HEARTBEAT_TIMEOUT_MS).toISOString();

    const { data: stuckTasks } = await supabase
      .from('signal_agent_tasks')
      .select('id, run_id, task_key, lease_expires_at, last_heartbeat_at, started_at')
      .eq('status', 'running')
      .limit(100);

    for (const t of stuckTasks || []) {
      const leaseExpired = t.lease_expires_at && t.lease_expires_at < leaseDeadlineIso;
      const heartbeatStale = t.last_heartbeat_at
        ? t.last_heartbeat_at < heartbeatDeadlineIso
        : (t.started_at && t.started_at < heartbeatDeadlineIso);

      if (!leaseExpired && !heartbeatStale) continue;

      await supabase.from('signal_agent_tasks').update({
        status: 'failed',
        error: leaseExpired ? 'Reaped: lease expired' : 'Reaped: no heartbeat',
        completed_at: nowIso,
      }).eq('id', t.id).eq('status', 'running');
      reapedTasks++;
      console.log(`[REAPER] Reaped task ${t.task_key} (run ${t.run_id}) — leaseExpired=${leaseExpired} heartbeatStale=${heartbeatStale}`);
    }

    // ── 2. Reap whole RUNS that have exceeded the hard timeout ──
    const runHardCutoff = new Date(now.getTime() - RUN_HARD_TIMEOUT_MS).toISOString();
    const { data: stuckRuns } = await supabase
      .from('signal_agent_runs')
      .select('id, agent_id, started_at')
      .in('status', ['running', 'queued'])
      .lt('started_at', runHardCutoff)
      .limit(50);

    for (const run of stuckRuns || []) {
      try {
        // Mark anything still pending/running as failed
        await supabase.from('signal_agent_tasks')
          .update({
            status: 'failed',
            error: 'Reaped: parent run hit hard timeout (30min)',
            completed_at: nowIso,
          })
          .eq('run_id', run.id)
          .in('status', ['pending', 'running']);

        const { data: tasks } = await supabase
          .from('signal_agent_tasks')
          .select('leads_found, status, rejected_profiles_sample, signal_type')
          .eq('run_id', run.id);

        const totalLeads = (tasks || []).reduce((s: number, t: any) => s + (t.leads_found || 0), 0);
        const doneCount = (tasks || []).filter((t: any) => t.status === 'done').length;
        const totalCount = tasks?.length || 0;

        const finalStatus = doneCount === totalCount && totalCount > 0
          ? 'done'
          : doneCount > 0 ? 'partial' : 'failed';

        const aggregatedRejected = aggregateRejected(tasks || []);

        await supabase.from('signal_agent_runs').update({
          status: finalStatus,
          total_leads: totalLeads,
          completed_tasks: doneCount,
          completed_at: nowIso,
          rejected_profiles_sample: aggregatedRejected,
          error: finalStatus === 'failed' ? 'Reaped: hard 30min timeout, no tasks completed' : null,
        }).eq('id', run.id);

        // Update agent results count if we have any leads.
        if (totalLeads > 0 && run.agent_id) {
          const { data: agent } = await supabase.from('signal_agents')
            .select('results_count, leads_list_name, name, user_id')
            .eq('id', run.agent_id).single();
          if (agent) {
            const lName = agent.leads_list_name || agent.name || 'Signal Leads';
            const { data: list } = await supabase.from('lists').select('id')
              .eq('user_id', agent.user_id).eq('name', lName).maybeSingle();
            if (list) {
              const { count } = await supabase.from('contact_lists')
                .select('id', { count: 'exact', head: true }).eq('list_id', list.id);
              if (typeof count === 'number' && count > 0) {
                await supabase.from('signal_agents')
                  .update({ results_count: count }).eq('id', run.agent_id);
              }
            }
          }
        }

        await maybeTriggerSuggestions(run.id, run.agent_id, totalLeads, aggregatedRejected.length);

        console.log(`[REAPER] Hard-finalized run ${run.id}: ${finalStatus}, ${totalLeads} leads, ${aggregatedRejected.length} rejected sampled`);
        reapedRuns++;
      } catch (e) {
        console.error(`[REAPER] Failed to reap run ${run.id}:`, e);
      }
    }

    // ── 3. Finalize runs whose tasks are ALL done/failed but were never closed ──
    // (Edge case: keyword fetcher's self-finalize step may have failed)
    const { data: openRuns } = await supabase
      .from('signal_agent_runs')
      .select('id, agent_id')
      .eq('status', 'running')
      .limit(50);

    for (const run of openRuns || []) {
      const { data: tasks } = await supabase
        .from('signal_agent_tasks')
        .select('status, leads_found, rejected_profiles_sample, signal_type')
        .eq('run_id', run.id);
      if (!tasks?.length) continue;
      const open = tasks.filter((t: any) => t.status === 'pending' || t.status === 'running').length;
      if (open > 0) continue;
      const totalLeads = tasks.reduce((s: number, t: any) => s + (t.leads_found || 0), 0);
      const doneCount = tasks.filter((t: any) => t.status === 'done').length;
      const finalStatus = doneCount === tasks.length ? 'done' : doneCount > 0 ? 'partial' : 'failed';
      const aggregatedRejected = aggregateRejected(tasks);
      await supabase.from('signal_agent_runs').update({
        status: finalStatus,
        total_leads: totalLeads,
        completed_tasks: doneCount,
        completed_at: nowIso,
        rejected_profiles_sample: aggregatedRejected,
      }).eq('id', run.id);
      await maybeTriggerSuggestions(run.id, run.agent_id, totalLeads, aggregatedRejected.length);
      console.log(`[REAPER] Closed orphan run ${run.id}: ${finalStatus}, ${totalLeads} leads, ${aggregatedRejected.length} rejected sampled`);
      reapedRuns++;
    }

    return new Response(JSON.stringify({ reaped_tasks: reapedTasks, reaped_runs: reapedRuns }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[REAPER] error:', error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Aggregate rejected profile samples across tasks (cap at 200)
function aggregateRejected(tasks: any[]): any[] {
  const all: any[] = [];
  for (const t of tasks) {
    const sample = (t.rejected_profiles_sample || []) as any[];
    for (const p of sample) {
      all.push({ ...p, signalType: p.signalType ?? t.signal_type });
      if (all.length >= 200) return all;
    }
  }
  return all;
}

// Fire-and-forget suggestion trigger
async function maybeTriggerSuggestions(runId: string, agentId: string | null, totalLeads: number, rejectedCount: number) {
  if (!agentId) return;
  if (totalLeads >= 20 && rejectedCount <= 50) return;
  try {
    // @ts-ignore EdgeRuntime
    EdgeRuntime.waitUntil(
      fetch(`${SUPABASE_URL}/functions/v1/generate-agent-suggestions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` },
        body: JSON.stringify({ runId, agentId }),
      }).catch((e) => console.warn(`[SUGGESTIONS] reaper trigger failed:`, e))
    );
  } catch (e) {
    console.warn('[SUGGESTIONS] waitUntil unavailable in reaper:', e);
  }
}
