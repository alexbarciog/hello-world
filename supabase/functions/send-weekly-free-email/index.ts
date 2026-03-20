import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@18.5.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/* ── Catchy subject lines (randomly picked per user) ──────────────── */

const SUBJECT_TEMPLATES = [
  (name: string) => `${name} is looking for your services on Reddit!`,
  (name: string) => `${name} just posted about a problem you solve`,
  (_: string) => `You received 5 new leads this week 🔥`,
  (_: string) => `We found a client for you — don't miss out`,
  (name: string) => `${name} needs help with exactly what you offer`,
  (_: string) => `3 companies are searching for your solution right now`,
  (_: string) => `Your competitors are already responding to these leads`,
  (name: string) => `${name} posted on r/SaaS — this looks like a match`,
  (_: string) => `7 new intent signals detected this week`,
  (_: string) => `Someone on Reddit is asking for what you sell`,
];

const FICTIONAL_NAMES = [
  'Mark', 'Sarah', 'James', 'Emily', 'David', 'Jessica', 'Michael', 'Amanda',
  'Chris', 'Laura', 'Ryan', 'Rachel', 'Tom', 'Olivia', 'Alex', 'Sophie',
  'Daniel', 'Hannah', 'Andrew', 'Megan', 'Jake', 'Natalie', 'Ben', 'Katie',
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateSubject(): string {
  const name = pick(FICTIONAL_NAMES);
  const template = pick(SUBJECT_TEMPLATES);
  return template(name);
}

function generateEmailHtml(subject: string, billingUrl: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
        
        <!-- Header -->
        <tr><td style="background-color:#000000;padding:32px 40px;text-align:center;">
          <h1 style="color:#ffffff;font-size:24px;margin:0;font-weight:700;">Intentsly</h1>
        </td></tr>
        
        <!-- Body -->
        <tr><td style="padding:40px;">
          <h2 style="font-size:20px;color:#18181b;margin:0 0 16px;font-weight:600;line-height:1.4;">
            ${subject}
          </h2>
          <p style="font-size:15px;color:#52525b;line-height:1.6;margin:0 0 12px;">
            Our AI agents have been scanning Reddit, LinkedIn, and other platforms — and we've spotted new opportunities that match your profile.
          </p>
          <p style="font-size:15px;color:#52525b;line-height:1.6;margin:0 0 28px;">
            Upgrade to <strong>Intentsly Plus</strong> to unlock real-time alerts, automated lead discovery, and AI-powered outreach — so you never miss a potential client again.
          </p>
          
          <!-- CTA Button -->
          <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
            <tr><td style="background-color:#000000;border-radius:8px;padding:14px 32px;">
              <a href="${billingUrl}" style="color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;display:inline-block;">
                Start Your Free Trial →
              </a>
            </td></tr>
          </table>
          
          <p style="font-size:13px;color:#a1a1aa;text-align:center;margin:28px 0 0;line-height:1.5;">
            7-day free trial • No credit card required to explore • Cancel anytime
          </p>
        </td></tr>
        
        <!-- Footer -->
        <tr><td style="background-color:#fafafa;padding:24px 40px;border-top:1px solid #f0f0f0;">
          <p style="font-size:12px;color:#a1a1aa;margin:0;text-align:center;line-height:1.5;">
            © 2026 Intentsly. All rights reserved.<br>
            You're receiving this because you signed up for Intentsly.
          </p>
        </td></tr>
        
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/* ── Main handler ──────────────────────────────────────────────────── */

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')!;
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !STRIPE_SECRET_KEY || !RESEND_API_KEY) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2025-08-27.basil' });

    // Get all users
    const { data: usersData, error: usersErr } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    if (usersErr) throw usersErr;

    const users = usersData?.users ?? [];
    console.log(`[weekly-email] Found ${users.length} total users`);

    let sent = 0;
    let skipped = 0;

    const BILLING_URL = 'https://intentsly043.lovable.app/billing';

    for (const user of users) {
      if (!user.email) { skipped++; continue; }

      try {
        // Check if user has active Stripe subscription
        const customers = await stripe.customers.list({ email: user.email, limit: 1 });
        
        if (customers.data.length > 0) {
          const customerId = customers.data[0].id;
          const activeSubs = await stripe.subscriptions.list({ customer: customerId, status: 'active', limit: 1 });
          const trialingSubs = await stripe.subscriptions.list({ customer: customerId, status: 'trialing', limit: 1 });
          
          if (activeSubs.data.length > 0 || trialingSubs.data.length > 0) {
            // User is paid — skip
            skipped++;
            continue;
          }
        }

        // Generate catchy subject & send email
        const subject = generateSubject();
        const html = generateEmailHtml(subject, BILLING_URL);

        const emailRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Intentsly <onboarding@resend.dev>',
            to: [user.email],
            subject,
            html,
          }),
        });

        if (emailRes.ok) {
          sent++;
          console.log(`[weekly-email] Sent to ${user.email}: "${subject}"`);
        } else {
          const errBody = await emailRes.text();
          console.warn(`[weekly-email] Failed for ${user.email}: ${errBody}`);
        }
      } catch (err) {
        console.error(`[weekly-email] Error for ${user.email}:`, err);
      }

      // Small delay to avoid rate limits
      await new Promise(r => setTimeout(r, 200));
    }

    console.log(`[weekly-email] Done. Sent: ${sent}, Skipped: ${skipped}`);
    return new Response(JSON.stringify({ sent, skipped }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[weekly-email] Fatal error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
