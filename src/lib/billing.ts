import { supabase } from "@/integrations/supabase/client";

export const CONTACT_EMAIL = "alex@intentsly.com";
export const PLAN_PRICE_USD = 97;

// A flat shape rather than a union: the app compiles without strictNullChecks,
// where `if (!result.ok)` doesn't narrow a discriminated union.
export interface RedirectResult {
  ok: boolean;
  reason?: "payments_disabled" | "not_signed_in" | "no_customer" | "error";
  message?: string;
}

const PAUSED_MESSAGE = `Checkout is paused for a moment. Email ${CONTACT_EMAIL} and Alex will set you up today.`;

async function redirectVia(fn: "create-checkout" | "customer-portal"): Promise<RedirectResult> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { ok: false, reason: "not_signed_in", message: "Please sign in first." };

  const { data, error } = await supabase.functions.invoke(fn);
  if (error) {
    // Non-2xx: read the body for the code (payments_disabled → 403).
    let body: { code?: string; error?: string } = {};
    try {
      body = await (error as { context?: Response }).context?.json();
    } catch {
      // no JSON body
    }
    if (body?.code === "payments_disabled") return { ok: false, reason: "payments_disabled", message: PAUSED_MESSAGE };
    if (body?.code === "no_customer") return { ok: false, reason: "no_customer", message: body.error || "No billing account yet." };
    return { ok: false, reason: "error", message: body?.error || error.message };
  }
  if (!data?.url) return { ok: false, reason: "error", message: data?.error || "Something went wrong." };
  window.location.href = data.url;
  return { ok: true };
}

/** Stripe Checkout for the $97/month plan (7-day trial for first-time accounts). */
export const startCheckout = () => redirectVia("create-checkout");

/** Stripe customer portal: cancel, change card, invoices, reactivate. */
export const openBillingPortal = () => redirectVia("customer-portal");
