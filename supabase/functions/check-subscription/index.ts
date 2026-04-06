import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const supabaseClient = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  { auth: { persistSession: false } }
);

const stripeKey = Deno.env.get("STRIPE_SECRET_KEY") || "";
const stripe = stripeKey ? new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" }) : null;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!stripe) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");

    // Single Stripe call: list subscriptions by email with expand
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });

    if (customers.data.length === 0) {
      const { data: profile } = await supabaseClient
        .from("profiles")
        .select("credits")
        .eq("user_id", user.id)
        .single();

      return new Response(JSON.stringify({
        subscribed: false,
        had_subscription: false,
        credits: profile?.credits ?? 0,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const customerId = customers.data[0].id;

    // Single call: get all subs (any status), check if any are active
    const subs = await stripe.subscriptions.list({
      customer: customerId,
      limit: 5,
    });

    const activeSub = subs.data.find(s => s.status === "active" || s.status === "trialing");
    const hasActiveSub = Boolean(activeSub);
    const hadSubscription = subs.data.length > 0;

    let subscriptionEnd = null;
    let productId = null;

    if (activeSub) {
      const endTs = activeSub.current_period_end;
      if (typeof endTs === "number" && endTs > 0) {
        subscriptionEnd = new Date(endTs * 1000).toISOString();
      }
      productId = activeSub.items?.data?.[0]?.price?.product ?? null;
    }

    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("credits")
      .eq("user_id", user.id)
      .single();

    let credits = profile?.credits ?? 0;

    if (hasActiveSub && credits === 0) {
      await supabaseClient
        .from("profiles")
        .update({ credits: 100 })
        .eq("user_id", user.id);
      credits = 100;
    }

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      had_subscription: hadSubscription,
      product_id: productId,
      subscription_end: subscriptionEnd,
      credits,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[CHECK-SUBSCRIPTION] Error:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }
});
