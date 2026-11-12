import { beforeEach, describe, expect, it, vi } from "vitest";
import { FunctionsFetchError, FunctionsHttpError } from "@supabase/supabase-js";

const invoke = vi.fn();
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { functions: { invoke: (...args: unknown[]) => invoke(...args) } },
}));

const { requestLeadMagnet, signupSource, leadMagnetUrl } = await import("@/lib/leadMagnets");

const input = { slug: "buying-signals-guide", email: "a@b.co", name: "Ana", source: "direct" };
const httpError = (status: number, body: unknown) =>
  new FunctionsHttpError(new Response(JSON.stringify(body), { status }));

describe("signupSource", () => {
  it("prefers utm_source", () =>
    expect(signupSource("?utm_source=linkedin", "https://www.google.com/")).toBe("linkedin"));
  it("falls back to the referrer hostname", () =>
    expect(signupSource("", "https://www.linkedin.com/feed/")).toBe("www.linkedin.com"));
  it("falls back to direct", () => {
    expect(signupSource("", "")).toBe("direct");
    expect(signupSource("?utm_source=%20", "not a url")).toBe("direct");
  });
  it("caps the length", () => expect(signupSource(`?utm_source=${"x".repeat(100)}`, "")).toHaveLength(60));
});

describe("leadMagnetUrl", () => {
  it("is the canonical /free URL", () =>
    expect(leadMagnetUrl("buying-signals-guide")).toBe("https://intentsly.com/free/buying-signals-guide"));
});

describe("requestLeadMagnet", () => {
  beforeEach(() => invoke.mockReset());

  it("sends slug, email, name and source to send-lead-magnet", async () => {
    invoke.mockResolvedValue({ data: { success: true, asset_url: "https://x/guide" }, error: null });
    await expect(requestLeadMagnet(input)).resolves.toEqual({ status: "sent", assetUrl: "https://x/guide" });
    expect(invoke).toHaveBeenCalledWith("send-lead-magnet", { body: input });
  });

  it("still returns the link when the email fails (502)", async () => {
    invoke.mockResolvedValue({
      data: null,
      error: httpError(502, { success: false, error: "Email failed, use the link", asset_url: "https://x/guide" }),
    });
    await expect(requestLeadMagnet(input)).resolves.toEqual({ status: "email_failed", assetUrl: "https://x/guide" });
  });

  it("reports an invalid email (400)", async () => {
    invoke.mockResolvedValue({ data: null, error: httpError(400, { error: "Invalid email" }) });
    await expect(requestLeadMagnet(input)).resolves.toEqual({
      status: "error",
      message: "Please enter a valid work email.",
    });
  });

  it("reports other server errors with the contact fallback", async () => {
    invoke.mockResolvedValue({ data: null, error: httpError(404, { error: "Unknown guide" }) });
    await expect(requestLeadMagnet(input)).resolves.toEqual({
      status: "error",
      message: "Something went wrong. Try again, or email alex@intentsly.com.",
    });
  });

  it("reports network failures", async () => {
    invoke.mockResolvedValue({ data: null, error: new FunctionsFetchError(new Error("offline")) });
    const result = await requestLeadMagnet(input);
    expect(result.status).toBe("error");
  });
});
