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
      console.log('[followup] No active campaigns');
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
    console.log(`[followup][campaign ${campaign.id}] no unipile account`);
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
    console.log(`[followup][campaign ${campaign.id}] checking ${pendingRequests.length} pending invitations`);

    // Strategy: Fetch the list of PENDING sent invitations from Unipile.
    // Contacts whose invitation is NO LONGER pending have accepted (or rejected).
    // We then verify by trying to open a chat with them.
    const pendingProviderIds = await fetchPendingSentInvitations(unipileDsn, unipileApiKey, accountId);
    console.log(`[followup][campaign ${campaign.id}] Unipile pending invitations count: ${pendingProviderIds.size}`);

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
        if (!publicId) {
          console.log(`[followup] contact ${req.contact_id} no linkedin id`);
          continue;
        }

        // Resolve to provider_id
        const providerId = await resolveProviderId(unipileDsn, unipileApiKey, accountId, publicId);
        if (!providerId) {
          console.log(`[followup] could not resolve provider_id for ${publicId}`);
          continue;
        }

        // If this provider_id is still in pending sent invitations, skip
        if (pendingProviderIds.has(providerId)) {
          console.log(`[followup] ${publicId} invitation still pending`);
          continue;
        }

        // Invitation is no longer pending → check if we have a chat (= accepted)
        const chatId = await findChat(unipileDsn, unipileApiKey, accountId, providerId);

        if (chatId) {
          // Accepted! Update record
          console.log(`[followup] ${publicId} ACCEPTED, chat: ${chatId}`);
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
          // Not pending and no chat → might be rejected or API lag, check relations
          const isRelation = await checkRelation(unipileDsn, unipileApiKey, accountId, publicId);
          if (isRelation) {
            console.log(`[followup] ${publicId} is a relation (no chat yet), marking accepted`);
            await supabase
              .from('campaign_connection_requests')
              .update({
                status: 'accepted',
                accepted_at: new Date().toISOString(),
                current_step: 1,
                step_completed_at: new Date().toISOString(),
              })
              .eq('id', req.id);
            acceptedCount++;
          } else {
            console.log(`[followup] ${publicId} not pending, no chat, not relation — likely rejected or pending API sync`);
          }
        }

        // Rate limit: 1-2s between checks
        await delay(1000 + Math.random() * 1000);
      } catch (err) {
        console.error(`[followup][campaign ${campaign.id}] acceptance check error for ${req.contact_id}:`, err);
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
  const { data: acceptedRequests } = await supabase
    .from('campaign_connection_requests')
    .select('id, contact_id, current_step, step_completed_at, chat_id')
    .eq('campaign_id', campaign.id)
    .eq('status', 'accepted');

  let messagesSent = 0;

  if (acceptedRequests && acceptedRequests.length > 0) {
    for (const req of acceptedRequests) {
      try {
        const currentStep = req.current_step || 1;
        const nextStepIndex = currentStep; // workflow_steps[0] = invitation, workflow_steps[1] = step 2
        const nextStep = workflowSteps[nextStepIndex];

        if (!nextStep || nextStep.type !== 'message') {
          if (currentStep >= workflowSteps.length) {
            await supabase
              .from('campaign_connection_requests')
              .update({ status: 'completed' })
              .eq('id', req.id);
          }
          continue;
        }

        // Check delay
        const stepCompletedAt = req.step_completed_at ? new Date(req.step_completed_at) : null;
        if (!stepCompletedAt) continue;

        const delayDays = nextStep.delay_days || 1;
        const delayMs = delayDays * 24 * 60 * 60 * 1000;
        const elapsed = Date.now() - stepCompletedAt.getTime();

        if (elapsed < delayMs) continue;

        // If no chat_id yet, try to find it now
        let chatId = req.chat_id;
        if (!chatId) {
          const { data: contact } = await supabase
            .from('contacts')
            .select('linkedin_profile_id, linkedin_url')
            .eq('id', req.contact_id)
            .single();

          if (contact) {
            const publicId = contact.linkedin_profile_id || extractLinkedinId(contact.linkedin_url);
            if (publicId) {
              const providerId = await resolveProviderId(unipileDsn, unipileApiKey, accountId, publicId);
              if (providerId) {
                chatId = await findChat(unipileDsn, unipileApiKey, accountId, providerId);
                if (chatId) {
                  await supabase
                    .from('campaign_connection_requests')
                    .update({ chat_id: chatId })
                    .eq('id', req.id);
                }
              }
            }
          }
        }

        if (!chatId) {
          console.log(`[followup] no chat_id for contact ${req.contact_id}, skipping message`);
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
          console.log(`[followup] empty message for step ${nextStepIndex + 1}, skipping`);
          continue;
        }

        // Send message via Unipile
        const sendRes = await fetch(
          `https://${unipileDsn}/api/v1/chats/${encodeURIComponent(chatId)}/messages`,
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
          console.error(`[followup] send failed for contact ${req.contact_id}:`, sendRes.status, errText);
          continue;
        }

        console.log(`[followup] sent step ${nextStepIndex + 1} to contact ${req.contact_id}`);

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

  console.log(`[followup][campaign ${campaign.id}] accepted: ${acceptedCount}, messages: ${messagesSent}`);
  return { accepted: acceptedCount, messagesSent };
}

// ── Unipile API helpers ──

/** Fetch all pending sent invitations and return a Set of provider_ids that are still pending */
async function fetchPendingSentInvitations(
  dsn: string, apiKey: string, accountId: string
): Promise<Set<string>> {
  const providerIds = new Set<string>();
  try {
    const url = new URL(`https://${dsn}/api/v1/users/invite/sent`);
    url.searchParams.set('account_id', accountId);
    url.searchParams.set('limit', '100');

    const res = await fetch(url.toString(), {
      headers: { 'X-API-KEY': apiKey, 'Accept': 'application/json' },
    });

    if (!res.ok) {
      console.error(`[followup] invite/sent failed: ${res.status} ${await res.text()}`);
      return providerIds;
    }

    const data = await res.json();
    const items = data?.items || data?.data || (Array.isArray(data) ? data : []);

    for (const item of items) {
      const pid = item.provider_id || item.id;
      if (pid) providerIds.add(pid);
    }

    console.log(`[followup] fetched ${items.length} pending sent invitations`);
  } catch (err) {
    console.error('[followup] fetchPendingSentInvitations error:', err);
  }
  return providerIds;
}

/** Resolve a LinkedIn public ID (vanity URL slug) to a Unipile provider_id */
async function resolveProviderId(
  dsn: string, apiKey: string, accountId: string, publicId: string
): Promise<string | null> {
  try {
    const res = await fetch(
      `https://${dsn}/api/v1/users/${encodeURIComponent(publicId)}?account_id=${accountId}`,
      { headers: { 'X-API-KEY': apiKey, 'Accept': 'application/json' } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.provider_id || null;
  } catch {
    return null;
  }
}

/** Find an existing chat with a provider_id, return chat ID or null */
async function findChat(
  dsn: string, apiKey: string, accountId: string, providerId: string
): Promise<string | null> {
  try {
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
    return chats.length > 0 ? (chats[0].id || chats[0].chat_id || null) : null;
  } catch {
    return null;
  }
}

/** Check if a user is a relation (connected) using the user profile endpoint */
async function checkRelation(
  dsn: string, apiKey: string, accountId: string, publicId: string
): Promise<boolean> {
  try {
    const res = await fetch(
      `https://${dsn}/api/v1/users/${encodeURIComponent(publicId)}?account_id=${accountId}`,
      { headers: { 'X-API-KEY': apiKey, 'Accept': 'application/json' } }
    );
    if (!res.ok) return false;
    const data = await res.json();
    // Check if the user profile indicates a connection (network_distance === 1 or is_connection)
    return data.network_distance === 1 || data.is_connection === true || data.relation_type === 'FIRST_DEGREE';
  } catch {
    return false;
  }
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
