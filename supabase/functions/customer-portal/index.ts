// Opens the Stripe customer portal (cancel, change card, invoices, reactivate)
// for the signed-in user's own Stripe customer.
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { disabledPaymentsResponse } from "../_shared/payments-policy.ts";
import { corsHeaders, json, siteOrigin, stripeClient } from "../_shared/stripe.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // The portal can restart a subscription, so it follows the same switch as checkout.
  const disabled = disabledPaymentsResponse(corsHeaders);
  if (disabled) return disabled;

  try {
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
      auth: { persistSession: false },
    });
    const token = (req.headers.get("Authorization") || "").replace("Bearer ", "");
    const { data: userData } = await admin.auth.getUser(token);
    const user = userData?.user;
    if (!user?.email) return json({ error: "Not signed in" }, 401);

    const { data: profile } = await admin.from("profiles").select("stripe_customer_id").eq("user_id", user.id).maybeSingle();
    let customerId = profile?.stripe_customer_id ?? null;
    const stripe = stripeClient();
    if (!customerId) {
      // Customers from before Epic 1 were never linked; find them by email.
      customerId = (await stripe.customers.list({ email: user.email, limit: 1 })).data[0]?.id ?? null;
    }
    if (!customerId) {
      return json({ error: "No billing account yet. Start your trial from the pricing page.", code: "no_customer" }, 404);
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${siteOrigin(req)}/settings?tab=billing`,
    });
    return json({ url: session.url });
  } catch (error) {
    console.error("[customer-portal]", error);
    return json({ error: error instanceof Error ? error.message : String(error) }, 500);
  }
});
