import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

  if (!RESEND_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_ANON_KEY) {
    return new Response(JSON.stringify({ error: 'Missing environment variables' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const body = await req.json();
  const { action } = body;

  // ── Step 1: send_code ─────────────────────────────────────────────────────
  if (action === 'send_code') {
    const email = (body.email || '').trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return new Response(JSON.stringify({ error: 'Invalid email address' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if user exists (don't reveal but block sending)
    const { data: users } = await adminClient.auth.admin.listUsers();
    const userExists = users?.users?.some(u => u.email?.toLowerCase() === email);
    
    // Always return success (don't reveal if user exists)
    if (!userExists) {
      return new Response(JSON.stringify({ success: true }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Invalidate old codes
    await adminClient
      .from('password_reset_codes')
      .update({ used: true })
      .eq('email', email)
      .eq('used', false);

    const code = generateCode();

    const { error: insertError } = await adminClient
      .from('password_reset_codes')
      .insert({ email, code });

    if (insertError) {
      return new Response(JSON.stringify({ error: 'Failed to generate code' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>Reset your password</title></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 20px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#e8432d,#f07048);padding:36px 48px 32px;text-align:center;">
            <span style="font-size:26px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">intentsly</span>
            <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">Password Reset</p>
          </td>
        </tr>
        <tr>
          <td style="padding:44px 48px 36px;">
            <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#111827;">Reset your password</h1>
            <p style="margin:0 0 28px;font-size:15px;color:#6b7280;line-height:1.6;">
              Use the code below to reset your password. This code expires in <strong>15 minutes</strong>.
            </p>
            <div style="background:#fef3f2;border:2px dashed #fca99a;border-radius:12px;padding:24px;text-align:center;margin-bottom:28px;">
              <p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#e8432d;text-transform:uppercase;letter-spacing:1px;">Your verification code</p>
              <p style="margin:0;font-size:42px;font-weight:800;color:#111827;letter-spacing:10px;font-family:'Courier New',monospace;">${code}</p>
            </div>
            <p style="margin:0;font-size:13px;color:#9ca3af;line-height:1.6;">
              If you didn't request a password reset, you can safely ignore this email. Your password won't change.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#f9fafb;border-top:1px solid #f0f0f0;padding:18px 48px;text-align:center;">
            <p style="margin:0;font-size:11px;color:#9ca3af;">© ${new Date().getFullYear()} Intentsly · noreply@intentsly.com</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Intentsly <noreply@intentsly.com>',
        to: [email],
        subject: `${code} – Your Intentsly password reset code`,
        html,
      }),
    });

    if (!resendRes.ok) {
      const err = await resendRes.json();
      console.error('Resend error:', err);
      return new Response(JSON.stringify({ error: 'Failed to send email' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // ── Step 2: verify_code ───────────────────────────────────────────────────
  if (action === 'verify_code') {
    const email = (body.email || '').trim().toLowerCase();
    const code = (body.code || '').trim();

    if (!email || !code || !/^\d{6}$/.test(code)) {
      return new Response(JSON.stringify({ error: 'Invalid request' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { data: rows } = await adminClient
      .from('password_reset_codes')
      .select('id, expires_at, used')
      .eq('email', email)
      .eq('code', code)
      .eq('used', false)
      .order('created_at', { ascending: false })
      .limit(1);

    if (!rows || rows.length === 0) {
      return new Response(JSON.stringify({ error: 'Invalid or expired code' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const row = rows[0];
    if (new Date(row.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: 'Code has expired. Please request a new one.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ success: true, reset_id: row.id }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // ── Step 3: reset_password ────────────────────────────────────────────────
  if (action === 'reset_password') {
    const email = (body.email || '').trim().toLowerCase();
    const code = (body.code || '').trim();
    const newPassword = body.password || '';

    if (!email || !code || !newPassword || !/^\d{6}$/.test(code)) {
      return new Response(JSON.stringify({ error: 'Invalid request' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    if (newPassword.length < 8) {
      return new Response(JSON.stringify({ error: 'Password must be at least 8 characters' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Re-verify code
    const { data: rows } = await adminClient
      .from('password_reset_codes')
      .select('id, expires_at, used')
      .eq('email', email)
      .eq('code', code)
      .eq('used', false)
      .order('created_at', { ascending: false })
      .limit(1);

    if (!rows || rows.length === 0 || new Date(rows[0].expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: 'Invalid or expired code' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get user by email
    const { data: users } = await adminClient.auth.admin.listUsers();
    const user = users?.users?.find(u => u.email?.toLowerCase() === email);
    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Update password
    const { error: updateError } = await adminClient.auth.admin.updateUserById(user.id, {
      password: newPassword,
    });

    if (updateError) {
      return new Response(JSON.stringify({ error: updateError.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Mark code as used
    await adminClient
      .from('password_reset_codes')
      .update({ used: true })
      .eq('id', rows[0].id);

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({ error: 'Invalid action' }), {
    status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
});
