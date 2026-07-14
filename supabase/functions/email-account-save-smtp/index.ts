// Verifies SMTP credentials (by sending a test email to the account owner)
// and saves the encrypted config in public.email_accounts.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { encryptPassword } from '../_shared/email-account-crypto.ts';
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
    const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

    const authHeader = req.headers.get('Authorization') || '';
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await userClient.auth.getUser();
    const user = userData?.user;
    if (!user) return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const body = await req.json();
    const {
      from_email,
      from_name,
      smtp_host,
      smtp_port,
      smtp_username,
      smtp_password,
      smtp_secure,
      skip_verify,
    } = body || {};

    if (!from_email || !smtp_host || !smtp_port || !smtp_username || !smtp_password) {
      return new Response(JSON.stringify({ error: 'from_email, smtp_host, smtp_port, smtp_username, smtp_password are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify by sending a test email to the account owner (unless caller opts out).
    if (!skip_verify) {
      const test = await sendSmtp(
        { host: smtp_host, port: Number(smtp_port), username: smtp_username, password: smtp_password, secure: !!smtp_secure },
        {
          from: from_email,
          fromName: from_name || undefined,
          to: from_email,
          subject: 'Intentsly · Email connection verified',
          html: `<p>Your ${from_email} inbox is now connected to Intentsly.</p><p>Campaign emails will be sent from this address.</p>`,
        },
      );
      if (!test.ok) {
        return new Response(JSON.stringify({ error: `SMTP verification failed: ${test.error}` }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { ciphertext, iv } = await encryptPassword(String(smtp_password));

    // Read current org
    const { data: profile } = await admin.from('profiles').select('current_organization_id').eq('user_id', user.id).maybeSingle();

    // Clear any existing default for this user (so unique index doesn't clash)
    await admin.from('email_accounts').update({ is_default: false }).eq('user_id', user.id);

    const { data: inserted, error: insertErr } = await admin
      .from('email_accounts')
      .insert({
        user_id: user.id,
        organization_id: profile?.current_organization_id || null,
        provider: 'smtp',
        from_email,
        from_name: from_name || null,
        is_default: true,
        smtp_host,
        smtp_port: Number(smtp_port),
        smtp_username,
        smtp_password_encrypted: ciphertext,
        smtp_password_iv: iv,
        smtp_secure: !!smtp_secure,
        verified_at: new Date().toISOString(),
      })
      .select('id, from_email, from_name, provider, is_default, verified_at')
      .single();
    if (insertErr) throw insertErr;

    return new Response(JSON.stringify({ ok: true, account: inserted }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('[email-account-save-smtp]', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
