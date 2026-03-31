const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SEQUENCES_PER_DAY = 20;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Business-hours guard: only send between 08:00–18:00 UTC
    const currentHour = new Date().getUTCHours();
    if (currentHour < 8 || currentHour >= 18) {
      return jsonResponse({ status: 'outside_business_hours', hour: currentHour });
    }

    const UNIPILE_API_KEY = Deno.env.get('UNIPILE_API_KEY');
    const UNIPILE_DSN = Deno.env.get('UNIPILE_DSN');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!UNIPILE_API_KEY) throw new Error('UNIPILE_API_KEY not configured');
    if (!UNIPILE_DSN) throw new Error('UNIPILE_DSN not configured');

    const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const today = new Date().toISOString().split('T')[0];

    // Get pending connection entries from daily_scheduled_leads for today
    const { data: scheduledLeads, error: slErr } = await serviceClient
      .from('daily_scheduled_leads')
      .select('id, campaign_id, contact_id, user_id')
      .eq('scheduled_date', today)
      .eq('action_type', 'connection')
      .eq('status', 'pending');

    if (slErr) throw new Error(`Failed to fetch scheduled leads: ${slErr.message}`);
    if (!scheduledLeads || scheduledLeads.length === 0) {
      return jsonResponse({ status: 'no_pending_connections', processed: 0 });
    }

    // Group by campaign
    const byCampaign: Record<string, typeof scheduledLeads> = {};
    for (const sl of scheduledLeads) {
      if (!byCampaign[sl.campaign_id]) byCampaign[sl.campaign_id] = [];
      byCampaign[sl.campaign_id].push(sl);
    }

    let totalSent = 0;

    for (const [campaignId, leads] of Object.entries(byCampaign)) {
      try {
        // Get campaign daily limit
        const { data: campaign } = await serviceClient
          .from('campaigns')
          .select('daily_connect_limit, user_id')
          .eq('id', campaignId)
          .eq('status', 'active')
          .single();

        if (!campaign) {
          console.log(`[send-conn] campaign ${campaignId} not active, skipping`);
          continue;
        }

        const dailyLimit = campaign.daily_connect_limit || 25;
        const batchSize = Math.max(1, Math.floor(dailyLimit / SEQUENCES_PER_DAY));

        // Count how many were already sent today
        const { count: sentToday } = await serviceClient
          .from('daily_scheduled_leads')
          .select('id', { count: 'exact', head: true })
          .eq('campaign_id', campaignId)
          .eq('scheduled_date', today)
          .eq('action_type', 'connection')
          .eq('status', 'sent');

        const remainingToday = Math.max(0, dailyLimit - (sentToday || 0));
        const toSendNow = Math.min(batchSize, remainingToday, leads.length);

        if (toSendNow === 0) {
          console.log(`[send-conn] campaign ${campaignId} daily limit reached`);
          continue;
        }

        // Get user's Unipile account_id
        const { data: profile } = await serviceClient
          .from('profiles')
          .select('unipile_account_id')
          .eq('user_id', campaign.user_id)
          .single();

        if (!profile?.unipile_account_id) {
          console.log(`[send-conn] campaign ${campaignId} no unipile account, skipping`);
          continue;
        }

        const accountId = profile.unipile_account_id;
        let sentThisBatch = 0;

        for (const sl of leads) {
          if (sentThisBatch >= toSendNow) break;
          try {
            const { data: contact } = await serviceClient
              .from('contacts')
              .select('id, first_name, last_name, linkedin_profile_id, linkedin_url')
              .eq('id', sl.contact_id)
              .single();

            if (!contact) {
              await updateScheduledStatus(serviceClient, sl.id, 'skipped');
              continue;
            }

            const publicId = contact.linkedin_profile_id || extractLinkedinId(contact.linkedin_url);
            if (!publicId) {
              console.log(`[send-conn] contact ${contact.id} has no linkedin ID, skipping`);
              await updateScheduledStatus(serviceClient, sl.id, 'skipped');
              // Also record in campaign_connection_requests
              await serviceClient.from('campaign_connection_requests').insert({
                campaign_id: campaignId,
                contact_id: contact.id,
                user_id: sl.user_id,
                status: 'skipped',
              });
              continue;
            }

            // Step 1: Resolve public identifier to Unipile provider_id
            const resolveRes = await fetch(
              `https://${UNIPILE_DSN}/api/v1/users/${encodeURIComponent(publicId)}?account_id=${accountId}`,
              { headers: { 'X-API-KEY': UNIPILE_API_KEY, 'Accept': 'application/json' } }
            );
            const resolveData = await resolveRes.json();

            if (!resolveRes.ok || !resolveData.provider_id) {
              console.error(`[send-conn] resolve failed for ${contact.id} (${publicId}):`, resolveRes.status);
              await updateScheduledStatus(serviceClient, sl.id, 'failed');
              await serviceClient.from('campaign_connection_requests').insert({
                campaign_id: campaignId,
                contact_id: contact.id,
                user_id: sl.user_id,
                status: 'failed',
              });
              continue;
            }

            const providerId = resolveData.provider_id;

            // Step 2: Send invitation via Unipile
            const inviteRes = await fetch(`https://${UNIPILE_DSN}/api/v1/users/invite`, {
              method: 'POST',
              headers: {
                'X-API-KEY': UNIPILE_API_KEY,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                account_id: accountId,
                provider_id: providerId,
              }),
            });

            const inviteData = await inviteRes.json();

            if (!inviteRes.ok) {
              console.error(`[send-conn] invite failed for ${contact.id}:`, inviteRes.status);
              await updateScheduledStatus(serviceClient, sl.id, 'failed');
              await serviceClient.from('campaign_connection_requests').insert({
                campaign_id: campaignId,
                contact_id: contact.id,
                user_id: sl.user_id,
                status: 'failed',
              });
              continue;
            }

            // Record successful send
            await updateScheduledStatus(serviceClient, sl.id, 'sent');
            await serviceClient.from('campaign_connection_requests').insert({
              campaign_id: campaignId,
              contact_id: contact.id,
              user_id: sl.user_id,
              status: 'sent',
              unipile_request_id: inviteData.request_id || inviteData.id || null,
            });

            totalSent++;

            // Small delay between requests
            await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 2000));
          } catch (err) {
            console.error(`[send-conn] error sending to ${sl.contact_id}:`, err);
            await updateScheduledStatus(serviceClient, sl.id, 'failed');
          }
        }

        // Update campaign invitations_sent counter
        if (totalSent > 0) {
          const { data: currentCampaign } = await serviceClient
            .from('campaigns')
            .select('invitations_sent')
            .eq('id', campaignId)
            .single();

          await serviceClient
            .from('campaigns')
            .update({ invitations_sent: (currentCampaign?.invitations_sent || 0) + totalSent })
            .eq('id', campaignId);
        }
      } catch (err) {
        console.error(`[send-conn] campaign ${campaignId} error:`, err);
      }
    }

    return jsonResponse({ status: 'ok', total_sent: totalSent });
  } catch (error) {
    console.error('send-connection-requests error:', error);
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      500
    );
  }
});

async function updateScheduledStatus(client: any, id: string, status: string) {
  await client
    .from('daily_scheduled_leads')
    .update({
      status,
      sent_at: status === 'sent' ? new Date().toISOString() : null,
    })
    .eq('id', id);
}

function extractLinkedinId(url: string | null): string | null {
  if (!url) return null;
  const match = url.match(/linkedin\.com\/in\/([^\/\?]+)/);
  return match ? match[1] : null;
}

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
