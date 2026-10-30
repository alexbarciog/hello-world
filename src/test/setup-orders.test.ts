import { describe, it, expect } from "vitest";
import { canBuySetup, canMoveTo, validateIntake } from "../../supabase/functions/_shared/setup-orders";

const good = {
  business: "A web design studio", ideal_customer: "Founders of 10-50 person SaaS", offer: "Fixed-price redesigns",
  example_clients: ["Acme", "Globex", "Initech"], linkedin_account: "https://www.linkedin.com/in/dana", tried: "Cold email",
};

describe("validateIntake", () => {
  it("accepts a complete intake and drops unknown fields", () => {
    const r = validateIntake({ ...good, role: "admin" });
    expect(r.ok).toBe(true);
    expect("role" in (r as { value: object }).value).toBe(false);
  });

  it("names everything that's missing", () => {
    const r = validateIntake({ example_clients: ["Only one"], linkedin_account: "dana" });
    expect((r as { errors: string[] }).errors).toEqual([
      "Tell us about your business.", "Describe your ideal customer.", "Describe your offer.",
      "Add 3 example clients.", "Add the LinkedIn profile URL to use (linkedin.com/in/…).",
    ]);
  });

  it("'what you tried' is optional; only 3 clients are kept", () => {
    const r = validateIntake({ ...good, tried: "", example_clients: ["a", "b", "c", "d"] });
    expect((r as { value: { example_clients: string[] } }).value.example_clients).toHaveLength(3);
  });
});

describe("rules", () => {
  it("sells only to trialing and active accounts", () => {
    expect(canBuySetup("trialing")).toBe(true);
    expect(canBuySetup("active")).toBe(true);
    for (const s of ["past_due", "canceled", "legacy_free", null, undefined]) expect(canBuySetup(s)).toBe(false);
  });

  it("keeps delivered and cancelled final, except that a refund can cancel", () => {
    expect(canMoveTo("ordered", "scheduled")).toBe(true);
    expect(canMoveTo("scheduled", "delivered")).toBe(true);
    expect(canMoveTo("delivered", "ordered")).toBe(false);
    expect(canMoveTo("cancelled", "ordered")).toBe(false);
    expect(canMoveTo("delivered", "cancelled")).toBe(true);
    expect(canMoveTo("cancelled", "cancelled")).toBe(false);
  });
});
