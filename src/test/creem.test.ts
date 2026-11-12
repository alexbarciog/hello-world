import { describe, it, expect } from "vitest";
import {
  checkoutSuccessUrl,
  creemConfig,
  eventTime,
  hmacSha256Hex,
  subscriptionChange,
  timingSafeEqual,
  verifyCreemSignature,
  type CreemEvent,
} from "../../supabase/functions/_shared/creem";

const SECRET = "whsec_test_secret";
const sign = (body: string, secret = SECRET) => hmacSha256Hex(secret, body);
const USER = "8f14e45f-ceea-467a-9575-6a3f3c1f2b11";

// Shapes from Creem's OpenAPI spec (CheckoutEntity, SubscriptionEntity).
const subscription = {
  id: "sub_1",
  object: "subscription",
  mode: "test",
  product: { id: "prod_8DrR0dQIKFbUOxWUFFNY7", price: 9700, trial_period_days: 7 },
  customer: { id: "cust_1", email: "Founder@Example.com" },
  status: "trialing",
  current_period_start_date: "2026-11-03T10:00:00.000Z",
  current_period_end_date: "2026-11-10T10:00:00.000Z",
  canceled_at: null,
  metadata: { user_id: USER },
};

const event = (eventType: string, object: Record<string, unknown>): CreemEvent => ({
  id: `evt_${eventType}`,
  eventType,
  created_at: 1_793_700_000_000,
  object,
});

describe("webhook signature", () => {
  it("computes HMAC-SHA256 hex (RFC 4231 style known vector)", async () => {
    expect(await hmacSha256Hex("key", "The quick brown fox jumps over the lazy dog"))
      .toBe("f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8");
  });

  it("accepts the HMAC-SHA256 hex of the raw body", async () => {
    const body = JSON.stringify(event("subscription.active", subscription));
    expect(await verifyCreemSignature(body, await sign(body), SECRET)).toBe(true);
  });

  it("rejects a tampered body, a wrong secret or a missing header", async () => {
    const body = JSON.stringify(event("subscription.active", subscription));
    expect(await verifyCreemSignature(body.replace("trialing", "active"), await sign(body), SECRET)).toBe(false);
    expect(await verifyCreemSignature(body, await sign(body, "other"), SECRET)).toBe(false);
    expect(await verifyCreemSignature(body, null, SECRET)).toBe(false);
    expect(await verifyCreemSignature(body, await sign(body), "")).toBe(false);
  });

  it("compares strings of different lengths safely", () => {
    expect(timingSafeEqual("abc", "abc")).toBe(true);
    expect(timingSafeEqual("abc", "abd")).toBe(false);
    expect(timingSafeEqual("abc", "abcd")).toBe(false);
  });
});

describe("subscriptionChange", () => {
  it("reads a subscription.* event", () => {
    expect(subscriptionChange(event("subscription.trialing", subscription))).toEqual({
      creemSubscriptionId: "sub_1",
      creemCustomerId: "cust_1",
      productId: "prod_8DrR0dQIKFbUOxWUFFNY7",
      status: "trialing",
      currentPeriodEnd: "2026-11-10T10:00:00.000Z",
      trialEnd: "2026-11-10T10:00:00.000Z",
      canceledAt: null,
      email: "founder@example.com",
      userId: USER,
      mode: "test",
    });
  });

  it("reads checkout.completed, with the user from the checkout metadata", () => {
    const checkout = {
      id: "ch_1",
      object: "checkout",
      mode: "prod",
      status: "completed",
      product: { id: "prod_fwiKA9LGhkCUDvOixT18z" },
      customer: { id: "cust_1", email: "a@b.co" },
      subscription: { ...subscription, metadata: {} },
      metadata: { user_id: USER },
    };
    const change = subscriptionChange(event("checkout.completed", checkout));
    expect(change).toMatchObject({ creemSubscriptionId: "sub_1", status: "trialing", userId: USER, mode: "live", email: "a@b.co" });
  });

  it("handles a checkout that only carries the subscription id", () => {
    const change = subscriptionChange(event("checkout.completed", { id: "ch_1", subscription: "sub_9", customer: "cust_9", product: "prod_x" }));
    expect(change).toMatchObject({ creemSubscriptionId: "sub_9", creemCustomerId: "cust_9", status: null, email: null, userId: null });
  });

  it("returns null when there is no subscription (one-off payment)", () => {
    expect(subscriptionChange(event("checkout.completed", { id: "ch_1", order: { id: "ord_1" } }))).toBeNull();
  });

  it("marks subscription.expired as expired unless it renewed", () => {
    expect(subscriptionChange(event("subscription.expired", { ...subscription, status: "canceled" }))?.status).toBe("expired");
    expect(subscriptionChange(event("subscription.expired", { ...subscription, status: "active" }))?.status).toBe("active");
  });

  it("ignores unknown statuses and non-uuid user ids", () => {
    const change = subscriptionChange(event("subscription.update", { ...subscription, status: "weird", metadata: { user_id: "1 OR 1=1" } }));
    expect(change?.status).toBeNull();
    expect(change?.userId).toBeNull();
    expect(change?.trialEnd).toBeNull();
  });
});

describe("helpers", () => {
  it("reads event times in milliseconds or seconds", () => {
    expect(eventTime({ created_at: 1_793_700_000_000 })).toBe(new Date(1_793_700_000_000).toISOString());
    expect(eventTime({ created_at: 1_793_700_000 })).toBe(new Date(1_793_700_000_000).toISOString());
  });

  it("defaults to test mode with the test product and API", () => {
    const cfg = creemConfig();
    expect(cfg.mode).toBe("test");
    expect(cfg.baseUrl).toBe("https://test-api.creem.io");
    expect(cfg.productId).toBe("prod_8DrR0dQIKFbUOxWUFFNY7");
    expect(creemConfig("live")).toMatchObject({ baseUrl: "https://api.creem.io", productId: "prod_fwiKA9LGhkCUDvOixT18z", webhookSecretName: "CREEM_WEBHOOK_SECRET_LIVE" });
  });

  it("sends people back to the site, or to a local dev server", () => {
    expect(checkoutSuccessUrl("https://evil.example")).toBe("https://intentsly.com/app?checkout=success");
    expect(checkoutSuccessUrl(null)).toBe("https://intentsly.com/app?checkout=success");
    expect(checkoutSuccessUrl("http://localhost:8080")).toBe("http://localhost:8080/app?checkout=success");
  });
});
