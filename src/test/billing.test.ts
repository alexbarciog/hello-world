import { describe, it, expect } from "vitest";
import { bannerFor, currentSubscription, decideAccess, isPaying } from "../../supabase/functions/_shared/billing";
import { mapStripeStatus, profileFieldsFromSubscription } from "../../supabase/functions/_shared/stripe-billing";

const NOW = new Date("2026-11-10T12:00:00Z");
const days = (n: number) => new Date(NOW.getTime() + n * 86_400_000).toISOString();

describe("isPaying (same rule as SQL is_paying)", () => {
  it("counts trialing, active and scheduled_cancel until the period ends", () => {
    for (const status of ["trialing", "active", "scheduled_cancel"] as const) {
      expect(isPaying({ status, current_period_end: days(3) }, NOW)).toBe(true);
      expect(isPaying({ status, current_period_end: days(-1) }, NOW)).toBe(false);
    }
  });

  it("never counts failed, paused or ended subscriptions", () => {
    for (const status of ["past_due", "unpaid", "paused", "canceled", "expired"] as const) {
      expect(isPaying({ status, current_period_end: days(3) }, NOW)).toBe(false);
    }
  });

  it("needs a period end", () => {
    expect(isPaying({ status: "active", current_period_end: null }, NOW)).toBe(false);
    expect(isPaying(null, NOW)).toBe(false);
  });
});

describe("currentSubscription", () => {
  it("prefers a paying row over a newer ended one", () => {
    const rows = [
      { status: "active" as const, current_period_end: days(10), updated_at: days(-5) },
      { status: "canceled" as const, current_period_end: days(-20), updated_at: days(-1) },
    ];
    expect(currentSubscription(rows, NOW)?.status).toBe("active");
  });

  it("otherwise takes the most recently updated", () => {
    const rows = [
      { status: "canceled" as const, current_period_end: days(-40), updated_at: days(-30) },
      { status: "past_due" as const, current_period_end: days(-1), updated_at: days(-1) },
    ];
    expect(currentSubscription(rows, NOW)?.status).toBe("past_due");
    expect(currentSubscription([], NOW)).toBeNull();
  });
});

describe("decideAccess", () => {
  it("gives paying accounts full access", () => {
    expect(decideAccess({ status: "trialing", current_period_end: days(5) }, NOW)).toBe("full");
    expect(decideAccess({ status: "scheduled_cancel", current_period_end: days(5) }, NOW)).toBe("full");
  });

  it("locks accounts whose subscription stopped paying, in test and live mode", () => {
    expect(decideAccess({ status: "past_due", current_period_end: days(5) }, NOW)).toBe("none");
    expect(decideAccess({ status: "canceled", current_period_end: days(5) }, NOW, { paymentsEnabled: false })).toBe("none");
    expect(decideAccess({ status: "scheduled_cancel", current_period_end: days(-1) }, NOW)).toBe("none");
  });

  it("locks accounts that never subscribed once Creem is live", () => {
    expect(decideAccess(null, NOW)).toBe("none");
  });

  it("keeps the old rules for accounts without a subscription while Creem is in test mode", () => {
    expect(decideAccess(null, NOW, { paymentsEnabled: false })).toBe("legacy");
  });
});

describe("bannerFor", () => {
  it("shows the trial end date during the trial", () => {
    expect(bannerFor({ status: "trialing", current_period_end: days(5), trial_end: days(5) }, { now: NOW })).toEqual({ kind: "trial", endsAt: days(5) });
  });

  it("says when a cancelled subscription stops", () => {
    expect(bannerFor({ status: "scheduled_cancel", current_period_end: days(9) }, { now: NOW })).toEqual({ kind: "ending", endsAt: days(9) });
  });

  it("is quiet for active subscriptions", () => {
    expect(bannerFor({ status: "active", current_period_end: days(20) }, { now: NOW })).toBeNull();
  });

  it("asks for a new card when a payment failed", () => {
    expect(bannerFor({ status: "past_due", current_period_end: days(2) }, { now: NOW })).toEqual({ kind: "payment_failed" });
    expect(bannerFor({ status: "unpaid", current_period_end: days(-2) }, { now: NOW })).toEqual({ kind: "payment_failed" });
  });

  it("shows why the account is locked", () => {
    expect(bannerFor({ status: "canceled", current_period_end: days(-2) }, { now: NOW })).toEqual({ kind: "locked", status: "canceled" });
    expect(bannerFor({ status: "active", current_period_end: days(-2) }, { now: NOW })).toEqual({ kind: "locked", status: "expired" });
    expect(bannerFor(null, { now: NOW })).toEqual({ kind: "locked", status: "no_subscription" });
  });

  it("shows nothing to accounts without a subscription while Creem is in test mode", () => {
    expect(bannerFor(null, { now: NOW, paymentsEnabled: false })).toBeNull();
  });
});

describe("Stripe profile sync (setup orders webhook)", () => {
  it("maps Stripe statuses", () => {
    expect(mapStripeStatus("unpaid")).toBe("past_due");
    expect(mapStripeStatus("incomplete_expired")).toBe("canceled");
    expect(mapStripeStatus("incomplete")).toBeNull();
  });

  it("reads the period end from the subscription item", () => {
    const fields = profileFieldsFromSubscription({
      id: "sub_1",
      status: "trialing",
      customer: "cus_1",
      items: { data: [{ current_period_end: 1_790_604_800, price: { id: "price_97" } }] },
    });
    expect(fields).toMatchObject({ stripe_customer_id: "cus_1", subscription_status: "trialing", plan_price_id: "price_97" });
    expect(fields.current_period_end).toBe(new Date(1_790_604_800 * 1000).toISOString());
  });
});
