import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FROM = 'Intentsly Updates <updates@intentsly.com>';
const SUBJECT = "Heads up: Intentsly pricing is going up →";
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
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">Intentsly is going from $59 to $97/mo. Lock in $59 before it changes.</div>

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
          <div style="font-size:11px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:#6E6E80;">Pricing update · A heads-up for early users</div>
        </td></tr>

        <!-- Headline -->
        <tr><td style="padding:18px 48px 0 48px;">
          <h1 style="font-size:32px;line-height:1.15;font-weight:700;letter-spacing:-0.025em;color:#1A1A2E;margin:0;">
            Intentsly is going from <span style="text-decoration:line-through;color:#9A9AA8;font-weight:600;">$59</span> to $97/mo.
          </h1>
        </td></tr>

        <!-- Lede -->
        <tr><td style="padding:20px 48px 0 48px;">
          <p style="font-size:16px;line-height:1.6;color:#3A3A4A;margin:0;">${greeting}</p>
          <p style="font-size:16px;line-height:1.6;color:#3A3A4A;margin:14px 0 0 0;">
            Quick, honest note before you see it on the pricing page. Intentsly is moving from <strong style="color:#1A1A2E;">$59/mo to $97/mo</strong>. The product has grown a lot — Personality Prediction, AI Chat, signal agents across LinkedIn, Reddit and X — and the price needs to catch up to what it actually does.
          </p>
          <p style="font-size:16px;line-height:1.6;color:#3A3A4A;margin:14px 0 0 0;">
            But you were here early. So here's the deal:
          </p>
        </td></tr>

        <!-- Price comparison card -->
        <tr><td style="padding:28px 48px 0 48px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F7F7F9;border-radius:16px;">
            <tr>
              <td width="50%" valign="top" style="padding:24px 24px 24px 28px;border-right:1px solid #EBEBED;">
                <div style="font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#10B981;margin-bottom:8px;">Lock in now</div>
                <div style="font-size:28px;font-weight:700;letter-spacing:-0.02em;color:#1A1A2E;line-height:1;">$59<span style="font-size:14px;font-weight:500;color:#6E6E80;">/mo</span></div>
                <div style="font-size:13px;line-height:1.55;color:#6E6E80;margin-top:10px;">Activate before the change and you keep $59/mo for as long as your subscription stays active.</div>
              </td>
              <td width="50%" valign="top" style="padding:24px 28px 24px 24px;">
                <div style="font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#6E6E80;margin-bottom:8px;">New price</div>
                <div style="font-size:28px;font-weight:700;letter-spacing:-0.02em;color:#1A1A2E;line-height:1;">$97<span style="font-size:14px;font-weight:500;color:#6E6E80;">/mo</span></div>
                <div style="font-size:13px;line-height:1.55;color:#6E6E80;margin-top:10px;">What every new user will pay starting next week.</div>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- Why -->
        <tr><td style="padding:32px 48px 0 48px;">
          <div style="font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#6E6E80;margin-bottom:10px;">Why we're raising it</div>
          <p style="font-size:15px;line-height:1.65;color:#3A3A4A;margin:0;">
            Intentsly today is a different product than the one you signed up for. You now get a full AI SDR running on LinkedIn, real-time intent signals from Reddit and X, DISC-based personality reads on every contact, and an AI Chat that finds buyers from a sentence. $59 doesn't reflect that anymore — and honestly, keeping it there means we can't keep shipping at the pace you've seen.
          </p>
        </td></tr>

        <!-- What you should do -->
        <tr><td style="padding:32px 48px 0 48px;">
          <div style="font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#6E6E80;margin-bottom:10px;">What this means for you</div>
          <p style="font-size:15px;line-height:1.65;color:#3A3A4A;margin:0 0 10px 0;">
            <strong style="color:#1A1A2E;">If you're already subscribed:</strong> nothing changes. You're locked at your current price.
          </p>
          <p style="font-size:15px;line-height:1.65;color:#3A3A4A;margin:0;">
            <strong style="color:#1A1A2E;">If you haven't activated yet:</strong> add a card now (you only pay after your first booked meeting — that part hasn't changed) and you'll be grandfathered in at $59/mo. Wait, and you'll start at $97.
          </p>
        </td></tr>

        <!-- CTA -->
        <tr><td style="padding:36px 48px 0 48px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
            <tr><td style="background:#1A1A2E;border-radius:12px;">
              <a href="${APP_URL}/billing" style="display:inline-block;padding:15px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:-0.01em;">Lock in $59/mo →</a>
            </td></tr>
          </table>
          <p style="font-size:13px;line-height:1.6;color:#6E6E80;margin:14px 0 0 0;">
            No charge today — Pay-on-Success still applies. You only get billed after Intentsly books you a meeting.
          </p>
        </td></tr>

        <!-- Sign-off -->
        <tr><td style="padding:44px 48px 0 48px;">
          <div style="height:1px;background:#EBEBED;line-height:1px;font-size:0;margin-bottom:28px;">&nbsp;</div>
          <p style="font-size:15px;line-height:1.6;color:#1A1A2E;margin:0;font-weight:500;">— Alex</p>
          <p style="font-size:13px;line-height:1.5;color:#6E6E80;margin:2px 0 0 0;">Founder, Intentsly</p>
          <p style="font-size:14px;line-height:1.65;color:#3A3A4A;margin:22px 0 0 0;">
            <span style="color:#1A1A2E;font-weight:600;">P.S.</span> I'm sending this before the price changes, not after, because that's how I'd want to be told. If you have questions, just hit reply.
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
