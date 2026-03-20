import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@18.5.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/* ── Email templates ──────────────────────────────────────────────── */

interface EmailTemplate {
  subject: (name: string) => string;
  headline: (name: string) => string;
  body: string;
  quote: (name: string) => string;
  subreddit: string;
  keywords: string;
  cta: string;
}

const TEMPLATES: EmailTemplate[] = [
  {
    subject: (name) => `${name} is looking for your services on Reddit!`,
    headline: (name) => `A high-intent signal was just detected on Reddit`,
    body: `Our intelligence engine identified a potential high-value lead in a relevant subreddit. The user is actively seeking solutions that align with your core offering. With <strong>Intentsly</strong>, you'd catch signals like this the moment they appear.`,
    quote: (name) => `"We're looking for a reliable tool to help us scale our outreach. Manual prospecting is killing our productivity. Budget is around $2k/mo for the right solution." — ${name}`,
    subreddit: 'r/SaaS',
    keywords: 'Outreach, Automation, Scale',
    cta: 'Review Lead & Respond',
  },
  {
    subject: () => `You received 5 new leads this week 🔥`,
    headline: () => `5 high-intent signals detected this week`,
    body: `This week alone, our AI scanned over 50,000 conversations and identified <strong>5 people</strong> actively searching for services like yours. They posted questions, asked for recommendations, and described problems your business solves.`,
    quote: () => `"Can anyone recommend a good B2B lead gen tool? We've tried everything and nothing sticks. Need something that actually finds warm leads, not just scrapes emails." — Reddit user`,
    subreddit: 'r/Entrepreneur',
    keywords: 'Lead Generation, B2B, Sales',
    cta: 'Don\'t Miss Next Week\'s Leads',
  },
  {
    subject: () => `We found a client for you — don't miss out`,
    headline: () => `A potential client is waiting for your response`,
    body: `Our AI detected a high-intent post from someone who needs exactly what you offer. They're comparing solutions, asking for advice, and ready to buy. With <strong>Intentsly</strong>, you'd jump into this conversation at the perfect moment.`,
    quote: () => `"Just got funding and need to set up our entire sales pipeline. Looking for tools that can help us find and reach out to potential customers automatically. Any recommendations?" — Reddit user`,
    subreddit: 'r/startups',
    keywords: 'Sales Pipeline, Funding, Growth',
    cta: 'Start Your Free Trial',
  },
  {
    subject: (name) => `${name} needs help with exactly what you offer`,
    headline: (name) => `${name} described your ideal customer profile perfectly`,
    body: `Imagine this: someone posts on Reddit saying they need a solution for the exact problem your product solves. They list their budget, their timeline, and their requirements — and it's a perfect match. This happens every day. Are you there to respond?`,
    quote: (name) => `"Spent the last 3 months trying to figure out how to find people who actually need our service. Cold emailing random lists isn't working. There has to be a smarter way to find intent signals." — ${name}`,
    subreddit: 'r/sales',
    keywords: 'Intent Signals, Prospecting',
    cta: 'Activate Your AI Agents',
  },
  {
    subject: () => `3 companies are searching for your solution right now`,
    headline: () => `Right now, 3 companies need what you sell`,
    body: `While you're reading this email, companies are actively searching for a solution like yours. They're posting on Reddit, asking their network, and browsing comparison sites. Your competitors might already be reaching out to them.`,
    quote: () => `"Our team is evaluating 3-4 tools for automated LinkedIn outreach. We need something that can identify the right prospects based on intent signals, not just job titles. Budget approved, just need the right fit." — Reddit user`,
    subreddit: 'r/GrowthHacking',
    keywords: 'LinkedIn, Outreach, Evaluation',
    cta: 'Be First to Respond',
  },
  {
    subject: () => `Your competitors are already responding to these leads`,
    headline: () => `While you wait, your competitors are closing deals`,
    body: `Every day, potential customers post on Reddit and LinkedIn looking for solutions. Some of them are describing the exact problem your product solves. But if you're not monitoring these conversations, your competitors are — and they're responding first.`,
    quote: () => `"Just signed up for an intent-monitoring tool and within 2 days found 4 qualified leads on Reddit. Wish I'd started sooner — my competitors were already in those threads." — Reddit user`,
    subreddit: 'r/SaaSMarketing',
    keywords: 'Competition, Intent, Speed',
    cta: 'Stop Losing Leads',
  },
  {
    subject: (name) => `${name} posted on r/SaaS — this looks like a perfect match`,
    headline: (name) => `${name}'s Reddit post is a goldmine for your business`,
    body: `A post just appeared on r/SaaS that reads like it was written for you. The author described their exact pain point, the budget they have, and the type of solution they're looking for — and it matches your offering perfectly.`,
    quote: (name) => `"Running a small agency and desperately need to automate our lead discovery process. We're spending 20+ hours/week just searching for potential clients manually. Would pay good money for something that does this automatically." — ${name}`,
    subreddit: 'r/SaaS',
    keywords: 'Agency, Lead Discovery, Automation',
    cta: 'Get Intent Signals Now',
  },
  {
    subject: () => `7 new intent signals detected this week`,
    headline: () => `This week: 7 people searched for what you sell`,
    body: `Our AI scanned thousands of conversations this week across Reddit, LinkedIn, and niche forums. Out of those, <strong>7 matched your ideal customer profile</strong> — real people with real problems who are actively looking for a solution like yours.`,
    quote: () => `"Does anyone know a platform that monitors Reddit and LinkedIn for buying signals? I want to know when someone in my niche is looking for a solution like mine. Tired of cold outreach that goes nowhere." — Reddit user`,
    subreddit: 'r/marketing',
    keywords: 'Buying Signals, Monitoring',
    cta: 'Unlock Your Signals',
  },
  {
    subject: () => `Someone on Reddit is asking for what you sell`,
    headline: () => `A Reddit user is looking for exactly your service`,
    body: `Right now, there's a thread on Reddit where someone is asking for recommendations — and what they described is basically your product. They've listed their requirements, their frustrations with current solutions, and what they're willing to pay.`,
    quote: () => `"Fed up with my current tool. Looking for something that can actually find people who are actively looking to buy, not just random contacts. Bonus points if it monitors Reddit conversations." — Reddit user`,
    subreddit: 'r/Entrepreneur',
    keywords: 'Recommendations, Buying Intent',
    cta: 'Never Miss a Lead Again',
  },
  {
    subject: () => `A warm lead just slipped through your fingers`,
    headline: () => `You could have closed this deal — here's how`,
    body: `Yesterday, someone posted on Reddit asking for a service exactly like yours. They got 12 responses within 3 hours — none of them were from you. The winner? A competitor who was using intent monitoring to catch leads in real-time.`,
    quote: () => `"Thanks everyone for the recommendations! I went with [competitor] because they were the first to reach out after my post. Speed matters when you're ready to buy." — Reddit user`,
    subreddit: 'r/smallbusiness',
    keywords: 'Speed, First Mover, Conversion',
    cta: 'Start Winning Leads',
  },
  {
    subject: (name) => `${name} just asked "Can anyone recommend a tool like yours?"`,
    headline: (name) => `${name} is looking for recommendations — yours included`,
    body: `"Can anyone recommend a good tool?" — Posts like this appear on Reddit every single day. The people writing them are high-intent buyers who are actively comparing options and ready to make a decision. With <strong>Intentsly</strong>, you'd be the recommendation that gets chosen.`,
    quote: (name) => `"Looking for recommendations for a lead intelligence platform. We need something that can monitor social media for intent signals and automatically surface potential customers. What are you all using?" — ${name}`,
    subreddit: 'r/sales',
    keywords: 'Recommendations, Intelligence',
    cta: 'Get Recommended',
  },
  {
    subject: () => `Your ideal customer just went online — are you watching?`,
    headline: () => `Your perfect customer is online right now`,
    body: `Somewhere on the internet, your ideal customer is describing the exact problem you solve. They're asking for help, comparing solutions, and getting ready to buy. The only question is: will you be there to respond?`,
    quote: () => `"Starting a new project and need tools for customer acquisition. Specifically looking for something AI-powered that can find people who are already looking for what we sell. Budget is flexible for the right solution." — Reddit user`,
    subreddit: 'r/GrowthHacking',
    keywords: 'AI, Customer Acquisition',
    cta: 'Activate AI Lead Discovery',
  },
];

const FICTIONAL_NAMES = [
  'Mark', 'Sarah', 'James', 'Emily', 'David', 'Jessica', 'Michael', 'Amanda',
  'Chris', 'Laura', 'Ryan', 'Rachel', 'Tom', 'Olivia', 'Alex', 'Sophie',
  'Daniel', 'Hannah', 'Andrew', 'Megan', 'Jake', 'Natalie', 'Ben', 'Katie',
  'Lucas', 'Victoria', 'Ethan', 'Caroline', 'Nathan', 'Samantha',
];

const SOCIAL_PROOF = [
  { quote: 'Intentsly helped us find 23 qualified leads in our first week. It\'s like having a sales team that never sleeps.', author: 'Growth Lead at a B2B SaaS company' },
  { quote: 'We closed our first Reddit-sourced deal within 48 hours of setting up Intentsly. The ROI is insane.', author: 'Founder of a marketing agency' },
  { quote: 'Before Intentsly, I was spending 3 hours daily searching Reddit manually. Now I just get notifications.', author: 'Sales Director at a tech startup' },
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/* ── HTML email generator (Editorial / MD3 design) ────────────────── */

function generateEmailHtml(
  template: EmailTemplate,
  name: string,
  billingUrl: string
): { subject: string; html: string } {
  const subject = template.subject(name);
  const headline = template.headline(name);
  const bodyText = template.body.replace(/\{name\}/g, name);
  const quoteText = template.quote(name);
  const proof = pick(SOCIAL_PROOF);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <!--[if mso]><style>table,td{font-family:Arial,sans-serif !important;}</style><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f8f7fc;font-family:'Segoe UI',Roboto,Arial,sans-serif;-webkit-font-smoothing:antialiased;">

  <!-- Hidden preheader: forces email clients to show headline instead of badge text -->
  <div style="display:none;font-size:1px;color:#f8f7fc;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    ${headline}${'&nbsp;&zwnj;'.repeat(30)}
  </div>

  <!-- Outer wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(180deg,#f3f2fa 0%,#f8f7fc 50%,#f4f3fa 100%);padding:40px 16px;">
    <tr><td align="center">

      <!-- Brand header -->
      <table width="600" cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
        <tr>
          <td style="padding:20px 0 16px;">
            <span style="font-size:22px;font-weight:400;color:#1a1b20;letter-spacing:-0.8px;">Intentsly</span>
          </td>
          <td align="right" style="padding:20px 0 16px;">
            <span style="font-size:13px;color:#005d8f;">🔔</span>
          </td>
        </tr>
      </table>

      <!-- Main card -->
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;border:1px solid rgba(0,0,0,0.06);box-shadow:0 8px 32px rgba(0,0,0,0.04);overflow:hidden;">

        <!-- Intent badge + Headline -->
        <tr><td style="padding:40px 40px 0;">
          <!-- Badge -->
          <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            <tr><td style="background-color:#e5deff;padding:6px 16px;border-radius:20px;">
              <span style="font-size:13px;font-weight:500;color:#1a0063;letter-spacing:0.3px;">🔥 High Intent</span>
            </td></tr>
          </table>
          <!-- Headline -->
          <h1 style="font-size:28px;font-weight:400;color:#1a1b20;line-height:1.2;letter-spacing:-0.5px;margin:0 0 24px;">
            ${headline}
          </h1>
        </td></tr>

        <!-- Body text -->
        <tr><td style="padding:0 40px;">
          <p style="font-size:16px;font-weight:300;color:#404850;line-height:1.65;margin:0 0 28px;">
            ${bodyText}
          </p>
        </td></tr>

        <!-- Quote card -->
        <tr><td style="padding:0 40px 32px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9f8fd;border:1px solid rgba(0,0,0,0.04);border-radius:12px;">
            <tr><td style="padding:24px 28px;">
              <span style="font-size:32px;color:rgba(0,93,143,0.15);line-height:1;display:block;margin-bottom:8px;">❝</span>
              <p style="font-size:15px;font-weight:300;font-style:italic;color:#1a1b20;line-height:1.6;margin:0;">
                ${quoteText}
              </p>
            </td></tr>
          </table>
        </td></tr>

        <!-- CTA button -->
        <tr><td style="padding:8px 40px 12px;" align="center">
          <table cellpadding="0" cellspacing="0">
            <tr><td style="background:#005d8f;border-radius:50px;padding:16px 44px;">
              <a href="${billingUrl}" style="color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;display:inline-block;letter-spacing:0.2px;">
                ${template.cta} →
              </a>
            </td></tr>
          </table>
        </td></tr>

        <!-- Sub-CTA text -->
        <tr><td style="padding:12px 40px 36px;" align="center">
          <p style="font-size:12px;font-weight:300;color:rgba(64,72,80,0.6);margin:0;">
            Available in your dashboard · 7-day free trial · Cancel anytime
          </p>
        </td></tr>

      </table>

      <!-- AI Insight floating card -->
      <table width="600" cellpadding="0" cellspacing="0" style="margin-top:16px;">
        <tr><td align="right" style="padding-right:20px;">
          <table cellpadding="0" cellspacing="0" style="background-color:#ffffff;border:1px solid rgba(0,0,0,0.06);border-radius:12px;box-shadow:0 4px 16px rgba(0,0,0,0.04);">
            <tr><td style="padding:16px 20px;">
              <p style="font-size:9px;text-transform:uppercase;letter-spacing:1.5px;color:#005d8f;font-weight:700;margin:0 0 6px;">✨ AI Insight</p>
              <p style="font-size:12px;color:#404850;margin:0;line-height:1.4;font-weight:300;">
                User matched 3 of your ICP criteria perfectly.
              </p>
            </td></tr>
          </table>
        </td></tr>
      </table>

      <!-- Social proof -->
      <table width="600" cellpadding="0" cellspacing="0" style="margin-top:24px;">
        <tr><td style="padding:24px 40px;" align="center">
          <p style="font-size:13px;font-style:italic;color:#71717a;line-height:1.6;margin:0 0 6px;">
            "${proof.quote}"
          </p>
          <p style="font-size:11px;color:#a1a1aa;margin:0;">— ${proof.author}</p>
        </td></tr>
      </table>

      <!-- Footer -->
      <table width="600" cellpadding="0" cellspacing="0" style="margin-top:16px;">
        <tr><td style="border-top:1px solid rgba(0,0,0,0.05);padding:24px 40px;" align="center">
          <p style="font-size:14px;font-weight:500;color:#1a1b20;letter-spacing:-0.5px;margin:0 0 12px;">Intentsly</p>
          <p style="font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#9ca3af;font-weight:300;margin:0 0 16px;">
            © 2026 Intentsly. Sent via High-Intent Reddit Signals.
          </p>
          <table cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:0 12px;">
                <a href="https://intentsly043.lovable.app/privacy-policy" style="font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#9ca3af;text-decoration:none;font-weight:300;">Privacy Policy</a>
              </td>
              <td style="padding:0 12px;">
                <a href="https://intentsly043.lovable.app/billing" style="font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#9ca3af;text-decoration:none;font-weight:300;">Manage Alerts</a>
              </td>
            </tr>
          </table>
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

    // Check for test mode
    let body: any = {};
    try { body = await req.json(); } catch { /* empty body is fine */ }
    const testEmail = body?.test_email as string | undefined;

    if (testEmail) {
      console.log(`[weekly-email] TEST MODE: sending to ${testEmail}`);
      const template = pick(TEMPLATES);
      const name = pick(FICTIONAL_NAMES);
      const BILLING_URL = 'https://intentsly043.lovable.app/billing';
      const { subject, html } = generateEmailHtml(template, name, BILLING_URL);

      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Intentsly <onboarding@resend.dev>',
          to: [testEmail],
          subject,
          html,
        }),
      });

      const resBody = await emailRes.text();
      if (emailRes.ok) {
        console.log(`[weekly-email] ✉️ Test sent to ${testEmail}: "${subject}"`);
        return new Response(JSON.stringify({ sent: 1, subject, test: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } else {
        console.warn(`[weekly-email] Test failed: ${resBody}`);
        return new Response(JSON.stringify({ sent: 0, error: resBody, test: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Normal mode: send to all free users
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
