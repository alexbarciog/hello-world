// Reaper: finalizes signal_agent_runs that are stuck in `running` for > 5 minutes.
// Designed to be called by pg_cron every minute. Idempotent.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const cutoff = new Date(Date.now() - 5 * 60 * 1000).toISOString(); // 5 min ago

  try {
    // Find runs stuck in running OR queued state for >5 min
    const { data: stuckRuns, error } = await supabase
      .from('signal_agent_runs')
      .select('id, agent_id, started_at')
      .in('status', ['running', 'queued'])
      .lt('started_at', cutoff)
      .limit(50);

    if (error) throw error;
    if (!stuckRuns?.length) {
      return new Response(JSON.stringify({ reaped: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[REAPER] Found ${stuckRuns.length} stuck runs`);
    let reaped = 0;

    for (const run of stuckRuns) {
      try {
        // Mark stuck tasks as failed
        await supabase.from('signal_agent_tasks')
          .update({
            status: 'failed',
            error: 'Reaped: stuck > 5min',
            completed_at: new Date().toISOString(),
          })
          .eq('run_id', run.id)
          .in('status', ['pending', 'running']);

        // Aggregate actual results from completed tasks
        const { data: tasks } = await supabase
          .from('signal_agent_tasks')
          .select('leads_found, status')
          .eq('run_id', run.id);

        const totalLeads = (tasks || []).reduce((sum: number, t: any) => sum + (t.leads_found || 0), 0);
        const doneCount = (tasks || []).filter((t: any) => t.status === 'done').length;
        const totalCount = tasks?.length || 0;

        // Determine final status
        const finalStatus = doneCount === totalCount && totalCount > 0
          ? 'done'
          : doneCount > 0 ? 'partial' : 'failed';

        await supabase.from('signal_agent_runs').update({
          status: finalStatus,
          total_leads: totalLeads,
          completed_tasks: doneCount,
          completed_at: new Date().toISOString(),
          error: finalStatus === 'failed' ? 'Reaped: no tasks completed within 5min' : null,
        }).eq('id', run.id);

        // Update agent results_count if needed (only if positive count)
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

        console.log(`[REAPER] Finalized run ${run.id}: ${finalStatus}, ${totalLeads} leads`);
        reaped++;
      } catch (e) {
        console.error(`[REAPER] Failed to reap run ${run.id}:`, e);
      }
    }

    return new Response(JSON.stringify({ reaped }), {
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
