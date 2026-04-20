const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import Stripe from 'https://esm.sh/stripe@17.7.0';

// ─── Fire-and-forget orchestrator ─────────────────────────────────────────────
// Returns immediately with job IDs, then processes in background via waitUntil.

interface SignalsConfig {
  enabled?: string[];
  keywords?: Record<string, string[]>;
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Cron schedule hours (UTC) — used to compute next_launch_at
const DAILY_LAUNCH_HOURS_UTC = [7, 9, 12, 15, 18];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  let targetAgentId: string | null = null;
  let bypassPlanCheck = false;
  let bypassBudget = false;
  try { const body = await req.json(); targetAgentId = body?.agent_id || null; bypassPlanCheck = body?.bypass_plan_check === true; bypassBudget = body?.bypass_budget === true; } catch { /* process all */ }

  try {
    const query = supabase.from('signal_agents').select('id, user_id, name');
    if (targetAgentId) query.eq('id', targetAgentId);
    else query.eq('status', 'active');
    const { data: agents, error: agentErr } = await query.limit(20);
    if (agentErr) throw new Error(`Failed to load agents: ${agentErr.message}`);
    if (!agents?.length) return jsonResponse({ message: 'No active signal agents', processed: 0 });

    // ── Daily run budget (manual triggers only) ──
    // Bandwidth safety net: cap any single agent at 20 runs per UTC day.
    // Bypassable via bypass_budget=true for active debugging sessions.
    const DAILY_RUN_BUDGET = 20;
    if (targetAgentId && !bypassBudget) {
      const startOfDay = new Date();
      startOfDay.setUTCHours(0, 0, 0, 0);
      const { count: todaysRuns } = await supabase
        .from('signal_agent_runs')
        .select('id', { count: 'exact', head: true })
        .eq('agent_id', targetAgentId)
        .gte('started_at', startOfDay.toISOString());
      if ((todaysRuns ?? 0) >= DAILY_RUN_BUDGET) {
        return new Response(
          JSON.stringify({
            error: `Daily run budget reached (${todaysRuns}/${DAILY_RUN_BUDGET}). This protects your Supabase bandwidth — try again tomorrow or wait for the next scheduled run.`,
            code: 'DAILY_BUDGET_EXCEEDED',
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }
    }

    // ── Stripe subscription check ──
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    const paidUsers = new Set<string>();
    if (bypassPlanCheck) {
      console.log('⚡ bypass_plan_check=true — treating all agents as paid');
      agents.forEach((a: any) => paidUsers.add(a.user_id));
    } else if (stripeKey) {
      const stripe = new Stripe(stripeKey, { apiVersion: '2024-12-18.acacia' });
      const uniqueUserIds = [...new Set(agents.map((a: any) => a.user_id))];
      for (const uid of uniqueUserIds) {
        try {
          const { data: { user } } = await supabase.auth.admin.getUserById(uid);
          if (!user?.email) continue;
          const customers = await stripe.customers.list({ email: user.email, limit: 1 });
          if (!customers.data.length) continue;
          const customer = customers.data[0];
          // Allow if active subscription OR card on file (but only if never had a subscription before)
          const subs = await stripe.subscriptions.list({ customer: customer.id, limit: 5 });
          const hasActiveSub = subs.data.some((s: any) => s.status === 'active' || s.status === 'trialing');
          const hadSubscription = subs.data.length > 0;
          if (hasActiveSub) {
            paidUsers.add(uid);
          } else if (!hadSubscription) {
            // Never had a subscription — allow with card on file (free trial)
            const defaultPm = customer.invoice_settings?.default_payment_method;
            if (defaultPm) {
              paidUsers.add(uid);
            } else {
              const pms = await stripe.paymentMethods.list({ customer: customer.id, type: 'card', limit: 1 });
              if (pms.data.length > 0) paidUsers.add(uid);
            }
          } else {
            // Had subscription but it's canceled — auto-pause their agents
            console.log(`User ${uid} had canceled subscription — pausing their agents`);
            const userAgentIds = agents.filter((a: any) => a.user_id === uid).map((a: any) => a.id);
            for (const agentId of userAgentIds) {
              await supabase.from('signal_agents').update({ status: 'paused' }).eq('id', agentId);
            }
            // Also pause their active campaigns
            await supabase.from('campaigns').update({ status: 'paused' }).eq('user_id', uid).eq('status', 'active');
          }
        } catch (e) { console.error(`Stripe check for ${uid}:`, e); }
      }
      console.log(`Eligible users (sub or card): ${paidUsers.size}/${uniqueUserIds.length}`);
    } else {
      console.warn('STRIPE_SECRET_KEY not set — processing all agents');
      agents.forEach((a: any) => paidUsers.add(a.user_id));
    }

    // Filter to paid agents only
    const eligibleAgents = agents.filter(a => paidUsers.has(a.user_id));
    if (!eligibleAgents.length) return jsonResponse({ message: 'No paid agents to process', processed: 0 });

    // Create a run record PER agent
    const runIds: { agentId: string; runId: string }[] = [];
    for (const agent of eligibleAgents) {
      const { data: run, error: runError } = await supabase.from('signal_agent_runs').insert({
        agent_id: agent.id, user_id: agent.user_id, status: 'queued', total_tasks: 0,
      }).select('id').single();
      if (runError) {
        console.error(`Failed to create run for agent ${agent.id}:`, runError.message);
        continue;
      }
      runIds.push({ agentId: agent.id, runId: run!.id });
    }

    if (!runIds.length) return jsonResponse({ message: 'Failed to create runs', processed: 0 });

    // Return immediately — all heavy work happens in background
    // @ts-ignore EdgeRuntime.waitUntil is available in Supabase Edge Functions
    EdgeRuntime.waitUntil(
      processAllAgents(runIds, bypassPlanCheck).catch(async (err) => {
        console.error(`Background processing failed:`, err);
      })
    );

    return jsonResponse({ job_ids: runIds.map(r => r.runId), message: 'Processing started', agents: runIds.length });
  } catch (error) {
    console.error('process-signal-agents error:', error);
    return errorResponse(error instanceof Error ? error.message : 'Unknown error');
  }
});

// ─── Process all agents in parallel ──────────────────────────────────────────

async function processAllAgents(runIds: { agentId: string; runId: string }[], bypassPlanCheck: boolean) {
  await Promise.allSettled(
    runIds.map(({ agentId, runId }) =>
      processSingleAgent(agentId, runId).catch(async (err) => {
        console.error(`Agent ${agentId} (run ${runId}) failed:`, err);
        const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        await sb.from('signal_agent_runs').update({
          status: 'failed', error: err?.message || String(err), completed_at: new Date().toISOString(),
        }).eq('id', runId);
      })
    )
  );
}

// ─── Process a single agent ──────────────────────────────────────────────────

async function processSingleAgent(agentId: string, runId: string) {
  const START = Date.now();
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  await supabase.from('signal_agent_runs').update({ status: 'running' }).eq('id', runId);

  // Fetch full agent data
  const { data: agent } = await supabase.from('signal_agents').select('*').eq('id', agentId).single();
  if (!agent) {
    await supabase.from('signal_agent_runs').update({ status: 'done', completed_at: new Date().toISOString() }).eq('id', runId);
    return;
  }

  const { data: profile } = await supabase.from('profiles').select('unipile_account_id').eq('user_id', agent.user_id).single();
  if (!profile?.unipile_account_id) {
    console.log(`Skipping agent ${agentId}: no Unipile account`);
    await supabase.from('signal_agent_runs').update({ status: 'done', completed_at: new Date().toISOString() }).eq('id', runId);
    return;
  }

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
  console.log(`Agent ${agentId}: business_context="${businessContext.slice(0, 100)}...", user_company="${userCompanyName}"`);

  const icpPayload = {
    jobTitles: (agent.icp_job_titles || []).map((s: string) => s.trim()).filter(Boolean),
    industries: (agent.icp_industries || []).map((s: string) => s.trim()).filter(Boolean),
    locations: (agent.icp_locations || []).map((s: string) => s.trim()).filter(Boolean),
    companySizes: (agent.icp_company_sizes || []).map((s: string) => s.trim()).filter(Boolean),
    companyTypes: (agent.icp_company_types || []).map((s: string) => s.trim()).filter(Boolean),
    excludeKeywords: (agent.icp_exclude_keywords || []).map((s: string) => s.toLowerCase().trim()).filter(Boolean),
    restrictedCountries: (agent.icp_restricted_countries || []).map((s: string) => s.toLowerCase().trim()).filter(Boolean),
    restrictedRoles: (agent.icp_restricted_roles || []).map((s: string) => s.toLowerCase().trim()).filter(Boolean),
  };

  const basePayload = {
    agent_id: agentId,
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
  interface TaskDef { signal_type: string; task_key: string; fn: string; payload: any; _isKeywordBatch?: boolean; }
  const tasks: TaskDef[] = [];

  const runOwnPostEngagers = enabled.includes('post_engagers');
  const runProfileEngagers = enabled.includes('profile_engagers');
  if (runOwnPostEngagers || runProfileEngagers) {
    tasks.push({
      signal_type: 'post_engagers', task_key: 'engagers', fn: 'signal-post-engagers',
      payload: { ...basePayload, profile_urls: runProfileEngagers ? (signalKeywords['profile_engagers'] || []) : [], run_own_posts: runOwnPostEngagers, run_profile_engagers: runProfileEngagers },
    });
  }

  // Keyword posts: split into batches of 4 (smaller batches finish faster, easier on Unipile)
  const KEYWORD_BATCH_SIZE = 4;
  if (enabled.includes('keyword_posts')) {
    const kws = signalKeywords['keyword_posts'] || agent.keywords || [];
    if (kws.length > 0) {
      for (let i = 0; i < kws.length; i += KEYWORD_BATCH_SIZE) {
        const batch = kws.slice(i, i + KEYWORD_BATCH_SIZE);
        const batchNum = Math.floor(i / KEYWORD_BATCH_SIZE) + 1;
        tasks.push({
          signal_type: 'keyword_posts',
          task_key: `keywords_b${batchNum}(${batch.length})`,
          fn: 'signal-keyword-posts',
          payload: { ...basePayload, keywords: batch },
          _isKeywordBatch: true,
        });
      }
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
    console.log(`Agent ${agentId}: job_changes enabled but not yet implemented — skipping`);
  }

  if (tasks.length === 0) {
    console.log(`Agent ${agentId}: no tasks to run`);
    await supabase.from('signal_agent_runs').update({ status: 'done', completed_at: new Date().toISOString() }).eq('id', runId);
    await setNextLaunchAt(supabase, agentId);
    return;
  }

  // Update run with task count
  await supabase.from('signal_agent_runs').update({ total_tasks: tasks.length }).eq('id', runId);

  // Separate keyword batches from other tasks early
  const keywordBatches = tasks.filter(t => t._isKeywordBatch);
  const otherTasks = tasks.filter(t => !t._isKeywordBatch);

  // ── Insert task records into the durable queue ──
  // Keyword batches: store as `pending` with full payload + staggered available_at.
  //   The drain-signal-agent-tasks worker (cron, every minute) claims them one
  //   at a time per run, with a cooldown between batches.
  // Other tasks: still inserted as `pending` (we mark them `running` right
  //   below when we kick them off in-process).
  const nowMs = Date.now();
  const KEYWORD_BATCH_STAGGER_MS = 75_000; // matches drain worker cooldown

  const taskRows = tasks.map((t, idx) => {
    const isKw = !!t._isKeywordBatch;
    const kwIdx = keywordBatches.findIndex(k => k.task_key === t.task_key);
    const availableAt = isKw
      ? new Date(nowMs + Math.max(0, kwIdx) * KEYWORD_BATCH_STAGGER_MS).toISOString()
      : new Date(nowMs).toISOString();
    return {
      run_id: runId,
      agent_id: agentId,
      signal_type: t.signal_type,
      task_key: t.task_key,
      status: 'pending',
      payload: isKw ? { ...t.payload } : null,
      available_at: availableAt,
    } as any;
  });
  await supabase.from('signal_agent_tasks').insert(taskRows);

  console.log(`Agent ${agentId}: ${tasks.length} tasks queued [${tasks.map(t => t.task_key).join(', ')}] — ${keywordBatches.length} keyword batches will be drained by worker`);

  // ── Kick off the drain worker IMMEDIATELY for the first keyword batch ──
  // Don't wait for the next cron tick — start now.
  if (keywordBatches.length > 0) {
    fetch(`${SUPABASE_URL}/functions/v1/drain-signal-agent-tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` },
      body: JSON.stringify({}),
    }).catch(err => console.error('Initial drain kick failed:', err));
  }

  // ── Mark non-keyword tasks as running and execute them in parallel (awaited) ──
  await Promise.all(otherTasks.map(task =>
    supabase.from('signal_agent_tasks')
      .update({ status: 'running', started_at: new Date().toISOString() })
      .eq('run_id', runId).eq('task_key', task.task_key)
  ));

  let agentLeads = 0;
  let completedTasks = 0;

  const otherPromises = otherTasks.map(async (task) => {
    try {
      const leads = await invokeSignalFunction(task.fn, { ...task.payload, run_id: runId, task_key: task.task_key });
      console.log(`${task.task_key}: ${leads} leads`);
      await supabase.from('signal_agent_tasks')
        .update({ status: 'done', leads_found: leads, completed_at: new Date().toISOString() })
        .eq('run_id', runId).eq('task_key', task.task_key);
      return { task_key: task.task_key, leads };
    } catch (err) {
      console.error(`${task.task_key} failed:`, err);
      await supabase.from('signal_agent_tasks')
        .update({ status: 'failed', error: String(err), completed_at: new Date().toISOString() })
        .eq('run_id', runId).eq('task_key', task.task_key);
      return { task_key: task.task_key, leads: 0 };
    }
  });

  const otherResults = await Promise.allSettled(otherPromises);
  for (const r of otherResults) {
    if (r.status === 'fulfilled') {
      agentLeads += r.value.leads;
    }
    completedTasks++;
  }

  // Update run with results from non-keyword tasks
  await supabase.from('signal_agent_runs')
    .update({ completed_tasks: completedTasks, total_leads: agentLeads })
    .eq('id', runId);

  // If there are no keyword batches, finalize the run now.
  // Otherwise, the keyword fetcher self-finalizes when the LAST pending/running
  // task completes, and the reaper handles long-tail cleanup based on lease expiry.
  if (keywordBatches.length === 0) {
    await finalizeRun(supabase, runId, agentId, agent, agentLeads, completedTasks, tasks.length, listName);
  } else {
    console.log(`Agent ${agentId}: ${keywordBatches.length} keyword batches queued — drain worker will pace them; reaper handles lease expiry`);
  }

  // Always set next_launch_at regardless of keyword batches
  await setNextLaunchAt(supabase, agentId);

  console.log(`Agent ${agentId}: ${agentLeads} leads from awaited tasks (${Math.round((Date.now() - START) / 1000)}s)`);
}

// ─── Finalize a run ──────────────────────────────────────────────────────────

async function finalizeRun(
  supabase: any, runId: string, agentId: string, agent: any,
  totalLeads: number, completedTasks: number, totalTasks: number, listName: string
) {
  // Final count from DB
  const { data: agentList } = await supabase.from('lists').select('id').eq('user_id', agent.user_id).eq('name', listName).maybeSingle();
  let actualCount = (agent.results_count || 0) + totalLeads;
  if (agentList) {
    const { count: listContactCount } = await supabase.from('contact_lists').select('id', { count: 'exact', head: true }).eq('list_id', agentList.id);
    if (typeof listContactCount === 'number') actualCount = listContactCount;
  }
  await supabase.from('signal_agents').update({
    last_launched_at: new Date().toISOString(),
    results_count: actualCount,
  }).eq('id', agentId);

  // Aggregate rejected_profiles_sample across all tasks in this run
  const aggregatedRejected = await aggregateRejectedProfiles(supabase, runId);

  await supabase.from('signal_agent_runs').update({
    status: completedTasks === totalTasks ? 'done' : 'partial',
    completed_tasks: completedTasks, total_leads: totalLeads,
    completed_at: new Date().toISOString(),
    rejected_profiles_sample: aggregatedRejected,
  }).eq('id', runId);

  if (totalLeads > 0) {
    await supabase.from('notifications').insert({
      user_id: agent.user_id,
      title: `${agent.name}: ${totalLeads} new leads`,
      body: `Your signal agent "${agent.name}" discovered ${totalLeads} new leads matching your ICP.`,
      type: 'signal', link: '/contacts',
    });
  }

  // Trigger AI suggestions asynchronously if run was thin or had many ICP rejections
  await maybeTriggerSuggestions(runId, agentId, totalLeads, aggregatedRejected.length);

  console.log(`✅ Run ${runId} finalized: ${totalLeads} leads, ${completedTasks}/${totalTasks} tasks, ${aggregatedRejected.length} rejected sampled`);
}

// Aggregate rejected profile samples across all tasks in a run (cap at 200)
async function aggregateRejectedProfiles(supabase: any, runId: string): Promise<any[]> {
  const { data: tasks } = await supabase.from('signal_agent_tasks')
    .select('rejected_profiles_sample, signal_type')
    .eq('run_id', runId);
  const all: any[] = [];
  for (const t of tasks || []) {
    const sample = (t.rejected_profiles_sample || []) as any[];
    for (const p of sample) {
      all.push({ ...p, signalType: p.signalType ?? t.signal_type });
      if (all.length >= 200) break;
    }
    if (all.length >= 200) break;
  }
  return all;
}

// Fire-and-forget suggestion trigger
async function maybeTriggerSuggestions(runId: string, agentId: string, totalLeads: number, rejectedCount: number) {
  if (totalLeads >= 20 && rejectedCount <= 50) return;
  try {
    // @ts-ignore EdgeRuntime is available in Supabase Edge Functions
    EdgeRuntime.waitUntil(
      fetch(`${SUPABASE_URL}/functions/v1/generate-agent-suggestions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` },
        body: JSON.stringify({ runId, agentId }),
      }).catch((e) => console.warn(`[SUGGESTIONS] trigger failed for run ${runId}:`, e))
    );
    console.log(`[SUGGESTIONS] Triggered for run ${runId} (leads=${totalLeads}, rejected=${rejectedCount})`);
  } catch (e) {
    console.warn(`[SUGGESTIONS] EdgeRuntime.waitUntil unavailable:`, e);
  }
}

// ─── Set next_launch_at based on cron schedule ───────────────────────────────

async function setNextLaunchAt(supabase: any, agentId: string) {
  const now = new Date();
  const currentHour = now.getUTCHours();
  const currentMinute = now.getUTCMinutes();

  // Find the next launch hour after now
  let nextHour = DAILY_LAUNCH_HOURS_UTC.find(h => h > currentHour);
  const nextDate = new Date(now);

  if (nextHour !== undefined) {
    nextDate.setUTCHours(nextHour, 0, 0, 0);
  } else {
    // All today's launches are past — next is first launch tomorrow
    nextDate.setUTCDate(nextDate.getUTCDate() + 1);
    nextDate.setUTCHours(DAILY_LAUNCH_HOURS_UTC[0], 0, 0, 0);
  }

  await supabase.from('signal_agents').update({
    next_launch_at: nextDate.toISOString(),
  }).eq('id', agentId);

  console.log(`Agent ${agentId}: next_launch_at set to ${nextDate.toISOString()}`);
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
