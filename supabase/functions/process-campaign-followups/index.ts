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
    const UNIPILE_API_KEY = Deno.env.get('UNIPILE_API_KEY');
    const UNIPILE_DSN = Deno.env.get('UNIPILE_DSN');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!UNIPILE_API_KEY || !UNIPILE_DSN) throw new Error('Unipile not configured');

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get all active campaigns with workflow steps
    const { data: campaigns, error: campErr } = await supabase
      .from('campaigns')
      .select('id, user_id, workflow_steps, source_list_id')
      .eq('status', 'active')
      .not('source_list_id', 'is', null);

    if (campErr) throw campErr;
    if (!campaigns || campaigns.length === 0) {
      return jsonRes({ status: 'no_active_campaigns' });
    }

    let totalAccepted = 0;
    let totalMessagesSent = 0;

    for (const campaign of campaigns) {
      try {
        const result = await processCampaign(supabase, campaign, UNIPILE_API_KEY, UNIPILE_DSN);
        totalAccepted += result.accepted;
        totalMessagesSent += result.messagesSent;
      } catch (err) {
        console.error(`[followup][campaign ${campaign.id}] error:`, err);
      }
    }

    console.log(`[followup] Done. Accepted: ${totalAccepted}, Messages sent: ${totalMessagesSent}`);
    return jsonRes({ status: 'ok', accepted: totalAccepted, messages_sent: totalMessagesSent });
  } catch (error) {
    console.error('[followup] Fatal error:', error);
    return jsonRes({ error: error instanceof Error ? error.message : 'Unknown error' }, 500);
  }
});

async function processCampaign(
  supabase: any,
  campaign: { id: string; user_id: string; workflow_steps: any; source_list_id: string },
  unipileApiKey: string,
  unipileDsn: string
): Promise<{ accepted: number; messagesSent: number }> {
  const workflowSteps: any[] = Array.isArray(campaign.workflow_steps) ? campaign.workflow_steps : [];
  if (workflowSteps.length < 2) {
    console.log(`[followup][campaign ${campaign.id}] no follow-up steps configured`);
    return { accepted: 0, messagesSent: 0 };
  }

  // Get user's Unipile account_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('unipile_account_id')
    .eq('user_id', campaign.user_id)
    .single();

  if (!profile?.unipile_account_id) {
    return { accepted: 0, messagesSent: 0 };
  }

  const accountId = profile.unipile_account_id;

  // ── Phase 1: Check pending invitations for acceptance ──
  const { data: pendingRequests } = await supabase
    .from('campaign_connection_requests')
    .select('id, contact_id, unipile_request_id, status, current_step')
    .eq('campaign_id', campaign.id)
    .eq('status', 'sent')
    .eq('current_step', 1);

  let acceptedCount = 0;

  if (pendingRequests && pendingRequests.length > 0) {
    // Fetch recent connections from Unipile to check acceptance
    const connectionsUrl = new URL(`https://${unipileDsn}/api/v1/users/connections`);
    connectionsUrl.searchParams.set('account_id', accountId);
    connectionsUrl.searchParams.set('limit', '100');

    const connRes = await fetch(connectionsUrl.toString(), {
      headers: { 'X-API-KEY': unipileApiKey, 'Accept': 'application/json' },
    });

    if (connRes.ok) {
      const connData = await connRes.json();
      const connections = connData?.items || connData?.data || (Array.isArray(connData) ? connData : []);
      const connectedProviderIds = new Set(
        connections.map((c: any) => c.provider_id || c.id).filter(Boolean)
      );

      // For each pending request, check if the contact is now connected
      for (const req of pendingRequests) {
        try {
          // Get contact's LinkedIn info
          const { data: contact } = await supabase
            .from('contacts')
            .select('linkedin_profile_id, linkedin_url, first_name, last_name')
            .eq('id', req.contact_id)
            .single();

          if (!contact) continue;

          const publicId = contact.linkedin_profile_id || extractLinkedinId(contact.linkedin_url);
          if (!publicId) continue;

          // Resolve to provider_id
          const resolveRes = await fetch(
            `https://${unipileDsn}/api/v1/users/${encodeURIComponent(publicId)}?account_id=${accountId}`,
            { headers: { 'X-API-KEY': unipileApiKey, 'Accept': 'application/json' } }
          );

          if (!resolveRes.ok) continue;
          const resolveData = await resolveRes.json();
          const providerId = resolveData.provider_id;
          if (!providerId) continue;

          // Check if this provider_id is in connections OR if they have a chat
          const isConnected = connectedProviderIds.has(providerId);

          if (!isConnected) {
            // Also try checking via chat — if we can find a chat with them, they accepted
            const chatUrl = new URL(`https://${unipileDsn}/api/v1/chats`);
            chatUrl.searchParams.set('account_id', accountId);
            chatUrl.searchParams.set('attendee_provider_id', providerId);
            chatUrl.searchParams.set('limit', '1');

            const chatRes = await fetch(chatUrl.toString(), {
              headers: { 'X-API-KEY': unipileApiKey, 'Accept': 'application/json' },
            });

            if (!chatRes.ok) continue;
            const chatData = await chatRes.json();
            const chats = chatData?.items || chatData?.data || [];

            if (chats.length === 0) continue; // Not accepted yet

            // They accepted! Store chat_id
            const chatId = chats[0].id || chats[0].chat_id;
            await supabase
              .from('campaign_connection_requests')
              .update({
                status: 'accepted',
                accepted_at: new Date().toISOString(),
                current_step: 1,
                step_completed_at: new Date().toISOString(),
                chat_id: chatId,
              })
              .eq('id', req.id);

            acceptedCount++;
          } else {
            // Connected — find or create chat
            const chatUrl = new URL(`https://${unipileDsn}/api/v1/chats`);
            chatUrl.searchParams.set('account_id', accountId);
            chatUrl.searchParams.set('attendee_provider_id', providerId);
            chatUrl.searchParams.set('limit', '1');

            const chatRes = await fetch(chatUrl.toString(), {
              headers: { 'X-API-KEY': unipileApiKey, 'Accept': 'application/json' },
            });

            let chatId: string | null = null;
            if (chatRes.ok) {
              const chatData = await chatRes.json();
              const chats = chatData?.items || chatData?.data || [];
              if (chats.length > 0) chatId = chats[0].id || chats[0].chat_id;
            }

            await supabase
              .from('campaign_connection_requests')
              .update({
                status: 'accepted',
                accepted_at: new Date().toISOString(),
                current_step: 1,
                step_completed_at: new Date().toISOString(),
                chat_id: chatId,
              })
              .eq('id', req.id);

            acceptedCount++;
          }

          // Small delay to avoid rate limiting
          await new Promise(r => setTimeout(r, 1000 + Math.random() * 1000));
        } catch (err) {
          console.error(`[followup][campaign ${campaign.id}] acceptance check error for ${req.contact_id}:`, err);
        }
      }
    }
  }

  // Update campaign accepted counter
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

  // ── Phase 2: Send follow-up messages for accepted contacts ──
  // Find contacts that are accepted and ready for next step
  const { data: acceptedRequests } = await supabase
    .from('campaign_connection_requests')
    .select('id, contact_id, current_step, step_completed_at, chat_id')
    .eq('campaign_id', campaign.id)
    .eq('status', 'accepted')
    .not('chat_id', 'is', null);

  let messagesSent = 0;

  if (acceptedRequests && acceptedRequests.length > 0) {
    for (const req of acceptedRequests) {
      try {
        const currentStep = req.current_step || 1;
        const nextStepIndex = currentStep; // workflow_steps is 0-indexed, currentStep starts at 1
        const nextStep = workflowSteps[nextStepIndex];

        if (!nextStep || nextStep.type !== 'message') {
          // No more steps or not a message step
          if (currentStep >= workflowSteps.length) {
            // Campaign sequence complete for this contact
            await supabase
              .from('campaign_connection_requests')
              .update({ status: 'completed' })
              .eq('id', req.id);
          }
          continue;
        }

        // Check delay — time since last step completion
        const stepCompletedAt = req.step_completed_at ? new Date(req.step_completed_at) : null;
        if (!stepCompletedAt) continue;

        const delayDays = nextStep.delay_days || 1;
        const delayMs = delayDays * 24 * 60 * 60 * 1000;
        const elapsed = Date.now() - stepCompletedAt.getTime();

        if (elapsed < delayMs) {
          // Not ready yet
          continue;
        }

        // Get contact info for template personalization
        const { data: contact } = await supabase
          .from('contacts')
          .select('first_name, last_name, company, title, signal')
          .eq('id', req.contact_id)
          .single();

        // Personalize message
        let message = nextStep.message || '';
        if (contact) {
          message = message
            .replace(/\{\{first_name\}\}/gi, contact.first_name || '')
            .replace(/\{\{last_name\}\}/gi, contact.last_name || '')
            .replace(/\{\{company\}\}/gi, contact.company || '')
            .replace(/\{\{title\}\}/gi, contact.title || '')
            .replace(/\{\{signal\}\}/gi, contact.signal || '');
        }

        if (!message.trim()) {
          console.log(`[followup][campaign ${campaign.id}] empty message for step ${nextStepIndex + 1}, skipping`);
          continue;
        }

        // Send message via Unipile
        const sendRes = await fetch(
          `https://${unipileDsn}/api/v1/chats/${encodeURIComponent(req.chat_id)}/messages`,
          {
            method: 'POST',
            headers: {
              'X-API-KEY': unipileApiKey,
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify({ text: message.trim() }),
          }
        );

        if (!sendRes.ok) {
          const errText = await sendRes.text();
          console.error(`[followup][campaign ${campaign.id}] send failed for contact ${req.contact_id}:`, sendRes.status, errText);
          continue;
        }

        console.log(`[followup][campaign ${campaign.id}] sent step ${nextStepIndex + 1} to contact ${req.contact_id}`);

        // Advance step
        const newStep = currentStep + 1;
        const isComplete = newStep >= workflowSteps.length;

        await supabase
          .from('campaign_connection_requests')
          .update({
            current_step: newStep,
            step_completed_at: new Date().toISOString(),
            status: isComplete ? 'completed' : 'accepted',
          })
          .eq('id', req.id);

        messagesSent++;

        // Delay between messages (3-5 seconds)
        await new Promise(r => setTimeout(r, 3000 + Math.random() * 2000));
      } catch (err) {
        console.error(`[followup][campaign ${campaign.id}] message error for ${req.contact_id}:`, err);
      }
    }

    // Update campaign messages_sent counter
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

  console.log(`[followup][campaign ${campaign.id}] accepted: ${acceptedCount}, messages: ${messagesSent}`);
  return { accepted: acceptedCount, messagesSent };
}

function extractLinkedinId(url: string | null): string | null {
  if (!url) return null;
  const match = url.match(/linkedin\.com\/in\/([^\/\?]+)/);
  return match ? match[1] : null;
}

function jsonRes(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
