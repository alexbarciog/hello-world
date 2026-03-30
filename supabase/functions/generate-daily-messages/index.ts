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
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

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
        const generated = await processCampaignMessages(supabase, campaign, LOVABLE_API_KEY);
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
  lovableApiKey: string
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

  for (const req of acceptedRequests) {
    try {
      const currentStep = req.current_step || 1;
      const nextStepIndex = currentStep; // workflow_steps[0]=invitation, [1]=step2...
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
        const previousStepMsg = nextStepIndex > 1 ? workflowSteps[nextStepIndex - 1]?.message || '' : '';

        try {
          const aiRes = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${lovableApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'google/gemini-3-flash-preview',
              messages: [
                { role: 'system', content: buildAiSdrPrompt(campaign, contact, nextStepIndex + 1, workflowSteps.length) },
                { role: 'user', content: buildAiSdrUserPrompt(nextStepIndex + 1, previousStepMsg, campaign, workflowSteps.length) },
              ],
            }),
          });

          if (aiRes.ok) {
            const aiData = await aiRes.json();
            message = aiData.choices?.[0]?.message?.content?.trim() || '';
          } else {
            console.error(`[daily-msg] AI error: ${aiRes.status}`);
            continue;
          }
        } catch (aiErr) {
          console.error(`[daily-msg] AI fetch error:`, aiErr);
          continue;
        }

        // Small delay to avoid rate limits
        await delay(1500);
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

// ── AI SDR prompt builders ──

function buildAiSdrPrompt(campaign: any, contact: any, stepNumber: number, totalSteps: number): string {
  const toneGuide: Record<string, string> = {
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
This is the icebreaker. Reference the specific buying signal. Make it personal, curious, genuine. Ask a thoughtful question.
Return ONLY the message text.`;
  } else if (isLast) {
    return `Write a FINAL follow-up message (Step ${stepNumber}).
${previousMessage ? `Previous message: "${previousMessage}"` : ''}
Short, low-pressure nudge. ${campaign.campaign_goal === 'demos' ? 'Offer a quick 10-min call.' : 'Keep the door open.'}
Return ONLY the message text.`;
  } else {
    return `Write a follow-up message (Step ${stepNumber}).
${previousMessage ? `Previous message: "${previousMessage}"\nBuild naturally on that.` : ''}
Reference a pain point relevant to their role. Show understanding. Don't repeat previous content.
Return ONLY the message text.`;
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
