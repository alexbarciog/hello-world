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

    // Get all active campaigns with AI SDR steps
    const { data: campaigns, error: campErr } = await supabase
      .from('campaigns')
      .select('id, user_id, workflow_steps, company_name, value_proposition, pain_points, campaign_goal, message_tone, industry, language, custom_training')
      .eq('status', 'active')
      .not('workflow_steps', 'is', null);

    if (campErr) throw campErr;
    if (!campaigns || campaigns.length === 0) {
      return jsonRes({ status: 'no_active_campaigns', generated: 0 });
    }

    let totalGenerated = 0;

    for (const campaign of campaigns) {
      try {
        const generated = await processCampaignMessages(
          supabase,
          campaign,
          SUPABASE_URL,
          SUPABASE_SERVICE_ROLE_KEY,
          LOVABLE_API_KEY,
        );
        totalGenerated += generated;
      } catch (err) {
        console.error(`[daily-msg][campaign ${campaign.id}] error:`, err);
      }
    }

    console.log(`[daily-msg] Done. Generated ${totalGenerated} messages.`);
    return jsonRes({ status: 'ok', generated: totalGenerated });
  } catch (error) {
    console.error('[daily-msg] Fatal error:', error);
    return jsonRes({ error: error instanceof Error ? error.message : 'Unknown error' }, 500);
  }
});

async function processCampaignMessages(
  supabase: any,
  campaign: any,
  supabaseUrl: string,
  serviceRoleKey: string,
  lovableApiKey: string,
): Promise<number> {
  const workflowSteps: any[] = Array.isArray(campaign.workflow_steps) ? campaign.workflow_steps : [];
  if (workflowSteps.length < 2) return 0;

  // Find accepted contacts ready for their next step TODAY
  const { data: acceptedRequests } = await supabase
    .from('campaign_connection_requests')
    .select('id, contact_id, current_step, step_completed_at, user_id')
    .eq('campaign_id', campaign.id)
    .eq('status', 'accepted');

  if (!acceptedRequests || acceptedRequests.length === 0) return 0;

  let generated = 0;
  const today = new Date().toISOString().split('T')[0];

  const hasInvitation = workflowSteps.length > 0 && workflowSteps[0].type === 'invitation';

  for (const req of acceptedRequests) {
    try {
      const currentStep = req.current_step || 1;
      const nextStepIndex = hasInvitation ? currentStep : currentStep - 1;
      const nextStep = workflowSteps[nextStepIndex];

      if (!nextStep || nextStep.type !== 'message') continue;

      // Check if delay has passed
      const stepCompletedAt = req.step_completed_at ? new Date(req.step_completed_at) : null;
      if (!stepCompletedAt) continue;

      const delayDays = nextStep.delay_days || 1;
      const delayMs = delayDays * 24 * 60 * 60 * 1000;
      if (Date.now() - stepCompletedAt.getTime() < delayMs) continue;

      // Check if we already generated a message for this contact+step
      const { data: existing } = await supabase
        .from('scheduled_messages')
        .select('id')
        .eq('connection_request_id', req.id)
        .eq('step_index', nextStepIndex)
        .maybeSingle();

      if (existing) continue; // Already generated

      // Get contact info
      const { data: contact } = await supabase
        .from('contacts')
        .select('first_name, last_name, company, title, signal')
        .eq('id', req.contact_id)
        .single();

      if (!contact) continue;

      let message = '';

      // If AI SDR mode, generate unique message
      if (nextStep.ai_icebreaker) {
        console.log(`[daily-msg] Generating AI message for contact ${req.contact_id}, step ${nextStepIndex + 1}`);

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

        const displayStepNumber = hasInvitation ? nextStepIndex + 1 : nextStepIndex + 2;

        message = await invokeGenerateStepMessage(supabaseUrl, serviceRoleKey, {
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
          customTraining: campaign.custom_training,
          firstName: contact.first_name,
          lastName: contact.last_name,
          leadCompany: contact.company,
          leadTitle: contact.title,
          buyingSignal: contact.signal,
        });

        if (!message.trim()) continue;

        // Small delay to avoid rate limits
        await delay(700);
      } else {
        // Template message — personalize with contact data
        message = nextStep.message || '';
        message = message
          .replace(/\{\{first_name\}\}/gi, contact.first_name || '')
          .replace(/\{\{last_name\}\}/gi, contact.last_name || '')
          .replace(/\{\{company\}\}/gi, contact.company || '')
          .replace(/\{\{title\}\}/gi, contact.title || '')
          .replace(/\{\{signal\}\}/gi, contact.signal || '');
      }

      if (!message.trim()) continue;

      // Save to scheduled_messages
      const { error: insertErr } = await supabase
        .from('scheduled_messages')
        .insert({
          campaign_id: campaign.id,
          contact_id: req.contact_id,
          connection_request_id: req.id,
          step_index: nextStepIndex,
          message: message.trim(),
          status: 'generated',
          scheduled_for: today,
          user_id: req.user_id,
        });

      if (insertErr) {
        console.error(`[daily-msg] Insert error:`, insertErr);
      } else {
        generated++;
        console.log(`[daily-msg] Generated message for ${contact.first_name} ${contact.last_name || ''} (step ${nextStepIndex + 1})`);
      }
    } catch (err) {
      console.error(`[daily-msg] Error for req ${req.id}:`, err);
    }
  }

  return generated;
}

async function invokeGenerateStepMessage(
  supabaseUrl: string,
  serviceRoleKey: string,
  payload: Record<string, unknown>,
): Promise<string> {
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/generate-step-message`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error('[daily-msg] generate-step-message error:', response.status, await response.text());
      return '';
    }

    const data = await response.json();
    return (data?.message || '').trim();
  } catch (error) {
    console.error('[daily-msg] generate-step-message invoke failed:', error);
    return '';
  }
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
