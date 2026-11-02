// Starts Stripe Checkout for the $97/month plan with the 7-day trial
// (card required; the trial cancels itself if no card is left on file).
// Accounts that already had a trial or subscription subscribe without one.
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { disabledPaymentsResponse } from "../_shared/payments-policy.ts";
import { corsHeaders, json, siteOrigin, stripeClient } from "../_shared/stripe.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const disabled = disabledPaymentsResponse(corsHeaders);
  if (disabled) return disabled;

  try {
    const priceId = Deno.env.get("STRIPE_PRICE_ID_MONTHLY");
    if (!priceId) throw new Error("STRIPE_PRICE_ID_MONTHLY is not set");

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
      auth: { persistSession: false },
    });
    const token = (req.headers.get("Authorization") || "").replace("Bearer ", "");
    const { data: userData } = await admin.auth.getUser(token);
    const user = userData?.user;
    if (!user?.email) return json({ error: "Not signed in" }, 401);

    const { data: profile } = await admin
      .from("profiles")
      .select("stripe_customer_id, subscription_id, subscription_status, trial_started_at")
      .eq("user_id", user.id)
      .maybeSingle();

    const stripe = stripeClient();
    const origin = siteOrigin(req);

    // Already trialing or paying: send them to manage billing, not a second subscription.
    if (profile?.stripe_customer_id && (profile.subscription_status === "trialing" || profile.subscription_status === "active")) {
      const portal = await stripe.billingPortal.sessions.create({
        customer: profile.stripe_customer_id,
        return_url: `${origin}/settings?tab=billing`,
      });
      return json({ url: portal.url, already_subscribed: true });
    }

    let customerId = profile?.stripe_customer_id ?? null;
    if (!customerId) {
      const existing = await stripe.customers.list({ email: user.email, limit: 1 });
      customerId = existing.data[0]?.id ?? (await stripe.customers.create({
        email: user.email,
        metadata: { user_id: user.id },
      })).id;
      await admin.from("profiles").update({ stripe_customer_id: customerId }).eq("user_id", user.id);
    }

    // One trial per account: anyone who had a trial or a subscription before pays from day one.
    const hadTrialOrSub = Boolean(profile?.trial_started_at || profile?.subscription_id);
    let trialDays = 0;
    if (!hadTrialOrSub) {
      const { data: limit } = await admin.from("plan_limits").select("value").eq("key", "trial_days").maybeSingle();
      trialDays = limit?.value ?? 7;
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      client_reference_id: user.id,
      line_items: [{ price: priceId, quantity: 1 }],
      payment_method_collection: "always",
      subscription_data: {
        metadata: { user_id: user.id },
        ...(trialDays > 0
          ? {
              trial_period_days: trialDays,
              trial_settings: { end_behavior: { missing_payment_method: "cancel" } },
            }
          : {}),
      },
      metadata: { user_id: user.id },
      success_url: `${origin}/onboarding?checkout=success`,
      cancel_url: `${origin}/pricing?checkout=canceled`,
    });

    return json({ url: session.url, trial_days: trialDays });
  } catch (error) {
    console.error("[create-checkout]", error);
    return json({ error: error instanceof Error ? error.message : String(error) }, 500);
  }
});
