/**
 * mcp — Intentsly's remote MCP server (the "Intentsly" connector in Claude).
 *
 * Transport: MCP Streamable HTTP, stateless, JSON responses. One McpServer per
 * request, bound to the caller's identity.
 *
 * Auth: OAuth 2.1 with Supabase Auth as the authorization server (Supabase
 * OAuth Server, dynamic client registration on). Claude discovers it through
 * this function's protected-resource metadata, the user signs in and approves
 * on intentsly.com/oauth/consent, and every request then carries the user's
 * Supabase access token. Queries run under that token, so RLS applies exactly
 * as in the app.
 *
 * Plan gate: accounts without an active plan or trial can connect and see the
 * account overview; every other tool tells them to start a trial.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { McpServer } from 'npm:@modelcontextprotocol/sdk@1.31.0/server/mcp.js';
import { WebStandardStreamableHTTPServerTransport } from 'npm:@modelcontextprotocol/sdk@1.31.0/server/webStandardStreamableHttp.js';
import { accessForUser } from '../_shared/account-access.ts';
import { registerTools } from './tools.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const APP_URL = (Deno.env.get('APP_URL') || 'https://intentsly.com').replace(/\/$/, '');
// Public address of this server: intentsly.com/mcp, which the site's Cloudflare
// Worker (worker/index.ts) forwards here. OAuth tokens are bound to it, so
// changing it disconnects every Claude user.
const PUBLIC_URL = (Deno.env.get('MCP_PUBLIC_URL') || `${APP_URL}/mcp`).replace(/\/$/, '');
const AUTH_ISSUER = `${SUPABASE_URL}/auth/v1`;
const RESOURCE_METADATA_URL = `${PUBLIC_URL}/.well-known/oauth-protected-resource`;

const INSTRUCTIONS = `Intentsly finds B2B leads who show buying intent on LinkedIn (posts, comments, engagement with competitors) and runs LinkedIn outreach campaigns to them.
- Call get_account_overview first to see the plan, the connected LinkedIn account and today's remaining LinkedIn limits.
- Leads are people, each with the buying signal that made them a lead. "hot" is the strongest intent.
- Sending a LinkedIn message or starting a campaign acts on the user's real LinkedIn account. Show the user exactly what will be sent or started and get a clear yes first.
- LinkedIn limits are enforced server-side to protect the account; when a tool says a limit is reached, tell the user rather than retrying.`;

const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, content-type, accept, mcp-protocol-version, mcp-session-id, last-event-id',
  'Access-Control-Expose-Headers': 'www-authenticate, mcp-session-id, mcp-protocol-version',
};

function withCors(res: Response): Response {
  const headers = new Headers(res.headers);
  for (const [k, v] of Object.entries(CORS)) headers.set(k, v);
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
}

function json(body: unknown, status = 200, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json', ...extra },
  });
}

function unauthorized(description: string): Response {
  return json(
    { error: 'invalid_token', error_description: description },
    401,
    { 'WWW-Authenticate': `Bearer resource_metadata="${RESOURCE_METADATA_URL}"` },
  );
}

/** Path inside this function, e.g. "" or "/.well-known/oauth-protected-resource". */
function subPath(url: URL): string {
  const p = url.pathname.replace(/^(?:\/functions\/v1)?\/mcp/, '');
  return p === '/' ? '' : p.replace(/\/$/, '');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  const url = new URL(req.url);
  const path = subPath(url);

  // RFC 9728 protected-resource metadata: tells Claude where to sign in.
  if (path.startsWith('/.well-known/oauth-protected-resource')) {
    return json({
      resource: PUBLIC_URL,
      authorization_servers: [AUTH_ISSUER],
      bearer_methods_supported: ['header'],
      resource_name: 'Intentsly',
      resource_documentation: `${APP_URL}/claude`,
    }, 200, { 'Cache-Control': 'public, max-age=3600' });
  }

  // Older MCP clients look for the authorization-server metadata on the MCP
  // server itself; hand them Supabase's.
  if (path.startsWith('/.well-known/oauth-authorization-server') || path.startsWith('/.well-known/openid-configuration')) {
    const upstream = await fetch(`${SUPABASE_URL}/.well-known/oauth-authorization-server/auth/v1`);
    return json(await upstream.json(), upstream.status, { 'Cache-Control': 'public, max-age=3600' });
  }

  if (path !== '') return json({ error: 'not_found' }, 404);

  // ── Authenticate ────────────────────────────────────────────────────────
  const token = req.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
  if (!token) return unauthorized('Sign in to Intentsly to use this connector.');
  const { data: userData, error: userErr } = await admin.auth.getUser(token);
  const user = userData?.user;
  if (userErr || !user) return unauthorized('The Intentsly sign-in has expired. Reconnect to continue.');

  // Stateless server: no server-initiated streams or sessions to resume.
  if (req.method !== 'POST') {
    return json({ error: 'method_not_allowed' }, 405, { Allow: 'POST, OPTIONS' });
  }

  try {
    const db = createClient(SUPABASE_URL, ANON_KEY, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const [{ data: profile }, access] = await Promise.all([
      db.from('profiles').select('unipile_account_id, current_organization_id').eq('user_id', user.id).maybeSingle(),
      accessForUser(admin, user.id),
    ]);
    const dsn = Deno.env.get('UNIPILE_DSN');
    const apiKey = Deno.env.get('UNIPILE_API_KEY');

    const server = new McpServer(
      { name: 'intentsly', title: 'Intentsly', version: '1.0.0', websiteUrl: APP_URL },
      { instructions: INSTRUCTIONS },
    );
    registerTools(server, {
      db,
      admin,
      userId: user.id,
      orgId: profile?.current_organization_id ?? null,
      access,
      linkedin: profile?.unipile_account_id && dsn && apiKey
        ? { dsn, apiKey, accountId: profile.unipile_account_id }
        : null,
      appUrl: APP_URL,
    });

    const transport = new WebStandardStreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });
    await server.connect(transport);
    return withCors(await transport.handleRequest(req));
  } catch (e) {
    console.error('[mcp] request failed:', e);
    return json({ jsonrpc: '2.0', error: { code: -32603, message: 'Internal error' }, id: null }, 500);
  }
});
