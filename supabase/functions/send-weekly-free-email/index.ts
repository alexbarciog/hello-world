import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@18.5.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/* ── Email templates (subject + body) ─────────────────────────────── */

interface EmailTemplate {
  subject: (name: string) => string;
  headline: (name: string) => string;
  body: string;
  cta: string;
}

const TEMPLATES: EmailTemplate[] = [
  {
    subject: (name) => `${name} is looking for your services on Reddit!`,
    headline: (name) => `${name} just posted about a problem you could solve`,
    body: `Someone on Reddit is actively searching for a solution that matches exactly what you offer. They described their pain point in detail — and your service is the perfect fit.<br><br>With <strong>Intentsly</strong>, you'd get notified the moment someone like ${'{name}'} posts about needing help. Our AI agents monitor Reddit, LinkedIn, and other platforms 24/7 so you can be the first to respond — before your competitors even notice.`,
    cta: 'Start Catching Leads →',
  },
  {
    subject: () => `You received 5 new leads this week 🔥`,
    headline: () => `5 potential clients were looking for you this week`,
    body: `This week alone, we detected <strong>5 people</strong> actively searching for services like yours across Reddit and LinkedIn. They posted questions, asked for recommendations, and described problems that your business solves.<br><br>Without <strong>Intentsly</strong>, these leads slip away — someone else responds first, or the post gets buried. With our AI-powered intent signals, you'd have been notified instantly and could have started a conversation before anyone else.`,
    cta: 'Don\'t Miss Next Week\'s Leads →',
  },
  {
    subject: () => `We found a client for you — don't miss out`,
    headline: () => `A potential client is waiting for your response`,
    body: `Our AI detected a high-intent post from someone who needs exactly what you offer. They're comparing solutions, asking for advice, and ready to buy.<br><br><strong>Intentsly</strong> finds these moments automatically — scanning thousands of posts per day across Reddit, LinkedIn, and niche communities. You get real-time alerts so you can jump into the conversation at the perfect moment. No more cold outreach. Just warm, ready-to-buy leads coming to you.`,
    cta: 'Start Your Free Trial →',
  },
  {
    subject: (name) => `${name} needs help with exactly what you offer`,
    headline: (name) => `${name} described your ideal customer profile perfectly`,
    body: `Imagine this: someone posts on Reddit saying they need a solution for the exact problem your product solves. They list their budget, their timeline, and their requirements — and it's a perfect match.<br><br>This happens every single day. The question is: are you there to respond? <strong>Intentsly</strong> monitors intent signals across the web and alerts you the moment someone fits your ideal customer profile. Stop waiting for leads to find you — find them first.`,
    cta: 'Activate Your AI Agents →',
  },
  {
    subject: () => `3 companies are searching for your solution right now`,
    headline: () => `Right now, 3 companies need what you sell`,
    body: `While you're reading this email, there are companies actively searching for a solution like yours. They're posting on Reddit, asking their LinkedIn network, and browsing comparison sites.<br><br>Your competitors might already be reaching out to them. With <strong>Intentsly</strong>, you'd be the first to know — our AI agents scan thousands of conversations daily and notify you the instant someone matches your ideal customer profile. First response wins. Be first.`,
    cta: 'Be First to Respond →',
  },
  {
    subject: () => `Your competitors are already responding to these leads`,
    headline: () => `While you wait, your competitors are closing deals`,
    body: `Every day, potential customers post on Reddit and LinkedIn looking for solutions. Some of them are describing the exact problem your product solves. But if you're not monitoring these conversations, your competitors are — and they're responding first.<br><br><strong>Intentsly's</strong> AI agents work around the clock, scanning intent signals so you never miss an opportunity. Get notified in real-time, craft the perfect response, and turn conversations into customers.`,
    cta: 'Stop Losing Leads →',
  },
  {
    subject: (name) => `${name} posted on r/SaaS — this looks like a perfect match`,
    headline: (name) => `${name}'s Reddit post is a goldmine for your business`,
    body: `A post just appeared on r/SaaS that reads like it was written for you. The author described their exact pain point, the budget they have, and the type of solution they're looking for — and it matches your offering perfectly.<br><br>Posts like this appear every single day. <strong>Intentsly</strong> uses AI to find them automatically, filtering through thousands of conversations to surface only the ones that matter to your business. No noise, no manual searching — just qualified intent signals delivered straight to your inbox.`,
    cta: 'Get Intent Signals Now →',
  },
  {
    subject: () => `7 new intent signals detected this week`,
    headline: () => `This week: 7 people searched for what you sell`,
    body: `Our AI scanned over 50,000 conversations this week across Reddit, LinkedIn, and niche forums. Out of those, <strong>7 matched your ideal customer profile</strong> — real people with real problems who are actively looking for a solution like yours.<br><br>These aren't cold leads from a purchased list. These are people who raised their hand and said "I need help." With <strong>Intentsly</strong>, you'd have seen each one the moment they posted, giving you the chance to respond while their intent is still hot.`,
    cta: 'Unlock Your Signals →',
  },
  {
    subject: () => `Someone on Reddit is asking for what you sell`,
    headline: () => `A Reddit user is looking for exactly your service`,
    body: `Right now, there's a thread on Reddit where someone is asking for recommendations — and what they described is basically your product. They've listed their requirements, their frustrations with current solutions, and what they're willing to pay.<br><br>This is the kind of lead that converts. And with <strong>Intentsly</strong>, you'd catch it automatically. Our AI monitors the web for buying-intent signals and sends you real-time notifications so you can respond while the conversation is still active.`,
    cta: 'Never Miss a Lead Again →',
  },
  {
    subject: () => `A warm lead just slipped through your fingers`,
    headline: () => `You could have closed this deal — here's how`,
    body: `Yesterday, someone posted on Reddit asking for a service exactly like yours. They got 12 responses within 3 hours — none of them were from you. The winner? A competitor who was using intent monitoring to catch leads in real-time.<br><br>Don't let that happen again. <strong>Intentsly's</strong> AI agents work 24/7, scanning Reddit, LinkedIn, and other platforms for people who are actively looking to buy. When a match is found, you get notified instantly — before the competition even knows the lead exists.`,
    cta: 'Start Winning Leads →',
  },
  {
    subject: (name) => `${name} just asked "Can anyone recommend a tool like yours?"`,
    headline: (name) => `${name} is looking for recommendations — yours included`,
    body: `"Can anyone recommend a good [your category] tool?" — Posts like this appear on Reddit every single day. The people writing them are high-intent buyers who are actively comparing options and ready to make a decision.<br><br>With <strong>Intentsly</strong>, you don't have to manually search for these posts. Our AI finds them for you, matches them against your ideal customer profile, and notifies you in real-time. Be the recommendation that gets chosen.`,
    cta: 'Get Recommended →',
  },
  {
    subject: () => `Your ideal customer just went online — are you watching?`,
    headline: () => `Your perfect customer is online right now`,
    body: `Somewhere on the internet, your ideal customer is describing the exact problem you solve. They're asking for help, comparing solutions, and getting ready to buy.<br><br>The only question is: will you be there to respond? <strong>Intentsly</strong> turns the entire web into your lead generation machine — AI-powered agents that never sleep, scanning thousands of conversations to find the people who need you most. First-mover advantage is everything in sales. Make sure you're first.`,
    cta: 'Activate AI Lead Discovery →',
  },
];

const FICTIONAL_NAMES = [
  'Mark', 'Sarah', 'James', 'Emily', 'David', 'Jessica', 'Michael', 'Amanda',
  'Chris', 'Laura', 'Ryan', 'Rachel', 'Tom', 'Olivia', 'Alex', 'Sophie',
  'Daniel', 'Hannah', 'Andrew', 'Megan', 'Jake', 'Natalie', 'Ben', 'Katie',
  'Lucas', 'Victoria', 'Ethan', 'Caroline', 'Nathan', 'Samantha',
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/* ── HTML email generator ─────────────────────────────────────────── */

function generateEmailHtml(
  template: EmailTemplate,
  name: string,
  billingUrl: string
): { subject: string; html: string } {
  const subject = template.subject(name);
  const headline = template.headline(name);
  const bodyHtml = template.body.replace(/\$\{'{name}'\}/g, name).replace(/\{name\}/g, name);

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">

        <!-- Header -->
        <tr><td style="background-color:#000000;padding:32px 40px;text-align:center;">
          <h1 style="color:#ffffff;font-size:24px;margin:0;font-weight:700;letter-spacing:-0.3px;">Intentsly</h1>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:40px;">
          <h2 style="font-size:22px;color:#18181b;margin:0 0 20px;font-weight:700;line-height:1.35;">
            ${headline}
          </h2>
          <p style="font-size:15px;color:#3f3f46;line-height:1.7;margin:0 0 28px;">
            ${bodyHtml}
          </p>

          <!-- CTA -->
          <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
            <tr><td style="background-color:#000000;border-radius:8px;padding:15px 36px;">
              <a href="${billingUrl}" style="color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;display:inline-block;">
                ${template.cta}
              </a>
            </td></tr>
          </table>

          <p style="font-size:13px;color:#a1a1aa;text-align:center;margin:28px 0 0;line-height:1.5;">
            7-day free trial &bull; Cancel anytime &bull; No commitment
          </p>
        </td></tr>

        <!-- Divider -->
        <tr><td style="padding:0 40px;">
          <hr style="border:none;border-top:1px solid #f0f0f0;margin:0;">
        </td></tr>

        <!-- Social proof -->
        <tr><td style="padding:28px 40px;">
          <p style="font-size:13px;color:#71717a;text-align:center;margin:0;line-height:1.6;">
            <em>"Intentsly helped us find 23 qualified leads in our first week. It's like having a sales team that never sleeps."</em><br>
            <span style="color:#a1a1aa;">— Growth Lead at a B2B SaaS company</span>
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background-color:#fafafa;padding:24px 40px;border-top:1px solid #f0f0f0;">
          <p style="font-size:12px;color:#a1a1aa;margin:0;text-align:center;line-height:1.6;">
            &copy; 2026 Intentsly. All rights reserved.<br>
            You're receiving this because you signed up for Intentsly.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return { subject, html };
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
        // Check if user has active Stripe subscription — skip paid users
        const customers = await stripe.customers.list({ email: user.email, limit: 1 });

        if (customers.data.length > 0) {
          const customerId = customers.data[0].id;
          const activeSubs = await stripe.subscriptions.list({ customer: customerId, status: 'active', limit: 1 });
          const trialingSubs = await stripe.subscriptions.list({ customer: customerId, status: 'trialing', limit: 1 });

          if (activeSubs.data.length > 0 || trialingSubs.data.length > 0) {
            skipped++;
            continue;
          }
        }

        // Pick a random template and name
        const template = pick(TEMPLATES);
        const name = pick(FICTIONAL_NAMES);
        const { subject, html } = generateEmailHtml(template, name, BILLING_URL);

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
          console.log(`[weekly-email] ✉️ Sent to ${user.email}: "${subject}"`);
        } else {
          const errBody = await emailRes.text();
          console.warn(`[weekly-email] Failed for ${user.email}: ${errBody}`);
        }
      } catch (err) {
        console.error(`[weekly-email] Error for ${user.email}:`, err);
      }

      // Delay between sends to avoid rate limits
      await new Promise(r => setTimeout(r, 300));
    }

    console.log(`[weekly-email] Done. Sent: ${sent}, Skipped (paid): ${skipped}`);
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
