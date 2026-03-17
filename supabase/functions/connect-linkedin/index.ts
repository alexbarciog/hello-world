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

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = claims.claims.sub;
    const { li_at } = await req.json();

    if (!li_at || typeof li_at !== 'string' || li_at.trim().length < 10) {
      return new Response(JSON.stringify({ error: 'Invalid li_at cookie value' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create account in Unipile using li_at cookie
    const createRes = await fetch(`https://${UNIPILE_DSN}/api/v1/accounts`, {
      method: 'POST',
      headers: {
        'X-API-KEY': UNIPILE_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        provider: 'LINKEDIN',
        access_token: li_at.trim(),
      }),
    });

    const createData = await createRes.json();

    if (!createRes.ok) {
      console.error('Unipile account creation error:', createRes.status, JSON.stringify(createData));
      throw new Error(createData.message || createData.error || `Unipile error: ${createRes.status}`);
    }

    const accountId = createData.account_id || createData.id;
    if (!accountId) throw new Error('No account_id returned from Unipile');

    // Store account_id in profile using service role
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { error: updateErr } = await serviceClient
      .from('profiles')
      .update({ unipile_account_id: accountId })
      .eq('user_id', userId);

    if (updateErr) throw new Error(`Failed to save account: ${updateErr.message}`);

    return new Response(JSON.stringify({ success: true, account_id: accountId }), {
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
