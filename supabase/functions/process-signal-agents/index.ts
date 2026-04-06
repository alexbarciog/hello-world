const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import Stripe from 'https://esm.sh/stripe@17.7.0';

// ─── Fire-and-forget orchestrator ─────────────────────────────────────────────
// Returns immediately with a job_id, then processes in background via waitUntil.

interface SignalsConfig {
  enabled?: string[];
  keywords?: Record<string, string[]>;
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  let targetAgentId: string | null = null;
  let bypassPlanCheck = false;
  try { const body = await req.json(); targetAgentId = body?.agent_id || null; bypassPlanCheck = body?.bypass_plan_check === true; } catch { /* process all */ }

  try {
    // Minimal query: just get the agent to create a run record
    const query = supabase.from('signal_agents').select('id, user_id, name');
    if (targetAgentId) query.eq('id', targetAgentId);
    else query.eq('status', 'active');
    const { data: agents, error: agentErr } = await query.limit(20);
    if (agentErr) throw new Error(`Failed to load agents: ${agentErr.message}`);
    if (!agents?.length) return jsonResponse({ message: 'No active signal agents', processed: 0 });

    // Create a run record for the first agent (single-agent mode is the common case)
    const agent = agents[0];
    const { data: run, error: runError } = await supabase.from('signal_agent_runs').insert({
      agent_id: agent.id, user_id: agent.user_id, status: 'queued', total_tasks: 0,
    }).select('id').single();

    if (runError) throw new Error(`Failed to create run: ${runError.message}`);
    const jobId = run!.id;

    // Return immediately — all heavy work happens in background
    // @ts-ignore EdgeRuntime.waitUntil is available in Supabase Edge Functions
    EdgeRuntime.waitUntil(
      processInBackground(jobId, agents).catch(async (err) => {
        console.error(`Background processing failed for run ${jobId}:`, err);
        const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        await sb.from('signal_agent_runs').update({
          status: 'failed', error: err?.message || String(err), completed_at: new Date().toISOString(),
        }).eq('id', jobId);
      })
    );

    return jsonResponse({ job_id: jobId, message: 'Processing started' });
  } catch (error) {
    console.error('process-signal-agents error:', error);
    return errorResponse(error instanceof Error ? error.message : 'Unknown error');
  }
});

// ─── Background processing ───────────────────────────────────────────────────

async function processInBackground(runId: string, agents: any[]) {
  const START = Date.now();
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Update run to running
  await supabase.from('signal_agent_runs').update({ status: 'running' }).eq('id', runId);

  let totalLeads = 0;

  // ── Stripe subscription check ──
  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
  const paidUsers = new Set<string>();
  if (stripeKey) {
    const stripe = new Stripe(stripeKey, { apiVersion: '2024-12-18.acacia' });
    const uniqueUserIds = [...new Set(agents.map((a: any) => a.user_id))];
    for (const uid of uniqueUserIds) {
      try {
        const { data: { user } } = await supabase.auth.admin.getUserById(uid);
        if (!user?.email) continue;
        const customers = await stripe.customers.list({ email: user.email, limit: 1 });
        if (!customers.data.length) continue;
        const subs = await stripe.subscriptions.list({ customer: customers.data[0].id, limit: 5 });
        if (subs.data.some((s: any) => s.status === 'active' || s.status === 'trialing')) paidUsers.add(uid);
      } catch (e) { console.error(`Stripe check for ${uid}:`, e); }
    }
    console.log(`Paid users: ${paidUsers.size}/${uniqueUserIds.length}`);
  } else {
    console.warn('STRIPE_SECRET_KEY not set — processing all agents');
    agents.forEach((a: any) => paidUsers.add(a.user_id));
  }

  // Re-fetch full agent data for processing
  const agentIds = agents.map(a => a.id);
  const { data: fullAgents } = await supabase.from('signal_agents').select('*').in('id', agentIds);
  if (!fullAgents?.length) {
    await supabase.from('signal_agent_runs').update({ status: 'done', completed_at: new Date().toISOString() }).eq('id', runId);
    return;
  }

  for (const agent of fullAgents) {
    if (!paidUsers.has(agent.user_id)) {
      console.log(`Skipping agent ${agent.id}: free plan`);
      continue;
    }

    try {
      const { data: profile } = await supabase.from('profiles').select('unipile_account_id').eq('user_id', agent.user_id).single();
      if (!profile?.unipile_account_id) { console.log(`Skipping agent ${agent.id}: no Unipile account`); continue; }

      const accountId = profile.unipile_account_id;
      const config: SignalsConfig = (agent.signals_config as SignalsConfig) || {};
      const enabled = config.enabled || [];
      const signalKeywords = config.keywords || {};
      const listName = agent.leads_list_name || agent.name || 'Signal Leads';

      // Build competitor company names for exclusion
      const competitorCompanyNames: string[] = [];
      for (const key of ['competitor_followers', 'competitor_engagers']) {
        for (const url of (signalKeywords[key] || [])) {
          const name = extractCompanyName(url);
          if (name) competitorCompanyNames.push(name.toLowerCase());
        }
      }

      // ── Build business_context from newest NON-EMPTY campaign ──
      let businessContext = '';
      let userCompanyName = '';
      const { data: campaigns } = await supabase
        .from('campaigns')
        .select('description, value_proposition, company_name, website, industry')
        .eq('user_id', agent.user_id)
        .order('created_at', { ascending: false })
        .limit(5);
      if (campaigns) {
        for (const c of campaigns) {
          // Extract company name from first campaign that has one
          if (!userCompanyName && c.company_name) userCompanyName = c.company_name;
          const parts = [
            c.company_name ? `Company: ${c.company_name}` : '',
            c.description ? `What they sell: ${c.description}` : '',
            c.value_proposition ? `Value proposition: ${c.value_proposition}` : '',
            c.industry ? `Industry: ${c.industry}` : '',
          ].filter(Boolean);
          if (parts.length >= 2 && !businessContext) { businessContext = parts.join('. '); }
        }
      }
      if (!businessContext) {
        const kws = agent.keywords || signalKeywords['keyword_posts'] || [];
        businessContext = `Company focuses on: ${agent.name}. Keywords: ${kws.join(', ')}`;
      }
      console.log(`Agent ${agent.id}: business_context="${businessContext.slice(0, 100)}...", user_company="${userCompanyName}"`);

      const icpPayload = {
        jobTitles: (agent.icp_job_titles || []).map((s: string) => s.trim()).filter(Boolean),
        industries: (agent.icp_industries || []).map((s: string) => s.trim()).filter(Boolean),
        locations: (agent.icp_locations || []).map((s: string) => s.trim()).filter(Boolean),
        companySizes: (agent.icp_company_sizes || []).map((s: string) => s.trim()).filter(Boolean),
        companyTypes: (agent.icp_company_types || []).map((s: string) => s.trim()).filter(Boolean),
        excludeKeywords: (agent.icp_exclude_keywords || []).map((s: string) => s.toLowerCase().trim()).filter(Boolean),
      };

      const basePayload = {
        agent_id: agent.id,
        account_id: accountId,
        user_id: agent.user_id,
        list_name: listName,
        icp: icpPayload,
        competitor_companies: competitorCompanyNames,
        business_context: businessContext,
        user_company_name: userCompanyName,
        precision_mode: agent.precision_mode || 'discovery',
      };

      // ── Build task list ──
      interface TaskDef { signal_type: string; task_key: string; fn: string; payload: any; }
      const tasks: TaskDef[] = [];

      const runOwnPostEngagers = enabled.includes('post_engagers');
      const runProfileEngagers = enabled.includes('profile_engagers');
      if (runOwnPostEngagers || runProfileEngagers) {
        tasks.push({
          signal_type: 'post_engagers', task_key: 'engagers', fn: 'signal-post-engagers',
          payload: { ...basePayload, profile_urls: runProfileEngagers ? (signalKeywords['profile_engagers'] || []) : [], run_own_posts: runOwnPostEngagers, run_profile_engagers: runProfileEngagers },
        });
      }

      if (enabled.includes('keyword_posts')) {
        const kws = signalKeywords['keyword_posts'] || agent.keywords || [];
        if (kws.length > 0) {
          tasks.push({
            signal_type: 'keyword_posts', task_key: `keywords(${kws.length})`, fn: 'signal-keyword-posts',
            payload: { ...basePayload, keywords: kws },
          });
        }
      }

      if (enabled.includes('hashtag_engagement')) {
        const hashtags = signalKeywords['hashtag_engagement'] || [];
        if (hashtags.length > 0) {
          tasks.push({
            signal_type: 'hashtag_engagement', task_key: `hashtags(${hashtags.length})`, fn: 'signal-hashtag-engagement',
            payload: { ...basePayload, hashtags },
          });
        }
      }

      if (enabled.includes('competitor_followers')) {
        const urls = signalKeywords['competitor_followers'] || [];
        if (urls.length > 0) {
          tasks.push({
            signal_type: 'competitor_followers', task_key: `comp_followers(${urls.length})`, fn: 'signal-competitor',
            payload: { ...basePayload, signal_type: 'competitor_followers', urls },
          });
        }
      }

      if (enabled.includes('competitor_engagers')) {
        const urls = signalKeywords['competitor_engagers'] || [];
        if (urls.length > 0) {
          tasks.push({
            signal_type: 'competitor_engagers', task_key: `comp_engagers(${urls.length})`, fn: 'signal-competitor',
            payload: { ...basePayload, signal_type: 'competitor_engagers', urls },
          });
        }
      }

      if (enabled.includes('job_changes')) {
        console.log(`Agent ${agent.id}: job_changes enabled but not yet implemented — skipping`);
      }

      // Update run with task count
      await supabase.from('signal_agent_runs').update({ total_tasks: tasks.length }).eq('id', runId);

      // Create task records
      if (tasks.length > 0) {
        await supabase.from('signal_agent_tasks').insert(
          tasks.map(t => ({ run_id: runId, agent_id: agent.id, signal_type: t.signal_type, task_key: t.task_key }))
        );
      }

      let agentLeads = 0;
      let completedTasks = 0;
      console.log(`Agent ${agent.id}: ${tasks.length} tasks [${tasks.map(t => t.task_key).join(', ')}]`);

      // ── Process tasks sequentially ──
      for (const task of tasks) {
        if (Date.now() - START > 145_000) {
          console.log(`Agent ${agent.id}: parent timeout — ${tasks.length - completedTasks} tasks remaining`);
          break;
        }

        await supabase.from('signal_agent_tasks')
          .update({ status: 'running', started_at: new Date().toISOString() })
          .eq('run_id', runId).eq('task_key', task.task_key);

        const leads = await invokeSignalFunction(task.fn, task.payload);
        console.log(`${task.task_key}: ${leads} leads`);
        agentLeads += leads;
        completedTasks++;

        await supabase.from('signal_agent_tasks')
          .update({ status: 'done', leads_found: leads, completed_at: new Date().toISOString() })
          .eq('run_id', runId).eq('task_key', task.task_key);
        await supabase.from('signal_agent_runs')
          .update({ completed_tasks: completedTasks, total_leads: agentLeads })
          .eq('id', runId);

        await saveAgentProgress(supabase, agent, agentLeads);
      }

      // Final count from DB
      const { data: agentList } = await supabase.from('lists').select('id').eq('user_id', agent.user_id).eq('name', listName).maybeSingle();
      let actualCount = (agent.results_count || 0) + agentLeads;
      if (agentList) {
        const { count: listContactCount } = await supabase.from('contact_lists').select('id', { count: 'exact', head: true }).eq('list_id', agentList.id);
        if (typeof listContactCount === 'number') actualCount = listContactCount;
      }
      await supabase.from('signal_agents').update({
        last_launched_at: new Date().toISOString(),
        results_count: actualCount,
      }).eq('id', agent.id);

      // Finalize run
      await supabase.from('signal_agent_runs').update({
        status: completedTasks === tasks.length ? 'done' : 'partial',
        completed_tasks: completedTasks, total_leads: agentLeads,
        completed_at: new Date().toISOString(),
      }).eq('id', runId);

      if (agentLeads > 0) {
        await supabase.from('notifications').insert({
          user_id: agent.user_id,
          title: `${agent.name}: ${agentLeads} new leads`,
          body: `Your signal agent "${agent.name}" discovered ${agentLeads} new leads matching your ICP.`,
          type: 'signal', link: '/contacts',
        });
      }

      totalLeads += agentLeads;
      console.log(`Agent ${agent.id}: ${agentLeads} leads total (${Math.round((Date.now() - START) / 1000)}s)`);
    } catch (e) {
      console.error(`Error processing agent ${agent.id}:`, e);
    }
  }

  // If no tasks were created (e.g. all agents skipped), finalize
  if (totalLeads === 0) {
    const { data: currentRun } = await supabase.from('signal_agent_runs').select('status').eq('id', runId).single();
    if (currentRun?.status === 'running') {
      await supabase.from('signal_agent_runs').update({ status: 'done', completed_at: new Date().toISOString() }).eq('id', runId);
    }
  }

  console.log(`Background processing complete: ${totalLeads} total leads (${Math.round((Date.now() - START) / 1000)}s)`);
}

// ─── Invoke a signal edge function ───────────────────────────────────────────

async function invokeSignalFunction(functionName: string, payload: any): Promise<number> {
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error(`${functionName} returned ${res.status}: ${text.slice(0, 200)}`);
      return 0;
    }
    const data = await res.json();
    return data.leads || 0;
  } catch (e) {
    console.error(`invokeSignalFunction ${functionName}:`, e);
    return 0;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function saveAgentProgress(supabase: any, agent: any, agentLeads: number) {
  await supabase.from('signal_agents').update({
    last_launched_at: new Date().toISOString(),
    results_count: (agent.results_count || 0) + agentLeads,
  }).eq('id', agent.id);
}

function extractLinkedInId(url: string): string | null {
  if (!url) return null;
  const m = url.match(/linkedin\.com\/(?:company|in)\/([^/?]+)/);
  return m ? m[1] : null;
}

function extractCompanyName(url: string): string | null {
  const id = extractLinkedInId(url);
  if (!id) return null;
  return id.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function jsonResponse(data: any) {
  return new Response(JSON.stringify(data), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

function errorResponse(message: string) {
  return new Response(JSON.stringify({ error: message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}
