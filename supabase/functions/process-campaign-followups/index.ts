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

    const { data: campaigns, error: campErr } = await supabase
      .from('campaigns')
      .select('id, user_id, workflow_steps, source_list_id, company_name, value_proposition, pain_points, campaign_goal, message_tone, industry, language')
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
        const result = await processCampaign(supabase, campaign, UNIPILE_API_KEY, UNIPILE_DSN, LOVABLE_API_KEY);
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
  campaign: any,
  unipileApiKey: string,
  unipileDsn: string,
  lovableApiKey: string | undefined
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
  // Strategy: For each contact with status='sent', check if we can find a chat
  // with them (= accepted) or if they show as 1st degree connection.
  const { data: pendingRequests } = await supabase
    .from('campaign_connection_requests')
    .select('id, contact_id, status, current_step')
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

        // Get clean LinkedIn vanity slug — decode first to avoid double-encoding
        let publicId = contact.linkedin_profile_id || extractLinkedinId(contact.linkedin_url);
        if (!publicId) {
          console.log(`[followup] contact ${req.contact_id} no linkedin id`);
          continue;
        }

        // Decode any already-encoded chars (e.g., %C4%83 → ă)
        try { publicId = decodeURIComponent(publicId); } catch { /* already decoded */ }

        // Resolve LinkedIn vanity to Unipile provider_id
        const providerId = await resolveProviderId(unipileDsn, unipileApiKey, accountId, publicId);
        if (!providerId) {
          // Try the profile endpoint with the raw slug as fallback
          console.log(`[followup] could not resolve ${publicId}, trying profile check`);

          // Check via user profile if they show as 1st degree
          const profileData = await fetchUserProfile(unipileDsn, unipileApiKey, accountId, publicId);
          if (profileData && isFirstDegree(profileData)) {
            console.log(`[followup] ${publicId} is 1st degree via profile (no provider_id)`);
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
          }
          await delay(800);
          continue;
        }

        // Try to find a chat with them — if chat exists, they accepted
        const chatId = await findChat(unipileDsn, unipileApiKey, accountId, providerId);

        if (chatId) {
          console.log(`[followup] ${publicId} ACCEPTED (chat found: ${chatId})`);
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
          // No chat found — check if the profile shows 1st degree connection
          const profileData = await fetchUserProfile(unipileDsn, unipileApiKey, accountId, publicId);
          if (profileData && isFirstDegree(profileData)) {
            console.log(`[followup] ${publicId} ACCEPTED (1st degree, no chat yet)`);
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
          }
        }

        await delay(1000 + Math.random() * 1000);
      } catch (err) {
        console.error(`[followup] acceptance check error for ${req.contact_id}:`, err);
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
        const nextStepIndex = currentStep; // workflow_steps[0]=invitation, [1]=step2, etc
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
        if (Date.now() - stepCompletedAt.getTime() < delayMs) continue;

        // If no chat_id, try to find one now
        let chatId = req.chat_id;
        if (!chatId) {
          const { data: contact } = await supabase
            .from('contacts')
            .select('linkedin_profile_id, linkedin_url')
            .eq('id', req.contact_id)
            .single();

          if (contact) {
            let pid = contact.linkedin_profile_id || extractLinkedinId(contact.linkedin_url);
            if (pid) {
              try { pid = decodeURIComponent(pid); } catch { /* ok */ }
              const providerId = await resolveProviderId(unipileDsn, unipileApiKey, accountId, pid);
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
          console.log(`[followup] no chat for contact ${req.contact_id}, can't send message`);
          continue;
        }

        // Get contact info for personalization
        const { data: contact } = await supabase
          .from('contacts')
          .select('first_name, last_name, company, title, signal')
          .eq('id', req.contact_id)
          .single();

        let message = '';

        // Check for pre-generated message from generate-daily-messages
        const { data: scheduledMsg } = await supabase
          .from('scheduled_messages')
          .select('id, message, status')
          .eq('connection_request_id', req.id)
          .eq('step_index', nextStepIndex)
          .in('status', ['generated', 'edited'])
          .maybeSingle();

        if (scheduledMsg && scheduledMsg.message) {
          message = scheduledMsg.message;
          console.log(`[followup] Using pre-generated message for contact ${req.contact_id} (${scheduledMsg.status})`);
        } else if (!nextStep.ai_icebreaker && nextStep.message) {
          // Template message — personalize with contact data
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
          console.log(`[followup] No message available for contact ${req.contact_id}, step ${nextStepIndex + 1} — waiting for daily generation`);
          continue;
        }

        if (!message.trim()) {
          console.log(`[followup] empty message for step ${nextStepIndex + 1}`);
          continue;
        }

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
          console.error(`[followup] send failed for ${req.contact_id}:`, sendRes.status, await sendRes.text());
          continue;
        }

        console.log(`[followup] sent step ${nextStepIndex + 1} to contact ${req.contact_id}`);

        // Mark scheduled_message as sent
        if (scheduledMsg) {
          await supabase
            .from('scheduled_messages')
            .update({ status: 'sent', sent_at: new Date().toISOString() })
            .eq('id', scheduledMsg.id);
        }

        const newStep = currentStep + 1;
        await supabase
          .from('campaign_connection_requests')
          .update({
            current_step: newStep,
            step_completed_at: new Date().toISOString(),
            status: newStep >= workflowSteps.length ? 'completed' : 'accepted',
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

async function resolveProviderId(
  dsn: string, apiKey: string, accountId: string, publicId: string
): Promise<string | null> {
  try {
    const url = `https://${dsn}/api/v1/users/${encodeURIComponent(publicId)}?account_id=${accountId}`;
    console.log(`[followup] resolving: ${publicId}`);
    const res = await fetch(url, {
      headers: { 'X-API-KEY': apiKey, 'Accept': 'application/json' },
    });
    if (!res.ok) {
      console.log(`[followup] resolve ${publicId} failed: ${res.status}`);
      return null;
    }
    const data = await res.json();
    console.log(`[followup] resolve ${publicId} => provider_id: ${data.provider_id}, network: ${data.network_distance}`);
    return data.provider_id || null;
  } catch (err) {
    console.error(`[followup] resolve error for ${publicId}:`, err);
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
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function isFirstDegree(profileData: any): boolean {
  // Check various fields that Unipile might return for connection status
  if (profileData.network_distance === 1) return true;
  if (profileData.is_connection === true) return true;
  if (profileData.relation_type === 'FIRST_DEGREE') return true;
  if (profileData.distance === 'DISTANCE_1') return true;
  if (profileData.connection_degree === 1) return true;
  return false;
}

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

    if (!res.ok) {
      console.log(`[followup] findChat failed: ${res.status}`);
      return null;
    }
    const data = await res.json();
    const chats = data?.items || data?.data || [];
    const chatId = chats.length > 0 ? (chats[0].id || chats[0].chat_id || null) : null;
    if (chatId) console.log(`[followup] found chat: ${chatId}`);
    return chatId;
  } catch {
    return null;
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

    professional: 'Use a professional but warm tone. Be polished and respectful.',
    conversational: 'Use a casual, friendly tone. Write like you\'re talking to a peer.',
    direct: 'Be bold and confident. Get to the point quickly.',
  };
  const goalGuide: Record<string, string> = {
    conversations: 'The goal is to start a genuine conversation. Don\'t push for a meeting.',
    demos: 'The goal is to book a call or demo. Include a clear but non-pushy CTA.',
  };

  return `You are a world-class LinkedIn outreach copywriter writing a REAL message to a SPECIFIC person.

TARGET PERSON:
- Name: ${contact?.first_name || 'Unknown'} ${contact?.last_name || ''}
- Title: ${contact?.title || 'Not specified'}
- Company: ${contact?.company || 'Not specified'}
- Buying Signal: ${contact?.signal || 'Not specified'}

SENDER'S BUSINESS:
- Company: ${campaign.company_name || 'Our company'}
- Value Proposition: ${campaign.value_proposition || 'Not specified'}
- Pain Points we solve: ${(campaign.pain_points || []).join('; ') || 'Not specified'}
- Industry: ${campaign.industry || 'Not specified'}

TONE: ${toneGuide[campaign.message_tone] || toneGuide.professional}
GOAL: ${goalGuide[campaign.campaign_goal] || goalGuide.conversations}
${campaign.language && campaign.language !== 'English (US)' ? `LANGUAGE: Write in ${campaign.language}` : ''}

CRITICAL RULES:
- Write 3-5 sentences MAX
- This must feel like a genuine human message, NOT a template
- Reference ${contact?.first_name || 'the person'}'s specific role, company, and buying signal naturally
- DO NOT use generic openers like "I hope this finds you well" or "I came across your profile"
- DO NOT mention AI, automation, or sequences
- DO NOT start with "Hi ${contact?.first_name}" — vary your openings
- Make this message UNIQUE to this person — it should NOT work for anyone else`;
}

function buildAiSdrUserPrompt(stepNumber: number, previousMessage: string, campaign: any, totalSteps: number): string {
  const isFirst = stepNumber === 2;
  const isLast = stepNumber >= totalSteps;

  if (isFirst) {
    return `Write the FIRST message after the LinkedIn connection was accepted (Step 2).
This is the icebreaker. Reference the specific buying signal that made us reach out. Make it personal, curious, and genuine. Ask a thoughtful question.
${previousMessage ? `The previous step was a connection request (no message sent).` : ''}
Return ONLY the message text.`;
  } else if (isLast) {
    return `Write a FINAL follow-up message (Step ${stepNumber}).
${previousMessage ? `Previous message sent: "${previousMessage}"` : ''}
Short, low-pressure nudge. Acknowledge they're busy. ${campaign.campaign_goal === 'demos' ? 'Offer a quick 10-min call.' : 'Keep the door open.'}
Return ONLY the message text.`;
  } else {
    return `Write a follow-up message (Step ${stepNumber}).
${previousMessage ? `Previous message: "${previousMessage}"\nBuild naturally on that conversation.` : ''}
Reference a pain point relevant to their role. Show you understand their challenges. Don't repeat previous content.
Return ONLY the message text.`;
  }
}
