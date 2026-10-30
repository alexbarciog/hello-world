import { describe, it, expect } from "vitest";
import {
  bannerFor,
  decideAccess,
  mapStripeStatus,
  profileFieldsFromSubscription,
  trialCapReached,
} from "../../supabase/functions/_shared/billing";

const NOW = new Date("2026-11-10T12:00:00Z");
const days = (n: number) => new Date(NOW.getTime() + n * 86_400_000).toISOString();

describe("decideAccess", () => {
  it("gives trialing and active accounts full access", () => {
    expect(decideAccess({ subscription_status: "trialing" }, NOW)).toBe("full");
    expect(decideAccess({ subscription_status: "active" }, NOW)).toBe("full");
  });

  it("locks past_due and canceled accounts", () => {
    expect(decideAccess({ subscription_status: "past_due" }, NOW)).toBe("none");
    expect(decideAccess({ subscription_status: "canceled" }, NOW)).toBe("none");
  });

  it("treats accounts without a plan as never subscribed: locked until they start a trial", () => {
    expect(decideAccess({ subscription_status: null }, NOW)).toBe("none");
    expect(decideAccess(null, NOW)).toBe("none");
  });

  it("locks nobody for not paying while checkout is switched off", () => {
    const off = { paymentsEnabled: false };
    expect(decideAccess({ subscription_status: null }, NOW, off)).toBe("legacy");
    expect(decideAccess(null, NOW, off)).toBe("legacy");
    // ...but a failed payment or a cancellation still locks.
    expect(decideAccess({ subscription_status: "past_due" }, NOW, off)).toBe("none");
  });
});

describe("mapStripeStatus", () => {
  it("maps Stripe statuses onto ours", () => {
    expect(mapStripeStatus("trialing")).toBe("trialing");
    expect(mapStripeStatus("active")).toBe("active");
    expect(mapStripeStatus("past_due")).toBe("past_due");
    expect(mapStripeStatus("unpaid")).toBe("past_due");
    expect(mapStripeStatus("canceled")).toBe("canceled");
    expect(mapStripeStatus("incomplete_expired")).toBe("canceled");
    expect(mapStripeStatus("incomplete")).toBeNull();
  });
});

describe("profileFieldsFromSubscription", () => {
  it("reads the period end from the subscription item (current Stripe API)", () => {
    const fields = profileFieldsFromSubscription({
      id: "sub_1",
      status: "trialing",
      customer: "cus_1",
      trial_start: 1_790_000_000,
      trial_end: 1_790_604_800,
      items: { data: [{ current_period_end: 1_790_604_800, price: { id: "price_97" } }] },
    });
    expect(fields).toMatchObject({
      stripe_customer_id: "cus_1",
      subscription_id: "sub_1",
      subscription_status: "trialing",
      plan_price_id: "price_97",
    });
    expect(fields.trial_ends_at).toBe(new Date(1_790_604_800 * 1000).toISOString());
    expect(fields.current_period_end).toBe(new Date(1_790_604_800 * 1000).toISOString());
  });

  it("leaves the status alone for in-between Stripe states", () => {
    const fields = profileFieldsFromSubscription({ id: "sub_1", status: "incomplete", customer: { id: "cus_1" } });
    expect(fields).not.toHaveProperty("subscription_status");
    expect(fields.stripe_customer_id).toBe("cus_1");
  });
});

describe("trial cap", () => {
  it("ends the trial at the cap, not before", () => {
    expect(trialCapReached(19, 20)).toBe(false);
    expect(trialCapReached(20, 20)).toBe(true);
    expect(trialCapReached(50, 0)).toBe(false); // cap disabled
  });
});

describe("bannerFor", () => {
  const trial = (startedDaysAgo: number) => ({
    subscription_status: "trialing" as const,
    trial_started_at: days(-startedDaysAgo),
    trial_ends_at: days(7 - startedDaysAgo),
  });
  const opts = { now: NOW, bannerDay: 5, signalCap: 20 };

  it("is quiet early in the trial", () => {
    expect(bannerFor(trial(1), { ...opts, signalsDelivered: 3 })).toBeNull();
  });

  it("warns from day 5", () => {
    expect(bannerFor(trial(4), { ...opts, signalsDelivered: 3 })).toMatchObject({ kind: "trial_ending", signalsLeft: 17 });
  });

  it("warns early when the signal cap is close", () => {
    expect(bannerFor(trial(1), { ...opts, signalsDelivered: 16 })).toMatchObject({ kind: "trial_ending", signalsLeft: 4 });
  });

  it("shows the lock reason when there is no access", () => {
    expect(bannerFor({ subscription_status: "past_due" }, { ...opts, signalsDelivered: 0 })).toEqual({ kind: "locked", status: "past_due" });
    expect(bannerFor({ subscription_status: null }, { ...opts, signalsDelivered: 0 })).toEqual({ kind: "locked", status: "no_subscription" });
  });

  it("shows nothing to accounts without a plan while checkout is off", () => {
    expect(bannerFor({ subscription_status: null }, { ...opts, signalsDelivered: 0, paymentsEnabled: false })).toBeNull();
  });
});
