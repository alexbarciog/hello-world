// Payments stay disabled until the owner sets the PAYMENTS_ENABLED=true
// edge-function secret. Merging code never turns payments on by itself.
// (Read defensively: this module is also imported by Vitest under Node.)
const env = (globalThis as { Deno?: { env: { get(key: string): string | undefined } } }).Deno?.env;

export const PAYMENTS_ENABLED = env?.get("PAYMENTS_ENABLED") === "true";

export function disabledPaymentsResponse(headers: Record<string, string>): Response | null {
  if (PAYMENTS_ENABLED) return null;
  return new Response(JSON.stringify({
    error: "Payments are currently unavailable.",
    code: "payments_disabled",
  }), {
    status: 403,
    headers: { ...headers, "Content-Type": "application/json" },
  });
}
