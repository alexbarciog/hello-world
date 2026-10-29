import { describe, it, expect } from "vitest";
import { PAYMENTS_ENABLED, disabledPaymentsResponse } from "../../supabase/functions/_shared/payments-policy";

describe("payment switch", () => {
  it("stays off unless the PAYMENTS_ENABLED secret is set", async () => {
    // No Deno env here, exactly like a deploy without the secret.
    expect(PAYMENTS_ENABLED).toBe(false);
    const response = disabledPaymentsResponse({ "Access-Control-Allow-Origin": "*" });
    expect(response?.status).toBe(403);
    expect(await response?.json()).toMatchObject({ code: "payments_disabled" });
  });
});
