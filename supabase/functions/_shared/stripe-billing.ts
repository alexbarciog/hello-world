// Stripe subscription → profile columns, kept for stripe-webhook (which also
// records done-for-you setup orders). Subscriptions are billed through Creem
// now; these profile columns no longer decide access (see billing.ts).
// Pure functions only, unit-tested in src/test/billing.test.ts.

export type StripeProfileStatus = "trialing" | "active" | "past_due" | "canceled";

/**
 * Stripe subscription status → profile status. Returns null for states that
 * don't change anything on their own (an `incomplete` first payment resolves
 * into active or incomplete_expired within minutes).
 */
export function mapStripeStatus(status: string): StripeProfileStatus | null {
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
  return fields;
}
