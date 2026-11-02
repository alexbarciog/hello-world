// Who may call send-email, and from which addresses. Pure functions so the
// rules are unit-tested (src/test/send-email-policy.test.ts).

export const ALLOWED_FROM = ["noreply@intentsly.com", "alex@intentsly.com", "support@intentsly.com"] as const;
const DEFAULT_FROM = "Intentsly <noreply@intentsly.com>";

function timingSafeEqual(a: string, b: string): boolean {
  if (!a || !b || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function checkSendAuth(
  headers: Headers,
  secrets: { sendSecret: string; serviceRoleKey: string },
): { ok: true; via: "secret" | "service_role" } | { ok: false } {
  const given = headers.get("x-send-secret") ?? "";
  // Require a real secret: an unset SEND_EMAIL_SECRET must never match an empty header.
  if (secrets.sendSecret.length >= 24 && timingSafeEqual(given, secrets.sendSecret)) {
    return { ok: true, via: "secret" };
  }
  const bearer = (headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (secrets.serviceRoleKey && timingSafeEqual(bearer, secrets.serviceRoleKey)) {
    return { ok: true, via: "service_role" };
  }
  return { ok: false };
}

/**
 * Accepts "addr" or "Name <addr>" for an allowlisted address and returns it
 * formatted for Resend; null for anything else. No `from` → noreply@.
 */
export function normalizeFrom(from: string | undefined | null): string | null {
  if (!from || !from.trim()) return DEFAULT_FROM;
  const m = from.trim().match(/^(?:"?([^"<]*?)"?\s*<([^<>\s]+)>|([^<>\s]+))$/);
  if (!m) return null;
  const name = (m[1] ?? "").trim();
  const addr = (m[2] ?? m[3] ?? "").toLowerCase();
  if (!(ALLOWED_FROM as readonly string[]).includes(addr)) return null;
  if (/[\r\n]/.test(name)) return null;
  return name ? `${name} <${addr}>` : `Intentsly <${addr}>`;
}
