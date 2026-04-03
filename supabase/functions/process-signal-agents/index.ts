const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import Stripe from 'https://esm.sh/stripe@17.7.0';

// ─── Sequential Dispatcher ───────────────────────────────────────────────────
// Invokes separate edge functions for each signal type, one at a time.
// Each signal function gets its own ~105s budget.

interface SignalsConfig {
  enabled?: string[];
  keywords?: Record<string, string[]>;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  let targetAgentId: string | null = null;
  try { const body = await req.json(); targetAgentId = body?.agent_id || null; } catch { /* process all */ }

  try {
    const query = supabase.from('signal_agents').select('*');
    if (targetAgentId) query.eq('id', targetAgentId);
    else query.eq('status', 'active');
    const { data: agents, error: agentErr } = await query.limit(20);
    if (agentErr) throw new Error(`Failed to load agents: ${agentErr.message}`);
    if (!agents?.length) return jsonResponse({ message: 'No active signal agents', processed: 0 });

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

    for (const agent of agents) {
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
        };

        let agentLeads = 0;
        console.log(`Agent ${agent.id}: signals=[${enabled.join(',')}]`);

        // ── 1. Post Engagers / Profile Engagers ──
        const runOwnPostEngagers = enabled.includes('post_engagers');
        const runProfileEngagers = enabled.includes('profile_engagers');
        if (runOwnPostEngagers || runProfileEngagers) {
          const profileUrls = runProfileEngagers ? (signalKeywords['profile_engagers'] || []) : [];
          const leads = await invokeSignalFunction(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, 'signal-post-engagers', {
            ...basePayload,
            profile_urls: profileUrls,
            run_own_posts: runOwnPostEngagers,
            run_profile_engagers: runProfileEngagers,
          });
          console.log(`signal-post-engagers: ${leads} leads (own_posts=${runOwnPostEngagers}, profile_engagers=${runProfileEngagers})`);
          agentLeads += leads;
          await saveAgentProgress(supabase, agent, agentLeads);
        }

        // ── 2. Keyword Posts ──
        if (enabled.includes('keyword_posts')) {
          const kws = signalKeywords['keyword_posts'] || agent.keywords || [];
          if (kws.length > 0) {
            const leads = await invokeSignalFunction(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, 'signal-keyword-posts', {
              ...basePayload,
              keywords: kws,
            });
            console.log(`keyword_posts: ${leads} leads`);
            agentLeads += leads;
            await saveAgentProgress(supabase, agent, agentLeads);
          }
        }

        // ── 3. Hashtag Engagement ──
        if (enabled.includes('hashtag_engagement')) {
          const hashtags = signalKeywords['hashtag_engagement'] || [];
          if (hashtags.length > 0) {
            const leads = await invokeSignalFunction(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, 'signal-hashtag-engagement', {
              ...basePayload,
              hashtags,
            });
            console.log(`hashtag_engagement: ${leads} leads`);
            agentLeads += leads;
            await saveAgentProgress(supabase, agent, agentLeads);
          }
        }

        // ── 4. Competitor Followers ──
        if (enabled.includes('competitor_followers')) {
          const urls = signalKeywords['competitor_followers'] || [];
          if (urls.length > 0) {
            const leads = await invokeSignalFunction(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, 'signal-competitor', {
              ...basePayload,
              signal_type: 'competitor_followers',
              urls,
            });
            console.log(`competitor_followers: ${leads} leads`);
            agentLeads += leads;
            await saveAgentProgress(supabase, agent, agentLeads);
          }
        }

        // ── 5. Competitor Engagers ──
        if (enabled.includes('competitor_engagers')) {
          const urls = signalKeywords['competitor_engagers'] || [];
          if (urls.length > 0) {
            const leads = await invokeSignalFunction(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, 'signal-competitor', {
              ...basePayload,
              signal_type: 'competitor_engagers',
              urls,
            });
            console.log(`competitor_engagers: ${leads} leads`);
            agentLeads += leads;
            await saveAgentProgress(supabase, agent, agentLeads);
          }
        }

        // Final count from DB for accuracy
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

        if (agentLeads > 0) {
          await supabase.from('notifications').insert({
            user_id: agent.user_id,
            title: `${agent.name}: ${agentLeads} new leads`,
            body: `Your signal agent "${agent.name}" discovered ${agentLeads} new leads matching your ICP.`,
            type: 'signal', link: '/contacts',
          });
        }

        totalLeads += agentLeads;
        console.log(`Agent ${agent.id}: ${agentLeads} leads total`);
      } catch (e) { console.error(`Error processing agent ${agent.id}:`, e); }
    }

    return jsonResponse({ message: `Processed ${agents.length} agents, ${totalLeads} total leads`, processed: agents.length, leads_inserted: totalLeads });
  } catch (error) {
    console.error('process-signal-agents error:', error);
    return errorResponse(error instanceof Error ? error.message : 'Unknown error');
  }
});

// ─── Invoke a signal edge function and wait for result ────────────────────────

async function invokeSignalFunction(supabaseUrl: string, serviceRoleKey: string, functionName: string, payload: any): Promise<number> {
  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`,
      },
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
