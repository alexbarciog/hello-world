const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

      // No account_id — list all accounts and find one tagged with this userId
      const listRes = await fetch(`https://${UNIPILE_DSN}/api/v1/accounts`, {
        headers: { 'X-API-KEY': UNIPILE_API_KEY },
      });
      const listData = await listRes.json();
      const accounts = listData.items || listData || [];

      // Find a LinkedIn account that was recently created (or tagged with user name)
      const linkedinAccount = accounts.find((acc: any) =>
        (acc.type === 'LINKEDIN' || acc.provider === 'LINKEDIN') &&
        (acc.name === userId || acc.connection_params?.name === userId) &&
        (acc.status === 'OK' || acc.status === 'CONNECTED')
      );

      if (linkedinAccount) {
        const accId = linkedinAccount.id || linkedinAccount.account_id;
        await saveAccountId(userId, accId);
        return new Response(JSON.stringify({ status: 'connected', account_id: accId }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
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
