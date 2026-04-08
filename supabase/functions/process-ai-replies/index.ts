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
 * Meeting detection: auto-books meetings when leads agree to schedule.
 * Smart follow-up: parses temporal cues for intelligent follow-up timing.
 * Max replies: configurable per campaign (default 5).
 */

const REJECTION_PATTERNS = [
  // Direct rejections
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
  /\bnot at the moment\b/i,
  /\bnot right now\b/i,
  /\bmaybe later\b/i,
  /\bnot a good time\b/i,
  /\bin the middle of something\b/i,
  /\btoo busy\b/i,
  /\bdon'?t have time\b/i,
  /\bnot for me\b/i,
  /\bno need\b/i,
  /\bwe'?re (all )?set\b/i,
  /\ball good\b/i,
  /\bpass\b/i,
  /\bi'?ll pass\b/i,
  /\bnot relevant\b/i,
  // "I don't need/want" patterns
  /\bdon'?t need\b/i,
  /\bdon'?t want\b/i,
  /\bdon'?t do\b/i,
  /\bwe don'?t\b/i,
  /\bi don'?t\b/i,
  /\bnot (something|anything) (i|we)\b/i,
  /\bnot (my|our) (thing|area|focus|department)\b/i,
  /\bwrong person\b/i,
  /\bnot the right (person|contact|fit)\b/i,
  /\bnot (a )?(fit|match)\b/i,
  // Polite declines
  /\bappreciate it,?\s*but\b/i,
  /\bthanks?,?\s*but\s*(no|i'?m? (good|fine|ok|set))\b/i,
  /\bi'?m?\s*(good|fine|ok|set|sorted|covered)\b/i,
  /\balready\s*(have|use|using|got|covered|sorted)\b/i,
  /\bwe'?ve got\b/i,
  /\bnah\b/i,
  /\bno way\b/i,
  /\bcan'?t help\b/i,
  /\bnot my\s*(call|decision)\b/i,
  // Off-topic / help-seeking (not a buyer)
  /\bcan you help me\s*(with|find|get)\b/i,
  /\bsend\s*(me\s*)?(your\s*)?(cv|resume|portfolio)\b/i,
  /\blooking for\s*(a\s*)?(job|work|position|role|opportunity)\b/i,
  /\bare you hiring\b/i,
  /\bdo you have.*position\b/i,
  /\bdo you have.*opening\b/i,
  /\bcan (you|i).*advic/i,
];

// ── Meeting intent detection ──
const MEETING_INTENT_PATTERNS = [
  /\blet'?s?\s+(schedule|book|set up|plan|arrange)\b/i,
  /\bschedule\s+a?\s*(call|meeting|chat|demo|session|zoom|teams)\b/i,
  /\bbook\s+a?\s*(call|meeting|time|slot|demo)\b/i,
  /\bset\s+up\s+a?\s*(call|meeting|time|chat)\b/i,
  /\blet'?s?\s+(talk|chat|connect|catch up|hop on|jump on)\b/i,
  /\bhappy\s+to\s+(chat|talk|connect|discuss|jump on|hop on)\b/i,
  /\bsure,?\s*(let'?s|we can|i'?m? (down|open|free|available))\b/i,
  /\bsounds?\s+good\b/i,
  /\bsounds?\s+great\b/i,
  /\bi'?m?\s+(open|free|available|down|interested)\b/i,
  /\bwhen\s+(are you|works?|is good|can we|should we)\b/i,
  /\bwhat\s+time\s+(works?|is good)\b/i,
  /\bpick\s+a\s+time\b/i,
  /\bsend\s+(me\s+)?(your\s+)?calendar\b/i,
  /\bcalendly\b/i,
  /\byes,?\s*(let'?s|i'?d love|absolutely|definitely)\b/i,
  /\bdefinitely\s*(interested|down|open)\b/i,
  /\babsolutely\b/i,
  /\bfor sure\b/i,
  /\bcount me in\b/i,
  /\blooking forward\b/i,
];

// ── Temporal cue parsing ──
// Returns a Date for when the follow-up should happen, or null
function parseTemporalCue(text: string): Date | null {
  const now = new Date();
  const lower = text.toLowerCase();

  // "tomorrow"
  if (/\btomorrow\b/i.test(lower)) {
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    d.setHours(9, 0, 0, 0); // 9 AM next day
    return d;
  }

  // "next week"
  if (/\bnext\s+week\b/i.test(lower)) {
    const d = new Date(now);
    d.setDate(d.getDate() + ((8 - d.getDay()) % 7 || 7)); // Next Monday
    d.setHours(9, 0, 0, 0);
    return d;
  }

  // "Monday", "Tuesday", etc.
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  for (let i = 0; i < dayNames.length; i++) {
    const regex = new RegExp(`\\b${dayNames[i]}\\b`, 'i');
    if (regex.test(lower)) {
      const d = new Date(now);
      const currentDay = d.getDay();
      let daysAhead = i - currentDay;
      if (daysAhead <= 0) daysAhead += 7;
      d.setDate(d.getDate() + daysAhead);
      d.setHours(9, 0, 0, 0);
      return d;
    }
  }

  // "in X days"
  const inDaysMatch = lower.match(/\bin\s+(\d+)\s+days?\b/i);
  if (inDaysMatch) {
    const d = new Date(now);
    d.setDate(d.getDate() + parseInt(inDaysMatch[1]));
    d.setHours(9, 0, 0, 0);
    return d;
  }

  // "couple of days" / "few days"
  if (/\b(couple|few)\s+(of\s+)?days?\b/i.test(lower)) {
    const d = new Date(now);
    d.setDate(d.getDate() + 2);
    d.setHours(9, 0, 0, 0);
    return d;
  }

  // "end of (the) week"
  if (/\bend\s+of\s+(the\s+)?week\b/i.test(lower)) {
    const d = new Date(now);
    const currentDay = d.getDay();
    const daysToFriday = (5 - currentDay + 7) % 7 || 7;
    d.setDate(d.getDate() + daysToFriday);
    d.setHours(9, 0, 0, 0);
    return d;
  }

  return null;
}

function hasMeetingIntent(text: string): boolean {
  return MEETING_INTENT_PATTERNS.some(p => p.test(text));
}

// Also check conversation history for meeting intent (lead + AI agreed)
function conversationHasMeetingAgreement(conversationHistory: string, latestLeadMessage: string): boolean {
  // Check if the latest lead message shows meeting intent
  if (hasMeetingIntent(latestLeadMessage)) return true;

  // Check if there's been a back-and-forth about scheduling
  const lines = conversationHistory.split('\n');
  let meetingMentions = 0;
  for (const line of lines) {
    if (MEETING_INTENT_PATTERNS.some(p => p.test(line))) {
      meetingMentions++;
    }
  }
  // If meeting was mentioned 2+ times in conversation, likely agreed
  return meetingMentions >= 2;
}

// Check for soft rejection: lead has declined twice in the conversation
function isSoftRejection(conversationHistory: string): boolean {
  const lines = conversationHistory.split('\n');
  let rejectionCount = 0;
  for (const line of lines) {
    // Only check lead messages (not "You:" lines)
    if (line.startsWith('You:')) continue;
    if (REJECTION_PATTERNS.some(p => p.test(line))) {
      rejectionCount++;
    }
  }
  return rejectionCount >= 2;
}

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
    let totalMeetingsBooked = 0;

    for (const campaign of campaigns) {
      try {
        const result = await processCampaignReplies(
          supabase, campaign, UNIPILE_API_KEY, UNIPILE_DSN, LOVABLE_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
        );
        totalReplied += result.replied;
        totalStopped += result.stopped;
        totalMeetingsBooked += result.meetingsBooked;
      } catch (err) {
        console.error(`[ai-replies][campaign ${campaign.id}] error:`, err);
      }
    }

    console.log(`[ai-replies] Done. Replied: ${totalReplied}, Stopped: ${totalStopped}, Meetings: ${totalMeetingsBooked}`);
    return jsonRes({ status: 'ok', replied: totalReplied, stopped: totalStopped, meetingsBooked: totalMeetingsBooked });
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
): Promise<{ replied: number; stopped: number; meetingsBooked: number }> {
  const maxReplies = campaign.max_ai_replies || 5;

  // Get user's Unipile account
  const { data: profile } = await supabase
    .from('profiles')
    .select('unipile_account_id')
    .eq('user_id', campaign.user_id)
    .single();

  if (!profile?.unipile_account_id) return { replied: 0, stopped: 0, meetingsBooked: 0 };
  const accountId = profile.unipile_account_id;

   // Get accepted/completed connection requests with chat_id that haven't been stopped
    // IMPORTANT: Only engage contacts where current_step >= 2 (at least one outreach message has been sent)
    const { data: connReqs } = await supabase
      .from('campaign_connection_requests')
      .select('id, contact_id, chat_id, ai_replies_count, conversation_stopped, last_incoming_message_at, last_ai_reply_at, user_id, current_step, created_at, sent_at, next_followup_at')
      .eq('campaign_id', campaign.id)
      .in('status', ['accepted', 'completed'])
      .eq('conversation_stopped', false)
      .gte('current_step', 2)
      .not('chat_id', 'is', null);

  if (!connReqs || connReqs.length === 0) return { replied: 0, stopped: 0, meetingsBooked: 0 };

  let replied = 0;
  let stopped = 0;
  let meetingsBooked = 0;

  for (const cr of connReqs) {
    try {
      if (cr.ai_replies_count >= maxReplies) {
        await supabase.from('campaign_connection_requests')
          .update({ conversation_stopped: true })
          .eq('id', cr.id);
        stopped++;
        continue;
      }

      // ── GUARD: Skip pre-existing conversations ──
      const crCreatedAt = new Date(cr.created_at || cr.sent_at || 0);

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

      const sortedMessages = [...messages].sort((a: any, b: any) => 
        new Date(b.timestamp || b.date || b.created_at || 0).getTime() - 
        new Date(a.timestamp || a.date || a.created_at || 0).getTime()
      );

      // ── GUARD: Check if this is a pre-existing conversation ──
      const oldestMessage = sortedMessages[sortedMessages.length - 1];
      const oldestMsgTime = new Date(oldestMessage?.timestamp || oldestMessage?.date || oldestMessage?.created_at || 0);
      if (oldestMsgTime.getTime() > 0 && oldestMsgTime < crCreatedAt) {
        console.log(`[ai-replies] Skipping contact ${cr.contact_id} — pre-existing conversation detected`);
        await supabase.from('campaign_connection_requests')
          .update({ conversation_stopped: true })
          .eq('id', cr.id);
        stopped++;
        continue;
      }

      const latestMessage = sortedMessages[0];
      if (!latestMessage) continue;

      const isFromLead = !latestMessage.is_sender && latestMessage.sender_id !== accountId;
      const latestMsgTime = new Date(latestMessage.timestamp || latestMessage.date || latestMessage.created_at);

      // === CASE 1: Lead responded — reply to their message ===
      if (isFromLead) {
        const msgTimestamp = latestMsgTime.toISOString();
        if (cr.last_incoming_message_at && new Date(cr.last_incoming_message_at) >= new Date(msgTimestamp)) {
          // Already processed — fall through to case 2
        } else {
          const leadMessage = (latestMessage.text || latestMessage.body || '').trim();
          if (!leadMessage) continue;

          // Smart stop: check for rejection
          if (isRejection(leadMessage)) {
            console.log(`[ai-replies] Rejection detected from contact ${cr.contact_id}: "${leadMessage.slice(0, 80)}"`);
            await supabase.from('campaign_connection_requests')
              .update({ conversation_stopped: true, last_incoming_message_at: msgTimestamp, lead_status: 'not_interested' })
              .eq('id', cr.id);
            await supabase.from('contacts')
              .update({ lead_status: 'not_interested' })
              .eq('id', cr.contact_id);
            stopped++;
            continue;
          }

          // Get full contact info
          const { data: contact } = await supabase
            .from('contacts')
            .select('first_name, last_name, company, title, signal, industry, linkedin_url, linkedin_profile_id, signal_post_url, relevance_tier')
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

          // Check for soft rejection (regex-based, 2+ hits in history)
          if (isSoftRejection(conversationHistory)) {
            console.log(`[ai-replies] Soft rejection detected (2+ signals) from contact ${cr.contact_id}`);
            await supabase.from('campaign_connection_requests')
              .update({ conversation_stopped: true, last_incoming_message_at: msgTimestamp, lead_status: 'not_interested' })
              .eq('id', cr.id);
            await supabase.from('contacts')
              .update({ lead_status: 'not_interested' })
              .eq('id', cr.contact_id);
            stopped++;
            continue;
          }

          // ── AI-BASED INTENT CLASSIFICATION ──
          // Catches nuanced rejections that regex misses (e.g., "can you help me find a job?",
          // "I was wondering if you could give me advice", off-topic requests)
          const aiIntent = await classifyLeadIntent(supabaseUrl, supabaseServiceRoleKey, {
            leadMessage,
            conversationHistory,
            companyName: campaign.company_name,
            valueProposition: campaign.value_proposition,
          });

          if (aiIntent === 'stop') {
            console.log(`[ai-replies] 🛑 AI classified as STOP for contact ${cr.contact_id}: "${leadMessage.slice(0, 100)}"`);
            await supabase.from('campaign_connection_requests')
              .update({ conversation_stopped: true, last_incoming_message_at: msgTimestamp, lead_status: 'not_interested' })
              .eq('id', cr.id);
            await supabase.from('contacts')
              .update({ lead_status: 'not_interested' })
              .eq('id', cr.contact_id);
            stopped++;
            continue;
          }

          // ── MEETING INTENT DETECTION ──
          const meetingAgreed = conversationHasMeetingAgreement(conversationHistory, leadMessage);
          let meetingContext = '';

          if (meetingAgreed) {
            console.log(`[ai-replies] 🎯 Meeting intent detected from ${contact.first_name} ${contact.last_name || ''}: "${leadMessage.slice(0, 100)}"`);

            // Parse temporal cue for scheduling
            const followUpDate = parseTemporalCue(leadMessage);

            // Auto-create meeting record
            const scheduledAt = followUpDate || new Date(Date.now() + 24 * 60 * 60 * 1000); // Default: tomorrow
            const { error: meetingErr } = await supabase
              .from('meetings')
              .insert({
                user_id: cr.user_id,
                contact_id: cr.contact_id,
                campaign_id: campaign.id,
                scheduled_at: scheduledAt.toISOString(),
                status: 'scheduled',
                notes: `Auto-detected from conversation. Lead said: "${leadMessage.slice(0, 200)}"`,
              });

            if (meetingErr) {
              console.error(`[ai-replies] Failed to create meeting for ${cr.contact_id}:`, meetingErr);
            } else {
              console.log(`[ai-replies] ✅ Meeting auto-booked for ${contact.first_name} on ${scheduledAt.toISOString()}`);
              meetingsBooked++;

              // Send email notification for meeting booked
              try {
                await supabase.functions.invoke('send-notification-email', {
                  body: {
                    user_id: cr.user_id,
                    title: `🎯 Meeting booked with ${contact.first_name} ${contact.last_name || ''}`,
                    body: `${contact.first_name} from ${contact.company || 'Unknown'} agreed to a meeting. Scheduled for ${scheduledAt.toLocaleDateString()}.`,
                    link: `/contacts`,
                    type: 'meeting',
                  }
                });
              } catch (emailErr) {
                console.error(`[ai-replies] Failed to send meeting email notification:`, emailErr);
              }

              // Update lead status to meeting_booked
              await supabase.from('contacts')
                .update({ lead_status: 'meeting_booked' })
                .eq('id', cr.contact_id);

              await supabase.from('campaign_connection_requests')
                .update({ lead_status: 'meeting_booked' })
                .eq('id', cr.id);
            }

            meetingContext = `MEETING CONFIRMED: The lead has agreed to a meeting/call. Respond warmly confirming the plan. If they mentioned a specific time (${followUpDate ? followUpDate.toISOString() : 'not specified'}), confirm it. Keep it brief and enthusiastic.`;
          }

          // ── TEMPORAL CUE: Set smart follow-up timing ──
          const temporalFollowUp = parseTemporalCue(leadMessage);
          if (temporalFollowUp && !meetingAgreed) {
            // Lead said something like "let's talk next week" without explicit meeting agreement
            await supabase.from('campaign_connection_requests')
              .update({ next_followup_at: temporalFollowUp.toISOString() })
              .eq('id', cr.id);
            console.log(`[ai-replies] ⏰ Smart follow-up set for ${contact.first_name} at ${temporalFollowUp.toISOString()}`);
          }

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
            meetingContext: meetingContext,
          });

          if (!reply.trim() || reply.trim().includes('[STOP]')) {
            if (reply.trim().includes('[STOP]')) {
              console.log(`[ai-replies] 🛑 AI returned [STOP] for contact ${cr.contact_id} — stopping conversation`);
              await supabase.from('campaign_connection_requests')
                .update({ conversation_stopped: true, last_incoming_message_at: msgTimestamp, lead_status: 'not_interested' })
                .eq('id', cr.id);
              await supabase.from('contacts')
                .update({ lead_status: 'not_interested' })
                .eq('id', cr.contact_id);
              stopped++;
            }
            continue;
          }

          const sendRes = await fetch(
            `https://${unipileDsn}/api/v1/chats/${encodeURIComponent(cr.chat_id)}/messages`,
            { method: 'POST', headers: { 'X-API-KEY': unipileApiKey, 'Content-Type': 'application/json', 'Accept': 'application/json' },
              body: JSON.stringify({ text: reply.trim() }) }
          );
          if (!sendRes.ok) { console.error(`[ai-replies] send failed for ${cr.contact_id}:`, sendRes.status); continue; }

          console.log(`[ai-replies] Replied to ${contact.first_name} ${contact.last_name || ''} (reply #${cr.ai_replies_count + 1})${meetingAgreed ? ' [MEETING]' : ''}`);

          // Send email notification for interested leads (AI classified as interested)
          if (aiIntent === 'interested') {
            try {
              await supabase.functions.invoke('send-notification-email', {
                body: {
                  user_id: cr.user_id,
                  title: `🔥 ${contact.first_name} ${contact.last_name || ''} is interested`,
                  body: `${contact.first_name} from ${contact.company || 'Unknown'} showed buying intent: "${leadMessage.slice(0, 150)}"`,
                  link: `/contacts`,
                  type: 'lead',
                }
              });
            } catch (emailErr) {
              console.error(`[ai-replies] Failed to send interested lead email notification:`, emailErr);
            }
          }
          
          const updateData: any = {
            ai_replies_count: cr.ai_replies_count + 1,
            last_incoming_message_at: msgTimestamp,
            last_ai_reply_at: new Date().toISOString(),
          };
          
          // If meeting was booked and lead mentioned a date, set follow-up for that date
          if (meetingAgreed && temporalFollowUp) {
            updateData.next_followup_at = temporalFollowUp.toISOString();
          }
          
          await supabase.from('campaign_connection_requests')
            .update(updateData)
            .eq('id', cr.id);

          const { data: currentCampaign } = await supabase.from('campaigns').select('messages_sent').eq('id', campaign.id).single();
          await supabase.from('campaigns').update({ messages_sent: (currentCampaign?.messages_sent || 0) + 1 }).eq('id', campaign.id);
          replied++;
          await delay(2000 + Math.random() * 2000);
          continue;
        }
      }

      // === CASE 2: No response from lead — send follow-up ===
      const lastReplyAt = cr.last_ai_reply_at ? new Date(cr.last_ai_reply_at) : null;
      const now = Date.now();

      // Smart follow-up: if next_followup_at is set, use that instead of 24h default
      if (cr.next_followup_at) {
        const followUpTime = new Date(cr.next_followup_at);
        if (now < followUpTime.getTime()) {
          // Not yet time for the smart follow-up
          continue;
        }
        // Time has come — clear the next_followup_at and proceed with follow-up
        await supabase.from('campaign_connection_requests')
          .update({ next_followup_at: null })
          .eq('id', cr.id);
        console.log(`[ai-replies] ⏰ Smart follow-up triggered for contact ${cr.contact_id}`);
      } else {
        // Default 24h follow-up logic
        const hoursSinceLastReply = lastReplyAt ? (now - lastReplyAt.getTime()) / (1000 * 60 * 60) : null;
        if (!lastReplyAt || hoursSinceLastReply === null || hoursSinceLastReply < 24) continue;
      }

      // Don't send more than 1 follow-up without a response
      const lastTwoOurs = sortedMessages.slice(0, 2).every((m: any) => m.is_sender || m.sender_id === accountId);
      if (lastTwoOurs) continue;

      const { data: contact } = await supabase
        .from('contacts')
        .select('first_name, last_name, company, title, signal, industry, linkedin_url, linkedin_profile_id, signal_post_url, relevance_tier')
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

      // Check if there's a meeting booked — adjust follow-up context
      const { data: existingMeeting } = await supabase
        .from('meetings')
        .select('id, scheduled_at, status')
        .eq('contact_id', cr.contact_id)
        .eq('user_id', cr.user_id)
        .eq('status', 'scheduled')
        .order('scheduled_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      let meetingContext = '';
      if (existingMeeting) {
        const meetingDate = new Date(existingMeeting.scheduled_at);
        meetingContext = `MEETING SCHEDULED: You have a meeting booked with this lead on ${meetingDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}. This follow-up should gently confirm the meeting or share something useful before it.`;
      }

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
        meetingContext: meetingContext,
      });

      if (!followUp.trim() || followUp.trim().includes('[STOP]')) {
        if (followUp.trim().includes('[STOP]')) {
          console.log(`[ai-replies] 🛑 AI returned [STOP] in follow-up for contact ${cr.contact_id} — stopping`);
          await supabase.from('campaign_connection_requests')
            .update({ conversation_stopped: true, lead_status: 'not_interested' })
            .eq('id', cr.id);
          await supabase.from('contacts')
            .update({ lead_status: 'not_interested' })
            .eq('id', cr.contact_id);
          stopped++;
        }
        continue;
      }

      const sendRes = await fetch(
        `https://${unipileDsn}/api/v1/chats/${encodeURIComponent(cr.chat_id)}/messages`,
        { method: 'POST', headers: { 'X-API-KEY': unipileApiKey, 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ text: followUp.trim() }) }
      );
      if (!sendRes.ok) { console.error(`[ai-replies] follow-up send failed for ${cr.contact_id}:`, sendRes.status); continue; }

      console.log(`[ai-replies] Follow-up sent to ${contact.first_name} ${contact.last_name || ''} (reply #${cr.ai_replies_count + 1})${existingMeeting ? ' [PRE-MEETING]' : ''}`);
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

  return { replied, stopped, meetingsBooked };
}

async function generateConversationalReply(
  supabaseUrl: string,
  serviceRoleKey: string,
  ctx: Record<string, unknown>,
): Promise<string> {
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/generate-step-message`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        isConversationalReply: true,
        conversationHistory: ctx.conversationHistory,
        leadMessage: ctx.leadMessage,
        repliesCount: ctx.repliesCount,
        maxReplies: ctx.maxReplies,
        isFollowUp: ctx.isFollowUp,
        companyName: ctx.companyName,
        valueProposition: ctx.valueProposition,
        campaignGoal: ctx.campaignGoal,
        messageTone: ctx.messageTone,
        industry: ctx.industry,
        language: ctx.language,
        customTraining: ctx.customTraining,
        firstName: ctx.firstName,
        lastName: ctx.lastName,
        leadCompany: ctx.leadCompany,
        leadTitle: ctx.leadTitle,
        buyingSignal: ctx.buyingSignal,
        leadIndustry: ctx.leadIndustry,
        meetingContext: ctx.meetingContext,
      }),
    });

    if (!response.ok) {
      console.error('[ai-replies] generate reply error:', response.status, await response.text());
      return '';
    }

    const data = await response.json();
    const raw = (data?.message || '').trim();
    // Never let [STOP] leak as an actual message — return it as-is for the caller to handle
    return raw;
  } catch (error) {
    console.error('[ai-replies] generate reply failed:', error);
    return '';
  }
}

// ── AI-based intent classifier ──
// Returns 'continue' (proceed with reply) or 'stop' (end conversation)
async function classifyLeadIntent(
  supabaseUrl: string,
  serviceRoleKey: string,
  ctx: { leadMessage: string; conversationHistory: string; companyName?: string; valueProposition?: string },
): Promise<'continue' | 'stop'> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) return 'continue'; // fail open

  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        temperature: 0,
        max_tokens: 20,
        messages: [
          {
            role: 'system',
            content: `You are a sales conversation classifier. Your ONLY job is to determine if the lead's latest message means we should STOP the conversation.

Output EXACTLY one word: "stop" or "continue"

STOP the conversation if the lead:
- Says they're not interested, don't need/want the service, or declines in any way
- Asks for something off-topic (job advice, CV review, career help, personal favors)
- Is looking for a job or asking if you're hiring
- Says they already have a solution or are covered
- Expresses annoyance, asks to stop messaging
- Gives any form of "no" even if polite ("thanks but I'm good", "appreciate it but no")
- Is clearly not a potential buyer for: ${ctx.companyName || 'our service'} (${ctx.valueProposition || 'B2B service'})
- Redirects the conversation away from business (asking for free advice, mentoring, etc.)

CONTINUE ONLY if the lead:
- Shows genuine interest in the product/service
- Asks questions about what you offer
- Agrees to a call or meeting
- Engages in normal professional small talk (early rapport building)
- Shares relevant business challenges`,
          },
          {
            role: 'user',
            content: `Conversation:\n${ctx.conversationHistory}\n\nLead's latest message: "${ctx.leadMessage}"\n\nOutput:`,
          },
        ],
      }),
    });

    if (!response.ok) return 'continue'; // fail open
    const data = await response.json();
    const result = (data.choices?.[0]?.message?.content || '').trim().toLowerCase();
    return result === 'stop' ? 'stop' : 'continue';
  } catch {
    return 'continue'; // fail open
  }
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function jsonRes(data: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
