const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY not configured');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get all users
    const { data: usersData, error: usersErr } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    if (usersErr) throw usersErr;

    const users = usersData.users.filter(u => u.email);
    const results: { email: string; status: string; error?: string }[] = [];

    const appUrl = 'https://intentsly043.lovable.app';

    for (const user of users) {
      const email = user.email!;
      const firstName = user.user_metadata?.first_name || 'there';

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
            <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 40px;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">Intentsly</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 20px;color:#374151;font-size:16px;">Hey ${firstName} 👋</p>
              
              <p style="margin:0 0 8px;color:#111827;font-size:20px;font-weight:700;">While you were away, your competitors weren't.</p>
              
              <p style="margin:0 0 20px;color:#6b7280;font-size:15px;line-height:1.6;">
                In the last 7 days, Intentsly detected <strong style="color:#6366f1;">dozens of high-intent signals</strong> from prospects actively looking for solutions like yours — on LinkedIn, Reddit, and X.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
                <tr>
                  <td style="padding:16px 20px;background:#f9fafb;border-bottom:1px solid #e5e7eb;">
                    <p style="margin:0;color:#111827;font-size:14px;font-weight:600;">🔥 What you're missing right now:</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0 0 10px;color:#374151;font-size:14px;line-height:1.5;">
                      📡 <strong>Intent signals</strong> from prospects discussing pain points you solve
                    </p>
                    <p style="margin:0 0 10px;color:#374151;font-size:14px;line-height:1.5;">
                      🎯 <strong>Warm leads</strong> matched to your ideal customer profile
                    </p>
                    <p style="margin:0 0 10px;color:#374151;font-size:14px;line-height:1.5;">
                      💬 <strong>Conversations</strong> where your solution is the perfect answer
                    </p>
                    <p style="margin:0;color:#374151;font-size:14px;line-height:1.5;">
                      🚀 <strong>AI-powered outreach</strong> that books meetings while you sleep
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.6;">
                Every day without Intentsly is a day your competitors are reaching these leads first. Don't let them win.
              </p>

              <a href="${appUrl}/dashboard" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:600;">
                See What You're Missing →
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px;border-top:1px solid #e5e7eb;">
              <p style="margin:0;color:#9ca3af;font-size:13px;">
                You're receiving this because you have an Intentsly account. 
                <a href="${appUrl}/settings" style="color:#6366f1;text-decoration:none;">Manage preferences</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Intentsly <onboarding@resend.dev>',
            to: [email],
            subject: '🔥 Your competitors are stealing your leads right now',
            html: emailHtml,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          results.push({ email, status: 'failed', error: JSON.stringify(data) });
        } else {
          results.push({ email, status: 'sent' });
        }

        // Small delay to avoid rate limits
        await new Promise(r => setTimeout(r, 200));
      } catch (err) {
        results.push({ email, status: 'failed', error: err instanceof Error ? err.message : 'Unknown' });
      }
    }

    const sent = results.filter(r => r.status === 'sent').length;
    const failed = results.filter(r => r.status === 'failed').length;

    console.log(`[reengagement-blast] Sent: ${sent}, Failed: ${failed}`);

    return new Response(
      JSON.stringify({ success: true, total: users.length, sent, failed, details: results }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[reengagement-blast] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
