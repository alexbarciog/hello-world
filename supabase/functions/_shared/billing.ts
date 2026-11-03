// Billing rules shared by the Creem edge functions and the agent/sender gates.
// Pure functions only (no Deno or network imports) so the same code is
// unit-tested in src/test/billing.test.ts.

/** public.subscriptions.status (Creem's statuses plus `expired`). */
export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "paused"
  | "scheduled_cancel"
  | "canceled"
  | "expired"
  | "unpaid";

/** Statuses that still unlock the product, until current_period_end. */
export const PAYING_STATUSES: SubscriptionStatus[] = ["trialing", "active", "scheduled_cancel"];

/**
 * - full:   paying (see isPaying): everything on.
 * - legacy: Creem is in test mode, so nobody can pay and nobody is locked for
 *           not paying. Callers apply the pre-Creem checks.
 * - none:   read-only. Signals stop, the SDR is paused, one button to fix it.
 */
export type Access = "full" | "legacy" | "none";

/** A public.subscriptions row (the columns access depends on). */
export interface BillingRow {
  status: SubscriptionStatus | null;
  current_period_end?: string | null;
  trial_end?: string | null;
  cancel_at_period_end?: boolean | null;
  founding?: boolean | null;
  updated_at?: string | null;
}

/** Same rule as the SQL function public.is_paying(). */
export function isPaying(row: BillingRow | null | undefined, now: Date = new Date()): boolean {
  if (!row?.status || !PAYING_STATUSES.includes(row.status) || !row.current_period_end) return false;
  return new Date(row.current_period_end).getTime() > now.getTime();
}

/** The row that decides an account's access: a paying one if any, else the most recently updated. */
export function currentSubscription<T extends BillingRow>(rows: T[] | null | undefined, now: Date = new Date()): T | null {
  if (!rows?.length) return null;
  const paying = rows.find((r) => isPaying(r, now));
  if (paying) return paying;
  return [...rows].sort((a, b) => (b.updated_at ?? "").localeCompare(a.updated_at ?? ""))[0];
}

export function decideAccess(
  row: BillingRow | null | undefined,
  now: Date = new Date(),
  opts: { paymentsEnabled?: boolean } = {},
): Access {
  if (isPaying(row, now)) return "full";
  // Had a subscription that no longer pays (failed payment, canceled, ended).
  if (row?.status) return "none";
  // Never subscribed (existing free accounts included). While Creem is in test
  // mode they keep the pre-Creem rules; once it's live they need a plan.
  return (opts.paymentsEnabled ?? true) ? "none" : "legacy";
}

export type BillingBanner =
  | { kind: "trial"; endsAt: string }
  | { kind: "ending"; endsAt: string }
  | { kind: "payment_failed" }
  | { kind: "locked"; status: "canceled" | "expired" | "paused" | "no_subscription" }
  | null;

/** Which banner the app shows at the top. */
export function bannerFor(
  row: BillingRow | null | undefined,
  opts: { now?: Date; paymentsEnabled?: boolean } = {},
): BillingBanner {
  const now = opts.now ?? new Date();
  const access = decideAccess(row, now, { paymentsEnabled: opts.paymentsEnabled });
  if (access === "legacy") return null;
  if (access === "full") {
    const end = row?.trial_end ?? row?.current_period_end;
    if (row?.status === "trialing" && end) return { kind: "trial", endsAt: end };
    if (row?.status === "scheduled_cancel" && row.current_period_end) return { kind: "ending", endsAt: row.current_period_end };
    return null;
  }
  switch (row?.status) {
    case "past_due":
    case "unpaid":
      return { kind: "payment_failed" };
    case "canceled":
    case "paused":
      return { kind: "locked", status: row.status };
    case undefined:
    case null:
      return { kind: "locked", status: "no_subscription" };
    default:
      // trialing/active/scheduled_cancel whose period ended without a renewal, or expired.
      return { kind: "locked", status: "expired" };
  }
}
