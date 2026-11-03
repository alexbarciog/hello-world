import { supabase } from "@/integrations/supabase/client";

export const CONTACT_EMAIL = "alex@intentsly.com";
export const PLAN_PRICE_USD = 97;
export const SETUP_PRICE_USD = 500;

// A flat shape rather than a union: the app compiles without strictNullChecks,
// where `if (!result.ok)` doesn't narrow a discriminated union.
export interface RedirectResult {
  ok: boolean;
  reason?: "payments_disabled" | "not_signed_in" | "no_customer" | "not_billing_owner" | "error";
  message?: string;
}

const PAUSED_MESSAGE = `Checkout is paused for a moment. Email ${CONTACT_EMAIL} and Alex will set you up today.`;

async function redirectVia(fn: "creem-checkout" | "creem-portal"): Promise<RedirectResult> {
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
    if (body?.code === "not_billing_owner") return { ok: false, reason: "not_billing_owner", message: body.error || "Your workspace owner manages billing." };
    return { ok: false, reason: "error", message: body?.error || error.message };
  }
  if (!data?.url) return { ok: false, reason: "error", message: data?.error || "Something went wrong." };
  window.location.href = data.url;
  return { ok: true };
}

/** Creem checkout for the $97/month plan (7-day free trial). Opens the portal if already subscribed. */
export const startCheckout = () => redirectVia("creem-checkout");

/** Creem customer portal: cancel, change card, invoices. */
export const openBillingPortal = () => redirectVia("creem-portal");
