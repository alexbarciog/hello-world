// Creem webhook: keeps public.subscriptions in sync and tells Alex's ops about
// new customers, refunds and disputes.
// - creem-signature: hex HMAC-SHA256 of the raw body with the webhook secret
//   (CREEM_WEBHOOK_SECRET_TEST / _LIVE, picked by CREEM_MODE); 401 otherwise.
// - Every event is stored in billing_events first; a repeated event id is
//   acknowledged and skipped. Processing errors are logged on that row and
//   still answered with 200, so Creem doesn't retry into the same error.
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { PAYING_STATUSES } from "../_shared/billing.ts";
import {
  type CreemEvent,
  creemConfig,
  eventTime,
  json,
  subscriptionChange,
  SUBSCRIPTION_EVENTS,
  verifyCreemSignature,
} from "../_shared/creem.ts";

const ALEX_MAILBOX = "alex@intentsly.com";

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false },
});

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const raw = await req.text();
  const cfg = creemConfig();
  if (!cfg.webhookSecret) {
    console.error(`[creem-webhook] ${cfg.webhookSecretName} is not set`);
    return json({ error: "Webhook not configured" }, 500);
  }
  if (!(await verifyCreemSignature(raw, req.headers.get("creem-signature"), cfg.webhookSecret))) {
    console.warn("[creem-webhook] rejected: bad signature");
    return json({ error: "Invalid signature" }, 401);
  }

  let event: CreemEvent;
  try {
    event = JSON.parse(raw);
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }
  if (!event?.id || !event.eventType) return json({ error: "Not a Creem event" }, 400);

  const { error: insertError } = await db
    .from("billing_events")
    .insert({ event_id: event.id, event_type: event.eventType, payload: event, raw_body: raw, signature: req.headers.get("creem-signature") });
  if (insertError) {
    if (insertError.code === "23505") return json({ received: true, duplicate: true });
    console.error("[creem-webhook] could not record event", insertError.message);
    return json({ error: "Could not record event" }, 500);
  }

  let error: string | null = null;
  try {
    await handle(event);
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
    console.error(`[creem-webhook] ${event.eventType} ${event.id}:`, error);
  }
  await db.from("billing_events").update({ processed_at: new Date().toISOString(), error }).eq("event_id", event.id);
  return json({ received: true });
});

async function handle(event: CreemEvent) {
  if (event.eventType === "refund.created" || event.eventType === "dispute.created") {
    await notifyMoneyBack(event);
    return;
  }
  if (!SUBSCRIPTION_EVENTS.includes(event.eventType)) return; // stored for the audit trail only

  const change = subscriptionChange(event);
  if (!change) return;

  const { data: existing } = await db
    .from("subscriptions")
    .select("id, user_id, status, founding, last_event_at")
    .eq("creem_subscription_id", change.creemSubscriptionId)
    .maybeSingle();

  const at = eventTime(event);
  if (existing?.last_event_at && new Date(existing.last_event_at).getTime() > new Date(at).getTime()) {
    console.log(`[creem-webhook] skipped older ${event.eventType} for ${change.creemSubscriptionId}`);
    return;
  }

  const userId = existing?.user_id ?? (await findUser(change.userId, change.email));
  if (!userId) throw new Error(`No account for subscription ${change.creemSubscriptionId} (${change.email ?? "no email"})`);

  // checkout.completed may carry only the subscription id; the subscription.* event fills the rest.
  if (!existing && !change.status) return;

  const now = new Date().toISOString();
  const row: Record<string, unknown> = {
    user_id: userId,
    creem_subscription_id: change.creemSubscriptionId,
    mode: change.mode,
    last_event_at: at,
    updated_at: now,
  };
  if (change.creemCustomerId) row.creem_customer_id = change.creemCustomerId;
  if (change.productId) row.product_id = change.productId;
  if (change.status) {
    row.status = change.status;
    row.cancel_at_period_end = change.status === "scheduled_cancel";
  }
  if (change.currentPeriodEnd) row.current_period_end = change.currentPeriodEnd;
  if (change.trialEnd) row.trial_end = change.trialEnd;
  if (change.canceledAt) row.canceled_at = change.canceledAt;

  const { error } = await db.from("subscriptions").upsert(row, { onConflict: "creem_subscription_id" });
  if (error) throw new Error(`subscriptions upsert failed: ${error.message}`);
  console.log(`[creem-webhook] ${event.eventType}: ${change.creemSubscriptionId} → ${change.status ?? existing?.status} (${userId})`);

  // Founding: the first activation (first real payment) while slots are left.
  let founding = Boolean(existing?.founding);
  if (change.status === "active" && !founding) {
    const { data, error: rpcError } = await db.rpc("claim_founding_subscription", {
      _creem_subscription_id: change.creemSubscriptionId,
    });
    if (rpcError) throw new Error(`claim_founding_subscription failed: ${rpcError.message}`);
    founding = data === true;
    if (founding) console.log(`[creem-webhook] ${userId} is a founding customer`);
  }

  if (!existing && change.status && PAYING_STATUSES.includes(change.status)) {
    await notifyNewSubscription(event, change.email ?? (await emailOf(userId)), change.status, change.mode);
  }
}

async function findUser(hint: string | null, email: string | null): Promise<string | null> {
  if (hint) {
    const { data } = await db.auth.admin.getUserById(hint);
    if (data?.user) return data.user.id;
  }
  if (!email) return null;
  const { data } = await db.rpc("user_id_by_email", { _email: email });
  return typeof data === "string" ? data : null;
}

async function emailOf(userId: string): Promise<string | null> {
  const { data } = await db.auth.admin.getUserById(userId);
  return data?.user?.email?.toLowerCase() ?? null;
}

const escapeLike = (s: string) => s.replace(/[\\%_]/g, (c) => `\\${c}`);

/** Alex's ops: the prospect becomes a customer, and the inbox desk / weekly review see it. */
async function notifyNewSubscription(event: CreemEvent, email: string | null, status: string, mode: string) {
  if (!email) return;
  // Test checkouts don't touch the prospect list.
  if (mode === "live") {
    const { error } = await db
      .from("ops_prospects")
      .update({ status: "customer", updated_at: new Date().toISOString() })
      .ilike("email", escapeLike(email));
    if (error) console.error("[creem-webhook] ops_prospects update failed", error.message);
  }
  await inbox(event, `New subscription: ${email}`, email, `Creem ${mode} subscription started (${status}). Event ${event.id}.`, mode);
}

async function notifyMoneyBack(event: CreemEvent) {
  const obj = event.object ?? {};
  const customer = obj.customer;
  const email = typeof customer === "object" && customer?.email ? String(customer.email).toLowerCase() : null;
  const amount = obj.refund_amount ?? obj.amount;
  const currency = obj.refund_currency ?? obj.currency ?? "";
  const kind = event.eventType === "refund.created" ? "Refund" : "Dispute";
  const mode = obj.mode === "prod" ? "live" : "test";
  await inbox(event, `${kind}: ${email ?? "unknown customer"}`, email, `Creem ${mode} ${kind.toLowerCase()} of ${typeof amount === "number" ? (amount / 100).toFixed(2) : "?"} ${currency}. Event ${event.id}.`, mode);
}

async function inbox(event: CreemEvent, subject: string, fromEmail: string | null, body: string, mode: string) {
  const { error } = await db.from("support_messages").insert({
    message_id: `creem:${event.id}`,
    mailbox: ALEX_MAILBOX,
    direction: "in",
    category: "billing",
    status: "drafted",
    subject: mode === "test" ? `[TEST] ${subject}` : subject,
    from_email: fromEmail,
    to_email: ALEX_MAILBOX,
    body_text: body,
    received_at: new Date().toISOString(),
  });
  if (error && error.code !== "23505") console.error("[creem-webhook] support_messages insert failed", error.message);
}
