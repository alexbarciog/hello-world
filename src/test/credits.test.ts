import { describe, expect, it } from "vitest";
import { DEFAULT_COSTS, leadAction } from "../../supabase/functions/_shared/credits";
import { type BillingPlan, LEGACY_PRODUCT_IDS, planForProduct, productForPlan } from "../../supabase/functions/_shared/creem";

const plans: BillingPlan[] = [
  { key: "starter", name: "Starter", price_cents: 2900, monthly_credits: 300, creem_product_id_test: "prod_s_t", creem_product_id_live: "prod_s_l" },
  { key: "growth", name: "Growth", price_cents: 6800, monthly_credits: 900, creem_product_id_test: "prod_g_t", creem_product_id_live: null },
  { key: "pro", name: "Pro", price_cents: 9700, monthly_credits: 1600, creem_product_id_test: null, creem_product_id_live: null },
];

describe("credit costs", () => {
  it("matches the decided price list", () => {
    expect(DEFAULT_COSTS).toEqual({ lead_1: 1, lead_2: 3, lead_3: 5, connection: 1, ai_message: 5, template_message: 2 });
  });

  it("charges leads by fire level and nothing below one fire", () => {
    expect(leadAction(0)).toBeNull();
    expect(leadAction(null)).toBeNull();
    expect(leadAction(1)).toBe("lead_1");
    expect(leadAction(2)).toBe("lead_2");
    expect(leadAction(3)).toBe("lead_3");
    expect(leadAction(7)).toBe("lead_3");
  });
});

describe("plans and Creem products", () => {
  it("finds the plan for a product in the right mode", () => {
    expect(planForProduct(plans, "prod_s_t", "test")?.key).toBe("starter");
    expect(planForProduct(plans, "prod_s_t", "live")).toBeNull();
    expect(planForProduct(plans, "prod_s_l", "live")?.key).toBe("starter");
    expect(planForProduct(plans, null, "test")).toBeNull();
  });

  it("treats the original $97 product as Pro", () => {
    expect(planForProduct(plans, LEGACY_PRODUCT_IDS.live, "live")?.key).toBe("pro");
    expect(planForProduct(plans, LEGACY_PRODUCT_IDS.test, "test")?.key).toBe("pro");
  });

  it("has no product until Alex sets one", () => {
    expect(productForPlan(plans[1], "live")).toBeNull();
    expect(productForPlan(plans[1], "test")).toBe("prod_g_t");
  });
});
