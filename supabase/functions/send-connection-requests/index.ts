const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SEQUENCES_PER_DAY = 20; // 20 x 30-min slots between 08:00-18:00

// Returns the local hour (0-23) in the given IANA timezone, or null if invalid.
function getHourInTimezone(tz: string): number | null {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour: 'numeric',
      hour12: false,
    }).formatToParts(new Date());
    const h = parts.find(p => p.type === 'hour')?.value;
    if (h === undefined) return null;
    const n = parseInt(h, 10);
    // Intl can return 24 for midnight in some runtimes — normalize.
    return Number.isFinite(n) ? n % 24 : null;
  } catch {
    return null;
  }
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
        // Get campaign and user profile limits
        const { data: campaign } = await serviceClient
          .from('campaigns')
          .select('daily_connect_limit, user_id, exclude_first_degree, timezone, workflow_steps')
          .eq('id', campaignId)
          .eq('status', 'active')
          .single();

        if (!campaign) {
          console.log(`[send-conn] campaign ${campaignId} not active, skipping`);
          continue;
        }

        // Per-campaign business-hours guard: only send between 08:00–18:00
        // in the campaign's local timezone (defaults to UTC).
        const tz = (campaign as any).timezone || 'UTC';
        const localHour = getHourInTimezone(tz);
        if (localHour === null) {
          console.warn(`[send-conn] campaign ${campaignId} invalid timezone "${tz}", falling back to UTC`);
        }
        const hourToCheck = localHour ?? new Date().getUTCHours();
        if (hourToCheck < 8 || hourToCheck >= 18) {
          console.log(`[send-conn] campaign ${campaignId} outside business hours (local hour=${hourToCheck}, tz=${tz})`);
          continue;
        }

        const excludeFirstDegree = campaign.exclude_first_degree !== false; // default true

        // Use profile daily_connections_limit as the authoritative cap
        const { data: userProfile } = await serviceClient
          .from('profiles')
          .select('daily_connections_limit')
          .eq('user_id', campaign.user_id)
          .single();

        const dailyLimit = userProfile?.daily_connections_limit || 25;
        const batchSize = Math.max(1, Math.ceil(dailyLimit / SEQUENCES_PER_DAY));

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
              .select('id, first_name, last_name, linkedin_profile_id, linkedin_url, company, signal, signal_post_url')
              .eq('id', sl.contact_id)
              .single();

            if (!contact) {
              await updateScheduledStatus(serviceClient, sl.id, 'skipped', 'Contact record no longer exists');
              continue;
            }

            // Company pages can never receive connection invites — permanent skip.
            if ((contact.linkedin_url || '').includes('/company/')) {
              const reason = 'Company page — LinkedIn company profiles cannot receive connection invites';
              console.log(`[send-conn] contact ${contact.id} is a company page, skipping`);
              await updateScheduledStatus(serviceClient, sl.id, 'skipped', reason);
              await insertConnReq(serviceClient, {
                campaign_id: campaignId,
                contact_id: contact.id,
                user_id: sl.user_id,
                status: 'skipped_company',
                error_reason: reason,
              });
              continue;
            }

            const publicId = contact.linkedin_profile_id || extractLinkedinId(contact.linkedin_url);
            if (!publicId) {
              const reason = 'No LinkedIn profile URL on this lead';
              console.log(`[send-conn] contact ${contact.id} has no linkedin ID, skipping`);
              await updateScheduledStatus(serviceClient, sl.id, 'skipped', reason);
              await insertConnReq(serviceClient, {
                campaign_id: campaignId,
                contact_id: contact.id,
                user_id: sl.user_id,
                status: 'skipped',
                error_reason: reason,
              });
              continue;
            }

            // Step 1: Resolve public identifier to Unipile provider_id (also reveals network distance)
            const resolveRes = await fetch(
              `https://${UNIPILE_DSN}/api/v1/users/${encodeURIComponent(publicId)}?account_id=${accountId}`,
              { headers: { 'X-API-KEY': UNIPILE_API_KEY, 'Accept': 'application/json' } }
            );
            const resolveRaw = await resolveRes.text();
            let resolveData: any = {};
            try { resolveData = JSON.parse(resolveRaw); } catch { /* non-JSON error body */ }

            if (!resolveRes.ok || !resolveData.provider_id) {
              const detail = (resolveData?.title || resolveData?.detail || resolveData?.type || resolveRaw || '').toString().slice(0, 160);
              // "Recipient cannot be reached" = the /in/ slug doesn't resolve to a
              // person (company page saved as a lead, or deactivated profile).
              // Permanent — mark terminally so it stops being retried every day.
              const unreachable = resolveRes.status === 422 && /cannot be reached/i.test(detail);
              const reason = unreachable
                ? 'Profile unreachable — likely a company page or deactivated account'
                : `Profile lookup failed (HTTP ${resolveRes.status})${detail ? `: ${detail}` : ''}`;
              console.error(`[send-conn] resolve failed for ${contact.id} (${publicId}):`, resolveRes.status, detail);
              await updateScheduledStatus(serviceClient, sl.id, unreachable ? 'skipped' : 'failed', reason);
              await insertConnReq(serviceClient, {
                campaign_id: campaignId,
                contact_id: contact.id,
                user_id: sl.user_id,
                status: unreachable ? 'skipped_unreachable' : 'failed',
                error_reason: reason,
              });
              continue;
            }

            // Persist the freshly resolved network distance on the contact so
            // schedule-daily-leads can exclude known 1st-degrees BEFORE they are
            // ever scheduled again. Fail-open (column may not exist yet).
            try {
              const resolvedDistance = resolveData.network_distance
                ? String(resolveData.network_distance)
                : (isFirstDegree(resolveData) ? 'FIRST_DEGREE' : null);
              if (resolvedDistance) {
                await serviceClient.from('contacts').update({ network_distance: resolvedDistance }).eq('id', contact.id);
              }
            } catch (e) {
              console.warn(`[send-conn] network_distance persist failed for ${contact.id}:`, e instanceof Error ? e.message : e);
            }

            // Guard: if Exclude 1st degree connections is enabled and this profile is already
            // in the user's network (BEFORE the campaign sent any invite), skip entirely.
            // This is safe — we only reach this code when no invite has been sent yet for this lead.
            if (excludeFirstDegree && isFirstDegree(resolveData)) {
              const reason = 'Already a 1st-degree connection (excluded by campaign setting)';
              console.log(`[send-conn] contact ${contact.id} already 1st degree, skipping per campaign setting`);
              await updateScheduledStatus(serviceClient, sl.id, 'skipped', reason);
              await insertConnReq(serviceClient, {
                campaign_id: campaignId,
                contact_id: contact.id,
                user_id: sl.user_id,
                status: 'skipped_already_connected',
                error_reason: reason,
              });
              continue;
            }

            const providerId = resolveData.provider_id;


            // ── Pre-invitation Comment/Like steps ─────────────────────────
            // Run any workflow steps marked `before_invitation: true` inline
            // before sending the invite. Skips silently on failure.
            const preSteps = ((campaign as any).workflow_steps || [])
              .filter((s: any) => s?.before_invitation && (s.type === 'like' || s.type === 'comment'));
            for (const preStep of preSteps) {
              const fnName = preStep.type === 'like' ? 'execute-like-step' : 'execute-comment-step';
              try {
                await fetch(`${SUPABASE_URL}/functions/v1/${fnName}`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                  },
                  body: JSON.stringify({
                    inline: true,
                    account_id: accountId,
                    step: preStep,
                    contact: {
                      id: contact.id,
                      first_name: contact.first_name,
                      company: (contact as any).company,
                      signal: (contact as any).signal,
                      signal_post_url: (contact as any).signal_post_url,
                    },
                  }),
                });
                await new Promise(r => setTimeout(r, 1500));
              } catch (e) {
                console.error(`[send-conn] pre-invite ${preStep.type} failed for ${contact.id}:`, e);
              }
            }

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

            const inviteRaw = await inviteRes.text();
            let inviteData: any = {};
            try { inviteData = JSON.parse(inviteRaw); } catch { /* non-JSON error body */ }

            if (!inviteRes.ok) {
              const detail = [inviteData?.title, inviteData?.detail, inviteData?.type]
                .filter(Boolean).join(' — ') || inviteRaw.slice(0, 160);

              // LinkedIn already has a pending invitation for this person (e.g. a
              // previous run sent it but crashed before recording). Not a failure:
              // record as sent so acceptance tracking takes over instead of
              // retrying and failing daily.
              if (/already_invited_recently|already been sent recently/i.test(detail)) {
                console.log(`[send-conn] invite already pending for ${contact.id} — recording as sent`);
                await updateScheduledStatus(serviceClient, sl.id, 'sent');
                await insertConnReq(serviceClient, {
                  campaign_id: campaignId,
                  contact_id: contact.id,
                  user_id: sl.user_id,
                  status: 'sent',
                  error_reason: 'Invitation was already pending on LinkedIn (sent by an earlier run)',
                });
                continue;
              }

              const reason = `Invite failed (HTTP ${inviteRes.status})${detail ? `: ${detail.slice(0, 200)}` : ''}`;
              console.error(`[send-conn] invite failed for ${contact.id}:`, inviteRes.status, detail);
              await updateScheduledStatus(serviceClient, sl.id, 'failed', reason);
              await insertConnReq(serviceClient, {
                campaign_id: campaignId,
                contact_id: contact.id,
                user_id: sl.user_id,
                status: 'failed',
                error_reason: reason,
              });
              continue;
            }

            // Record successful send (upsert: a previous failed attempt may have
            // left a row — a plain insert would silently collide and the sent
            // invite would never be recorded, causing daily re-sends).
            await updateScheduledStatus(serviceClient, sl.id, 'sent');
            await insertConnReq(serviceClient, {
              campaign_id: campaignId,
              contact_id: contact.id,
              user_id: sl.user_id,
              status: 'sent',
              sent_at: new Date().toISOString(),
              unipile_request_id: inviteData.request_id || inviteData.id || null,
            });

            totalSent++;
            sentThisBatch++;

            // Small delay between requests
            await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 2000));
          } catch (err) {
            console.error(`[send-conn] error sending to ${sl.contact_id}:`, err);
            const reason = `Unexpected error: ${(err instanceof Error ? err.message : String(err)).slice(0, 180)}`;
            await updateScheduledStatus(serviceClient, sl.id, 'failed', reason);
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

async function updateScheduledStatus(client: any, id: string, status: string, reason?: string) {
  const payload: Record<string, unknown> = {
    status,
    sent_at: status === 'sent' ? new Date().toISOString() : null,
    error_reason: reason ?? null,
  };
  let { error } = await client.from('daily_scheduled_leads').update(payload).eq('id', id);
  // Fail-open if the error_reason migration hasn't been applied yet.
  if (error && /error_reason/i.test(error.message || '')) {
    delete payload.error_reason;
    ({ error } = await client.from('daily_scheduled_leads').update(payload).eq('id', id));
  }
  if (error) console.error('[send-conn] updateScheduledStatus error:', error.message);
}

/**
 * Record a campaign_connection_requests outcome. The table has a UNIQUE
 * (campaign_id, contact_id) constraint and retried contacts already have a row
 * from a previous attempt — a plain insert fails silently and the status stays
 * frozen at the first failure forever. Upsert so retries update the outcome.
 * Falls back without error_reason if that migration hasn't been applied.
 */
async function insertConnReq(client: any, row: Record<string, unknown>) {
  let { error } = await client
    .from('campaign_connection_requests')
    .upsert(row, { onConflict: 'campaign_id,contact_id' });
  if (error && /error_reason/i.test(error.message || '')) {
    const { error_reason: _dropped, ...rest } = row;
    ({ error } = await client
      .from('campaign_connection_requests')
      .upsert(rest, { onConflict: 'campaign_id,contact_id' }));
  }
  if (error) console.error('[send-conn] insertConnReq error:', error.message);
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

// Detect if a Unipile profile response indicates the user is already a 1st-degree connection.
// Mirrors the heuristic used in process-campaign-followups.
function isFirstDegree(p: any): boolean {
  if (!p) return false;
  if (p.network_distance === 1 || p.network_distance === '1' || p.network_distance === 'FIRST_DEGREE' || p.network_distance === 'first_degree') return true;
  if (p.is_connection === true || p.is_connection === 'true') return true;
  if (p.relation_type === 'FIRST_DEGREE' || p.relation_type === 'first_degree') return true;
  if (p.distance === 'DISTANCE_1' || p.distance === 1 || p.distance === '1') return true;
  if (p.connection_degree === 1 || p.connection_degree === '1' || p.connection_degree === '1st') return true;
  if (p.network === 'FIRST' || p.network === 'first' || p.network === 1) return true;
  if (p.degree === 1 || p.degree === '1' || p.degree === 'FIRST') return true;
  if (p.connected === true || p.connected === 'true') return true;
  if (p.is_first_degree === true || p.is_first_degree === 'true') return true;
  if (p.member_distance?.value === 'DISTANCE_1') return true;
  if (p.connection_status === 'CONNECTED' || p.connection_status === 'connected') return true;
  if (p.network?.distance === 'FIRST' || p.network?.distance === 1 || p.network?.distance === '1') return true;
  if (p.connection?.type === 'FIRST_DEGREE') return true;
  return false;
}
