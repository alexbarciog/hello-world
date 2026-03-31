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
  const hasInvitation = workflowSteps.length > 0 && workflowSteps[0].type === 'invitation';
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

  // ── Phase 1: Check pending invitations for acceptance ──
  const { data: pendingRequests } = await supabase
    .from('campaign_connection_requests')
    .select('id, contact_id, status, current_step, user_id')
    .eq('campaign_id', campaign.id)
    .eq('status', 'sent')
    .eq('current_step', 1);

  let acceptedCount = 0;

  if (pendingRequests && pendingRequests.length > 0) {
    console.log(`[followup][campaign ${campaign.id}] checking ${pendingRequests.length} pending invitations`);

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

        // Fallback: check invitation API if profile check didn't confirm
        let invitationAccepted = false;
        if (!chatId && !firstDegree && providerId) {
          console.log(`[followup] Profile check negative for ${req.contact_id}, trying invitation API fallback`);
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
        await delay(300);

        // Immediately generate next message for newly accepted
        if (wasAccepted && lovableApiKey) {
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
        }

        await delay(500);
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

  // ── Phase 2: Send follow-up messages for verified accepted contacts only ──
  const { data: acceptedRequests } = await supabase
    .from('campaign_connection_requests')
    .select('id, contact_id, current_step, step_completed_at, chat_id, user_id, created_at, sent_at')
    .eq('campaign_id', campaign.id)
    .eq('status', 'accepted');

  let messagesSent = 0;

  if (acceptedRequests && acceptedRequests.length > 0) {
    for (const req of acceptedRequests) {
      try {
        // For accepted contacts without chat_id, try to find it now
        if (!req.chat_id) {
          const { data: contact } = await supabase
            .from('contacts')
            .select('linkedin_profile_id, linkedin_url')
            .eq('id', req.contact_id)
            .single();

          if (contact) {
            let pubId = contact.linkedin_profile_id || extractLinkedinId(contact.linkedin_url);
            if (pubId) {
              try { pubId = decodeURIComponent(pubId); } catch { /* ok */ }
              const pId = await resolveProviderId(unipileDsn, unipileApiKey, accountId, pubId);
              if (pId) {
                const foundChat = await findChat(unipileDsn, unipileApiKey, accountId, pId, null);
                if (foundChat) {
                  req.chat_id = foundChat;
                  await supabase.from('campaign_connection_requests')
                    .update({ chat_id: foundChat })
                    .eq('id', req.id);
                  console.log(`[followup] resolved chat_id for accepted contact ${req.contact_id}: ${foundChat}`);
                }
              }
            }
          }

          if (!req.chat_id) {
            console.log(`[followup] accepted contact ${req.contact_id} still has no chat_id, skipping send (will retry next run)`);
            continue;
          }
        }

        const currentStep = req.current_step || 1;
        const nextWfIdx = getNextWorkflowIndex(currentStep, workflowSteps);
        const nextStep = workflowSteps[nextWfIdx];

        if (!nextStep || nextStep.type !== 'message') {
          // Check if completed
          const totalSteps = workflowSteps.filter((s: any) => s.type === 'message').length;
          const completedMsgSteps = currentStep - 1; // steps done after invitation
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

        // Check delay before SENDING — supports delay_hours (preferred) or delay_days (legacy)
        const delayHours = nextStep.delay_hours || (nextStep.delay_days ? nextStep.delay_days * 24 : 24);
        const delayMs = delayHours * 60 * 60 * 1000;
        if (Date.now() - stepCompletedAt.getTime() < delayMs) continue;

        const { data: contact } = await supabase
          .from('contacts')
          .select('first_name, last_name, company, title, signal, linkedin_profile_id, linkedin_url')
          .eq('id', req.contact_id)
          .single();

        if (!contact) continue;

        let providerId: string | null = null;
        let publicId = contact.linkedin_profile_id || extractLinkedinId(contact.linkedin_url);
        if (publicId) {
          try { publicId = decodeURIComponent(publicId); } catch { /* ok */ }
          providerId = await resolveProviderId(unipileDsn, unipileApiKey, accountId, publicId);
        }

        let chatId = providerId
          ? await findChat(unipileDsn, unipileApiKey, accountId, providerId, req.chat_id)
          : req.chat_id;

        if (chatId !== req.chat_id) {
          await supabase
            .from('campaign_connection_requests')
            .update({ chat_id: chatId })
            .eq('id', req.id);

          if (chatId) {
            console.log(`[followup] corrected chat for contact ${req.contact_id}: ${req.chat_id || 'none'} -> ${chatId}`);
          } else if (req.chat_id) {
            console.log(`[followup] cleared invalid chat for contact ${req.contact_id}: ${req.chat_id}`);
          }
        }

        if (!chatId) {
          console.log(`[followup] no verified chat for contact ${req.contact_id}, skipping`);
          continue;
        }

        // ── GUARD: Skip pre-existing conversations ──
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
                console.log(`[followup] Skipping contact ${req.contact_id} — pre-existing conversation (oldest msg: ${oldestMsgTime.toISOString()}, CR: ${crCreatedAt.toISOString()})`);
                await supabase.from('campaign_connection_requests')
                  .update({ conversation_stopped: true })
                  .eq('id', req.id);
                continue;
              }
            }
          }
        } catch (guardErr) {
          console.error(`[followup] pre-existing guard error for ${req.contact_id}:`, guardErr);
        }

        let message = '';

        // Check for pre-generated message
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

        const sendRes = await fetch(
          `https://${unipileDsn}/api/v1/chats/${encodeURIComponent(chatId)}/messages`,
          {
            method: 'POST',
            headers: { 'X-API-KEY': unipileApiKey, 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ text: message.trim() }),
          }
        );

        if (!sendRes.ok) {
          console.error(`[followup] send failed for ${req.contact_id}:`, sendRes.status, await sendRes.text());
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
        const newWfIdx = getNextWorkflowIndex(newStep, workflowSteps);
        const hasMoreSteps = newWfIdx < workflowSteps.length && workflowSteps[newWfIdx]?.type === 'message';

        await supabase
          .from('campaign_connection_requests')
          .update({
            current_step: newStep,
            step_completed_at: new Date().toISOString(),
            status: hasMoreSteps ? 'accepted' : 'completed',
          })
          .eq('id', req.id);

        messagesSent++;

        // Mark daily_scheduled_leads entry as sent (if exists)
        const today = new Date().toISOString().split('T')[0];
        const actionType = `message_step_${newStep}`;
        await supabase
          .from('daily_scheduled_leads')
          .update({ status: 'sent', sent_at: new Date().toISOString() })
          .eq('campaign_id', campaign.id)
          .eq('contact_id', req.contact_id)
          .eq('scheduled_date', today)
          .eq('action_type', actionType);

        // Immediately generate next step message after sending
        if (lovableApiKey && hasMoreSteps) {
          const gen = await generateNextStepMessage(
            supabase,
            campaign,
            req,
            newWfIdx,
            workflowSteps,
            lovableApiKey,
            supabaseUrl,
            supabaseServiceRoleKey,
          );
          if (gen) generatedCount++;
        }

        await delay(3000 + Math.random() * 2000);
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

  // ── Phase 3: Catch-up generation — generate messages only for verified accepted contacts missing scheduled_messages ──
  if (lovableApiKey) {
    const { data: allAccepted } = await supabase
      .from('campaign_connection_requests')
      .select('id, contact_id, current_step, user_id, chat_id')
      .eq('campaign_id', campaign.id)
      .eq('status', 'accepted');

    if (allAccepted && allAccepted.length > 0) {
      for (const req of allAccepted) {
        try {
          // Generate message even without chat_id — chat will be resolved when sending

          const currentStep = req.current_step || 1;
          const nextWfIdx = getNextWorkflowIndex(currentStep, workflowSteps);
          const nextStep = workflowSteps[nextWfIdx];

          if (!nextStep || nextStep.type !== 'message') continue;

          // Check if message already exists
          const { data: existing } = await supabase
            .from('scheduled_messages')
            .select('id')
            .eq('connection_request_id', req.id)
            .eq('step_index', nextWfIdx)
            .maybeSingle();

          if (existing) continue;

          console.log(`[followup][catch-up] Generating message for contact ${req.contact_id}, wfIdx ${nextWfIdx}`);
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
    .select('first_name, last_name, company, title, signal')
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
  // Original checks
  if (profileData.network_distance === 1 || profileData.network_distance === '1') return true;
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
