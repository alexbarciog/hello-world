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

    const { data: claims, error: claimsErr } = await supabase.auth.getClaims(
      authHeader.replace('Bearer ', '')
    );
    if (claimsErr || !claims?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = claims.claims.sub;
    const body = await req.json();
    const { action } = body;

    // ── Action: solve checkpoint ──────────────────────────────────────────
    if (action === 'solve_checkpoint') {
      const { account_id, code } = body;
      if (!account_id || !code) {
        return new Response(JSON.stringify({ error: 'account_id and code are required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const solveRes = await fetch(`https://${UNIPILE_DSN}/api/v1/accounts/checkpoint`, {
        method: 'POST',
        headers: { 'X-API-KEY': UNIPILE_API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ account_id, code }),
      });

      const solveData = await solveRes.json();

      if (solveRes.status === 202) {
        // Another checkpoint
        return new Response(JSON.stringify({
          status: 'checkpoint',
          checkpoint_type: solveData.checkpoint?.type || solveData.type || 'UNKNOWN',
          account_id: solveData.account_id || account_id,
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      if (!solveRes.ok) {
        console.error('Checkpoint solve error:', solveRes.status, JSON.stringify(solveData));
        throw new Error(solveData.message || solveData.error || `Checkpoint error: ${solveRes.status}`);
      }

      // Success — save account
      const finalAccountId = solveData.account_id || solveData.id || account_id;
      await saveAccountId(userId, finalAccountId);

      return new Response(JSON.stringify({ status: 'connected', account_id: finalAccountId }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── Action: check status (for IN_APP_VALIDATION polling) ─────────────
    if (action === 'check_status') {
      const { account_id } = body;
      if (!account_id) {
        return new Response(JSON.stringify({ error: 'account_id is required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

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

    // ── Default action: connect with li_at cookie ─────────────────────────
    const { li_at } = body;

    if (!li_at || typeof li_at !== 'string' || li_at.trim().length < 10) {
      return new Response(JSON.stringify({ error: 'Invalid li_at cookie value' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const createRes = await fetch(`https://${UNIPILE_DSN}/api/v1/accounts`, {
      method: 'POST',
      headers: { 'X-API-KEY': UNIPILE_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: 'LINKEDIN',
        access_token: li_at.trim(),
      }),
    });

    const createData = await createRes.json();

    // Handle checkpoint (202)
    if (createRes.status === 202) {
      const checkpointType = createData.checkpoint?.type || createData.type || 'UNKNOWN';
      const tempAccountId = createData.account_id || createData.id;

      return new Response(JSON.stringify({
        status: 'checkpoint',
        checkpoint_type: checkpointType,
        account_id: tempAccountId,
        message: getCheckpointMessage(checkpointType),
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (!createRes.ok) {
      console.error('Unipile account creation error:', createRes.status, JSON.stringify(createData));
      throw new Error(createData.message || createData.error || `Unipile error: ${createRes.status}`);
    }

    // Direct success (no checkpoint)
    const accountId = createData.account_id || createData.id;
    if (!accountId) throw new Error('No account_id returned from Unipile');

    await saveAccountId(userId, accountId);

    return new Response(JSON.stringify({ status: 'connected', account_id: accountId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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

function getCheckpointMessage(type: string): string {
  switch (type) {
    case '2FA': return 'Enter your two-factor authentication code';
    case 'OTP': return 'Enter the one-time password sent to your email or phone';
    case 'IN_APP_VALIDATION': return 'Please confirm the login in your LinkedIn mobile app';
    case 'CAPTCHA': return 'A CAPTCHA verification is required. Please try again later.';
    case 'PHONE_REGISTER': return 'LinkedIn requires phone verification. Please verify on LinkedIn first.';
    default: return 'Additional verification is required';
  }
}
