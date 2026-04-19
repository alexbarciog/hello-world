import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FROM = 'Intentsly Updates <updates@intentsly.com>';
const SUBJECT = "Alex, your leads now come with a personality cheat sheet 🧠";
const APP_URL = 'https://intentsly.com';

function buildHtml(firstName: string | null) {
  const greeting = firstName ? `Hey ${firstName},` : 'Hey,';
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${SUBJECT}</title></head>
<body style="margin:0;padding:0;background:#f6f7f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,sans-serif;color:#0a0a0a;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f7f9;padding:40px 16px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.04);">
        <tr><td style="padding:32px 40px 8px 40px;">
          <div style="font-size:13px;font-weight:600;letter-spacing:-0.01em;color:#0a0a0a;">Intentsly</div>
        </td></tr>

        <tr><td style="padding:8px 40px 0 40px;">
          <h1 style="font-size:26px;line-height:1.25;font-weight:700;letter-spacing:-0.02em;color:#0a0a0a;margin:16px 0 16px 0;">
            We just shipped two things that change how you sell.
          </h1>
          <p style="font-size:15px;line-height:1.6;color:#3a3a3a;margin:0 0 12px 0;">${greeting}</p>
          <p style="font-size:15px;line-height:1.6;color:#3a3a3a;margin:0 0 20px 0;">
            I'll be quick. Most outreach fails because you're guessing — guessing what to say, guessing if they're a fit, guessing how they'll react. We just killed two of those guesses.
          </p>
        </td></tr>

        <tr><td style="padding:8px 40px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9fa;border-radius:12px;padding:20px;">
            <tr><td>
              <div style="font-size:11px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:#1A8FE3;margin-bottom:8px;">New · Personality Prediction</div>
              <div style="font-size:17px;font-weight:600;letter-spacing:-0.01em;color:#0a0a0a;margin-bottom:8px;">Know how to pitch — before you send the message.</div>
              <p style="font-size:14px;line-height:1.6;color:#55575d;margin:0;">
                Every lead in your contacts now comes with a DISC personality read: how they communicate, what motivates them, what to avoid, and the single best opening line for <em>that specific person</em>. No more cold-template guessing.
              </p>
            </td></tr>
          </table>
        </td></tr>

        <tr><td style="padding:12px 40px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9fa;border-radius:12px;padding:20px;">
            <tr><td>
              <div style="font-size:11px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:#1A8FE3;margin-bottom:8px;">New · AI Chat</div>
              <div style="font-size:17px;font-weight:600;letter-spacing:-0.01em;color:#0a0a0a;margin-bottom:8px;">Describe your ideal customer. Get the leads.</div>
              <p style="font-size:14px;line-height:1.6;color:#55575d;margin:0;">
                Open the new AI Chat and just type: <em>"founders of seed-stage SaaS in the US who recently posted about hiring SDRs"</em>. It searches LinkedIn, scores each profile against your ICP, and hands you a list to save in one click. No filters, no Sales Nav.
              </p>
            </td></tr>
          </table>
        </td></tr>

        <tr><td align="center" style="padding:28px 40px 8px 40px;">
          <a href="${APP_URL}/dashboard" style="display:inline-block;background:#0a0a0a;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 28px;border-radius:10px;letter-spacing:-0.01em;">Try them now →</a>
        </td></tr>

        <tr><td style="padding:16px 40px 8px 40px;">
          <p style="font-size:14px;line-height:1.6;color:#3a3a3a;margin:0;">
            Both are live in your account right now. Takes about 30 seconds to see your first personality read.
          </p>
        </td></tr>

        <tr><td style="padding:24px 40px 32px 40px;border-top:1px solid #ececef;">
          <p style="font-size:14px;line-height:1.6;color:#3a3a3a;margin:16px 0 4px 0;">— Alex</p>
          <p style="font-size:13px;line-height:1.5;color:#8a8d93;margin:0;">Founder, Intentsly</p>
          <p style="font-size:13px;line-height:1.6;color:#55575d;margin:18px 0 0 0;">
            <strong style="color:#0a0a0a;">P.S.</strong> If the personality read on your top lead doesn't make you rewrite your next message, hit reply and tell me — I read every response.
          </p>
        </td></tr>

        <tr><td style="padding:20px 40px;background:#fafafa;text-align:center;">
          <p style="font-size:11px;line-height:1.5;color:#9a9da3;margin:0;">
            You're receiving this because you have an Intentsly account.<br>
            Intentsly · <a href="${APP_URL}" style="color:#9a9da3;text-decoration:underline;">intentsly.com</a>
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

    // Auth: require admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing auth' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const userClient = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: isAdmin } = await admin.rpc('has_role', { _user_id: user.id, _role: 'admin' });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Admin only' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

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
