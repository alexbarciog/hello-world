import { describe, it, expect } from "vitest";
import { PAYMENTS_ENABLED, disabledPaymentsResponse } from "../../supabase/functions/_shared/payments-policy";

describe("payment deactivation", () => {
  it("blocks payment creation for everyone while disabled", async () => {
    expect(PAYMENTS_ENABLED).toBe(false);
    const response = disabledPaymentsResponse({ "Access-Control-Allow-Origin": "*" });
    expect(response?.status).toBe(403);
    expect(await response?.json()).toMatchObject({ code: "payments_disabled" });
  });
});