// Billing state for the signed-in user's account, read by useSubscription.
// Subscription status comes from public.subscriptions (kept in sync by
// creem-webhook). While Creem is in test mode, accounts without a subscription
// still get the pre-Creem Stripe lookup for subscribed / has_card, so they
// behave as before.
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { bannerFor, currentSubscription, decideAccess } from "../_shared/billing.ts";
import { billingOwnerOf, subscriptionsOf } from "../_shared/account-access.ts";
import { BILLING_LIVE, CREEM_MODE } from "../_shared/creem.ts";
import { corsHeaders, json, STRIPE_API_VERSION } from "../_shared/stripe.ts";

const db = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", {
  auth: { persistSession: false },
});
const stripeKey = Deno.env.get("STRIPE_SECRET_KEY") || "";
const stripe = stripeKey ? new Stripe(stripeKey, { apiVersion: STRIPE_API_VERSION }) : null;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const token = (req.headers.get("Authorization") || "").replace("Bearer ", "");
    const { data: userData, error: userError } = await db.auth.getUser(token);
    const user = userData?.user;
    if (userError || !user?.email) return json({ error: "Not signed in" }, 401);

    const ownerId = await billingOwnerOf(db, user.id);
    const { data: owner } = await db
      .from("profiles")
      .select("credits, free_trial_enabled, free_trial_limit")
      .eq("user_id", ownerId)
      .maybeSingle();

    const now = new Date();
    const sub = currentSubscription((await subscriptionsOf(db, [ownerId])).get(ownerId), now);
    const access = decideAccess(sub, now, { paymentsEnabled: BILLING_LIVE });
    const banner = bannerFor(sub, { now, paymentsEnabled: BILLING_LIVE });

    const { data: foundingLeft } = await db.rpc("founding_slots_remaining");

    const base = {
      subscription_status: sub?.status ?? null,
      access,
      banner,
      is_billing_owner: ownerId === user.id,
      trial_ends_at: sub?.status === "trialing" ? sub.trial_end ?? sub.current_period_end ?? null : null,
      current_period_end: sub?.current_period_end ?? null,
      cancel_at_period_end: sub?.cancel_at_period_end ?? false,
      founding: sub?.founding ?? false,
      founding_slots_left: typeof foundingLeft === "number" ? foundingLeft : 0,
      payments_enabled: BILLING_LIVE,
      creem_mode: CREEM_MODE,
      credits: owner?.credits ?? 0,
      free_trial_enabled: owner?.free_trial_enabled ?? false,
      free_trial_limit: owner?.free_trial_limit ?? 1,
    };

    if (access === "full") {
      // Paying and trialing accounts start with 100 credits (unchanged from before).
      if ((owner?.credits ?? 0) === 0) {
        await db.from("profiles").update({ credits: 100 }).eq("user_id", ownerId);
        base.credits = 100;
      }
      return json({ ...base, subscribed: true, had_subscription: true, has_card: true, subscription_end: base.current_period_end, product_id: null });
    }
    // Had a Creem subscription that no longer pays, or (live) never subscribed:
    // old Stripe history is ignored either way.
    if (access === "none") {
      return json({ ...base, subscribed: false, had_subscription: Boolean(sub), has_card: false, subscription_end: null, product_id: null });
    }

    // Creem is in test mode and this account has no subscription: look the payer up in Stripe as before.
    const legacy = await legacyStripeState(ownerId === user.id ? user.email : await emailOf(ownerId));
    return json({ ...base, ...legacy });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[check-subscription]", message);
    return json({ error: message }, 200);
  }
});

async function emailOf(userId: string): Promise<string | null> {
  const { data } = await db.auth.admin.getUserById(userId);
  return data?.user?.email ?? null;
}

async function legacyStripeState(email: string | null) {
  const empty = { subscribed: false, had_subscription: false, has_card: false, subscription_end: null, product_id: null };
  if (!stripe || !email) return empty;
  const customers = await stripe.customers.list({ email, limit: 1 });
  const customer = customers.data[0];
  if (!customer) return empty;
  const subs = await stripe.subscriptions.list({ customer: customer.id, limit: 5 });
  const live = subs.data.find((s: Stripe.Subscription) => s.status === "active" || s.status === "trialing");
  const end = live?.items?.data?.[0]?.current_period_end;
  let hasCard = Boolean(customer.invoice_settings?.default_payment_method);
  if (!hasCard) hasCard = (await stripe.paymentMethods.list({ customer: customer.id, type: "card", limit: 1 })).data.length > 0;
  return {
    subscribed: Boolean(live),
    // An old cancelled plan counts as never having had one (founder decision).
    had_subscription: false,
    has_card: hasCard,
    subscription_end: typeof end === "number" ? new Date(end * 1000).toISOString() : null,
    product_id: (live?.items?.data?.[0]?.price?.product as string | undefined) ?? null,
  };
}
