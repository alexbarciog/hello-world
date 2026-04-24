const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Compute the workflow_steps array index for the next step to process.
 * workflow_steps may or may not include an invitation entry at [0].
 * current_step is 1-based: 1 = invitation done, 2 = step 2 done, etc.
 */
function getNextWorkflowIndex(currentStep: number, workflowSteps: any[]): number {
  const firstType = workflowSteps[0]?.type;
  const hasInvitation = firstType === 'invitation' || firstType === 'invite';
  // If invitation is in array: current_step=1 → index 1 (first message)
  // If invitation is NOT in array: current_step=1 → index 0 (first message)
  return hasInvitation ? currentStep : currentStep - 1;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const UNIPILE_API_KEY = Deno.env.get('UNIPILE_API_KEY');
    const UNIPILE_DSN = Deno.env.get('UNIPILE_DSN');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!UNIPILE_API_KEY || !UNIPILE_DSN) throw new Error('Unipile not configured');

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Parse optional body params
    const body = await req.json().catch(() => ({}));
    const filterCampaignId: string | null = body.campaign_id || null;

    let query = supabase
      .from('campaigns')
      .select('id, user_id, workflow_steps, source_list_id, source_agent_id, company_name, value_proposition, pain_points, campaign_goal, message_tone, industry, language, custom_training')
      .eq('status', 'active');
    if (filterCampaignId) query = query.eq('id', filterCampaignId);

    const { data: campaigns, error: campErr } = await query;

    // Resolve source_list_id for agent-sourced campaigns
    if (campaigns) {
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

            if (list) {
              campaign.source_list_id = list.id;
              console.log(`[followup][campaign ${campaign.id}] resolved list from agent: ${list.id}`);
            }
          }
        }
      }
    }

    if (campErr) throw campErr;
    if (!campaigns || campaigns.length === 0) {
      console.log('[followup] No active campaigns');
      return jsonRes({ status: 'no_active_campaigns' });
    }

    let totalAccepted = 0;
    let totalMessagesSent = 0;
    let totalGenerated = 0;

    for (const campaign of campaigns) {
      try {
        const result = await processCampaign(
          supabase,
          campaign,
          UNIPILE_API_KEY,
          UNIPILE_DSN,
          LOVABLE_API_KEY,
          SUPABASE_URL,
          SUPABASE_SERVICE_ROLE_KEY,
        );
        totalAccepted += result.accepted;
        totalMessagesSent += result.messagesSent;
        totalGenerated += result.generated;
      } catch (err) {
        console.error(`[followup][campaign ${campaign.id}] error:`, err);
      }
    }

    console.log(`[followup] Done. Accepted: ${totalAccepted}, Messages sent: ${totalMessagesSent}, Generated: ${totalGenerated}`);
    return jsonRes({ status: 'ok', accepted: totalAccepted, messages_sent: totalMessagesSent, generated: totalGenerated });
  } catch (error) {
    console.error('[followup] Fatal error:', error);
    return jsonRes({ error: error instanceof Error ? error.message : 'Unknown error' }, 500);
  }
});

async function processCampaign(
  supabase: any,
  campaign: any,
  unipileApiKey: string,
  unipileDsn: string,
  lovableApiKey: string | undefined,
  supabaseUrl: string,
  supabaseServiceRoleKey: string,
): Promise<{ accepted: number; messagesSent: number; generated: number }> {
  const today = new Date().toISOString().split('T')[0];
  const workflowSteps: any[] = Array.isArray(campaign.workflow_steps) ? campaign.workflow_steps : [];
  const messageStepsCount = workflowSteps.filter((s: any) => s.type === 'message').length;
  console.log(`[followup][campaign ${campaign.id}] ${workflowSteps.length} workflow steps, ${messageStepsCount} message steps, hasInvitation: ${workflowSteps[0]?.type === 'invitation'}`);
  if (messageStepsCount === 0) {
    console.log(`[followup][campaign ${campaign.id}] no message steps configured`);
    return { accepted: 0, messagesSent: 0, generated: 0 };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('unipile_account_id')
    .eq('user_id', campaign.user_id)
    .single();

  if (!profile?.unipile_account_id) {
    console.log(`[followup][campaign ${campaign.id}] no unipile account`);
    return { accepted: 0, messagesSent: 0, generated: 0 };
  }

  const accountId = profile.unipile_account_id;
  let generatedCount = 0;
  const MAX_ACCEPTANCE_CHECKS = 30;
  const MAX_MESSAGE_SENDS = 30;

  // ── Phase A: Send follow-up messages FIRST (highest priority) ──
  // This runs before acceptance checking to ensure messages are never blocked by timeout
  let messagesSent = 0;

  // Order by current_step ASC so step 1 contacts (short delay) are processed before step 2+ (long delay)
  // ★ CRITICAL: Exclude contacts who have replied — Conversational AI SDR handles them
  const { data: acceptedRequests } = await supabase
    .from('campaign_connection_requests')
    .select('id, contact_id, current_step, step_completed_at, chat_id, user_id, created_at, sent_at, last_incoming_message_at, conversation_stopped')
    .eq('campaign_id', campaign.id)
    .eq('status', 'accepted')
    .is('last_incoming_message_at', null)
    .eq('conversation_stopped', false)
    .order('current_step', { ascending: true })
    .order('step_completed_at', { ascending: true })
    .limit(MAX_MESSAGE_SENDS);

  if (acceptedRequests && acceptedRequests.length > 0) {
    console.log(`[followup][campaign ${campaign.id}] Phase A: processing ${acceptedRequests.length} accepted contacts for messages`);
    for (const req of acceptedRequests) {
      try {
        // Resolve provider_id early
        let resolvedProviderId: string | null = null;
        const { data: contact } = await supabase
          .from('contacts')
          .select('first_name, last_name, company, title, signal, linkedin_profile_id, linkedin_url')
          .eq('id', req.contact_id)
          .single();
        if (!contact) continue;

        let publicId = contact.linkedin_profile_id || extractLinkedinId(contact.linkedin_url);
        if (publicId) {
          try { publicId = decodeURIComponent(publicId); } catch { /* ok */ }
          resolvedProviderId = await resolveProviderId(unipileDsn, unipileApiKey, accountId, publicId);
        }

        // Try to find existing chat_id
        if (!req.chat_id && resolvedProviderId) {
          const foundChat = await findChat(unipileDsn, unipileApiKey, accountId, resolvedProviderId, null);
          if (foundChat) {
            req.chat_id = foundChat;
            await supabase.from('campaign_connection_requests')
              .update({ chat_id: foundChat })
              .eq('id', req.id);
            console.log(`[followup] resolved chat_id for contact ${req.contact_id}: ${foundChat}`);
          }
        }

        if (!req.chat_id && !resolvedProviderId) {
          console.log(`[followup] contact ${req.contact_id} no chat_id and no provider_id, skipping`);
          continue;
        }

        const currentStep = req.current_step || 1;
        const nextWfIdx = getNextWorkflowIndex(currentStep, workflowSteps);
        const nextStep = workflowSteps[nextWfIdx];

        if (!nextStep || nextStep.type !== 'message') {
          const totalSteps = workflowSteps.filter((s: any) => s.type === 'message').length;
          const completedMsgSteps = currentStep - 1;
          if (completedMsgSteps >= totalSteps) {
            await supabase
              .from('campaign_connection_requests')
              .update({ status: 'completed' })
              .eq('id', req.id);
          }
          continue;
        }

        const stepCompletedAt = req.step_completed_at ? new Date(req.step_completed_at) : null;
        if (!stepCompletedAt) continue;

        // Check delay before SENDING
        const delayHours = nextStep.delay_hours || (nextStep.delay_days ? nextStep.delay_days * 24 : 24);
        const delayMs = delayHours * 60 * 60 * 1000;
        if (Date.now() - stepCompletedAt.getTime() < delayMs) {
          console.log(`[followup] contact ${req.contact_id} delay not elapsed yet (${delayHours}h), skipping`);
          continue;
        }

        // Validate/update chat_id
        let chatId = req.chat_id;
        if (chatId && resolvedProviderId) {
          const verifiedChat = await findChat(unipileDsn, unipileApiKey, accountId, resolvedProviderId, chatId);
          if (verifiedChat !== chatId) {
            chatId = verifiedChat;
            await supabase.from('campaign_connection_requests')
              .update({ chat_id: chatId })
              .eq('id', req.id);
          }
        }

        if (!chatId && !resolvedProviderId) {
          console.log(`[followup] no chat and no provider for contact ${req.contact_id}, skipping`);
          continue;
        }

        // ── GUARD: Skip pre-existing conversations AND detect live replies ──
        if (chatId) {
          const crCreatedAt = new Date(req.created_at || req.sent_at || 0);
          try {
            const checkMsgRes = await fetch(
              `https://${unipileDsn}/api/v1/chats/${encodeURIComponent(chatId)}/messages?limit=10`,
              { headers: { 'X-API-KEY': unipileApiKey, 'Accept': 'application/json' } }
            );
            if (checkMsgRes.ok) {
              const checkMsgData = await checkMsgRes.json();
              const chatMessages = checkMsgData.items || checkMsgData || [];
              if (Array.isArray(chatMessages) && chatMessages.length > 0) {
                const sorted = [...chatMessages].sort((a: any, b: any) =>
                  new Date(a.timestamp || a.date || a.created_at || 0).getTime() -
                  new Date(b.timestamp || b.date || b.created_at || 0).getTime()
                );
                const oldestMsgTime = new Date(sorted[0]?.timestamp || sorted[0]?.date || sorted[0]?.created_at || 0);
                if (oldestMsgTime.getTime() > 0 && oldestMsgTime < crCreatedAt) {
                  console.log(`[followup] Skipping contact ${req.contact_id} — pre-existing conversation`);
                  await supabase.from('campaign_connection_requests')
                    .update({ conversation_stopped: true })
                    .eq('id', req.id);
                  continue;
                }

                // ★ LIVE REPLY CHECK: If the lead has sent ANY message, stop step advancement
                // The Conversational AI SDR will handle the conversation from here
                const leadReplied = chatMessages.some((msg: any) => {
                  const isFromLead = msg.is_sender === false || msg.role === 'other' || msg.sender_type === 'attendee' || msg.direction === 'inbound';
                  const msgTime = new Date(msg.timestamp || msg.date || msg.created_at || 0);
                  return isFromLead && msgTime >= crCreatedAt;
                });
                if (leadReplied) {
                  console.log(`[followup] ★ Lead ${req.contact_id} has replied — stopping step advancement, Conversational AI SDR takes over`);
                  await supabase.from('campaign_connection_requests')
                    .update({ last_incoming_message_at: new Date().toISOString() })
                    .eq('id', req.id)
                    .is('last_incoming_message_at', null); // only set if not already set
                  continue;
                }
              }
            }
          } catch (guardErr) {
            console.error(`[followup] pre-existing guard error for ${req.contact_id}:`, guardErr);
          }
        }

        let message = '';
        const { data: scheduledMsg } = await supabase
          .from('scheduled_messages')
          .select('id, message, status')
          .eq('connection_request_id', req.id)
          .eq('step_index', nextWfIdx)
          .in('status', ['generated', 'edited'])
          .maybeSingle();

        if (scheduledMsg && scheduledMsg.message) {
          message = scheduledMsg.message;
          console.log(`[followup] Using pre-generated message for contact ${req.contact_id} (${scheduledMsg.status})`);
        } else if (!nextStep.ai_icebreaker && nextStep.message) {
          message = nextStep.message;
          if (contact) {
            message = message
              .replace(/\{\{first_name\}\}/gi, contact?.first_name || '')
              .replace(/\{\{last_name\}\}/gi, contact?.last_name || '')
              .replace(/\{\{company\}\}/gi, contact?.company || '')
              .replace(/\{\{title\}\}/gi, contact?.title || '')
              .replace(/\{\{signal\}\}/gi, contact?.signal || '');
          }
        } else {
          console.log(`[followup] No message available for contact ${req.contact_id}, step ${nextWfIdx + 1} — waiting for generation`);
          continue;
        }

        if (!message.trim()) continue;

        // ── Send message ──
        let sendOk = false;
        if (chatId) {
          const sendRes = await fetch(
            `https://${unipileDsn}/api/v1/chats/${encodeURIComponent(chatId)}/messages`,
            {
              method: 'POST',
              headers: { 'X-API-KEY': unipileApiKey, 'Content-Type': 'application/json', 'Accept': 'application/json' },
              body: JSON.stringify({ text: message.trim() }),
            }
          );
          if (sendRes.ok) {
            sendOk = true;
          } else {
            console.error(`[followup] send via chat failed for ${req.contact_id}:`, sendRes.status, await sendRes.text());
          }
        }

        if (!sendOk && resolvedProviderId) {
          console.log(`[followup] Creating new chat for contact ${req.contact_id} via provider_id ${resolvedProviderId}`);
          const newChatRes = await fetch(
            `https://${unipileDsn}/api/v1/chats`,
            {
              method: 'POST',
              headers: { 'X-API-KEY': unipileApiKey, 'Content-Type': 'application/json', 'Accept': 'application/json' },
              body: JSON.stringify({
                account_id: accountId,
                attendees_ids: [resolvedProviderId],
                text: message.trim(),
              }),
            }
          );
          if (newChatRes.ok) {
            const newChatData = await newChatRes.json();
            const newChatId = newChatData.chat_id || newChatData.id || null;
            if (newChatId) {
              chatId = newChatId;
              await supabase.from('campaign_connection_requests')
                .update({ chat_id: newChatId })
                .eq('id', req.id);
              console.log(`[followup] Created new chat ${newChatId} for contact ${req.contact_id}`);
            }
            sendOk = true;
          } else {
            console.error(`[followup] create chat failed for ${req.contact_id}:`, newChatRes.status, await newChatRes.text());
          }
        }

        if (!sendOk) {
          console.log(`[followup] failed to send message to contact ${req.contact_id}`);
          continue;
        }

        console.log(`[followup] sent step ${currentStep + 1} to contact ${req.contact_id}`);

        if (scheduledMsg) {
          await supabase
            .from('scheduled_messages')
            .update({ status: 'sent', sent_at: new Date().toISOString() })
            .eq('id', scheduledMsg.id);
        }

        const newStep = currentStep + 1;
        const newWfIdx2 = getNextWorkflowIndex(newStep, workflowSteps);
        const hasMoreSteps = newWfIdx2 < workflowSteps.length && workflowSteps[newWfIdx2]?.type === 'message';

        await supabase
          .from('campaign_connection_requests')
          .update({
            current_step: newStep,
            step_completed_at: new Date().toISOString(),
            status: hasMoreSteps ? 'accepted' : 'completed',
          })
          .eq('id', req.id);

        messagesSent++;

        // Mark daily_scheduled_leads entry as sent
        const actionType = `message_step_${newStep}`;
        await supabase
          .from('daily_scheduled_leads')
          .update({ status: 'sent', sent_at: new Date().toISOString() })
          .eq('campaign_id', campaign.id)
          .eq('contact_id', req.contact_id)
          .eq('scheduled_date', today)
          .eq('action_type', actionType);

        // Generate next step message after sending
        if (lovableApiKey && hasMoreSteps) {
          const gen = await generateNextStepMessage(
            supabase,
            campaign,
            req,
            newWfIdx2,
            workflowSteps,
            lovableApiKey,
            supabaseUrl,
            supabaseServiceRoleKey,
          );
          if (gen) generatedCount++;

          const futureStep = workflowSteps[newWfIdx2];
          if (futureStep && futureStep.type === 'message') {
            const futureDelayHours = futureStep.delay_hours || (futureStep.delay_days ? futureStep.delay_days * 24 : 24);
            const readyAt = new Date(Date.now() + futureDelayHours * 60 * 60 * 1000);
            const endOfToday = new Date(today + 'T23:59:59.999Z');
            if (readyAt <= endOfToday) {
              const { data: userProfile2 } = await supabase
                .from('profiles')
                .select('daily_messages_limit')
                .eq('user_id', req.user_id)
                .single();
              const msgLimit = userProfile2?.daily_messages_limit || 15;
              const { count: msgToday } = await supabase
                .from('daily_scheduled_leads')
                .select('id', { count: 'exact', head: true })
                .eq('user_id', req.user_id)
                .eq('scheduled_date', today)
                .like('action_type', 'message_step_%');
              if ((msgToday || 0) < msgLimit) {
                const nextActionType = `message_step_${newStep + 1}`;
                await supabase.from('daily_scheduled_leads').upsert({
                  campaign_id: campaign.id,
                  contact_id: req.contact_id,
                  user_id: req.user_id,
                  scheduled_date: today,
                  action_type: nextActionType,
                  step_index: newWfIdx2,
                  status: 'pending',
                }, { onConflict: 'campaign_id,contact_id,scheduled_date,action_type' });
                console.log(`[followup] Queued ${nextActionType} for contact ${req.contact_id}`);
              }
            }
          }
        }

        await delay(500);
      } catch (err) {
        console.error(`[followup] message error for ${req.contact_id}:`, err);
      }
    }

    if (messagesSent > 0) {
      const { data: currentCampaign } = await supabase
        .from('campaigns')
        .select('messages_sent')
        .eq('id', campaign.id)
        .single();

      await supabase
        .from('campaigns')
        .update({ messages_sent: (currentCampaign?.messages_sent || 0) + messagesSent })
        .eq('id', campaign.id);
    }
  }

  // ── Phase B: Check pending invitations for acceptance ──

  // Two-pass strategy: check recent invitations first (most likely to have new accepts),
  // then check older ones. This prevents fresh accepts from being stuck behind stale pending.
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: recentPending } = await supabase
    .from('campaign_connection_requests')
    .select('id, contact_id, status, current_step, user_id')
    .eq('campaign_id', campaign.id)
    .eq('status', 'sent')
    .eq('current_step', 1)
    .gte('sent_at', oneDayAgo)
    .order('sent_at', { ascending: false })
    .limit(20);

  const { data: olderPending } = await supabase
    .from('campaign_connection_requests')
    .select('id, contact_id, status, current_step, user_id')
    .eq('campaign_id', campaign.id)
    .eq('status', 'sent')
    .eq('current_step', 1)
    .lt('sent_at', oneDayAgo)
    .order('sent_at', { ascending: true })
    .limit(MAX_ACCEPTANCE_CHECKS - (recentPending?.length || 0));

  // Merge: recent first, then older
  const recentIds = new Set((recentPending || []).map((r: any) => r.id));
  const pendingRequests = [
    ...(recentPending || []),
    ...(olderPending || []).filter((r: any) => !recentIds.has(r.id)),
  ];

  let acceptedCount = 0;

  if (pendingRequests.length > 0) {
    console.log(`[followup][campaign ${campaign.id}] checking ${pendingRequests.length} pending invitations (${recentPending?.length || 0} recent + ${olderPending?.length || 0} older)`);

    for (const req of pendingRequests) {
      try {
        const { data: contact } = await supabase
          .from('contacts')
          .select('linkedin_profile_id, linkedin_url, first_name, last_name')
          .eq('id', req.contact_id)
          .single();

        if (!contact) continue;

        let publicId = contact.linkedin_profile_id || extractLinkedinId(contact.linkedin_url);
        if (!publicId) {
          console.log(`[followup] contact ${req.contact_id} no linkedin id`);
          continue;
        }

        try { publicId = decodeURIComponent(publicId); } catch { /* already decoded */ }

        let wasAccepted = false;

        // Check acceptance via chat_id OR FIRST_DEGREE network distance
        const profileData = await fetchUserProfile(unipileDsn, unipileApiKey, accountId, publicId);
        const providerId = profileData?.provider_id || null;
        let chatId: string | null = null;

        if (providerId) {
          chatId = await findChat(unipileDsn, unipileApiKey, accountId, providerId, null);
        }

        // Accept if we found a chat OR if the profile shows FIRST_DEGREE connection
        const firstDegree = profileData ? isFirstDegree(profileData) : false;

        // Fallback: only check invitation API if profile data is ambiguous
        // If network_distance is clearly SECOND/THIRD/OUT_OF_NETWORK, skip the fallback
        let invitationAccepted = false;
        const networkDist = profileData?.network_distance || '';
        const isDefinitelyNotConnected = /^(SECOND|THIRD|OUT_OF)/i.test(String(networkDist));

        if (!chatId && !firstDegree && providerId && !isDefinitelyNotConnected) {
          console.log(`[followup] Profile ambiguous for ${req.contact_id} (distance: ${networkDist}), trying invitation API fallback`);
          invitationAccepted = await checkInvitationAccepted(unipileDsn, unipileApiKey, accountId, providerId);
        }

        if (chatId || firstDegree || invitationAccepted) {
          await supabase
            .from('campaign_connection_requests')
            .update({
              status: 'accepted',
              accepted_at: new Date().toISOString(),
              current_step: 1,
              step_completed_at: new Date().toISOString(),
              chat_id: chatId || null,
            })
            .eq('id', req.id);
          acceptedCount++;
          wasAccepted = true;
          console.log(`[followup] contact ${req.contact_id} ACCEPTED (chat: ${!!chatId}, firstDegree: ${firstDegree}, invAPI: ${invitationAccepted})`);
        } else {
          console.warn(`[followup] contact ${req.contact_id} NOT accepted (providerId: ${providerId})`);
        }
        await delay(50);

        // Immediately generate next message for newly accepted
        if (wasAccepted && lovableApiKey) {
          // ── Kick off personality prediction (fire-and-forget) for this lead ──
          // The edge function is idempotent (caches result); it skips if already generated.
          // We don't await — message generation should not be blocked.
          try {
            const { data: existingPersonality } = await supabase
              .from('contacts')
              .select('first_name, last_name, title, company, signal, personality_prediction')
              .eq('id', req.contact_id)
              .single();

            if (existingPersonality && !existingPersonality.personality_prediction) {
              fetch(`${supabaseUrl}/functions/v1/generate-personality-prediction`, {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${supabaseServiceRoleKey}`,
                  apikey: supabaseServiceRoleKey,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  contactId: req.contact_id,
                  name: [existingPersonality.first_name, existingPersonality.last_name].filter(Boolean).join(' '),
                  headline: existingPersonality.title || '',
                  postText: existingPersonality.signal || '',
                  jobTitle: existingPersonality.title || '',
                  company: existingPersonality.company || '',
                }),
              }).catch((e) => console.warn(`[followup] personality gen kickoff failed for ${req.contact_id}:`, e?.message));
            }
          } catch (e) {
            console.warn(`[followup] personality precheck failed for ${req.contact_id}:`, (e as Error)?.message);
          }

          const wfIdx = getNextWorkflowIndex(1, workflowSteps);
          const gen = await generateNextStepMessage(
            supabase,
            campaign,
            req,
            wfIdx,
            workflowSteps,
            lovableApiKey,
            supabaseUrl,
            supabaseServiceRoleKey,
          );
          if (gen) generatedCount++;

          // Add to daily_scheduled_leads if delay allows same-day execution
          const nextStep = workflowSteps[wfIdx];
          if (nextStep && nextStep.type === 'message') {
            const delayHours = nextStep.delay_hours || (nextStep.delay_days ? nextStep.delay_days * 24 : 24);
            // Use step_completed_at (just set above) as the base for readiness calculation
            const stepCompletedNow = new Date();
            const readyAt = new Date(stepCompletedNow.getTime() + delayHours * 60 * 60 * 1000);
            const endOfToday = new Date(today + 'T23:59:59.999Z');

            if (readyAt <= endOfToday) {
              // Check user's daily message limit
              const { data: userProfile } = await supabase
                .from('profiles')
                .select('daily_messages_limit')
                .eq('user_id', req.user_id)
                .single();

              const messagesLimit = userProfile?.daily_messages_limit || 15;

              const { count: msgScheduledToday } = await supabase
                .from('daily_scheduled_leads')
                .select('id', { count: 'exact', head: true })
                .eq('user_id', req.user_id)
                .eq('scheduled_date', today)
                .like('action_type', 'message_step_%');

              if ((msgScheduledToday || 0) < messagesLimit) {
                const actionType = `message_step_2`;
                await supabase
                  .from('daily_scheduled_leads')
                  .upsert({
                    campaign_id: campaign.id,
                    contact_id: req.contact_id,
                    user_id: req.user_id,
                    scheduled_date: today,
                    action_type: actionType,
                    step_index: wfIdx,
                    status: 'pending',
                  }, { onConflict: 'campaign_id,contact_id,scheduled_date,action_type' });
                console.log(`[followup] Added ${actionType} to daily queue for contact ${req.contact_id}`);
              } else {
                console.log(`[followup] Daily message limit reached for user ${req.user_id}, will schedule tomorrow`);
              }
            } else {
              console.log(`[followup] Next step for ${req.contact_id} not ready until ${readyAt.toISOString()}, will be scheduled tomorrow`);
            }
          }
        }

        await delay(50);
      } catch (err) {
        console.error(`[followup] acceptance check error for ${req.contact_id}:`, err);
      }
    }
  }

  if (acceptedCount > 0) {
    const { data: currentCampaign } = await supabase
      .from('campaigns')
      .select('invitations_accepted')
      .eq('id', campaign.id)
      .single();

    await supabase
      .from('campaigns')
      .update({ invitations_accepted: (currentCampaign?.invitations_accepted || 0) + acceptedCount })
      .eq('id', campaign.id);
  }

  // (Phase 2 is now Phase A above — runs first to avoid timeout blocking message delivery)

  // ── Phase 3: Catch-up generation — generate messages ONLY when previous step is sent ──
  // Rule: Step 2 can be generated when connection is accepted (current_step=1).
  // Step 3+ can only be generated AFTER the previous step's message has status='sent'.
  if (lovableApiKey) {
    // ★ CRITICAL: Exclude contacts who have replied — Conversational AI SDR handles them
    const { data: allAccepted } = await supabase
      .from('campaign_connection_requests')
      .select('id, contact_id, current_step, user_id, chat_id, step_completed_at, last_incoming_message_at')
      .eq('campaign_id', campaign.id)
      .eq('status', 'accepted')
      .is('last_incoming_message_at', null)
      .eq('conversation_stopped', false);

    if (allAccepted && allAccepted.length > 0) {
      for (const req of allAccepted) {
        try {
          const currentStep = req.current_step || 1;
          const nextWfIdx = getNextWorkflowIndex(currentStep, workflowSteps);
          const nextStep = workflowSteps[nextWfIdx];

          if (!nextStep || nextStep.type !== 'message') continue;

          // GUARD: For step 3+, only generate if previous step's message was SENT
          if (currentStep > 1) {
            const prevWfIdx = getNextWorkflowIndex(currentStep - 1, workflowSteps);
            // Verify previous step's scheduled_message exists AND is sent
            const { data: prevMsg } = await supabase
              .from('scheduled_messages')
              .select('id, status')
              .eq('connection_request_id', req.id)
              .eq('step_index', prevWfIdx)
              .maybeSingle();

            if (!prevMsg || prevMsg.status !== 'sent') {
              // Previous step not sent yet — do NOT generate this step
              continue;
            }
          }

          // Check if message already exists for this step
          const { data: existing } = await supabase
            .from('scheduled_messages')
            .select('id')
            .eq('connection_request_id', req.id)
            .eq('step_index', nextWfIdx)
            .maybeSingle();

          if (existing) continue;

          console.log(`[followup][catch-up] Generating message for contact ${req.contact_id}, wfIdx ${nextWfIdx} (prev step confirmed sent)`);
          const gen = await generateNextStepMessage(
            supabase,
            campaign,
            req,
            nextWfIdx,
            workflowSteps,
            lovableApiKey,
            supabaseUrl,
            supabaseServiceRoleKey,
          );
          if (gen) generatedCount++;
        } catch (err) {
          console.error(`[followup][catch-up] error for ${req.contact_id}:`, err);
        }
      }
    }
  }

  console.log(`[followup][campaign ${campaign.id}] accepted: ${acceptedCount}, messages: ${messagesSent}, generated: ${generatedCount}`);
  return { accepted: acceptedCount, messagesSent, generated: generatedCount };
}

// ── Generate next step message ──

async function generateNextStepMessage(
  supabase: any,
  campaign: any,
  req: any,
  wfIndex: number,
  workflowSteps: any[],
  lovableApiKey: string,
  supabaseUrl: string,
  supabaseServiceRoleKey: string,
): Promise<boolean> {
  const nextStep = workflowSteps[wfIndex];
  if (!nextStep || nextStep.type !== 'message') return false;

  // Check if already exists
  const { data: existing } = await supabase
    .from('scheduled_messages')
    .select('id')
    .eq('connection_request_id', req.id)
    .eq('step_index', wfIndex)
    .maybeSingle();

  if (existing) return false;

  const { data: contact } = await supabase
    .from('contacts')
    .select('first_name, last_name, company, title, signal, industry, personality_prediction')
    .eq('id', req.contact_id)
    .single();

  if (!contact) return false;

  let message = '';
  const hasInvitation = workflowSteps.length > 0 && workflowSteps[0].type === 'invitation';
  const displayStepNumber = hasInvitation ? wfIndex + 1 : wfIndex + 2; // Step 2, 3, 4...

  if (nextStep.ai_icebreaker) {
    console.log(`[followup] Generating AI message for contact ${req.contact_id}, step ${displayStepNumber}`);

    const { data: previousMessages } = await supabase
      .from('scheduled_messages')
      .select('step_index, message, sent_at')
      .eq('connection_request_id', req.id)
      .in('status', ['sent', 'generated', 'edited'])
      .order('step_index', { ascending: true });

    const previousMessagesArray = (previousMessages || [])
      .map((m: any) => (m.message || '').trim())
      .filter((m: string) => m.length > 0);

    const previousStepMessage = previousMessagesArray.length > 0
      ? previousMessagesArray[previousMessagesArray.length - 1]
      : '';

    message = await invokeGenerateStepMessage(supabaseUrl, supabaseServiceRoleKey, {
      stepNumber: displayStepNumber,
      previousStepMessage,
      previousMessages: previousMessagesArray,
      companyName: campaign.company_name,
      valueProposition: campaign.value_proposition,
      painPoints: campaign.pain_points || [],
      campaignGoal: campaign.campaign_goal,
      messageTone: campaign.message_tone,
      industry: campaign.industry,
      language: campaign.language,
      customTraining: [campaign.custom_training, nextStep.step_instructions].filter(Boolean).join('\n\n'),
      firstName: contact.first_name,
      lastName: contact.last_name,
      leadCompany: contact.company,
      leadTitle: contact.title,
      buyingSignal: contact.signal,
      leadIndustry: contact.industry,
      personality: contact.personality_prediction,
    });

    if (!message.trim()) {
      console.error(`[followup] generate-step-message returned empty for contact ${req.contact_id}`);
      return false;
    }

    await delay(700);
  } else {
    message = nextStep.message || '';
    message = message
      .replace(/\{\{first_name\}\}/gi, contact.first_name || '')
      .replace(/\{\{last_name\}\}/gi, contact.last_name || '')
      .replace(/\{\{company\}\}/gi, contact.company || '')
      .replace(/\{\{title\}\}/gi, contact.title || '')
      .replace(/\{\{signal\}\}/gi, contact.signal || '');
  }

  if (!message.trim()) return false;

  const today = new Date().toISOString().split('T')[0];
  const { error: insertErr } = await supabase
    .from('scheduled_messages')
    .insert({
      campaign_id: campaign.id,
      contact_id: req.contact_id,
      connection_request_id: req.id,
      step_index: wfIndex,
      message: message.trim(),
      status: 'generated',
      scheduled_for: today,
      user_id: req.user_id || campaign.user_id,
    });

  if (insertErr) {
    console.error(`[followup] Insert scheduled_message error:`, insertErr);
    return false;
  }

  console.log(`[followup] Generated step ${displayStepNumber} message for ${contact.first_name} ${contact.last_name || ''}`);
  return true;
}

async function invokeGenerateStepMessage(
  supabaseUrl: string,
  supabaseServiceRoleKey: string,
  payload: Record<string, unknown>,
): Promise<string> {
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/generate-step-message`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${supabaseServiceRoleKey}`,
        apikey: supabaseServiceRoleKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error('[followup] generate-step-message error:', response.status, await response.text());
      return '';
    }

    const data = await response.json();
    return (data?.message || '').trim();
  } catch (error) {
    console.error('[followup] generate-step-message invoke failed:', error);
    return '';
  }
}

// ── Unipile API helpers ──

async function resolveProviderId(
  dsn: string, apiKey: string, accountId: string, publicId: string
): Promise<string | null> {
  try {
    const url = `https://${dsn}/api/v1/users/${encodeURIComponent(publicId)}?account_id=${accountId}`;
    const res = await fetch(url, {
      headers: { 'X-API-KEY': apiKey, 'Accept': 'application/json' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.provider_id || null;
  } catch {
    return null;
  }
}

async function fetchUserProfile(
  dsn: string, apiKey: string, accountId: string, publicId: string
): Promise<any | null> {
  try {
    const url = `https://${dsn}/api/v1/users/${encodeURIComponent(publicId)}?account_id=${accountId}`;
    const res = await fetch(url, {
      headers: { 'X-API-KEY': apiKey, 'Accept': 'application/json' },
    });
    if (!res.ok) {
      const errBody = await res.text();
      console.error(`[fetchUserProfile] FAILED for ${publicId}: HTTP ${res.status}, body: ${errBody.substring(0, 300)}`);
      return null;
    }
    const data = await res.json();
    // Diagnostic: log ALL connection-related fields
    console.log(`[fetchUserProfile] ${publicId} => ${JSON.stringify({
      provider_id: data.provider_id,
      network_distance: data.network_distance,
      is_connection: data.is_connection,
      relation_type: data.relation_type,
      distance: data.distance,
      connection_degree: data.connection_degree,
      network: data.network,
      degree: data.degree,
      relationship: data.relationship,
      connected: data.connected,
      is_first_degree: data.is_first_degree,
      member_distance: data.member_distance,
      connection_status: data.connection_status,
    })}`);
    return data;
  } catch (err) {
    console.error(`[fetchUserProfile] exception for ${publicId}:`, err);
    return null;
  }
}

function isFirstDegree(profileData: any): boolean {
  // Original checks — network_distance can be number (1) or string ("1", "FIRST_DEGREE")
  if (profileData.network_distance === 1 || profileData.network_distance === '1' || profileData.network_distance === 'FIRST_DEGREE' || profileData.network_distance === 'first_degree') return true;
  if (profileData.is_connection === true || profileData.is_connection === 'true') return true;
  if (profileData.relation_type === 'FIRST_DEGREE' || profileData.relation_type === 'first_degree') return true;
  if (profileData.distance === 'DISTANCE_1' || profileData.distance === 1 || profileData.distance === '1') return true;
  if (profileData.connection_degree === 1 || profileData.connection_degree === '1' || profileData.connection_degree === '1st') return true;
  // Expanded checks
  if (profileData.network === 'FIRST' || profileData.network === 'first' || profileData.network === 1) return true;
  if (profileData.degree === 1 || profileData.degree === '1' || profileData.degree === 'FIRST') return true;
  if (profileData.connected === true || profileData.connected === 'true') return true;
  if (profileData.is_first_degree === true || profileData.is_first_degree === 'true') return true;
  if (profileData.member_distance?.value === 'DISTANCE_1') return true;
  if (profileData.connection_status === 'CONNECTED' || profileData.connection_status === 'connected') return true;
  // Nested network object
  if (profileData.network?.distance === 'FIRST' || profileData.network?.distance === 1 || profileData.network?.distance === '1') return true;
  if (profileData.connection?.type === 'FIRST_DEGREE') return true;
  return false;
}

async function checkInvitationAccepted(
  dsn: string, apiKey: string, accountId: string, providerId: string
): Promise<boolean> {
  try {
    const url = new URL(`https://${dsn}/api/v1/users/invitations`);
    url.searchParams.set('account_id', accountId);
    url.searchParams.set('limit', '50');
    const res = await fetch(url.toString(), {
      headers: { 'X-API-KEY': apiKey, 'Accept': 'application/json' },
    });
    if (!res.ok) {
      console.warn(`[checkInvitationAccepted] HTTP ${res.status}`);
      return false;
    }
    const data = await res.json();
    const items = data?.items || data?.data || (Array.isArray(data) ? data : []);
    for (const inv of items) {
      const invProviderId = inv.provider_id || inv.attendee_provider_id || inv.user_provider_id;
      if (invProviderId === providerId) {
        const status = (inv.status || '').toLowerCase();
        console.log(`[checkInvitationAccepted] Found invitation for ${providerId}: status=${status}`);
        if (status === 'accepted' || status === 'connected') return true;
      }
    }
    return false;
  } catch (err) {
    console.error(`[checkInvitationAccepted] error:`, err);
    return false;
  }
}

async function findChat(
  dsn: string,
  apiKey: string,
  accountId: string,
  providerId: string,
  existingChatId?: string | null,
): Promise<string | null> {
  try {
    // Step 1: If we have an existing chat_id, validate it belongs to this provider
    if (existingChatId) {
      const validUrl = new URL(`https://${dsn}/api/v1/chats/${encodeURIComponent(existingChatId)}`);
      const validRes = await fetch(validUrl.toString(), {
        headers: { 'X-API-KEY': apiKey, 'Accept': 'application/json' },
      });
      if (validRes.ok) {
        const chatData = await validRes.json();
        if (chatMatchesProvider(chatData, providerId)) {
          return existingChatId; // Existing chat is valid
        }
        console.log(`[findChat] existing chat ${existingChatId} does NOT belong to provider ${providerId}`);
      } else {
        await validRes.text(); // consume body
      }
    }

    // Step 2: Search for the correct chat using Unipile's filter
    const url = new URL(`https://${dsn}/api/v1/chats`);
    url.searchParams.set('account_id', accountId);
    url.searchParams.set('attendee_provider_id', providerId);
    url.searchParams.set('limit', '1');

    const res = await fetch(url.toString(), {
      headers: { 'X-API-KEY': apiKey, 'Accept': 'application/json' },
    });

    if (!res.ok) return null;
    const data = await res.json();
    const chats = data?.items || data?.data || [];

    if (!Array.isArray(chats) || chats.length === 0) return null;

    const chat = chats[0];
    const chatId = chat.id || chat.chat_id || null;

    // Validate the returned chat actually has the right attendee
    if (chatId && chatMatchesProvider(chat, providerId)) {
      return chatId;
    }

    return null;
  } catch {
    return null;
  }
}

function chatMatchesProvider(chat: any, providerId: string): boolean {
  if (!chat || !providerId) return false;
  if (chat.attendee_provider_id === providerId) return true;
  if (chat.provider_id === providerId) return true;

  const attendees = Array.isArray(chat.attendees) ? chat.attendees : [];
  return attendees.some((attendee: any) =>
    attendee?.provider_id === providerId ||
    attendee?.attendee_provider_id === providerId ||
    attendee?.id === providerId
  );
}

function extractLinkedinId(url: string | null): string | null {
  if (!url) return null;
  const match = url.match(/linkedin\.com\/in\/([^\/\?]+)/);
  return match ? match[1] : null;
}

function delay(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

function jsonRes(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
