// Stripe → Intentsly billing state. The only writer of subscription status.
// Signature-verified; each event id is processed once (replays return 200 and
// do nothing). Deploy with verify_jwt = false (Stripe sends no Supabase JWT).
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { profileFieldsFromSubscription, type StripeSubscriptionLike } from "../_shared/billing.ts";
import { pauseAccount } from "../_shared/account-access.ts";
import { json, stripeClient } from "../_shared/stripe.ts";

const HANDLED = new Set([
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.payment_failed",
  "invoice.paid",
  "charge.refunded",
]);

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  const secret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!secret) return json({ error: "STRIPE_WEBHOOK_SECRET is not set" }, 500);
  const signature = req.headers.get("stripe-signature");
  if (!signature) return json({ error: "missing signature" }, 400);

  const stripe = stripeClient();
  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, secret, undefined, Stripe.createSubtleCryptoProvider());
  } catch (err) {
    console.error("[stripe-webhook] bad signature", err instanceof Error ? err.message : err);
    return json({ error: "invalid signature" }, 400);
  }

  if (!HANDLED.has(event.type)) return json({ received: true, ignored: event.type });

  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });

  // Claim the event id first. A duplicate (Stripe retry or replay) stops here.
  const { error: claimErr } = await db.from("stripe_events").insert({ id: event.id, type: event.type });
  if (claimErr) {
    if (claimErr.code === "23505") return json({ received: true, duplicate: true });
    console.error("[stripe-webhook] claim failed", claimErr.message);
    return json({ error: "storage error" }, 500);
  }

  try {
    await handle(stripe, db, event);
    await db.from("stripe_events").update({ processed_at: new Date().toISOString() }).eq("id", event.id);
    return json({ received: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[stripe-webhook] ${event.type} ${event.id} failed:`, message);
    // Release the claim so Stripe's automatic retry processes it again.
    await db.from("stripe_events").delete().eq("id", event.id);
    return json({ error: message }, 500);
  }
});

// deno-lint-ignore no-explicit-any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = any;

async function handle(stripe: Stripe, db: Db, event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode === "payment" && session.metadata?.kind === "setup_order") {
        await recordSetupOrder(db, session);
        return;
      }
      if (session.mode !== "subscription" || !session.subscription) return;
      const sub = await stripe.subscriptions.retrieve(String(session.subscription));
      await syncSubscription(db, sub, session.client_reference_id || session.metadata?.user_id || null);
      return;
    }
    case "charge.refunded": {
      // A full refund (from the Stripe dashboard) cancels the setup order.
      const charge = event.data.object as Stripe.Charge;
      if (!charge.refunded || !charge.payment_intent) return;
      const pi = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent.id;
      const { error } = await db.from("setup_orders").update({ status: "cancelled" }).eq("stripe_payment_intent_id", pi);
      if (error) throw new Error(`setup order cancel failed: ${error.message}`);
      return;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      await syncSubscription(db, sub, sub.metadata?.user_id || null);
      return;
    }
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const subId = invoiceSubscriptionId(invoice);
      if (!subId) return;
      const sub = await stripe.subscriptions.retrieve(subId);
      const userId = await syncSubscription(db, sub, sub.metadata?.user_id || null);
      // A failed charge locks the app even before Stripe flips the status.
      if (userId && sub.status !== "canceled") {
        await db.from("profiles").update({ subscription_status: "past_due", billing_updated_at: new Date().toISOString() }).eq("user_id", userId);
        await pauseAccount(db, userId);
      }
      return;
    }
    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;
      const subId = invoiceSubscriptionId(invoice);
      if (!subId || (invoice.amount_paid ?? 0) <= 0) return;
      const sub = await stripe.subscriptions.retrieve(subId);
      const userId = await syncSubscription(db, sub, sub.metadata?.user_id || null);
      if (userId) await maybeMakeFounding(stripe, db, sub, userId);
      return;
    }
  }
}

function invoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  // Moved to invoice.parent.subscription_details in API 2025-03-31.
  const inv = invoice as unknown as {
    parent?: { subscription_details?: { subscription?: string | { id: string } | null } | null } | null;
    subscription?: string | { id: string } | null;
  };
  const sub = inv.parent?.subscription_details?.subscription ?? inv.subscription ?? null;
  return sub ? String(typeof sub === "string" ? sub : sub.id) : null;
}

/** Writes the subscription onto the payer's profile. Returns their user id. */
async function syncSubscription(db: Db, sub: Stripe.Subscription, hintUserId: string | null): Promise<string | null> {
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const userId = await findUser(db, customerId, hintUserId);
  if (!userId) {
    console.warn(`[stripe-webhook] no profile for customer ${customerId} (sub ${sub.id})`);
    return null;
  }

  const { data: before } = await db.from("profiles").select("subscription_id, subscription_status").eq("user_id", userId).maybeSingle();
  // An old subscription's events must not overwrite a newer one.
  if (before?.subscription_id && before.subscription_id !== sub.id && sub.status === "canceled") {
    return userId;
  }

  const fields = profileFieldsFromSubscription(sub as unknown as StripeSubscriptionLike);
  const { error } = await db.from("profiles").update(fields).eq("user_id", userId);
  if (error) throw new Error(`profile update failed: ${error.message}`);

  const after = fields.subscription_status ?? before?.subscription_status;
  if ((after === "past_due" || after === "canceled") && before?.subscription_status !== after) {
    const paused = await pauseAccount(db, userId);
    console.log(`[stripe-webhook] ${userId} → ${after}; paused ${paused.agents} agents, ${paused.campaigns} campaigns`);
  }
  return userId;
}

async function findUser(db: Db, customerId: string, hintUserId: string | null): Promise<string | null> {
  if (hintUserId) {
    const { data } = await db.from("profiles").select("user_id").eq("user_id", hintUserId).maybeSingle();
    if (data) return data.user_id;
  }
  const { data: byCustomer } = await db.from("profiles").select("user_id").eq("stripe_customer_id", customerId).maybeSingle();
  if (byCustomer) return byCustomer.user_id;
  return null;
}

/**
 * Founding deal: the first N paid subscriptions on the launch price (only new
 * subscriptions use it, so existing customers never take a slot). The flag
 * keeps them on $97 if the list price rises; a coupon is attached when
 * FOUNDING_COUPON_ID is configured.
 */
async function maybeMakeFounding(stripe: Stripe, db: Db, sub: Stripe.Subscription, userId: string) {
  const launchPrice = Deno.env.get("STRIPE_PRICE_ID_MONTHLY");
  if (!launchPrice || sub.items.data[0]?.price?.id !== launchPrice) return;
  const { data: rank, error } = await db.rpc("claim_founding_slot", { _user_id: userId });
  if (error) throw new Error(`claim_founding_slot failed: ${error.message}`);
  if (!rank) return;
  console.log(`[stripe-webhook] ${userId} is founding customer #${rank}`);
  const coupon = Deno.env.get("FOUNDING_COUPON_ID");
  const hasCoupon = (sub.discounts ?? []).length > 0;
  if (coupon && !hasCoupon) {
    await stripe.subscriptions.update(sub.id, { discounts: [{ coupon }], metadata: { ...sub.metadata, founding: "true" } });
  }
}

/** Paid done-for-you setup. The unique payment-intent index makes replays harmless. */
async function recordSetupOrder(db: Db, session: Stripe.Checkout.Session) {
  const userId = session.metadata?.user_id;
  const pi = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
  if (!userId || !pi || session.payment_status !== "paid") return;
  const { error } = await db.from("setup_orders").insert({
    account_id: userId,
    stripe_payment_intent_id: pi,
    amount: session.amount_total ?? 0,
    status: "ordered",
  });
  if (error && error.code !== "23505") throw new Error(`setup order insert failed: ${error.message}`);
}
