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
    if (!UNIPILE_API_KEY) throw new Error('UNIPILE_API_KEY not configured');
    if (!UNIPILE_DSN) throw new Error('UNIPILE_DSN not configured');

    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = user.id;
    const body = await req.json();
    const { action } = body;

    // ── Action: create hosted auth link ───────────────────────────────────
    if (action === 'create_link') {
      const { notify_url } = body;

      const expiresOn = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 min

      const linkRes = await fetch(`https://${UNIPILE_DSN}/api/v1/hosted/accounts/link`, {
        method: 'POST',
        headers: { 'X-API-KEY': UNIPILE_API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'create',
          providers: ['LINKEDIN'],
          api_url: `https://${UNIPILE_DSN}`,
          expiresOn,
          notify_url: notify_url || undefined,
          name: userId, // tag with user id for identification
        }),
      });

      const linkData = await linkRes.json();

      if (!linkRes.ok) {
        console.error('Unipile hosted link error:', linkRes.status, JSON.stringify(linkData));
        throw new Error(linkData.message || linkData.error || `Unipile error: ${linkRes.status}`);
      }

      return new Response(JSON.stringify({
        status: 'link_created',
        url: linkData.url,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ── Action: check status (poll for connection) ────────────────────────
    if (action === 'check_status') {
      const { account_id } = body;

      // If we have a specific account_id, check its status
      if (account_id) {
        const statusRes = await fetch(`https://${UNIPILE_DSN}/api/v1/accounts/${account_id}`, {
          headers: { 'X-API-KEY': UNIPILE_API_KEY },
        });
        const statusData = await statusRes.json();
        const accountStatus = statusData.status || statusData.connection_status;

        if (accountStatus === 'OK' || accountStatus === 'CONNECTED') {
          await saveAccountId(userId, account_id);
          return new Response(JSON.stringify({ status: 'connected', account_id }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify({ status: 'pending', account_status: accountStatus }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // No account_id — list all accounts and find a LinkedIn one for this user
      const listRes = await fetch(`https://${UNIPILE_DSN}/api/v1/accounts`, {
        headers: { 'X-API-KEY': UNIPILE_API_KEY },
      });
      const listData = await listRes.json();
      const accounts = listData.items || listData || [];

      console.log(`[check_status] userId=${userId}, total accounts=${accounts.length}`);

      // Try to find a LinkedIn account that matches this user
      // Check multiple possible fields where name/userId might be stored
      let linkedinAccount = null;

      for (const acc of accounts) {
        const isLinkedIn = acc.type === 'LINKEDIN' || acc.provider === 'LINKEDIN';
        const isOkStatus = acc.status === 'OK' || acc.status === 'CONNECTED' || acc.connection_status === 'OK';
        
        if (!isLinkedIn || !isOkStatus) continue;

        // Check various name fields where userId might be stored
        const nameMatch = 
          acc.name === userId ||
          acc.connection_params?.name === userId ||
          acc.identifier === userId ||
          acc.custom_name === userId;

        if (nameMatch) {
          linkedinAccount = acc;
          break;
        }
      }

      // If no match by name, check if there's any recently created LinkedIn account
      // (within the last 5 minutes) that isn't already assigned to another user
      if (!linkedinAccount) {
        const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
        
        for (const acc of accounts) {
          const isLinkedIn = acc.type === 'LINKEDIN' || acc.provider === 'LINKEDIN';
          const isOkStatus = acc.status === 'OK' || acc.status === 'CONNECTED' || acc.connection_status === 'OK';
          const createdAt = acc.created_at || acc.createdAt || acc.created;
          
          if (!isLinkedIn || !isOkStatus) continue;
          
          if (createdAt && createdAt > fiveMinAgo) {
            // Check if this account is already saved by another user
            const serviceClient = createClient(
              Deno.env.get('SUPABASE_URL')!,
              Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
            );
            const accId = acc.id || acc.account_id;
            const { data: existingProfile } = await serviceClient
              .from('profiles')
              .select('user_id')
              .eq('unipile_account_id', accId)
              .single();

            if (!existingProfile) {
              linkedinAccount = acc;
              console.log(`[check_status] Found recent unassigned LinkedIn account: ${accId}, created: ${createdAt}`);
              break;
            }
          }
        }
      }

      if (linkedinAccount) {
        const accId = linkedinAccount.id || linkedinAccount.account_id;
        console.log(`[check_status] Match found! accId=${accId}`);
        await saveAccountId(userId, accId);
        return new Response(JSON.stringify({ status: 'connected', account_id: accId }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Log first account for debugging if no match found
      if (accounts.length > 0) {
        const sample = accounts[0];
        console.log(`[check_status] No match. Sample account keys: ${Object.keys(sample).join(', ')}, name: ${sample.name}, type: ${sample.type}, status: ${sample.status}`);
      }

      return new Response(JSON.stringify({ status: 'pending' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('connect-linkedin error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function saveAccountId(userId: string, accountId: string) {
  const serviceClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
  const { error } = await serviceClient
    .from('profiles')
    .update({ unipile_account_id: accountId })
    .eq('user_id', userId);
  if (error) throw new Error(`Failed to save account: ${error.message}`);
}
