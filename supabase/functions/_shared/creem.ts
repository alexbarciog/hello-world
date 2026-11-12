// Creem (merchant of record) settings and the pure parts of the webhook.
// CREEM_MODE=test|live (default test) picks the API base URL, API key, product
// and webhook secret together. Field names follow Creem's OpenAPI spec
// (https://api.creem.io/open-api/json). Imported by Vitest under Node too, so
// Deno is read defensively; see src/test/creem.test.ts.
import type { SubscriptionStatus } from "./billing.ts";

const env = (globalThis as { Deno?: { env: { get(key: string): string | undefined } } }).Deno?.env;

export type CreemMode = "test" | "live";

export const CREEM_MODE: CreemMode = env?.get("CREEM_MODE") === "live" ? "live" : "test";

/**
 * Billing is enforced only in live mode: accounts without a plan become
 * read-only. In test mode they keep the pre-Creem rules, so real users aren't
 * locked out while nobody can pay yet.
 */
export const BILLING_LIVE = CREEM_MODE === "live";

const PRODUCT_IDS: Record<CreemMode, string> = {
  live: "prod_fwiKA9LGhkCUDvOixT18z",
  test: "prod_8DrR0dQIKFbUOxWUFFNY7",
};

export function creemConfig(mode: CreemMode = CREEM_MODE) {
  const suffix = mode === "live" ? "LIVE" : "TEST";
  return {
    mode,
    baseUrl: mode === "live" ? "https://api.creem.io" : "https://test-api.creem.io",
    apiKeyName: `CREEM_API_KEY_${suffix}`,
    apiKey: env?.get(`CREEM_API_KEY_${suffix}`) ?? "",
    productId: PRODUCT_IDS[mode],
    webhookSecretName: `CREEM_WEBHOOK_SECRET_${suffix}`,
    webhookSecret: env?.get(`CREEM_WEBHOOK_SECRET_${suffix}`) ?? "",
  };
}

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

/** Where Creem sends people after paying: the site, or a local dev server when testing. */
export function checkoutSuccessUrl(origin: string | null): string {
  let base = env?.get("SITE_URL") || "https://intentsly.com";
  try {
    if (origin && ["localhost", "127.0.0.1"].includes(new URL(origin).hostname)) base = origin;
  } catch {
    // not a URL
  }
  return `${base}/app?checkout=success`;
}

/** POST to the Creem API. Throws with the status and a short body on failure. */
export async function creemPost<T>(path: string, body: unknown, cfg = creemConfig()): Promise<T> {
  if (!cfg.apiKey) throw new Error(`${cfg.apiKeyName} is not set`);
  const res = await fetch(`${cfg.baseUrl}${path}`, {
    method: "POST",
    headers: { "x-api-key": cfg.apiKey, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Creem ${path} ${res.status}: ${text.slice(0, 300)}`);
  return JSON.parse(text) as T;
}

// ── Webhook signature ───────────────────────────────────────────────────────

export async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(message)));
  return Array.from(sig, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Compares every character, so the time taken doesn't reveal where two strings differ. */
export function timingSafeEqual(a: string, b: string): boolean {
  let diff = a.length ^ b.length;
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}

/** creem-signature = hex HMAC-SHA256 of the raw request body with the webhook secret. */
export async function verifyCreemSignature(rawBody: string, signature: string | null, secret: string): Promise<boolean> {
  if (!signature || !secret) return false;
  const expected = await hmacSha256Hex(secret, rawBody);
  return timingSafeEqual(expected, signature.trim().toLowerCase());
}

// ── Webhook events ──────────────────────────────────────────────────────────

// deno-lint-ignore no-explicit-any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Obj = Record<string, any>;

export interface CreemEvent {
  id: string;
  eventType: string;
  created_at: number;
  object: Obj;
}

export const SUBSCRIPTION_EVENTS = [
  "checkout.completed",
  "subscription.trialing",
  "subscription.active",
  "subscription.paid",
  "subscription.update",
  "subscription.past_due",
  "subscription.unpaid",
  "subscription.paused",
  "subscription.scheduled_cancel",
  "subscription.canceled",
  "subscription.expired",
];

const STATUSES: SubscriptionStatus[] = [
  "trialing", "active", "past_due", "paused", "scheduled_cancel", "canceled", "expired", "unpaid",
];

export interface SubscriptionChange {
  creemSubscriptionId: string;
  creemCustomerId: string | null;
  productId: string | null;
  /** null when the event doesn't carry the subscription's status. */
  status: SubscriptionStatus | null;
  currentPeriodEnd: string | null;
  /** Only known while trialing: the trial ends with the first period. */
  trialEnd: string | null;
  canceledAt: string | null;
  email: string | null;
  /** metadata.user_id set by creem-checkout. */
  userId: string | null;
  mode: CreemMode;
}

const idOf = (v: unknown): string | null =>
  typeof v === "string" ? v : v && typeof v === "object" && typeof (v as Obj).id === "string" ? (v as Obj).id : null;

const isoOrNull = (v: unknown): string | null => {
  if (typeof v !== "string" || !v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Event created_at (Creem sends milliseconds) as an ISO date. */
export function eventTime(event: Pick<CreemEvent, "created_at">): string {
  const n = Number(event.created_at);
  if (!Number.isFinite(n) || n <= 0) return new Date().toISOString();
  return new Date(n < 1e12 ? n * 1000 : n).toISOString();
}

/**
 * The subscription a checkout.completed or subscription.* event describes, or
 * null when it carries none (e.g. a one-off payment).
 */
export function subscriptionChange(event: CreemEvent): SubscriptionChange | null {
  const obj = event.object ?? {};
  const isCheckout = event.eventType === "checkout.completed";
  const sub: Obj | null = isCheckout ? (typeof obj.subscription === "object" ? obj.subscription : null) : obj;
  const subId = isCheckout ? idOf(obj.subscription) : idOf(obj);
  if (!subId) return null;

  const customer = obj.customer;
  const metadata = (isCheckout ? obj.metadata : null) ?? sub?.metadata ?? {};
  const raw = sub?.status;
  let status: SubscriptionStatus | null = STATUSES.includes(raw) ? raw : null;
  // subscription.expired leaves the status as it was; the period is over unless it renewed.
  if (event.eventType === "subscription.expired" && status !== "active" && status !== "trialing") status = "expired";

  const currentPeriodEnd = isoOrNull(sub?.current_period_end_date);
  const userId = typeof metadata?.user_id === "string" && UUID.test(metadata.user_id) ? metadata.user_id : null;
  return {
    creemSubscriptionId: subId,
    creemCustomerId: idOf(customer),
    productId: idOf(obj.product),
    status,
    currentPeriodEnd,
    trialEnd: status === "trialing" ? currentPeriodEnd : null,
    canceledAt: isoOrNull(sub?.canceled_at),
    email: typeof customer === "object" && typeof customer?.email === "string" ? customer.email.toLowerCase() : null,
    userId,
    mode: (obj.mode ?? sub?.mode) === "prod" ? "live" : "test",
  };
}
