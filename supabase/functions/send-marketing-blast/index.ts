import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FROM = 'Intentsly Updates <updates@intentsly.com>';
const SUBJECT = "Two new things inside Intentsly →";
const APP_URL = 'https://intentsly.com';

function buildHtml(firstName: string | null) {
  const greeting = firstName ? `Hi ${firstName},` : 'Hi,';
  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light">
<title>${SUBJECT}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Inter','Segoe UI',Helvetica,Arial,sans-serif;color:#1A1A2E;-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">Personality Prediction + AI Chat are live. Open one lead to see the difference.</div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f4f5;padding:48px 16px;">
    <tr><td align="center">

      <!-- Wordmark -->
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;margin-bottom:20px;">
        <tr><td style="padding:0 4px;">
          <div style="font-size:13px;font-weight:600;letter-spacing:-0.01em;color:#1A1A2E;">Intentsly</div>
        </td></tr>
      </table>

      <!-- Card -->
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff;border-radius:20px;overflow:hidden;">

        <!-- Eyebrow -->
        <tr><td style="padding:44px 48px 0 48px;">
          <div style="font-size:11px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:#6E6E80;">Product update · April 2026</div>
        </td></tr>

        <!-- Headline -->
        <tr><td style="padding:18px 48px 0 48px;">
          <h1 style="font-size:32px;line-height:1.15;font-weight:700;letter-spacing:-0.025em;color:#1A1A2E;margin:0;">
            Stop guessing how to open the conversation.
          </h1>
        </td></tr>

        <!-- Lede -->
        <tr><td style="padding:20px 48px 0 48px;">
          <p style="font-size:16px;line-height:1.6;color:#3A3A4A;margin:0;">${greeting}</p>
          <p style="font-size:16px;line-height:1.6;color:#3A3A4A;margin:14px 0 0 0;">
            We shipped two things this week that change the answer to <em style="color:#1A1A2E;font-style:italic;">"who do I message, and what do I say?"</em> Both are live in your account right now.
          </p>
        </td></tr>

        <!-- Divider -->
        <tr><td style="padding:36px 48px 0 48px;">
          <div style="height:1px;background:#EBEBED;line-height:1px;font-size:0;">&nbsp;</div>
        </td></tr>

        <!-- Feature 1 -->
        <tr><td style="padding:32px 48px 0 48px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td width="44" valign="top" style="padding-right:16px;">
                <div style="width:44px;height:44px;background:#EDEEFC;border-radius:12px;text-align:center;line-height:44px;font-size:18px;font-weight:700;color:#4F46E5;letter-spacing:-0.02em;">01</div>
              </td>
              <td valign="top">
                <div style="font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#4F46E5;margin-bottom:6px;">New</div>
                <div style="font-size:19px;font-weight:600;letter-spacing:-0.015em;color:#1A1A2E;margin-bottom:10px;">Personality Prediction</div>
                <p style="font-size:15px;line-height:1.65;color:#3A3A4A;margin:0;">
                  Every contact now comes with a DISC read: how they communicate, what motivates them, what to avoid, and the single best opening line for <em style="color:#1A1A2E;font-style:italic;">that</em> person. Built from their public footprint — no template guessing.
                </p>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- Feature 2 -->
        <tr><td style="padding:32px 48px 0 48px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td width="44" valign="top" style="padding-right:16px;">
                <div style="width:44px;height:44px;background:#E6F1FD;border-radius:12px;text-align:center;line-height:44px;font-size:18px;font-weight:700;color:#1A8FE3;letter-spacing:-0.02em;">02</div>
              </td>
              <td valign="top">
                <div style="font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#1A8FE3;margin-bottom:6px;">New</div>
                <div style="font-size:19px;font-weight:600;letter-spacing:-0.015em;color:#1A1A2E;margin-bottom:10px;">AI Chat — describe your buyer, get the leads</div>
                <p style="font-size:15px;line-height:1.65;color:#3A3A4A;margin:0;">
                  Type something like <em style="color:#1A1A2E;font-style:italic;">"founders of seed-stage SaaS in the US who recently posted about hiring SDRs"</em>. AI Chat searches LinkedIn, scores each profile against your ICP, and hands you a list to save in one click. No filters. No Sales Nav.
                </p>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- CTA -->
        <tr><td style="padding:40px 48px 0 48px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
            <tr><td style="background:#1A1A2E;border-radius:12px;">
              <a href="${APP_URL}/dashboard" style="display:inline-block;padding:15px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:-0.01em;">Open Intentsly →</a>
            </td></tr>
          </table>
          <p style="font-size:13px;line-height:1.6;color:#6E6E80;margin:14px 0 0 0;">
            Takes ~30 seconds to see the personality read on your top lead.
          </p>
        </td></tr>

        <!-- Sign-off -->
        <tr><td style="padding:44px 48px 0 48px;">
          <div style="height:1px;background:#EBEBED;line-height:1px;font-size:0;margin-bottom:28px;">&nbsp;</div>
          <p style="font-size:15px;line-height:1.6;color:#1A1A2E;margin:0;font-weight:500;">— Alex</p>
          <p style="font-size:13px;line-height:1.5;color:#6E6E80;margin:2px 0 0 0;">Founder, Intentsly</p>
          <p style="font-size:14px;line-height:1.65;color:#3A3A4A;margin:22px 0 0 0;">
            <span style="color:#1A1A2E;font-weight:600;">P.S.</span> If the personality read on your top lead doesn't make you rewrite your next message, hit reply and tell me. I read every response.
          </p>
        </td></tr>

        <tr><td style="padding:48px;"></td></tr>
      </table>

      <!-- Footer -->
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;margin-top:20px;">
        <tr><td align="center" style="padding:0 24px;">
          <p style="font-size:12px;line-height:1.6;color:#6E6E80;margin:0;">
            You're receiving this because you have an Intentsly account.<br>
            <a href="${APP_URL}" style="color:#6E6E80;text-decoration:underline;">intentsly.com</a>
          </p>
        </td></tr>
      </table>

    </td></tr>
  </table>
</body></html>`;
}

async function sendOne(apiKey: string, to: string, firstName: string | null) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to: [to], subject: SUBJECT, html: buildHtml(firstName) }),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY not configured');

    const body = await req.json().catch(() => ({}));
    const { testEmail, confirm } = body as { testEmail?: string; confirm?: boolean };

    const authHeader = req.headers.get('Authorization');
    const adminSecret = req.headers.get('x-admin-secret');
    const ADMIN_SECRET = Deno.env.get('MARKETING_BLAST_SECRET');
    // Bypass via shared admin secret OR service-role key
    const isServiceRole = authHeader === `Bearer ${SERVICE_ROLE}`;
    const isSecretAuth = !!(ADMIN_SECRET && adminSecret === ADMIN_SECRET);

    let isAdmin = isServiceRole || isSecretAuth;
    if (!isAdmin) {
      // Auth: require admin user JWT
      if (!authHeader) {
        return new Response(JSON.stringify({ error: 'Missing auth' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      const userClient = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY')!, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user } } = await userClient.auth.getUser();
      if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

      const adminCheck = createClient(SUPABASE_URL, SERVICE_ROLE);
      const { data } = await adminCheck.rpc('has_role', { _user_id: user.id, _role: 'admin' });
      isAdmin = !!data;
      if (!isAdmin) {
        return new Response(JSON.stringify({ error: 'Admin only' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // TEST MODE
    if (testEmail) {
      const result = await sendOne(RESEND_API_KEY, testEmail, 'Alex');
      return new Response(JSON.stringify({ mode: 'test', to: testEmail, ...result }), {
        status: result.ok ? 200 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // BLAST MODE — require explicit confirm
    if (!confirm) {
      return new Response(JSON.stringify({ error: 'Pass { confirm: true } to send blast to all users.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch all auth users
    const allUsers: Array<{ email: string; firstName: string | null }> = [];
    let page = 1;
    while (true) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
      if (error) throw error;
      for (const u of data.users) {
        if (!u.email) continue;
        const fn = (u.user_metadata?.first_name as string | undefined)
          || (u.user_metadata?.full_name as string | undefined)?.split(' ')[0]
          || null;
        allUsers.push({ email: u.email, firstName: fn });
      }
      if (data.users.length < 1000) break;
      page++;
    }

    let sent = 0, failed = 0;
    const errors: any[] = [];
    for (const u of allUsers) {
      const r = await sendOne(RESEND_API_KEY, u.email, u.firstName);
      if (r.ok) sent++;
      else { failed++; errors.push({ email: u.email, status: r.status, data: r.data }); }
      // throttle ~5/sec to stay well under Resend limits
      await new Promise(r => setTimeout(r, 200));
    }

    return new Response(JSON.stringify({
      mode: 'blast', total: allUsers.length, sent, failed, errors: errors.slice(0, 10),
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('send-marketing-blast error:', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
