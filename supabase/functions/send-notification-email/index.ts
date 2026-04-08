const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not configured');
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const body = await req.json();

    // Support both direct call and DB webhook trigger format
    let userId: string;
    let title: string;
    let notifBody: string | null;
    let link: string | null;
    let type: string;

    if (body.record) {
      // Called from database webhook/trigger via pg_net
      const record = body.record;
      userId = record.user_id;
      title = record.title;
      notifBody = record.body;
      link = record.link;
      type = record.type;
    } else {
      // Direct invocation
      userId = body.user_id;
      title = body.title;
      notifBody = body.body;
      link = body.link;
      type = body.type || 'info';
    }

    if (!userId || !title) {
      return new Response(
        JSON.stringify({ error: 'Missing user_id or title' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user email from auth.users
    const { data: userData, error: userErr } = await supabase.auth.admin.getUserById(userId);
    if (userErr || !userData?.user?.email) {
      console.error(`[send-notification-email] Could not find email for user ${userId}:`, userErr);
      return new Response(
        JSON.stringify({ error: 'User email not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userEmail = userData.user.email;
    const userName = userData.user.user_metadata?.first_name || 'there';

    // Build the email HTML
    const appUrl = 'https://intentsly043.lovable.app';
    const fullLink = link ? `${appUrl}${link}` : appUrl;

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
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 40px;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">Intentsly</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 16px;color:#374151;font-size:16px;">Hey ${userName} 👋</p>
              <p style="margin:0 0 24px;color:#111827;font-size:18px;font-weight:600;">${escapeHtml(title)}</p>
              ${notifBody ? `<p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6;">${escapeHtml(notifBody)}</p>` : ''}
              <a href="${fullLink}" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:15px;font-weight:600;">
                View in Intentsly →
              </a>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;border-top:1px solid #e5e7eb;">
              <p style="margin:0;color:#9ca3af;font-size:13px;">
                This notification was sent by Intentsly. 
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

    // Send via Resend
    const subjectLine = getSubjectFromType(type, title);
    
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Intentsly <no-reply@intentsly.com>',
        to: [userEmail],
        subject: subjectLine,
        html: emailHtml,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`[send-notification-email] Resend error:`, data);
      throw new Error(`Resend API error [${response.status}]: ${JSON.stringify(data)}`);
    }

    console.log(`[send-notification-email] Email sent to ${userEmail} (${type}): ${data.id}`);

    return new Response(
      JSON.stringify({ success: true, email_id: data.id, sent_to: userEmail }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[send-notification-email] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getSubjectFromType(type: string, title: string): string {
  // Clean emoji from title for email subject
  const cleanTitle = title.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();
  
  switch (type) {
    case 'reddit_signal':
      return `🔴 ${cleanTitle} — Intentsly`;
    case 'signal':
      return `📡 ${cleanTitle} — Intentsly`;
    case 'lead':
      return `🎯 ${cleanTitle} — Intentsly`;
    case 'meeting':
      return `🎯 ${cleanTitle} — Intentsly`;
    default:
      return `${cleanTitle} — Intentsly`;
  }
}
