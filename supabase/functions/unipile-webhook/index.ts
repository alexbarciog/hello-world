/**
 * unipile-webhook — real-time LinkedIn events from Unipile.
 *
 * Replaces polling as the primary detector for:
 *  - new_relation (source "users"):   invitation accepted → mark the matching
 *    campaign_connection_requests row accepted; the followups cron generates
 *    and sends the next message on its normal (budgeted) schedule
 *  - message_received (source "messaging"): lead replied → stamp
 *    last_incoming_message_at so step advancement stops and the
 *    Conversational AI SDR takes over
 *
 * The acceptance-check rotation in process-campaign-followups stays as a
 * backstop for events missed while a webhook was unregistered.
 *
 * Auth: Unipile is registered (see connect-linkedin ensureWebhooks) to send a
 * custom header X-Intentsly-Secret matching the UNIPILE_WEBHOOK_SECRET env.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-intentsly-secret',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const expected = Deno.env.get('UNIPILE_WEBHOOK_SECRET') || '';
    const provided = req.headers.get('x-intentsly-secret') || '';
    if (!expected || provided !== expected) {
      return json({ error: 'unauthorized' }, 401);
    }

    const payload = await req.json().catch(() => ({}));
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const event = (payload.event || payload.type || '').toString();
    const accountId = payload.account_id || payload.accountId || null;
    console.log(`[unipile-webhook] event=${event} account=${accountId}`);

    if (!accountId) return json({ ok: true, ignored: 'no account_id' });

    // Resolve the owning user
    const { data: prof } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('unipile_account_id', accountId)
      .maybeSingle();
    if (!prof?.user_id) return json({ ok: true, ignored: 'unknown account' });
    const userId = prof.user_id;

    // ── Invitation accepted ──────────────────────────────────────────────
    if (/new_relation/i.test(event)) {
      const ids = [
        payload.user_provider_id,
        payload.user_public_identifier,
        payload.user_id,
        payload.provider_id,
        payload.public_identifier,
      ].filter((v: unknown) => typeof v === 'string' && v) as string[];
      if (ids.length === 0) return json({ ok: true, ignored: 'no relation ids' });

      const { data: contacts } = await supabase
        .from('contacts')
        .select('id')
        .eq('user_id', userId)
        .in('linkedin_profile_id', ids)
        .limit(2);
      if (!contacts?.length) return json({ ok: true, ignored: 'no matching contact' });

      const contactIds = contacts.map((c: any) => c.id);
      const { data: updated } = await supabase
        .from('campaign_connection_requests')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString(),
          current_step: 1,
          step_completed_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .in('contact_id', contactIds)
        .eq('status', 'sent')
        .select('id');

      console.log(`[unipile-webhook] new_relation → ${updated?.length || 0} request(s) marked accepted`);
      return json({ ok: true, accepted: updated?.length || 0 });
    }

    // ── Incoming message from a lead ─────────────────────────────────────
    if (/message_received|message\.received|new_message/i.test(event)) {
      // Ignore messages sent BY the account owner
      const sender = payload.sender || payload.from || {};
      const senderId = (sender.attendee_provider_id || sender.provider_id || sender.id || '').toString();
      const accountOwnerIds = [payload.account_info?.user_id, payload.account_info?.provider_id]
        .filter(Boolean).map(String);
      if (senderId && accountOwnerIds.includes(senderId)) {
        return json({ ok: true, ignored: 'own message' });
      }

      const chatId = (payload.chat_id || payload.chatId || '').toString();
      const now = new Date().toISOString();
      let matched = 0;

      if (chatId) {
        const { data: updated } = await supabase
          .from('campaign_connection_requests')
          .update({ last_incoming_message_at: now })
          .eq('user_id', userId)
          .eq('chat_id', chatId)
          .is('last_incoming_message_at', null)
          .select('id');
        matched = updated?.length || 0;
      }

      // Fallback: match by the sender's provider id via contacts
      if (matched === 0 && senderId) {
        const { data: contacts } = await supabase
          .from('contacts')
          .select('id')
          .eq('user_id', userId)
          .eq('linkedin_profile_id', senderId)
          .limit(1);
        if (contacts?.length) {
          const { data: updated } = await supabase
            .from('campaign_connection_requests')
            .update({ last_incoming_message_at: now, ...(chatId ? { chat_id: chatId } : {}) })
            .eq('user_id', userId)
            .eq('contact_id', contacts[0].id)
            .is('last_incoming_message_at', null)
            .select('id');
          matched = updated?.length || 0;
        }
      }

      console.log(`[unipile-webhook] message_received → ${matched} request(s) marked replied`);
      return json({ ok: true, replied: matched });
    }

    return json({ ok: true, ignored: event || 'unknown event' });
  } catch (e) {
    console.error('[unipile-webhook] error:', e);
    return json({ error: e instanceof Error ? e.message : 'Unknown' }, 500);
  }
});
