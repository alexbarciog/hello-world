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
      const result = await resolveConnectedAccount({
        userId,
        supabaseUrl: SUPABASE_URL,
        serviceRoleKey: SUPABASE_SERVICE_ROLE_KEY,
        unipileApiKey: UNIPILE_API_KEY,
        unipileDsn: UNIPILE_DSN,
      });

      if (result) {
        return jsonResponse({
          status: 'connected',
          account_id: result.accountId,
          display_name: result.displayName || null,
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

  if (!status || !accountId) {
    return jsonResponse({ status: 'ignored', reason: 'missing_fields' });
  }

  const upperStatus = status.toUpperCase();
  const POSITIVE_STATUSES = ['CREATION_SUCCESS', 'RECONNECTED', 'OK', 'SYNC_SUCCESS'];
  const NEGATIVE_STATUSES = ['DISCONNECTED', 'DELETED', 'REMOVED', 'ERROR', 'CREATION_FAIL', 'CONNECTION_ERROR', 'ACCOUNT_DISCONNECTED'];

  if (NEGATIVE_STATUSES.includes(upperStatus)) {
    console.log('[unipile_notify] disconnection event:', upperStatus, 'accountId:', accountId);
    await handleAccountDisconnection(accountId, upperStatus, supabaseUrl, serviceRoleKey);
    return jsonResponse({ status: 'disconnection_handled', account_id: accountId });
  }

  if (!POSITIVE_STATUSES.includes(upperStatus)) {
    return jsonResponse({ status: 'ignored', reason: 'unsupported_status' });
  }

  if (!userId) {
    return jsonResponse({ status: 'ignored', reason: 'missing_user_id' });
  }

  // Try to fetch the LinkedIn display name from the Unipile account
  let displayName: string | null = null;
  try {
    const UNIPILE_API_KEY = normalizeSecret(Deno.env.get('UNIPILE_API_KEY'));
    const UNIPILE_DSN = normalizeDsn(Deno.env.get('UNIPILE_DSN'));
    if (UNIPILE_API_KEY && UNIPILE_DSN) {
      const acctRes = await fetch(`https://${UNIPILE_DSN}/api/v1/accounts/${accountId}`, {
        headers: { ...buildUnipileAuthHeaders(UNIPILE_API_KEY), 'Accept': 'application/json' },
      });
      if (acctRes.ok) {
        const acctData = await safeJson(acctRes);
        displayName = getAccountDisplayName(acctData);
        console.log('[unipile_notify] fetched display name:', displayName);
      }
    }
  } catch (err) {
    console.error('[unipile_notify] failed to fetch display name:', err);
  }

  await saveAccountInfo(userId, accountId, displayName, supabaseUrl, serviceRoleKey);

  // Activate pending campaigns & agents, then trigger lead discovery
  await activatePendingAndDiscover(userId, supabaseUrl, serviceRoleKey);

  return jsonResponse({ status: 'saved', account_id: accountId });
}

async function handleAccountDisconnection(
  accountId: string,
  status: string,
  supabaseUrl: string,
  serviceRoleKey: string
) {
  const serviceClient = createClient(supabaseUrl, serviceRoleKey);

  // Find the user by unipile_account_id
  const { data: profile, error: profileErr } = await serviceClient
    .from('profiles')
    .select('user_id, linkedin_display_name')
    .eq('unipile_account_id', accountId)
    .single();

  if (profileErr || !profile) {
    console.warn('[disconnect] no profile found for account:', accountId);
    return;
  }

  const userId = profile.user_id;
  console.log('[disconnect] clearing account for user:', userId, 'status:', status);

  // Clear the unipile_account_id
  await serviceClient
    .from('profiles')
    .update({ unipile_account_id: null, linkedin_display_name: null })
    .eq('user_id', userId);

  // Pause active campaigns
  const { data: pausedCampaigns } = await serviceClient
    .from('campaigns')
    .update({ status: 'paused' })
    .eq('user_id', userId)
    .eq('status', 'active')
    .select('id');

  console.log(`[disconnect] paused ${pausedCampaigns?.length || 0} campaigns`);

  // Pause active signal agents
  await serviceClient
    .from('signal_agents')
    .update({ status: 'paused' })
    .eq('user_id', userId)
    .eq('status', 'active');

  // Insert in-app notification
  await serviceClient.from('notifications').insert({
    user_id: userId,
    type: 'warning',
    title: '⚠️ LinkedIn Disconnected',
    body: 'Your LinkedIn account has been disconnected. Your campaigns and agents have been paused. Please reconnect to resume.',
    link: '/onboarding',
  });

  // Send email notification via Resend
  try {
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      console.warn('[disconnect] RESEND_API_KEY not set, skipping email');
      return;
    }

    const { data: userData } = await serviceClient.auth.admin.getUserById(userId);
    const userEmail = userData?.user?.email;
    if (!userEmail) {
      console.warn('[disconnect] no email found for user:', userId);
      return;
    }

    const userName = userData.user.user_metadata?.first_name || 'there';
    const appUrl = 'https://intentsly.com';

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:'Segoe UI',Roboto,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <tr>
            <td style="background:linear-gradient(135deg,#ef4444,#dc2626);padding:32px 40px;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">⚠️ Intentsly</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 16px;color:#374151;font-size:16px;">Hey ${userName} 👋</p>
              <p style="margin:0 0 8px;color:#111827;font-size:18px;font-weight:600;">Your LinkedIn account has been disconnected</p>
              <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6;">
                We detected that your LinkedIn account was disconnected from our platform. 
                As a result, all your active campaigns and signal agents have been <strong>paused</strong> to protect your account.
              </p>
              <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6;">
                To resume your outreach, please reconnect your LinkedIn account. It only takes a few seconds.
              </p>
              <a href="${appUrl}/onboarding" style="display:inline-block;background:linear-gradient(135deg,#2563eb,#1d4ed8);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600;">
                Reconnect LinkedIn →
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px;border-top:1px solid #e5e7eb;">
              <p style="margin:0;color:#9ca3af;font-size:13px;">
                This alert was sent by Intentsly because your LinkedIn connection status changed.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Intentsly <no-reply@intentsly.com>',
        to: [userEmail],
        subject: '⚠️ Your LinkedIn account was disconnected — Intentsly',
        html: emailHtml,
      }),
    });

    const resData = await res.json();
    if (res.ok) {
      console.log(`[disconnect] email sent to ${userEmail}: ${resData.id}`);
    } else {
      console.error('[disconnect] Resend error:', resData);
    }
  } catch (err) {
    console.error('[disconnect] email send error:', err);
  }
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

async function resolveConnectedAccount({
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
}): Promise<{ accountId: string; displayName: string | null } | null> {
  const stored = await getStoredAccountInfo(userId, supabaseUrl, serviceRoleKey);

  if (stored?.accountId) {
    // Live-verify the stored account is still active on Unipile
    const alive = await verifyAccountAlive(stored.accountId, unipileApiKey, unipileDsn);
    if (alive) return stored;

    // Account is dead on Unipile — clear it and handle disconnection
    console.log('[check_status] stored account no longer alive on Unipile, clearing:', stored.accountId);
    await handleAccountDisconnection(stored.accountId, 'DISCONNECTED', supabaseUrl, serviceRoleKey);
    return null;
  }

  const remote = await findRemoteLinkedinAccount(userId, unipileApiKey, unipileDsn);
  if (!remote) return null;

  await saveAccountInfo(userId, remote.accountId, remote.displayName, supabaseUrl, serviceRoleKey);
  return remote;
}

async function verifyAccountAlive(accountId: string, unipileApiKey: string, unipileDsn: string): Promise<boolean> {
  try {
    const res = await fetch(`https://${unipileDsn}/api/v1/accounts/${accountId}`, {
      headers: { ...buildUnipileAuthHeaders(unipileApiKey), 'Accept': 'application/json' },
    });

    if (!res.ok) {
      console.log('[verify_alive] Unipile returned', res.status, 'for account', accountId);
      return false;
    }

    const data = await safeJson(res);
    const status = getString(data.status, data.message).toUpperCase();
    const DEAD_STATUSES = ['DISCONNECTED', 'DELETED', 'REMOVED', 'ERROR', 'CREATION_FAIL', 'CONNECTION_ERROR', 'ACCOUNT_DISCONNECTED'];

    if (DEAD_STATUSES.includes(status)) {
      console.log('[verify_alive] account status is dead:', status);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[verify_alive] error checking account:', err);
    // On network error, assume alive to avoid false disconnections
    return true;
  }
}

async function getStoredAccountInfo(userId: string, supabaseUrl: string, serviceRoleKey: string): Promise<{ accountId: string; displayName: string | null } | null> {
  const serviceClient = createClient(supabaseUrl, serviceRoleKey);
  const { data: profile, error } = await serviceClient
    .from('profiles')
    .select('unipile_account_id, linkedin_display_name')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('[check_status] profile lookup error:', error.message);
    return null;
  }

  if (!profile?.unipile_account_id) return null;
  return { accountId: profile.unipile_account_id, displayName: profile.linkedin_display_name || null };
}

async function findRemoteLinkedinAccount(userId: string, unipileApiKey: string, unipileDsn: string): Promise<{ accountId: string; displayName: string | null } | null> {
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
    
    if (!matchedAccount) {
      console.log('[check_status] remote lookup', JSON.stringify({ userId, accountsFound: accounts.length, matched: false }));
      return null;
    }

    const accountId = getAccountId(matchedAccount);
    if (!accountId) return null;

    const displayName = getAccountDisplayName(matchedAccount);
    console.log('[check_status] remote lookup', JSON.stringify({ userId, accountsFound: accounts.length, matched: true, displayName }));

    return { accountId, displayName };
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

function getAccountDisplayName(account: UnipileAccount): string | null {
  // The Unipile account object has a top-level "name" field with the LinkedIn display name
  const name = getString(
    account.name,
    account.display_name,
    account.displayName,
    account.full_name,
    account.fullName,
  );

  if (name) return name;
  
  // Fallback: try connection_params.im.username
  if (isRecord(account.connection_params)) {
    const cp = account.connection_params as Record<string, unknown>;
    if (isRecord(cp.im)) {
      const im = cp.im as Record<string, unknown>;
      const imName = getString(im.username, im.full_name);
      if (imName) return imName;
    }
  }
  
  return null;
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

async function saveAccountInfo(
  userId: string,
  accountId: string,
  displayName: string | null,
  supabaseUrl: string,
  serviceRoleKey: string
) {
  const serviceClient = createClient(supabaseUrl, serviceRoleKey);
  const updateData: Record<string, unknown> = { user_id: userId, unipile_account_id: accountId };
  if (displayName) updateData.linkedin_display_name = displayName;
  
  const { error } = await serviceClient
    .from('profiles')
    .upsert(updateData, { onConflict: 'user_id' });

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
