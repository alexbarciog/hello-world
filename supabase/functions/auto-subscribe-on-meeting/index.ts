import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const stripeKey = Deno.env.get("STRIPE_SECRET_KEY") || "";
const stripe = stripeKey ? new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" }) : null;

const STARTER_PRICE_ID = "price_1TIByxFsgTpFMX56JNwbw3TA";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!stripe) throw new Error("STRIPE_SECRET_KEY is not set");

    const body = await req.json();
    const userId = body.user_id;
    if (!userId) throw new Error("user_id is required");

    // Check if this user has free trial enabled — only auto-subscribe if so
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("free_trial_enabled, free_trial_limit")
      .eq("user_id", userId)
      .single();

    if (!profile?.free_trial_enabled) {
      console.log("[auto-subscribe] Free trial not enabled for this user — skipping auto-subscribe");
      return jsonRes({ status: "skipped", message: "Free trial not enabled for this user" });
    }

    // Check if user has reached their free trial meeting limit
    const { count: meetingCount } = await supabaseClient
      .from("meetings")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);

    const limit = profile.free_trial_limit ?? 1;
    if ((meetingCount ?? 0) < limit) {
      console.log(`[auto-subscribe] User has ${meetingCount}/${limit} meetings — not yet at limit, skipping`);
      return jsonRes({ status: "under_limit", message: `${meetingCount}/${limit} meetings` });
    }

    console.log(`[auto-subscribe] User reached ${meetingCount}/${limit} meeting limit — proceeding with auto-subscribe`);

    // Get user email
    const { data: userData, error: userErr } = await supabaseClient.auth.admin.getUserById(userId);
    if (userErr || !userData?.user?.email) throw new Error("User not found");
    const userEmail = userData.user.email;
    const userName = userData.user.user_metadata?.first_name || "there";

    console.log(`[auto-subscribe] Checking user ${userEmail}`);

    // Find Stripe customer
    const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
    if (customers.data.length === 0) {
      console.log(`[auto-subscribe] No Stripe customer for ${userEmail} — skipping`);
      return jsonRes({ status: "no_customer", message: "No card on file" });
    }

    const customer = customers.data[0];

    // Check if already has active subscription
    const subs = await stripe.subscriptions.list({ customer: customer.id, limit: 5 });
    const activeSub = subs.data.find(s => s.status === "active" || s.status === "trialing");
    if (activeSub) {
      console.log(`[auto-subscribe] User ${userEmail} already has active subscription — skipping`);
      return jsonRes({ status: "already_subscribed" });
    }

    // Get default payment method
    let paymentMethodId = customer.invoice_settings?.default_payment_method as string | null;
    if (!paymentMethodId) {
      // Try to find any payment method on file
      const pms = await stripe.paymentMethods.list({ customer: customer.id, type: "card", limit: 1 });
      if (pms.data.length > 0) {
        paymentMethodId = pms.data[0].id;
        // Set as default for invoices
        await stripe.customers.update(customer.id, {
          invoice_settings: { default_payment_method: paymentMethodId },
        });
      }
    }

    if (!paymentMethodId) {
      console.log(`[auto-subscribe] No payment method for ${userEmail} — skipping`);
      return jsonRes({ status: "no_payment_method", message: "No card on file" });
    }

    console.log(`[auto-subscribe] Creating subscription for ${userEmail} with PM ${paymentMethodId}`);

    // Create subscription — charge immediately
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: STARTER_PRICE_ID }],
      default_payment_method: paymentMethodId,
      payment_behavior: "error_if_incomplete",
      expand: ["latest_invoice.payment_intent"],
    });

    const invoice = subscription.latest_invoice as any;
    const paymentIntent = invoice?.payment_intent;
    const paymentSucceeded = paymentIntent?.status === "succeeded" || subscription.status === "active";

    if (paymentSucceeded) {
      console.log(`[auto-subscribe] ✅ Subscription created for ${userEmail}: ${subscription.id}`);

      // Send congrats email
      try {
        await sendEmail(userId, userName, userEmail, "success");
      } catch (e) {
        console.error("[auto-subscribe] Failed to send congrats email:", e);
      }

      // Create in-app notification
      await supabaseClient.from("notifications").insert({
        user_id: userId,
        title: "🎉 You're now on the Starter plan!",
        body: "Congrats! Your first meeting was booked using Intentsly. Your subscription is now active.",
        link: "/billing",
        type: "info",
      });

      return jsonRes({ status: "subscribed", subscription_id: subscription.id });
    } else {
      // Payment failed — cancel the subscription
      console.error(`[auto-subscribe] ❌ Payment failed for ${userEmail}. Status: ${paymentIntent?.status}`);
      try {
        await stripe.subscriptions.cancel(subscription.id);
      } catch (cancelErr) {
        console.error("[auto-subscribe] Failed to cancel subscription:", cancelErr);
      }

      // Send failure email
      try {
        await sendEmail(userId, userName, userEmail, "failed");
      } catch (e) {
        console.error("[auto-subscribe] Failed to send failure email:", e);
      }

      // Create in-app notification
      await supabaseClient.from("notifications").insert({
        user_id: userId,
        title: "⚠️ Payment failed",
        body: "Your card was declined. Please update your payment method to continue using Intentsly.",
        link: "/billing",
        type: "info",
      });

      return jsonRes({ status: "payment_failed" });
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[auto-subscribe] Error:", msg);
    return jsonRes({ error: msg }, 500);
  }
});

function jsonRes(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function sendEmail(userId: string, userName: string, userEmail: string, type: "success" | "failed") {
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  if (!RESEND_API_KEY) {
    console.warn("[auto-subscribe] RESEND_API_KEY not set — skipping email");
    return;
  }

  const appUrl = "https://intentsly043.lovable.app";

  const subject = type === "success"
    ? "🎉 Congrats! You booked your first meeting using Intentsly"
    : "⚠️ Your payment failed — action needed";

  const bodyHtml = type === "success"
    ? `
      <p style="margin:0 0 16px;color:#374151;font-size:16px;">Hey ${userName} 👋</p>
      <p style="margin:0 0 16px;color:#111827;font-size:18px;font-weight:600;">Your first meeting was just booked using Intentsly!</p>
      <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6;">
        This is a huge milestone — our AI found the right prospect, engaged them, and got you a meeting. 
        You're now on the <strong>Starter plan ($59/mo)</strong> and your subscription is active.
      </p>
      <a href="${appUrl}/contacts" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:15px;font-weight:600;">
        View your meetings →
      </a>
    `
    : `
      <p style="margin:0 0 16px;color:#374151;font-size:16px;">Hey ${userName} 👋</p>
      <p style="margin:0 0 16px;color:#111827;font-size:18px;font-weight:600;">Oh no! Your payment didn't go through.</p>
      <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6;">
        We tried to activate your Starter plan after your first meeting was booked, but the card charge failed. 
        To continue using Intentsly, please update your card information.
      </p>
      <a href="${appUrl}/billing" style="display:inline-block;background:linear-gradient(135deg,#ef4444,#dc2626);color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:15px;font-weight:600;">
        Update payment method →
      </a>
    `;

  const emailHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:'Segoe UI',Roboto,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <tr><td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 40px;">
          <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">Intentsly</h1>
        </td></tr>
        <tr><td style="padding:40px;">${bodyHtml}</td></tr>
        <tr><td style="padding:24px 40px;border-top:1px solid #e5e7eb;">
          <p style="margin:0;color:#9ca3af;font-size:13px;">
            This email was sent by Intentsly. 
            <a href="${appUrl}/settings" style="color:#6366f1;text-decoration:none;">Manage preferences</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Intentsly <no-reply@intentsly.com>",
      to: [userEmail],
      subject,
      html: emailHtml,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Resend error [${res.status}]: ${JSON.stringify(data)}`);
  }
  console.log(`[auto-subscribe] Email sent (${type}) to ${userEmail}: ${data.id}`);
}
