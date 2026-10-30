// Rules for the done-for-you setup. Pure functions, unit-tested in
// src/test/setup-orders.test.ts.
export const SETUP_PRICE_CENTS = 50_000;

export interface SetupIntake {
  business: string;
  ideal_customer: string;
  offer: string;
  example_clients: string[];
  linkedin_account: string;
  tried: string;
}

const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export function validateIntake(input: unknown): { ok: true; value: SetupIntake } | { ok: false; errors: string[] } {
  const o = (input ?? {}) as Record<string, unknown>;
  const value: SetupIntake = {
    business: text(o.business, 2000),
    ideal_customer: text(o.ideal_customer, 2000),
    offer: text(o.offer, 2000),
    example_clients: (Array.isArray(o.example_clients) ? o.example_clients : []).map((c) => text(c, 300)).filter(Boolean).slice(0, 3),
    linkedin_account: text(o.linkedin_account, 300),
    tried: text(o.tried, 2000),
  };
  const errors: string[] = [];
  if (!value.business) errors.push("Tell us about your business.");
  if (!value.ideal_customer) errors.push("Describe your ideal customer.");
  if (!value.offer) errors.push("Describe your offer.");
  if (value.example_clients.length < 3) errors.push("Add 3 example clients.");
  if (!/linkedin\.com\/in\//i.test(value.linkedin_account)) errors.push("Add the LinkedIn profile URL to use (linkedin.com/in/…).");
  return errors.length ? { ok: false, errors } : { ok: true, value };
}

export const canBuySetup = (status: string | null | undefined) => status === "trialing" || status === "active";

/** Allowed moves. A delivered or cancelled order is final, apart from a refund. */
export function canMoveTo(from: string, to: string): boolean {
  if (from === to) return false;
  if (to === "cancelled") return from !== "cancelled";
  if (from === "ordered") return to === "scheduled" || to === "delivered";
  if (from === "scheduled") return to === "ordered" || to === "delivered";
  return false;
}
