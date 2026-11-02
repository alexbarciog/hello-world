import { describe, it, expect } from "vitest";
import { checkSendAuth, normalizeFrom } from "../../supabase/functions/_shared/send-email-policy";

const secrets = { sendSecret: "s".repeat(32), serviceRoleKey: "service-role-key" };
const h = (init: Record<string, string>) => new Headers(init);

describe("send-email auth", () => {
  it("rejects unauthenticated calls, including the public anon key", () => {
    expect(checkSendAuth(h({}), secrets).ok).toBe(false);
    expect(checkSendAuth(h({ authorization: "Bearer anon-key" }), secrets).ok).toBe(false);
    expect(checkSendAuth(h({ "x-send-secret": "wrong" }), secrets).ok).toBe(false);
  });

  it("accepts the shared secret or the service-role key", () => {
    expect(checkSendAuth(h({ "x-send-secret": "s".repeat(32) }), secrets)).toEqual({ ok: true, via: "secret" });
    expect(checkSendAuth(h({ authorization: "Bearer service-role-key" }), secrets)).toEqual({ ok: true, via: "service_role" });
  });

  it("never matches an empty header when the secret isn't configured", () => {
    expect(checkSendAuth(h({ "x-send-secret": "" }), { sendSecret: "", serviceRoleKey: "" }).ok).toBe(false);
    expect(checkSendAuth(h({ authorization: "Bearer " }), { sendSecret: "", serviceRoleKey: "" }).ok).toBe(false);
  });
});

describe("send-email from allowlist", () => {
  it("allows only noreply@, alex@ and support@", () => {
    expect(normalizeFrom("noreply@intentsly.com")).toBe("Intentsly <noreply@intentsly.com>");
    expect(normalizeFrom("Alex <alex@intentsly.com>")).toBe("Alex <alex@intentsly.com>");
    expect(normalizeFrom("Support@Intentsly.com")).toBe("Intentsly <support@intentsly.com>");
    expect(normalizeFrom("ceo@intentsly.com")).toBeNull();
    expect(normalizeFrom("Intentsly <noreply@evil.com>")).toBeNull();
    expect(normalizeFrom("a@b.com, noreply@intentsly.com")).toBeNull();
  });

  it("defaults to noreply@", () => {
    expect(normalizeFrom(undefined)).toBe("Intentsly <noreply@intentsly.com>");
  });
});
