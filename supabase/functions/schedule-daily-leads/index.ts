const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const today = new Date().toISOString().split('T')[0];

    // Get all active campaigns
    const { data: campaigns, error: campErr } = await supabase
      .from('campaigns')
      .select('id, user_id, source_list_id, source_agent_id, workflow_steps, daily_connect_limit')
      .eq('status', 'active');

    if (campErr) throw campErr;
    if (!campaigns || campaigns.length === 0) {
      return jsonRes({ status: 'no_active_campaigns', scheduled: 0 });
    }

    // Resolve source_list_id for agent-sourced campaigns
    for (const campaign of campaigns) {
      if (!campaign.source_list_id && campaign.source_agent_id) {
        const { data: agent } = await supabase
          .from('signal_agents')
          .select('leads_list_name')
          .eq('id', campaign.source_agent_id)
          .single();
        if (agent?.leads_list_name) {
          const { data: list } = await supabase
            .from('lists')
            .select('id')
            .eq('name', agent.leads_list_name)
            .eq('user_id', campaign.user_id)
            .single();
          if (list) campaign.source_list_id = list.id;
        }
      }
    }

    let totalScheduled = 0;

    // Group campaigns by user to respect per-user limits
    const userCampaigns: Record<string, typeof campaigns> = {};
    for (const c of campaigns) {
      if (!c.user_id) continue;
      if (!userCampaigns[c.user_id]) userCampaigns[c.user_id] = [];
      userCampaigns[c.user_id].push(c);
    }

    for (const [userId, userCamps] of Object.entries(userCampaigns)) {
      try {
        // Get user profile limits
        const { data: profile } = await supabase
          .from('profiles')
          .select('daily_connections_limit, daily_messages_limit')
          .eq('user_id', userId)
          .single();

        const connectionsLimit = profile?.daily_connections_limit || 15;
        const messagesLimit = profile?.daily_messages_limit || 15;

        let connectionsScheduled = 0;
        let messagesScheduled = 0;

        for (const campaign of userCamps) {
          if (!campaign.source_list_id) continue;

          // ── Schedule connection requests ──
          const campaignConnLimit = campaign.daily_connect_limit || 25;
          const remainingConnections = Math.min(
            campaignConnLimit,
            connectionsLimit - connectionsScheduled
          );

          if (remainingConnections > 0) {
            // Get contacts in list
            const { data: contactLinks } = await supabase
              .from('contact_lists')
              .select('contact_id')
              .eq('list_id', campaign.source_list_id);

            if (contactLinks && contactLinks.length > 0) {
              const allContactIds = contactLinks.map((cl: any) => cl.contact_id);

              // Exclude already sent/accepted/completed contacts
              const { data: alreadySent } = await supabase
                .from('campaign_connection_requests')
                .select('contact_id, status')
                .eq('campaign_id', campaign.id);

              const doneSet = new Set(
                (alreadySent || [])
                  .filter((r: any) => ['sent', 'accepted', 'pending', 'completed'].includes(r.status))
                  .map((r: any) => r.contact_id)
              );

              const unseenIds = allContactIds.filter((id: string) => !doneSet.has(id));

              if (unseenIds.length > 0) {
                // Fetch with relevance tier for prioritization
                const { data: contactsWithTier } = await supabase
                  .from('contacts')
                  .select('id, relevance_tier')
                  .in('id', unseenIds);

                if (contactsWithTier && contactsWithTier.length > 0) {
                  const tierOrder: Record<string, number> = { hot: 0, warm: 1, cold: 2 };
                  contactsWithTier.sort((a: any, b: any) =>
                    (tierOrder[a.relevance_tier] ?? 2) - (tierOrder[b.relevance_tier] ?? 2)
                  );

                  const toSchedule = contactsWithTier.slice(0, remainingConnections);

                  for (const contact of toSchedule) {
                    const { error } = await supabase
                      .from('daily_scheduled_leads')
                      .upsert({
                        campaign_id: campaign.id,
                        contact_id: contact.id,
                        user_id: userId,
                        scheduled_date: today,
                        action_type: 'connection',
                        step_index: 1,
                        status: 'pending',
                      }, { onConflict: 'campaign_id,contact_id,scheduled_date,action_type' });

                    if (!error) {
                      connectionsScheduled++;
                      totalScheduled++;
                    }
                  }
                }
              }
            }
          }

          // ── Schedule follow-up messages ──
          const workflowSteps: any[] = Array.isArray(campaign.workflow_steps) ? campaign.workflow_steps : [];
          const messageSteps = workflowSteps.filter((s: any) => s.type === 'message');
          if (messageSteps.length === 0) continue;

          const remainingMessages = messagesLimit - messagesScheduled;
          if (remainingMessages <= 0) continue;

          // Get accepted contacts ready for next message
          const { data: acceptedRequests } = await supabase
            .from('campaign_connection_requests')
            .select('id, contact_id, current_step, step_completed_at, chat_id')
            .eq('campaign_id', campaign.id)
            .eq('status', 'accepted');

          if (!acceptedRequests || acceptedRequests.length === 0) continue;

          const hasInvitation = workflowSteps.length > 0 && workflowSteps[0].type === 'invitation';
          let msgScheduledThisCampaign = 0;

          for (const req of acceptedRequests) {
            if (msgScheduledThisCampaign >= remainingMessages) break;
            if (!req.chat_id) continue;

            const currentStep = req.current_step || 1;
            const nextWfIdx = hasInvitation ? currentStep : currentStep - 1;
            const nextStep = workflowSteps[nextWfIdx];

            if (!nextStep || nextStep.type !== 'message') continue;

            // Check if delay will have elapsed by end of today
            const stepCompletedAt = req.step_completed_at ? new Date(req.step_completed_at) : null;
            if (!stepCompletedAt) continue;

            const delayHours = nextStep.delay_hours || (nextStep.delay_days ? nextStep.delay_days * 24 : 24);
            const delayMs = delayHours * 60 * 60 * 1000;
            const readyAt = new Date(stepCompletedAt.getTime() + delayMs);

            // Schedule if it will be ready today (by end of day UTC)
            const endOfToday = new Date(today + 'T23:59:59.999Z');
            if (readyAt > endOfToday) continue;

            const actionType = `message_step_${currentStep + 1}`;
            const { error } = await supabase
              .from('daily_scheduled_leads')
              .upsert({
                campaign_id: campaign.id,
                contact_id: req.contact_id,
                user_id: userId,
                scheduled_date: today,
                action_type: actionType,
                step_index: nextWfIdx,
                status: 'pending',
              }, { onConflict: 'campaign_id,contact_id,scheduled_date,action_type' });

            if (!error) {
              msgScheduledThisCampaign++;
              messagesScheduled++;
              totalScheduled++;
            }
          }
        }

        console.log(`[schedule-daily] user ${userId}: ${connectionsScheduled} connections, ${messagesScheduled} messages scheduled`);
      } catch (err) {
        console.error(`[schedule-daily] error for user ${userId}:`, err);
      }
    }

    return jsonRes({ status: 'ok', total_scheduled: totalScheduled, date: today });
  } catch (error) {
    console.error('[schedule-daily] error:', error);
    return jsonRes({ error: error instanceof Error ? error.message : 'Unknown error' }, 500);
  }
});

function jsonRes(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
