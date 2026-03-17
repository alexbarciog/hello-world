const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type RequestPayload = Record<string, unknown>;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const UNIPILE_API_KEY = Deno.env.get('UNIPILE_API_KEY');
    const UNIPILE_DSN = Deno.env.get('UNIPILE_DSN');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!UNIPILE_API_KEY) throw new Error('UNIPILE_API_KEY not configured');
    if (!UNIPILE_DSN) throw new Error('UNIPILE_DSN not configured');
    if (!SUPABASE_URL) throw new Error('SUPABASE_URL not configured');
    if (!SUPABASE_ANON_KEY) throw new Error('SUPABASE_ANON_KEY not configured');
    if (!SUPABASE_SERVICE_ROLE_KEY) throw new Error('SUPABASE_SERVICE_ROLE_KEY not configured');

    const url = new URL(req.url);
    const body = await readPayload(req, url);
    const authHeader = req.headers.get('Authorization');

    if (isUnipileNotify(url, authHeader, body)) {
      return await handleUnipileNotify(body, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    }

    if (!authHeader?.startsWith('Bearer ')) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    const userId = user.id;
    const action = typeof body.action === 'string' ? body.action : undefined;

    if (action === 'create_link') {
      const returnUrl = typeof body.return_url === 'string' ? body.return_url : undefined;
      const notifyUrl = `${SUPABASE_URL}/functions/v1/connect-linkedin?source=unipile_notify`;
      const expiresOn = new Date(Date.now() + 30 * 60 * 1000).toISOString();

      const linkRes = await fetch(`https://${UNIPILE_DSN}/api/v1/hosted/accounts/link`, {
        method: 'POST',
        headers: {
          'X-API-KEY': UNIPILE_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'create',
          providers: ['LINKEDIN'],
          api_url: `https://${UNIPILE_DSN}`,
          expiresOn,
          notify_url: notifyUrl,
          success_redirect_url: buildRedirectUrl(returnUrl, 'success'),
          failure_redirect_url: buildRedirectUrl(returnUrl, 'failed'),
          name: userId,
        }),
      });

      const linkData = await linkRes.json();

      if (!linkRes.ok) {
        console.error('Unipile hosted link error:', linkRes.status, JSON.stringify(linkData));
        throw new Error(linkData.message || linkData.error || `Unipile error: ${linkRes.status}`);
      }

      return jsonResponse({
        status: 'link_created',
        url: linkData.url,
      });
    }

    if (action === 'check_status') {
      const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const { data: profile, error: profileError } = await serviceClient
        .from('profiles')
        .select('unipile_account_id')
        .eq('user_id', userId)
        .single();

      if (profileError) {
        console.error('[check_status] profile lookup error:', profileError.message);
      }

      if (profile?.unipile_account_id) {
        return jsonResponse({
          status: 'connected',
          account_id: profile.unipile_account_id,
        });
      }

      return jsonResponse({ status: 'pending' });
    }

    return jsonResponse({ error: 'Invalid action' }, 400);
  } catch (error) {
    console.error('connect-linkedin error:', error);
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      500
    );
  }
});

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function readPayload(req: Request, url: URL): Promise<RequestPayload> {
  const queryPayload = Object.fromEntries(url.searchParams.entries());
  const contentType = req.headers.get('content-type') || '';

  if (req.method === 'GET' || !contentType.includes('application/json')) {
    return queryPayload;
  }

  try {
    const json = await req.json();
    if (json && typeof json === 'object' && !Array.isArray(json)) {
      return { ...queryPayload, ...(json as RequestPayload) };
    }
  } catch {
    // ignore invalid json payloads
  }

  return queryPayload;
}

function isUnipileNotify(url: URL, authHeader: string | null, body: RequestPayload) {
  return (
    (!authHeader && url.searchParams.get('source') === 'unipile_notify') ||
    (!authHeader && typeof body.status === 'string' && typeof body.account_id === 'string')
  );
}

async function handleUnipileNotify(
  body: RequestPayload,
  supabaseUrl: string,
  serviceRoleKey: string
) {
  const payload =
    body.AccountStatus && typeof body.AccountStatus === 'object'
      ? (body.AccountStatus as RequestPayload)
      : body;

  const status = typeof payload.status === 'string'
    ? payload.status
    : typeof payload.message === 'string'
      ? payload.message
      : undefined;
  const accountId = typeof payload.account_id === 'string' ? payload.account_id : undefined;
  const userId = typeof payload.name === 'string' ? payload.name : undefined;

  console.log('[unipile_notify]', JSON.stringify({ status, accountId, userId }));

  if (!status || !accountId || !userId) {
    return jsonResponse({ status: 'ignored', reason: 'missing_fields' });
  }

  if (!['CREATION_SUCCESS', 'RECONNECTED', 'OK', 'SYNC_SUCCESS'].includes(status)) {
    return jsonResponse({ status: 'ignored', reason: 'unsupported_status' });
  }

  await saveAccountId(userId, accountId, supabaseUrl, serviceRoleKey);
  return jsonResponse({ status: 'saved', account_id: accountId });
}

function buildRedirectUrl(returnUrl: string | undefined, linkedinStatus: 'success' | 'failed') {
  if (!returnUrl) return undefined;

  try {
    const url = new URL(returnUrl);
    if (!['http:', 'https:'].includes(url.protocol)) return undefined;
    url.searchParams.set('linkedin', linkedinStatus);
    return url.toString();
  } catch {
    return undefined;
  }
}

async function saveAccountId(
  userId: string,
  accountId: string,
  supabaseUrl: string,
  serviceRoleKey: string
) {
  const serviceClient = createClient(supabaseUrl, serviceRoleKey);
  const { error } = await serviceClient
    .from('profiles')
    .upsert({ user_id: userId, unipile_account_id: accountId }, { onConflict: 'user_id' });

  if (error) {
    throw new Error(`Failed to save account: ${error.message}`);
  }
}
