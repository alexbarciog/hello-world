import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

async function checkUserExists(supabaseUrl: string, serviceRoleKey: string, email: string): Promise<boolean> {
  try {
    const res = await fetch(`${supabaseUrl}/auth/v1/admin/users?email=${encodeURIComponent(email)}&per_page=1`, {
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
      },
    });
    if (!res.ok) return false;
    const data = await res.json();
    return (data?.users?.length ?? 0) > 0;
  } catch {
    return false;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!RESEND_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing required environment variables');
    }

    // Authenticate the caller
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const userClient = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY') || '', {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const body = await req.json();
    const email = (body.email || '').trim().toLowerCase();

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return new Response(JSON.stringify({ error: 'Invalid email address' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get inviter profile info
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('company_name')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const inviterName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'A teammate';
    const orgName = campaign?.company_name || 'Intentsly';

    // Check if invited email already has an account
    const userExists = await checkUserExists(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, email);

    // Create invitation record
    const { data: invite, error: insertError } = await supabase
      .from('invitations')
      .insert({
        email,
        invited_by: user.id,
        inviter_name: inviterName,
        organization_name: orgName,
      })
      .select('token')
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      throw new Error('Failed to create invitation');
    }

    const origin = req.headers.get('origin') || 'https://hello-tiny-word.lovable.app';
    const inviteUrl = userExists
      ? `${origin}/login?invite=${invite.token}`
      : `${origin}/register?invite=${invite.token}`;

    const ctaText = userExists
      ? 'Accept Invitation &amp; Sign In'
      : 'Accept Invitation &amp; Create Account';

    const accountNote = userExists
      ? `You already have an Intentsly account with <strong>${email}</strong>. Just sign in to accept the invitation.`
      : `Create your free account to get started immediately — no credit card required during your 7-day trial.`;

    const htmlBody = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>You're invited to Intentsly</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#e8432d,#f07048);padding:40px 48px 36px;text-align:center;">
              <div style="display:inline-flex;align-items:center;gap:10px;">
                <span style="font-size:28px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">intentsly</span>
              </div>
              <p style="color:rgba(255,255,255,0.85);margin:10px 0 0;font-size:14px;">AI-Powered Lead Discovery</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:44px 48px;">
              <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#111827;">You're invited! 🎉</h1>
              <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6;">
                <strong style="color:#111827;">${inviterName}</strong> has invited you to join
                <strong style="color:#111827;">${orgName}</strong> on Intentsly — the AI platform
                that turns intent signals into warm leads.
              </p>

              <div style="background:#fef3f2;border:1px solid #fde8e4;border-radius:10px;padding:20px 24px;margin-bottom:28px;">
                <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#e8432d;text-transform:uppercase;letter-spacing:0.5px;">Your invitation</p>
                <p style="margin:0;font-size:14px;color:#374151;line-height:1.6;">
                  You've been added to <strong>${orgName}</strong>. ${accountNote}
                </p>
              </div>

              <div style="margin-bottom:32px;">
                <p style="margin:0 0 12px;font-size:13px;font-weight:600;color:#374151;">What you'll get access to:</p>
                <table cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td style="padding:6px 0;">
                      <span style="display:inline-block;width:20px;color:#e8432d;font-weight:700;">✓</span>
                      <span style="font-size:13px;color:#4b5563;">AI-powered lead discovery with intent signals</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;">
                      <span style="display:inline-block;width:20px;color:#e8432d;font-weight:700;">✓</span>
                      <span style="font-size:13px;color:#4b5563;">LinkedIn outreach automation</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;">
                      <span style="display:inline-block;width:20px;color:#e8432d;font-weight:700;">✓</span>
                      <span style="font-size:13px;color:#4b5563;">Real-time campaign analytics and contact management</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;">
                      <span style="display:inline-block;width:20px;color:#e8432d;font-weight:700;">✓</span>
                      <span style="font-size:13px;color:#4b5563;">Shared workspace with ${orgName} team</span>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- CTA Button -->
              <div style="text-align:center;margin-bottom:32px;">
                <a href="${inviteUrl}"
                   style="display:inline-block;background:linear-gradient(135deg,#e8432d,#f07048);color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:10px;font-size:16px;font-weight:700;letter-spacing:-0.2px;box-shadow:0 4px 12px rgba(232,67,45,0.35);">
                  ${ctaText}
                </a>
              </div>

              <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;line-height:1.6;">
                This invitation expires in <strong>7 days</strong>. If you didn't expect this email, you can safely ignore it.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;border-top:1px solid #f0f0f0;padding:20px 48px;text-align:center;">
              <p style="margin:0;font-size:11px;color:#9ca3af;">
                © ${new Date().getFullYear()} Intentsly · noreply@intentsly.com
              </p>
              <p style="margin:6px 0 0;font-size:11px;color:#d1d5db;">
                Invite link: <a href="${inviteUrl}" style="color:#e8432d;">${inviteUrl}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Intentsly <onboarding@resend.dev>',
        to: [email],
        subject: `${inviterName} invited you to join ${orgName} on Intentsly`,
        html: htmlBody,
      }),
    });

    const resendData = await resendRes.json();
    if (!resendRes.ok) {
      console.error('Resend error:', JSON.stringify(resendData));
      return new Response(
        JSON.stringify({ success: false, error: `Email send failed: ${resendData?.message || JSON.stringify(resendData)}` }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: `Invitation sent to ${email}`, userExists }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
