const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// True when a persisted contacts.network_distance value means "already a
// 1st-degree connection". Values come from Unipile responses saved at
// discovery or by send-connection-requests, so cover the common encodings.
function isFirstDegreeDistance(value: unknown): boolean {
  if (value == null) return false;
  const v = String(value).trim().toUpperCase();
  return v === '1' || v === 'FIRST_DEGREE' || v === 'FIRST' || v === 'DISTANCE_1' || v === '1ST';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const today = new Date().toISOString().split('T')[0];

    // ── Cleanup: expire yesterday's (and older) pending entries ──
    const { data: staleLeads } = await supabase
      .from('daily_scheduled_leads')
      .select('id, campaign_id, contact_id, user_id, action_type, step_index')
      .lt('scheduled_date', today)
      .eq('status', 'pending');

    if (staleLeads && staleLeads.length > 0) {
      console.log(`[schedule-daily] Expiring ${staleLeads.length} stale pending entries from previous days`);
      const staleIds = staleLeads.map((s: any) => s.id);
      // Mark them as expired in batches
      for (let i = 0; i < staleIds.length; i += 50) {
        await supabase
          .from('daily_scheduled_leads')
          .update({ status: 'expired' })
          .in('id', staleIds.slice(i, i + 50));
      }
    }

    // Also clean up sent/failed/skipped from previous days (housekeeping)
    await supabase
      .from('daily_scheduled_leads')
      .delete()
      .lt('scheduled_date', today)
      .in('status', ['sent', 'failed', 'skipped', 'expired']);

    // Get all active campaigns
    const { data: campaigns, error: campErr } = await supabase
      .from('campaigns')
      .select('id, user_id, source_list_id, source_agent_id, workflow_steps, daily_connect_limit, exclude_first_degree')
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
    // Per-campaign diagnostics so an empty day is explainable instead of silent.
    const campaignReports: { campaign_id: string; scheduled_connections: number; scheduled_messages: number; note: string }[] = [];

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

        // Count what is ALREADY scheduled today across this user (any status) so
        // repeated invocations don't double-count and starve later campaigns.
        const { data: existingToday } = await supabase
          .from('daily_scheduled_leads')
          .select('campaign_id, action_type')
          .eq('user_id', userId)
          .eq('scheduled_date', today);

        let connectionsScheduled = 0;
        let messagesScheduled = 0;
        const perCampaignConn: Record<string, number> = {};
        const perCampaignMsg: Record<string, number> = {};
        for (const row of existingToday || []) {
          if (row.action_type === 'connection') {
            connectionsScheduled++;
            perCampaignConn[row.campaign_id] = (perCampaignConn[row.campaign_id] || 0) + 1;
          } else if (typeof row.action_type === 'string' && row.action_type.startsWith('message_step_')) {
            messagesScheduled++;
            perCampaignMsg[row.campaign_id] = (perCampaignMsg[row.campaign_id] || 0) + 1;
          }
        }

        for (const campaign of userCamps) {
          const report = { campaign_id: campaign.id, scheduled_connections: 0, scheduled_messages: 0, note: '' };
          campaignReports.push(report);
          // Per-campaign isolation: one campaign's failure must never starve the
          // user's other campaigns (previously an exception aborted the whole user).
          try {
          if (!campaign.source_list_id) {
            report.note = 'no source list resolved — agent list missing or renamed';
            continue;
          }

          // Per-campaign cap (falls back to sender limit if unset)
          const campaignCap = campaign.daily_connect_limit && campaign.daily_connect_limit > 0
            ? campaign.daily_connect_limit
            : connectionsLimit;

          // ── Schedule connection requests ──
          // Respect BOTH the sender-wide cap and the remaining per-campaign cap
          const campaignConnRemaining = campaignCap - (perCampaignConn[campaign.id] || 0);
          const remainingConnections = Math.min(
            connectionsLimit - connectionsScheduled,
            campaignConnRemaining,
          );

          if (remainingConnections <= 0) {
            report.note = `connection quota exhausted for today (user-wide limit ${connectionsLimit}, already scheduled ${connectionsScheduled}; campaign cap ${campaignCap})`;
          }

          if (remainingConnections > 0) {
            // Get contacts in list — batch to avoid URL length limits
            let allContactIds: string[] = [];
            let offset = 0;
            const PAGE_SIZE = 500;
            while (true) {
              const { data: contactLinks } = await supabase
                .from('contact_lists')
                .select('contact_id')
                .eq('list_id', campaign.source_list_id)
                .range(offset, offset + PAGE_SIZE - 1);
              if (!contactLinks || contactLinks.length === 0) break;
              allContactIds.push(...contactLinks.map((cl: any) => cl.contact_id));
              if (contactLinks.length < PAGE_SIZE) break;
              offset += PAGE_SIZE;
            }

            if (allContactIds.length > 0) {
              // Exclude already sent/accepted/completed contacts — batch query
              let alreadySent: any[] = [];
              for (let i = 0; i < allContactIds.length; i += 100) {
                const batch = allContactIds.slice(i, i + 100);
                const { data } = await supabase
                  .from('campaign_connection_requests')
                  .select('contact_id, status')
                  .eq('campaign_id', campaign.id)
                  .in('contact_id', batch);
                if (data) alreadySent.push(...data);
              }

              // 'skipped_already_connected' is TERMINAL: the send step confirmed via
              // Unipile that this contact is already a 1st-degree connection. Without
              // it here, such contacts were rescheduled (and re-skipped) every day.
              const doneSet = new Set(
                alreadySent
                  .filter((r: any) => ['sent', 'accepted', 'pending', 'completed', 'skipped_already_connected', 'skipped_company', 'skipped_unreachable'].includes(r.status))
                  .map((r: any) => r.contact_id)
              );

              const unseenIds = allContactIds.filter((id: string) => !doneSet.has(id));
              console.log(`[schedule-daily] campaign ${campaign.id}: ${allContactIds.length} total, ${doneSet.size} done, ${unseenIds.length} unseen`);
              if (unseenIds.length === 0) {
                report.note = `all ${allContactIds.length} contacts already contacted or terminally skipped`;
              }

              if (unseenIds.length > 0) {
                // Fetch with relevance tier — batch in chunks of 100, only approved/auto_approved
                let contactsWithTier: any[] = [];
                for (let i = 0; i < unseenIds.length; i += 100) {
                  const batch = unseenIds.slice(i, i + 100);
                  let { data, error: tierErr } = await supabase
                    .from('contacts')
                    .select('id, relevance_tier, approval_status, network_distance')
                    .in('id', batch)
                    .in('approval_status', ['approved', 'auto_approved']);
                  // Fail-open if the network_distance migration hasn't run yet.
                  if (tierErr && /network_distance/i.test(tierErr.message || '')) {
                    ({ data, error: tierErr } = await supabase
                      .from('contacts')
                      .select('id, relevance_tier, approval_status')
                      .in('id', batch)
                      .in('approval_status', ['approved', 'auto_approved']));
                  }
                  if (tierErr) {
                    console.error(`[schedule-daily] contacts batch error:`, tierErr.message);
                  }
                  if (data) contactsWithTier.push(...data);
                }

                // ── Exclude 1st degree connections at SCHEDULING time ──
                // Uses the network_distance persisted at discovery / by the send
                // step. Contacts with unknown distance still pass — the send-time
                // Unipile check remains the authoritative backstop for those.
                if ((campaign as any).exclude_first_degree !== false) {
                  const before = contactsWithTier.length;
                  contactsWithTier = contactsWithTier.filter((c: any) => !isFirstDegreeDistance(c.network_distance));
                  const excluded = before - contactsWithTier.length;
                  if (excluded > 0) {
                    console.log(`[schedule-daily] campaign ${campaign.id}: excluded ${excluded} known 1st-degree connection(s)`);
                    if (contactsWithTier.length === 0) {
                      report.note = `all ${before} eligible contacts are already 1st-degree connections`;
                    }
                  }
                }

                if (contactsWithTier.length > 0) {
                  const tierOrder: Record<string, number> = { hot: 0, warm: 1, cold: 2 };
                  contactsWithTier.sort((a: any, b: any) =>
                    (tierOrder[a.relevance_tier] ?? 2) - (tierOrder[b.relevance_tier] ?? 2)
                  );

                  const toSchedule = contactsWithTier.slice(0, remainingConnections);
                  console.log(`[schedule-daily] campaign ${campaign.id}: scheduling ${toSchedule.length} connections`);

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

                    if (error) {
                      console.error(`[schedule-daily] upsert error for ${contact.id}:`, error.message);
                    } else {
                      connectionsScheduled++;
                      totalScheduled++;
                      report.scheduled_connections++;
                    }
                  }
                } else {
                  // No approved contacts left — check if campaign's agent has manual_approval
                  // and there are pending contacts that could be approved
                  if (campaign.source_agent_id) {
                    const { data: agentInfo } = await supabase.from('signal_agents').select('manual_approval, name').eq('id', campaign.source_agent_id).single();
                    if (agentInfo?.manual_approval) {
                      // Count pending contacts in this list
                      let pendingCount = 0;
                      for (let i = 0; i < unseenIds.length; i += 100) {
                        const batch = unseenIds.slice(i, i + 100);
                        const { count } = await supabase.from('contacts').select('id', { count: 'exact', head: true }).in('id', batch).eq('approval_status', 'pending');
                        pendingCount += (count || 0);
                      }
                      if (pendingCount > 0) {
                        console.log(`[schedule-daily] campaign ${campaign.id}: ${pendingCount} pending leads need approval`);
                        await supabase.from('notifications').insert({
                          user_id: userId,
                          title: `Campaign ran out of approved leads`,
                          body: `Your campaign has no more approved leads to reach out to. You have ${pendingCount} leads waiting for your approval from agent "${agentInfo.name}".`,
                          type: 'warning',
                          link: '/contacts',
                        });
                        // Send email notification
                        try {
                          await supabase.functions.invoke('send-notification-email', {
                            body: { record: { user_id: userId, title: `⚠️ Campaign ran out of approved leads`, body: `Your campaign has no more approved leads. You have ${pendingCount} leads waiting for approval from agent "${agentInfo.name}". Go to your Contacts tab to review and approve them.`, link: '/contacts', type: 'warning' } },
                          });
                        } catch (e) { console.error('[schedule-daily] email notify error:', e); }
                      }
                    }
                  }
                  if (!report.note) report.note = 'no approved contacts left — leads may be waiting for approval';
                  console.log(`[schedule-daily] campaign ${campaign.id}: no approved contacts with tier data found`);
                }
              }
            } else {
              report.note = 'source list has no contacts';
              console.log(`[schedule-daily] campaign ${campaign.id}: no contacts in list ${campaign.source_list_id}`);
            }
          }

          // ── Schedule follow-up messages ──
          const workflowSteps: any[] = Array.isArray(campaign.workflow_steps) ? campaign.workflow_steps : [];
          const messageSteps = workflowSteps.filter((s: any) => s.type === 'message');
          if (messageSteps.length === 0) continue;

          const remainingMessages = messagesLimit - messagesScheduled;
          if (remainingMessages <= 0) continue;

          // Per-campaign message cap: reuse daily_connect_limit as the campaign's
          // overall daily action cap so a small campaign doesn't hog the sender quota.
          const perCampaignMsgCap = campaign.daily_connect_limit && campaign.daily_connect_limit > 0
            ? campaign.daily_connect_limit
            : remainingMessages;
          const campaignMsgRemaining = perCampaignMsgCap - (perCampaignMsg[campaign.id] || 0);
          const campaignMsgAllowance = Math.min(remainingMessages, campaignMsgRemaining);
          if (campaignMsgAllowance <= 0) continue;

          // Get accepted contacts ready for next message
          const { data: acceptedRequests } = await supabase
            .from('campaign_connection_requests')
            .select('id, contact_id, current_step, step_completed_at, chat_id')
            .eq('campaign_id', campaign.id)
            .eq('status', 'accepted');

          if (!acceptedRequests || acceptedRequests.length === 0) continue;

          const firstType = workflowSteps[0]?.type;
          const hasInvitation = firstType === 'invitation' || firstType === 'invite';
          let msgScheduledThisCampaign = 0;

          for (const req of acceptedRequests) {
            if (msgScheduledThisCampaign >= campaignMsgAllowance) break;
            // chat_id may not exist yet for newly accepted contacts — still schedule

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
              report.scheduled_messages++;
            }
          }
          } catch (campErr) {
            report.note = `error: ${(campErr instanceof Error ? campErr.message : String(campErr)).slice(0, 200)}`;
            console.error(`[schedule-daily] campaign ${campaign.id} error:`, campErr);
          }
        }

        console.log(`[schedule-daily] user ${userId}: ${connectionsScheduled} connections, ${messagesScheduled} messages scheduled`);
      } catch (err) {
        console.error(`[schedule-daily] error for user ${userId}:`, err);
      }
    }

    console.log('[schedule-daily] campaign summary:', JSON.stringify(campaignReports));
    return jsonRes({ status: 'ok', total_scheduled: totalScheduled, date: today, campaigns: campaignReports });
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
