const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type RequestPayload = Record<string, unknown>;
type UnipileAccount = Record<string, unknown>;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const UNIPILE_API_KEY = normalizeSecret(Deno.env.get('UNIPILE_API_KEY'));
    const UNIPILE_DSN = normalizeDsn(Deno.env.get('UNIPILE_DSN'));
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

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsErr } = await supabase.auth.getClaims(token);

    if (claimsErr || !claimsData?.claims) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    const userId = claimsData.claims.sub;
    const action = typeof body.action === 'string' ? body.action : undefined;

    if (action === 'create_link') {
      const returnUrl = typeof body.return_url === 'string' ? body.return_url : undefined;
      const notifyUrl = `${SUPABASE_URL}/functions/v1/connect-linkedin?source=unipile_notify`;
      const expiresOn = new Date(Date.now() + 30 * 60 * 1000).toISOString();

      const linkRes = await fetch(`https://${UNIPILE_DSN}/api/v1/hosted/accounts/link`, {
        method: 'POST',
        headers: {
          ...buildUnipileAuthHeaders(UNIPILE_API_KEY),
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

      const linkData = await safeJson(linkRes);

      if (!linkRes.ok) {
        console.error('Unipile hosted link error:', linkRes.status, JSON.stringify(linkData), JSON.stringify(unipileDebugMetadata(UNIPILE_API_KEY, UNIPILE_DSN)));
        throw new Error(linkData.message || linkData.error || `Unipile error: ${linkRes.status}`);
      }

      return jsonResponse({
        status: 'link_created',
        url: linkData.url,
      });
    }

    if (action === 'check_status') {
      const accountId = await resolveConnectedAccountId({
        userId,
        supabaseUrl: SUPABASE_URL,
        serviceRoleKey: SUPABASE_SERVICE_ROLE_KEY,
        unipileApiKey: UNIPILE_API_KEY,
        unipileDsn: UNIPILE_DSN,
      });

      if (accountId) {
        return jsonResponse({
          status: 'connected',
          account_id: accountId,
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

  if (!['CREATION_SUCCESS', 'RECONNECTED', 'OK', 'SYNC_SUCCESS'].includes(status.toUpperCase())) {
    return jsonResponse({ status: 'ignored', reason: 'unsupported_status' });
  }

  await saveAccountId(userId, accountId, supabaseUrl, serviceRoleKey);

  // Activate pending campaigns & agents, then trigger lead discovery
  await activatePendingAndDiscover(userId, supabaseUrl, serviceRoleKey);

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

async function resolveConnectedAccountId({
  userId,
  supabaseUrl,
  serviceRoleKey,
  unipileApiKey,
  unipileDsn,
}: {
  userId: string;
  supabaseUrl: string;
  serviceRoleKey: string;
  unipileApiKey: string;
  unipileDsn: string;
}) {
  const storedAccountId = await getStoredAccountId(userId, supabaseUrl, serviceRoleKey);
  if (storedAccountId) return storedAccountId;

  const remoteAccountId = await findRemoteLinkedinAccountId(userId, unipileApiKey, unipileDsn);
  if (!remoteAccountId) return null;

  await saveAccountId(userId, remoteAccountId, supabaseUrl, serviceRoleKey);
  return remoteAccountId;
}

async function getStoredAccountId(userId: string, supabaseUrl: string, serviceRoleKey: string) {
  const serviceClient = createClient(supabaseUrl, serviceRoleKey);
  const { data: profile, error } = await serviceClient
    .from('profiles')
    .select('unipile_account_id')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('[check_status] profile lookup error:', error.message);
    return null;
  }

  return profile?.unipile_account_id || null;
}

async function findRemoteLinkedinAccountId(userId: string, unipileApiKey: string, unipileDsn: string) {
  try {
    const response = await fetch(`https://${unipileDsn}/api/v1/accounts`, {
      headers: {
        ...buildUnipileAuthHeaders(unipileApiKey),
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[check_status] failed to list Unipile accounts:', response.status, errorText, JSON.stringify(unipileDebugMetadata(unipileApiKey, unipileDsn)));
      return null;
    }

    const data = await response.json();
    const accounts = extractAccounts(data);
    const matchedAccount = accounts.find((account) => isMatchingLinkedinAccount(account, userId));
    const accountId = matchedAccount ? getAccountId(matchedAccount) : null;

    console.log('[check_status] remote lookup', JSON.stringify({
      userId,
      accountsFound: accounts.length,
      matched: Boolean(accountId),
    }));

    return accountId;
  } catch (error) {
    console.error('[check_status] remote lookup error:', error);
    return null;
  }
}

function extractAccounts(payload: unknown): UnipileAccount[] {
  if (Array.isArray(payload)) return payload.filter(isRecord);
  if (!isRecord(payload)) return [];

  const collections = [payload.items, payload.results, payload.accounts, payload.data];
  for (const candidate of collections) {
    if (Array.isArray(candidate)) {
      return candidate.filter(isRecord);
    }
  }

  return [];
}

function isMatchingLinkedinAccount(account: UnipileAccount, userId: string) {
  const provider = getString(
    account.account_type,
    account.provider,
    account.type,
    isRecord(account.account) ? account.account.account_type : undefined,
    isRecord(account.account) ? account.account.provider : undefined,
  ).toUpperCase();

  const owner = getString(
    account.name,
    account.source,
    account.user_id,
    isRecord(account.metadata) ? account.metadata.name : undefined,
    isRecord(account.metadata) ? account.metadata.source : undefined,
    isRecord(account.account) ? account.account.name : undefined,
  );

  const status = getString(account.status, account.message).toUpperCase();
  const isLinkedin = provider ? provider.includes('LINKEDIN') : true;
  const isSameUser = owner === userId;
  const isUsable = !['DELETED', 'CREATION_FAIL', 'ERROR'].includes(status);

  return isLinkedin && isSameUser && isUsable;
}

function getAccountId(account: UnipileAccount) {
  return getString(
    account.account_id,
    account.id,
    account.accountId,
    isRecord(account.account) ? account.account.account_id : undefined,
    isRecord(account.account) ? account.account.id : undefined,
  ) || null;
}

function getString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return '';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function normalizeSecret(value: string | undefined | null) {
  if (!value) return '';
  const trimmed = value.trim();

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }

  return trimmed;
}

function normalizeDsn(value: string | undefined | null) {
  const cleaned = normalizeSecret(value);
  if (!cleaned) return '';

  return cleaned
    .replace(/^https?:\/\//i, '')
    .replace(/\/+$/, '');
}

function buildUnipileAuthHeaders(apiKey: string) {
  return {
    'X-API-KEY': apiKey,
    'Authorization': `Bearer ${apiKey}`,
  };
}

function unipileDebugMetadata(apiKey: string, dsn: string) {
  const safePrefix = apiKey.slice(0, 4);
  const safeSuffix = apiKey.slice(-4);

  return {
    key_length: apiKey.length,
    key_prefix: safePrefix,
    key_suffix: safeSuffix,
    dsn: dsn.replace(/\/.*/, ''),
  };
}

async function safeJson(response: Response): Promise<Record<string, unknown>> {
  try {
    const payload = await response.json();
    if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
      return payload as Record<string, unknown>;
    }
    return {};
  } catch {
    return {};
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

async function activatePendingAndDiscover(
  userId: string,
  supabaseUrl: string,
  serviceRoleKey: string
) {
  const serviceClient = createClient(supabaseUrl, serviceRoleKey);

  try {
    // Activate pending campaigns
    const { data: activated, error: campErr } = await serviceClient
      .from('campaigns')
      .update({ status: 'active' })
      .eq('user_id', userId)
      .eq('status', 'pending_linkedin')
      .select('id');

    if (campErr) {
      console.error('[activate] campaigns error:', campErr.message);
    } else {
      console.log(`[activate] activated ${activated?.length || 0} campaigns for user ${userId}`);
    }

    // Activate pending signal agents
    const { error: agentErr } = await serviceClient
      .from('signal_agents')
      .update({ status: 'active' })
      .eq('user_id', userId)
      .eq('status', 'pending_linkedin');

    if (agentErr) {
      console.error('[activate] agents error:', agentErr.message);
    }

    // Trigger discover-leads (fire-and-forget)
    if (activated && activated.length > 0) {
      const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
      fetch(`${supabaseUrl}/functions/v1/discover-leads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({}),
      }).catch((err) => console.error('[activate] discover-leads trigger error:', err));
    }
  } catch (err) {
    console.error('[activate] error:', err);
  }
}
