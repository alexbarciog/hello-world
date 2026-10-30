// Billing state for the signed-in user's account, read by useSubscription.
// Subscription status comes from the database (kept in sync by stripe-webhook).
// While checkout is switched off, accounts without a status still get the
// pre-Epic-1 Stripe lookup for subscribed / has_card, so they behave as before.
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { bannerFor, decideAccess } from "../_shared/billing.ts";
import { billingOwnerOf, countTrialSignals } from "../_shared/account-access.ts";
import { PAYMENTS_ENABLED } from "../_shared/payments-policy.ts";
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
      .select("credits, free_trial_enabled, free_trial_limit, current_organization_id, subscription_status, trial_started_at, trial_ends_at, current_period_end, founding, plan_price_id")
      .eq("user_id", ownerId)
      .maybeSingle();

    const { data: limits } = await db.from("plan_limits").select("key, value");
    const limit = (key: string, fallback: number) => limits?.find((l: { key: string }) => l.key === key)?.value ?? fallback;
    const signalCap = limit("trial_signal_cap", 20);

    const access = decideAccess(owner, new Date(), { paymentsEnabled: PAYMENTS_ENABLED });
    const signalsUsed = owner?.subscription_status === "trialing"
      ? await countTrialSignals(db, ownerId, owner.current_organization_id, owner.trial_started_at)
      : 0;
    const banner = bannerFor(owner, {
      bannerDay: limit("trial_banner_day", 5),
      signalCap,
      signalsDelivered: signalsUsed,
      paymentsEnabled: PAYMENTS_ENABLED,
    });

    const { data: foundingLeft } = await db.rpc("founding_slots_remaining");

    const base = {
      subscription_status: owner?.subscription_status ?? null,
      access,
      banner,
      is_billing_owner: ownerId === user.id,
      trial_started_at: owner?.trial_started_at ?? null,
      trial_ends_at: owner?.trial_ends_at ?? null,
      current_period_end: owner?.current_period_end ?? null,
      founding: owner?.founding ?? false,
      founding_slots_left: typeof foundingLeft === "number" ? foundingLeft : 0,
      signals_used: signalsUsed,
      signal_cap: signalCap,
      payments_enabled: PAYMENTS_ENABLED,
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
    if (access === "none" && (owner?.subscription_status === "past_due" || owner?.subscription_status === "canceled")) {
      return json({ ...base, subscribed: false, had_subscription: true, has_card: false, subscription_end: null, product_id: null });
    }

    // Never subscribed, with checkout on: old Stripe history is ignored, so an
    // earlier cancelled plan doesn't stop them from getting the trial.
    if (access === "none") {
      return json({ ...base, subscribed: false, had_subscription: false, has_card: false, subscription_end: null, product_id: null });
    }

    // Checkout is off: look the payer up in Stripe as before.
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
  const subs = await stripe.subscriptions.list({ customer: customer.id, status: "all", limit: 5 });
  const live = subs.data.find((s: Stripe.Subscription) => s.status === "active" || s.status === "trialing");
  const end = live?.items?.data?.[0]?.current_period_end;
  let hasCard = Boolean(customer.invoice_settings?.default_payment_method);
  if (!hasCard) hasCard = (await stripe.paymentMethods.list({ customer: customer.id, type: "card", limit: 1 })).data.length > 0;
  return {
    subscribed: Boolean(live),
    had_subscription: subs.data.length > 0,
    has_card: hasCard,
    subscription_end: typeof end === "number" ? new Date(end * 1000).toISOString() : null,
    product_id: (live?.items?.data?.[0]?.price?.product as string | undefined) ?? null,
  };
}
