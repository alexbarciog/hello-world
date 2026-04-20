const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!RESEND_API_KEY || !LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'Missing email keys' }), { status: 500, headers: corsHeaders });
    }

    // Get all agents with manual_approval enabled
    const { data: agents } = await supabase
      .from('signal_agents')
      .select('id, user_id, name, leads_list_name, manual_approval')
      .eq('manual_approval', true);

    if (!agents || agents.length === 0) {
      return new Response(JSON.stringify({ status: 'no_manual_agents', sent: 0 }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    let emailsSent = 0;
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // Group by user
    const userAgents: Record<string, typeof agents> = {};
    for (const a of agents) {
      if (!userAgents[a.user_id]) userAgents[a.user_id] = [];
      userAgents[a.user_id].push(a);
    }

    for (const [userId, uAgents] of Object.entries(userAgents)) {
      let totalPending = 0;
      const agentSummaries: string[] = [];

      for (const agent of uAgents) {
        // Find lists for this agent
        const listName = agent.leads_list_name || agent.name;
        const { data: list } = await supabase.from('lists').select('id').eq('user_id', userId).eq('name', listName).maybeSingle();
        if (!list) continue;

        // Count pending contacts added in last 24h
        const { data: contactIds } = await supabase.from('contact_lists').select('contact_id').eq('list_id', list.id);
        if (!contactIds || contactIds.length === 0) continue;

        const ids = contactIds.map((c: any) => c.contact_id);
        let pendingCount = 0;
        for (let i = 0; i < ids.length; i += 100) {
          const batch = ids.slice(i, i + 100);
          const { count } = await supabase.from('contacts').select('id', { count: 'exact', head: true })
            .in('id', batch).eq('approval_status', 'pending').gte('imported_at', since);
          pendingCount += (count || 0);
        }

        if (pendingCount > 0) {
          totalPending += pendingCount;
          agentSummaries.push(`• ${agent.name}: ${pendingCount} new lead${pendingCount > 1 ? 's' : ''}`);
        }
      }

      if (totalPending === 0) continue;

      // Get user email
      const { data: { user } } = await supabase.auth.admin.getUserById(userId);
      if (!user?.email) continue;

      const html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 20px;">
          <h2 style="font-size: 20px; font-weight: 700; margin: 0 0 8px;">🎯 ${totalPending} new lead${totalPending > 1 ? 's' : ''} need${totalPending === 1 ? 's' : ''} your approval</h2>
          <p style="color: #6b7280; font-size: 14px; margin: 0 0 20px;">Your signal agents found leads that require manual review.</p>
          <div style="background: #f9fafb; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
            ${agentSummaries.join('<br/>')}
          </div>
          <a href="https://intentsly.com/contacts" style="display: inline-block; background: #000; color: #fff; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-size: 14px; font-weight: 600;">Review & Approve Leads</a>
          <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">Only approved leads will be used in your outreach campaigns.</p>
        </div>
      `;

      const GATEWAY_URL = 'https://connector-gateway.lovable.dev/resend';
      await fetch(`${GATEWAY_URL}/emails`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'X-Connection-Api-Key': RESEND_API_KEY,
        },
        body: JSON.stringify({
          from: 'Intentsly <no-reply@intentsly.com>',
          to: [user.email],
          subject: `🎯 ${totalPending} new leads need your approval — Intentsly`,
          html,
        }),
      });
      emailsSent++;
    }

    return new Response(JSON.stringify({ status: 'ok', emails_sent: emailsSent }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[send-approval-digest] error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
