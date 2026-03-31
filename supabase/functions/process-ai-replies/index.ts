const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Conversational AI — auto-replies to leads who respond.
 * Polls Unipile for new incoming messages on active campaigns with conversational_ai=true.
 * Generates context-aware replies focused on booking a call.
 * Smart stop: detects rejection / opt-out and stops replying.
 * Max replies: configurable per campaign (default 5).
 */

const REJECTION_PATTERNS = [
  /\bnot interested\b/i,
  /\bno thanks?\b/i,
  /\bno,?\s*thank you\b/i,
  /\bunsubscribe\b/i,
  /\bstop\s*(messaging|contacting|emailing)?\b/i,
  /\bremove me\b/i,
  /\bleave me alone\b/i,
  /\bdon'?t contact\b/i,
  /\bopt\s*out\b/i,
  /\bnot looking\b/i,
  /\bplease don'?t\b/i,
  /\bgo away\b/i,
];

function isRejection(text: string): boolean {
  return REJECTION_PATTERNS.some(p => p.test(text));
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
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get active campaigns with conversational AI enabled
    const { data: campaigns, error: campErr } = await supabase
      .from('campaigns')
      .select('id, user_id, company_name, value_proposition, pain_points, campaign_goal, message_tone, industry, language, custom_training, max_ai_replies, workflow_steps')
      .eq('status', 'active')
      .eq('conversational_ai', true);

    if (campErr) throw campErr;
    if (!campaigns || campaigns.length === 0) {
      return jsonRes({ status: 'no_conversational_campaigns', replied: 0 });
    }

    let totalReplied = 0;
    let totalStopped = 0;

    for (const campaign of campaigns) {
      try {
        const result = await processCampaignReplies(
          supabase, campaign, UNIPILE_API_KEY, UNIPILE_DSN, LOVABLE_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
        );
        totalReplied += result.replied;
        totalStopped += result.stopped;
      } catch (err) {
        console.error(`[ai-replies][campaign ${campaign.id}] error:`, err);
      }
    }

    console.log(`[ai-replies] Done. Replied: ${totalReplied}, Stopped: ${totalStopped}`);
    return jsonRes({ status: 'ok', replied: totalReplied, stopped: totalStopped });
  } catch (error) {
    console.error('[ai-replies] Fatal error:', error);
    return jsonRes({ error: error instanceof Error ? error.message : 'Unknown error' }, 500);
  }
});

async function processCampaignReplies(
  supabase: any,
  campaign: any,
  unipileApiKey: string,
  unipileDsn: string,
  lovableApiKey: string,
  supabaseUrl: string,
  supabaseServiceRoleKey: string,
): Promise<{ replied: number; stopped: number }> {
  const maxReplies = campaign.max_ai_replies || 5;

  // Get user's Unipile account
  const { data: profile } = await supabase
    .from('profiles')
    .select('unipile_account_id')
    .eq('user_id', campaign.user_id)
    .single();

  if (!profile?.unipile_account_id) return { replied: 0, stopped: 0 };
  const accountId = profile.unipile_account_id;

   // Get accepted/completed connection requests with chat_id that haven't been stopped
    // IMPORTANT: Only engage contacts where current_step >= 2 (at least one outreach message has been sent)
    // This prevents the conversational AI from replying before the scheduled workflow messages
    const { data: connReqs } = await supabase
      .from('campaign_connection_requests')
      .select('id, contact_id, chat_id, ai_replies_count, conversation_stopped, last_incoming_message_at, last_ai_reply_at, user_id, current_step')
      .eq('campaign_id', campaign.id)
      .in('status', ['accepted', 'completed'])
      .eq('conversation_stopped', false)
      .gte('current_step', 2)
      .not('chat_id', 'is', null);

  if (!connReqs || connReqs.length === 0) return { replied: 0, stopped: 0 };

  let replied = 0;
  let stopped = 0;

  for (const cr of connReqs) {
    try {
      if (cr.ai_replies_count >= maxReplies) {
        // Max replies reached, stop
        await supabase.from('campaign_connection_requests')
          .update({ conversation_stopped: true })
          .eq('id', cr.id);
        stopped++;
        continue;
      }

      // Fetch recent messages from this chat
      const messagesRes = await fetch(
        `https://${unipileDsn}/api/v1/chats/${encodeURIComponent(cr.chat_id)}/messages?limit=10`,
        { headers: { 'X-API-KEY': unipileApiKey, 'Accept': 'application/json' } }
      );

      if (!messagesRes.ok) {
        console.error(`[ai-replies] fetch messages failed for chat ${cr.chat_id}:`, messagesRes.status);
        continue;
      }

      const messagesData = await messagesRes.json();
      const messages = messagesData.items || messagesData || [];

      if (!Array.isArray(messages) || messages.length === 0) continue;

      // Find the most recent message
      const sortedMessages = [...messages].sort((a: any, b: any) => 
        new Date(b.timestamp || b.date || b.created_at || 0).getTime() - 
        new Date(a.timestamp || a.date || a.created_at || 0).getTime()
      );

      const latestMessage = sortedMessages[0];
      if (!latestMessage) continue;

      // Check if the latest message is from the lead (not from us)
      const isFromLead = !latestMessage.is_sender && latestMessage.sender_id !== accountId;
      const latestMsgTime = new Date(latestMessage.timestamp || latestMessage.date || latestMessage.created_at);

      // === CASE 1: Lead responded — reply to their message ===
      if (isFromLead) {
        const msgTimestamp = latestMsgTime.toISOString();
        if (cr.last_incoming_message_at && new Date(cr.last_incoming_message_at) >= new Date(msgTimestamp)) {
          // Check if we should do a 24h follow-up instead (fall through to case 2)
        } else {
          const leadMessage = (latestMessage.text || latestMessage.body || '').trim();
          if (!leadMessage) continue;

          // Smart stop: check for rejection
          if (isRejection(leadMessage)) {
            console.log(`[ai-replies] Rejection detected from contact ${cr.contact_id}: "${leadMessage.slice(0, 50)}"`);
            await supabase.from('campaign_connection_requests')
              .update({ conversation_stopped: true, last_incoming_message_at: msgTimestamp })
              .eq('id', cr.id);
            stopped++;
            continue;
          }

          // Get full contact info for rich context
          const { data: contact } = await supabase
            .from('contacts')
            .select('first_name, last_name, company, title, signal, linkedin_url, linkedin_profile_id, signal_post_url, relevance_tier')
            .eq('id', cr.contact_id)
            .single();
          if (!contact) continue;

          const conversationHistory = sortedMessages
            .slice(0, 8).reverse()
            .map((m: any) => {
              const sender = m.is_sender || m.sender_id === accountId ? 'You' : contact.first_name;
              return `${sender}: ${(m.text || m.body || '').trim()}`;
            })
            .filter((line: string) => line.length > 5)
            .join('\n');

          const reply = await generateConversationalReply(supabaseUrl, supabaseServiceRoleKey, {
            conversationHistory, leadMessage,
            companyName: campaign.company_name, valueProposition: campaign.value_proposition,
            painPoints: campaign.pain_points || [], campaignGoal: campaign.campaign_goal,
            messageTone: campaign.message_tone, industry: campaign.industry,
            language: campaign.language, customTraining: campaign.custom_training,
            firstName: contact.first_name, lastName: contact.last_name,
            leadCompany: contact.company, leadTitle: contact.title,
            buyingSignal: contact.signal, repliesCount: cr.ai_replies_count,
            maxReplies: maxReplies, isFollowUp: false,
          });

          if (!reply.trim()) continue;

          const sendRes = await fetch(
            `https://${unipileDsn}/api/v1/chats/${encodeURIComponent(cr.chat_id)}/messages`,
            { method: 'POST', headers: { 'X-API-KEY': unipileApiKey, 'Content-Type': 'application/json', 'Accept': 'application/json' },
              body: JSON.stringify({ text: reply.trim() }) }
          );
          if (!sendRes.ok) { console.error(`[ai-replies] send failed for ${cr.contact_id}:`, sendRes.status); continue; }

          console.log(`[ai-replies] Replied to ${contact.first_name} ${contact.last_name || ''} (reply #${cr.ai_replies_count + 1})`);
          await supabase.from('campaign_connection_requests')
            .update({ ai_replies_count: cr.ai_replies_count + 1, last_incoming_message_at: msgTimestamp, last_ai_reply_at: new Date().toISOString() })
            .eq('id', cr.id);

          const { data: currentCampaign } = await supabase.from('campaigns').select('messages_sent').eq('id', campaign.id).single();
          await supabase.from('campaigns').update({ messages_sent: (currentCampaign?.messages_sent || 0) + 1 }).eq('id', campaign.id);
          replied++;
          await delay(2000 + Math.random() * 2000);
          continue;
        }
      }

      // === CASE 2: No response from lead for 24h+ — send follow-up ===
      // The latest message is from us (or we already processed the lead's last message)
      const lastReplyAt = cr.last_ai_reply_at ? new Date(cr.last_ai_reply_at) : null;
      const hoursSinceLastReply = lastReplyAt ? (Date.now() - lastReplyAt.getTime()) / (1000 * 60 * 60) : null;

      // Only follow up if: we sent a reply before, it's been 24h+, and we haven't already followed up (check if latest msg is our follow-up)
      if (!lastReplyAt || hoursSinceLastReply === null || hoursSinceLastReply < 24) continue;

      // Don't send more than 1 follow-up without a response (check if last 2 messages are both ours)
      const lastTwoOurs = sortedMessages.slice(0, 2).every((m: any) => m.is_sender || m.sender_id === accountId);
      if (lastTwoOurs) continue;

      const { data: contact } = await supabase
        .from('contacts')
        .select('first_name, last_name, company, title, signal, linkedin_url, linkedin_profile_id, signal_post_url, relevance_tier')
        .eq('id', cr.contact_id)
        .single();
      if (!contact) continue;

      const conversationHistory = sortedMessages
        .slice(0, 8).reverse()
        .map((m: any) => {
          const sender = m.is_sender || m.sender_id === accountId ? 'You' : contact.first_name;
          return `${sender}: ${(m.text || m.body || '').trim()}`;
        })
        .filter((line: string) => line.length > 5)
        .join('\n');

      const followUp = await generateConversationalReply(supabaseUrl, supabaseServiceRoleKey, {
        conversationHistory, leadMessage: '',
        companyName: campaign.company_name, valueProposition: campaign.value_proposition,
        painPoints: campaign.pain_points || [], campaignGoal: campaign.campaign_goal,
        messageTone: campaign.message_tone, industry: campaign.industry,
        language: campaign.language, customTraining: campaign.custom_training,
        firstName: contact.first_name, lastName: contact.last_name,
        leadCompany: contact.company, leadTitle: contact.title,
        buyingSignal: contact.signal, repliesCount: cr.ai_replies_count,
        maxReplies: maxReplies, isFollowUp: true,
      });

      if (!followUp.trim()) continue;

      const sendRes = await fetch(
        `https://${unipileDsn}/api/v1/chats/${encodeURIComponent(cr.chat_id)}/messages`,
        { method: 'POST', headers: { 'X-API-KEY': unipileApiKey, 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ text: followUp.trim() }) }
      );
      if (!sendRes.ok) { console.error(`[ai-replies] follow-up send failed for ${cr.contact_id}:`, sendRes.status); continue; }

      console.log(`[ai-replies] 24h follow-up sent to ${contact.first_name} ${contact.last_name || ''} (reply #${cr.ai_replies_count + 1})`);
      await supabase.from('campaign_connection_requests')
        .update({ ai_replies_count: cr.ai_replies_count + 1, last_ai_reply_at: new Date().toISOString() })
        .eq('id', cr.id);

      const { data: currentCampaign } = await supabase.from('campaigns').select('messages_sent').eq('id', campaign.id).single();
      await supabase.from('campaigns').update({ messages_sent: (currentCampaign?.messages_sent || 0) + 1 }).eq('id', campaign.id);
      replied++;
      await delay(2000 + Math.random() * 2000);
    } catch (err) {
      console.error(`[ai-replies] error for contact ${cr.contact_id}:`, err);
    }
  }

  return { replied, stopped };
}

async function generateConversationalReply(
  supabaseUrl: string,
  serviceRoleKey: string,
  ctx: Record<string, unknown>,
): Promise<string> {
  try {
    const isFollowUp = ctx.isFollowUp as boolean;

    const systemPrompt = `You are an AI SDR having a real LinkedIn conversation. Your ONLY goal is to book a call/meeting.

RULES:
- ${isFollowUp ? 'The lead has NOT responded to your last message. Send a natural, non-pushy follow-up that adds new value or a different angle. Reference the previous conversation naturally.' : 'Reply naturally to what the lead said — this is a real conversation, not a cold outreach'}
- Keep responses under 50 words, 1-2 short paragraphs max
- Be ${ctx.messageTone || 'professional'} but human
- NO placeholders, NO jargon (leverage, utilize, synergy, delighted)
- NO em-dashes (—) or semicolons
${isFollowUp ? '- Do NOT repeat your previous message or ask the same question\n- Offer a new insight, share a quick relevant stat, or reframe the value proposition\n- Keep it light and casual, like "Hey, just circling back..." or "Quick thought..."' : '- If the lead asks a question, answer it briefly then steer toward a call\n- If the lead seems interested, propose a specific time frame ("sometime this week?")\n- If the lead is hesitant, acknowledge their concern and offer value'}
- Reply ${ctx.repliesCount as number >= (ctx.maxReplies as number) - 2 ? 'with a final gentle push for a call — this is one of your last messages' : 'conversationally, building toward booking a call'}
- Language: ${ctx.language || 'English'}
${ctx.customTraining ? `\nAdditional instructions: ${ctx.customTraining}` : ''}`;

    const userPrompt = `Context:
- Your company: ${ctx.companyName || 'our company'}
- Value proposition: ${ctx.valueProposition || 'We help businesses grow'}
- Campaign goal: ${ctx.campaignGoal || 'Book a demo call'}
- Lead: ${ctx.firstName} ${ctx.lastName || ''}, ${ctx.leadTitle || ''} at ${ctx.leadCompany || 'their company'}
- Signal: ${ctx.buyingSignal || 'engaged with our content'}
- Reply #${(ctx.repliesCount as number) + 1} of ${ctx.maxReplies}
${isFollowUp ? '- TYPE: Follow-up (lead has not responded in 24h+)' : ''}

Recent conversation:
${ctx.conversationHistory}

${isFollowUp ? 'The lead has not responded to your last message. Write a natural follow-up (under 50 words):' : `The lead just said: "${ctx.leadMessage}"\n\nWrite your reply (under 50 words):`}

Write your reply (under 50 words):`;

    const response = await fetch(`${supabaseUrl}/functions/v1/generate-step-message`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        stepNumber: 0, // Indicates conversational reply
        previousStepMessage: '',
        previousMessages: [],
        companyName: ctx.companyName,
        valueProposition: ctx.valueProposition,
        painPoints: ctx.painPoints,
        campaignGoal: ctx.campaignGoal,
        messageTone: ctx.messageTone,
        industry: ctx.industry,
        language: ctx.language,
        customTraining: `${systemPrompt}\n\n${userPrompt}`,
        firstName: ctx.firstName,
        lastName: ctx.lastName,
        leadCompany: ctx.leadCompany,
        leadTitle: ctx.leadTitle,
        buyingSignal: ctx.buyingSignal,
        isConversationalReply: true,
        conversationHistory: ctx.conversationHistory,
        leadMessage: ctx.leadMessage,
      }),
    });

    if (!response.ok) {
      console.error('[ai-replies] generate reply error:', response.status, await response.text());
      return '';
    }

    const data = await response.json();
    return (data?.message || '').trim();
  } catch (error) {
    console.error('[ai-replies] generate reply failed:', error);
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
