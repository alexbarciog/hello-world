const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SEQUENCES_PER_DAY = 5;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const UNIPILE_API_KEY = Deno.env.get('UNIPILE_API_KEY');
    const UNIPILE_DSN = Deno.env.get('UNIPILE_DSN');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!UNIPILE_API_KEY) throw new Error('UNIPILE_API_KEY not configured');
    if (!UNIPILE_DSN) throw new Error('UNIPILE_DSN not configured');

    const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get all active campaigns that have a source_list_id
    const { data: campaigns, error: campErr } = await serviceClient
      .from('campaigns')
      .select('id, user_id, source_list_id, daily_connect_limit')
      .eq('status', 'active')
      .not('source_list_id', 'is', null);

    if (campErr) throw new Error(`Failed to fetch campaigns: ${campErr.message}`);
    if (!campaigns || campaigns.length === 0) {
      return jsonResponse({ status: 'no_active_campaigns', processed: 0 });
    }

    let totalSent = 0;

    for (const campaign of campaigns) {
      try {
        const sent = await processCampaign(
          serviceClient,
          campaign,
          UNIPILE_API_KEY,
          UNIPILE_DSN
        );
        totalSent += sent;
      } catch (err) {
        console.error(`[campaign ${campaign.id}] error:`, err);
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

async function processCampaign(
  serviceClient: any,
  campaign: { id: string; user_id: string; source_list_id: string; daily_connect_limit: number },
  unipileApiKey: string,
  unipileDsn: string
): Promise<number> {
  const dailyLimit = campaign.daily_connect_limit || 25;
  const batchSize = Math.max(1, Math.floor(dailyLimit / SEQUENCES_PER_DAY));

  // Get user's Unipile account_id
  const { data: profile } = await serviceClient
    .from('profiles')
    .select('unipile_account_id')
    .eq('user_id', campaign.user_id)
    .single();

  if (!profile?.unipile_account_id) {
    console.log(`[campaign ${campaign.id}] no unipile account, skipping`);
    return 0;
  }

  const accountId = profile.unipile_account_id;

  // Count how many requests were already sent TODAY for this campaign
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  const { count: sentToday } = await serviceClient
    .from('campaign_connection_requests')
    .select('id', { count: 'exact', head: true })
    .eq('campaign_id', campaign.id)
    .gte('sent_at', todayStart.toISOString());

  const remainingToday = Math.max(0, dailyLimit - (sentToday || 0));
  const toSendNow = Math.min(batchSize, remainingToday);

  if (toSendNow === 0) {
    console.log(`[campaign ${campaign.id}] daily limit reached (${sentToday}/${dailyLimit})`);
    return 0;
  }

  // Get contacts from the list that haven't been sent a request yet
  const { data: contactLinks } = await serviceClient
    .from('contact_lists')
    .select('contact_id')
    .eq('list_id', campaign.source_list_id);

  if (!contactLinks || contactLinks.length === 0) {
    console.log(`[campaign ${campaign.id}] no contacts in list`);
    return 0;
  }

  const allContactIds = contactLinks.map((cl: any) => cl.contact_id);

  // Get already-sent contact IDs for this campaign (only exclude successful ones)
  const { data: alreadySent } = await serviceClient
    .from('campaign_connection_requests')
    .select('contact_id, status')
    .eq('campaign_id', campaign.id);

  // Only skip contacts that were successfully sent or accepted — retry skipped/failed ones
  const successSet = new Set(
    (alreadySent || [])
      .filter((r: any) => r.status === 'sent' || r.status === 'accepted' || r.status === 'pending')
      .map((r: any) => r.contact_id)
  );
  const retryContactIds = (alreadySent || [])
    .filter((r: any) => r.status === 'skipped' || r.status === 'failed')
    .map((r: any) => r.contact_id);
  const retrySet = new Set(retryContactIds);
  
  const unseenContactIds = allContactIds.filter((cid: string) => !successSet.has(cid));

  if (unseenContactIds.length === 0) {
    console.log(`[campaign ${campaign.id}] all contacts already processed`);
    return 0;
  }

  // Take only the batch we need
  const batchContactIds = unseenContactIds.slice(0, toSendNow);

  // Fetch contact details (need linkedin_profile_id or linkedin_url)
  const { data: contactsData } = await serviceClient
    .from('contacts')
    .select('id, first_name, last_name, linkedin_profile_id, linkedin_url')
    .in('id', batchContactIds);

  if (!contactsData || contactsData.length === 0) return 0;

  let sentCount = 0;

  for (const contact of contactsData) {
    const isRetry = retrySet.has(contact.id);
    try {
      const publicId = contact.linkedin_profile_id || extractLinkedinId(contact.linkedin_url);
      if (!publicId) {
        console.log(`[campaign ${campaign.id}] contact ${contact.id} has no linkedin ID, skipping`);
        if (!isRetry) {
          await serviceClient.from('campaign_connection_requests').insert({
            campaign_id: campaign.id,
            contact_id: contact.id,
            user_id: campaign.user_id,
            status: 'skipped',
          });
        }
        continue;
      }

      // Step 1: Resolve public identifier to Unipile provider_id
      const resolveRes = await fetch(
        `https://${unipileDsn}/api/v1/users/${encodeURIComponent(publicId)}?account_id=${accountId}`,
        { headers: { 'X-API-KEY': unipileApiKey, 'Accept': 'application/json' } }
      );
      const resolveData = await resolveRes.json();

      if (!resolveRes.ok || !resolveData.provider_id) {
        console.error(`[campaign ${campaign.id}] resolve failed for ${contact.id} (${publicId}):`, resolveRes.status, JSON.stringify(resolveData));
        if (!isRetry) {
          await serviceClient.from('campaign_connection_requests').insert({
            campaign_id: campaign.id,
            contact_id: contact.id,
            user_id: campaign.user_id,
            status: 'failed',
          });
        }
        continue;
      }

      const providerId = resolveData.provider_id;

      // Step 2: Send invitation via Unipile with the resolved provider_id
      const inviteRes = await fetch(`https://${unipileDsn}/api/v1/users/invite`, {
        method: 'POST',
        headers: {
          'X-API-KEY': unipileApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          account_id: accountId,
          provider_id: providerId,
        }),
      });

      const inviteData = await inviteRes.json();

      if (!inviteRes.ok) {
        console.error(`[campaign ${campaign.id}] invite failed for ${contact.id}:`, inviteRes.status, JSON.stringify(inviteData));
        if (isRetry) {
          await serviceClient.from('campaign_connection_requests')
            .update({ status: 'failed', sent_at: new Date().toISOString() })
            .eq('campaign_id', campaign.id)
            .eq('contact_id', contact.id);
        } else {
          await serviceClient.from('campaign_connection_requests').insert({
            campaign_id: campaign.id,
            contact_id: contact.id,
            user_id: campaign.user_id,
            status: 'failed',
          });
        }
        continue;
      }

      // Record successful send (update if retry, insert if new)
      if (isRetry) {
        await serviceClient.from('campaign_connection_requests')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
            unipile_request_id: inviteData.request_id || inviteData.id || null,
          })
          .eq('campaign_id', campaign.id)
          .eq('contact_id', contact.id);
      } else {
        await serviceClient.from('campaign_connection_requests').insert({
          campaign_id: campaign.id,
          contact_id: contact.id,
          user_id: campaign.user_id,
          status: 'sent',
          unipile_request_id: inviteData.request_id || inviteData.id || null,
        });
      }

      sentCount++;

      // Small delay between requests to avoid rate limiting (2-4 seconds random)
      await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 2000));
    } catch (err) {
      console.error(`[campaign ${campaign.id}] error sending to ${contact.id}:`, err);
    }
  }

  // Update campaign invitations_sent counter
  if (sentCount > 0) {
    const { data: currentCampaign } = await serviceClient
      .from('campaigns')
      .select('invitations_sent')
      .eq('id', campaign.id)
      .single();

    await serviceClient
      .from('campaigns')
      .update({ invitations_sent: (currentCampaign?.invitations_sent || 0) + sentCount })
      .eq('id', campaign.id);
  }

  console.log(`[campaign ${campaign.id}] sent ${sentCount} invitations (batch of ${toSendNow})`);
  return sentCount;
}

function extractLinkedinId(url: string | null): string | null {
  if (!url) return null;
  // Extract profile ID from LinkedIn URL like linkedin.com/in/username
  const match = url.match(/linkedin\.com\/in\/([^\/\?]+)/);
  return match ? match[1] : null;
}

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
