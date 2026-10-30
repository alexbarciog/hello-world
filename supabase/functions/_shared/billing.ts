// Billing rules shared by the Stripe edge functions and the agent/sender
// gates. Pure functions only (no Deno or network imports) so the same code is
// unit-tested in src/test/billing.test.ts.

export type SubscriptionStatus = "legacy_free" | "trialing" | "active" | "past_due" | "canceled";

/**
 * - full:   trialing or active — everything on.
 * - legacy: an existing free account inside its grace window — keeps working
 *           exactly as before Epic 1 (callers apply their old checks).
 * - none:   read-only. Signals stop, the SDR is paused, "Reactivate" in the app.
 */
export type Access = "full" | "legacy" | "none";

export interface BillingRow {
  subscription_status: SubscriptionStatus | null;
  trial_started_at?: string | null;
  trial_ends_at?: string | null;
  current_period_end?: string | null;
  legacy_ends_at?: string | null;
  founding?: boolean | null;
}

export function decideAccess(
  row: BillingRow | null | undefined,
  now: Date = new Date(),
  opts: { paymentsEnabled?: boolean } = {},
): Access {
  const paymentsEnabled = opts.paymentsEnabled ?? true;
  switch (row?.subscription_status) {
    case "trialing":
    case "active":
      return "full";
    case "past_due":
    case "canceled":
      return "none";
    default:
      // While checkout is switched off nobody can pay, so nobody is locked out
      // for not paying: legacy and brand-new accounts keep the pre-Epic-1 rules.
      if (!paymentsEnabled) return "legacy";
      if (row?.subscription_status === "legacy_free" && row.legacy_ends_at && new Date(row.legacy_ends_at) > now) {
        return "legacy";
      }
      // Expired legacy account, or a new account that never finished checkout.
      return "none";
  }
}

/**
 * Stripe subscription status → our status. Returns null for states that don't
 * change access on their own (an `incomplete` first payment resolves into
 * active or incomplete_expired within minutes).
 */
export function mapStripeStatus(status: string): SubscriptionStatus | null {
  switch (status) {
    case "trialing":
      return "trialing";
    case "active":
      return "active";
    case "past_due":
    case "unpaid":
    case "paused":
      return "past_due";
    case "canceled":
    case "incomplete_expired":
      return "canceled";
    default:
      return null;
  }
}

const toIso = (unixSeconds: number | null | undefined) =>
  typeof unixSeconds === "number" && unixSeconds > 0 ? new Date(unixSeconds * 1000).toISOString() : null;

// Minimal shape of the Stripe subscription object we read. Since API version
// 2025-03-31 current_period_end lives on the subscription item.
export interface StripeSubscriptionLike {
  id: string;
  status: string;
  customer: string | { id: string };
  trial_start?: number | null;
  trial_end?: number | null;
  current_period_end?: number | null;
  items?: { data?: Array<{ current_period_end?: number | null; price?: { id?: string } | null }> };
}

/** Profile columns to write for a subscription (null status → leave status as is). */
export function profileFieldsFromSubscription(sub: StripeSubscriptionLike) {
  const item = sub.items?.data?.[0];
  const fields: Record<string, unknown> = {
    stripe_customer_id: typeof sub.customer === "string" ? sub.customer : sub.customer.id,
    subscription_id: sub.id,
    trial_started_at: toIso(sub.trial_start),
    trial_ends_at: toIso(sub.trial_end),
    current_period_end: toIso(item?.current_period_end ?? sub.current_period_end),
    plan_price_id: item?.price?.id ?? null,
    billing_updated_at: new Date().toISOString(),
  };
  const status = mapStripeStatus(sub.status);
  if (status) fields.subscription_status = status;
  // A paying or trialing account is no longer on the legacy clock.
  if (status === "trialing" || status === "active") fields.legacy_ends_at = null;
  return fields;
}

export function trialCapReached(signalsDelivered: number, cap: number): boolean {
  return cap > 0 && signalsDelivered >= cap;
}

export type BillingBanner =
  | { kind: "trial_ending"; endsAt: string; signalsLeft: number }
  | { kind: "locked"; status: "past_due" | "canceled" | "expired" | "no_subscription" }
  | { kind: "legacy"; endsAt: string }
  | null;

/**
 * Which banner the app shows. Trial: from day `bannerDay` on, or once the
 * signal cap is near (≤ 25% left). Legacy: always, so nobody is surprised.
 */
export function bannerFor(
  row: BillingRow | null | undefined,
  opts: { now?: Date; bannerDay: number; signalCap: number; signalsDelivered: number; paymentsEnabled?: boolean },
): BillingBanner {
  const now = opts.now ?? new Date();
  const access = decideAccess(row, now, { paymentsEnabled: opts.paymentsEnabled });
  if (access === "none") {
    const s = row?.subscription_status;
    if (s === "past_due" || s === "canceled") return { kind: "locked", status: s };
    if (s === "legacy_free") return { kind: "locked", status: "expired" };
    return { kind: "locked", status: "no_subscription" };
  }
  if (access === "legacy" && row?.subscription_status === "legacy_free" && row.legacy_ends_at && opts.paymentsEnabled !== false) {
    return { kind: "legacy", endsAt: row.legacy_ends_at };
  }
  if (row?.subscription_status === "trialing" && row.trial_ends_at) {
    const signalsLeft = Math.max(opts.signalCap - opts.signalsDelivered, 0);
    const started = row.trial_started_at ? new Date(row.trial_started_at) : null;
    const trialDay = started ? Math.floor((now.getTime() - started.getTime()) / 86_400_000) + 1 : 0;
    const nearCap = opts.signalCap > 0 && signalsLeft <= Math.ceil(opts.signalCap / 4);
    if (trialDay >= opts.bannerDay || nearCap) {
      return { kind: "trial_ending", endsAt: row.trial_ends_at, signalsLeft };
    }
  }
  return null;
}
