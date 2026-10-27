// Explicitly disabled until the owner authorizes re-enabling payments.
export const PAYMENTS_ENABLED = false;

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