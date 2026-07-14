// Sends a test email using a stored email_accounts row (by id, owned by caller).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { decryptPassword } from '../_shared/email-account-crypto.ts';
import { sendSmtp } from '../_shared/smtp-send.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
    const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const authHeader = req.headers.get('Authorization') || '';
    const userClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const { account_id, to } = await req.json();
    if (!account_id) return new Response(JSON.stringify({ error: 'account_id required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: acct, error } = await admin.from('email_accounts').select('*').eq('id', account_id).eq('user_id', user.id).maybeSingle();
    if (error || !acct) return new Response(JSON.stringify({ error: 'account not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    if (acct.provider !== 'smtp') {
      return new Response(JSON.stringify({ error: 'only smtp accounts supported for test send' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const password = await decryptPassword(acct.smtp_password_encrypted, acct.smtp_password_iv);
    const recipient = (to && String(to).trim()) || acct.from_email;

    const res = await sendSmtp(
      { host: acct.smtp_host, port: acct.smtp_port, username: acct.smtp_username, password, secure: acct.smtp_secure },
      {
        from: acct.from_email,
        fromName: acct.from_name || undefined,
        to: recipient,
        subject: 'Intentsly · SMTP test email',
        html: `<p>This is a test email sent from your connected inbox <b>${acct.from_email}</b>.</p><p>If you can read this, your SMTP connection is working.</p>`,
      },
    );
    if (!res.ok) return new Response(JSON.stringify({ error: res.error }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
