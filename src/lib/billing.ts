import { supabase } from "@/integrations/supabase/client";
import type { PlanKey } from "@/lib/plans";

export const CONTACT_EMAIL = "alex@intentsly.com";
export const SETUP_PRICE_USD = 500;

// A flat shape rather than a union: the app compiles without strictNullChecks,
// where `if (!result.ok)` doesn't narrow a discriminated union.
export interface RedirectResult {
  ok: boolean;
  reason?: "payments_disabled" | "not_signed_in" | "no_customer" | "not_billing_owner" | "error";
  message?: string;
}

/** A plan checkout either redirects to Creem, or (existing subscriber) changes the plan in place. */
export interface CheckoutResult extends RedirectResult {
  /** The existing subscription was upgraded or downgraded; nothing to redirect to. */
  changed?: boolean;
  plan?: string;
  /** now = upgrade applied (credit difference granted); next_renewal = scheduled downgrade. */
  effective?: "now" | "next_renewal";
}

export const PAYMENTS_UNAVAILABLE_MESSAGE = `Payments are currently unavailable. Email ${CONTACT_EMAIL} and Alex will set you up today.`;

type Body = { code?: string; error?: string };

function failure(body: Body | null | undefined, fallback: string): RedirectResult {
  if (body?.code === "payments_disabled") return { ok: false, reason: "payments_disabled", message: PAYMENTS_UNAVAILABLE_MESSAGE };
  if (body?.code === "no_customer") return { ok: false, reason: "no_customer", message: body.error || "No billing account yet." };
  if (body?.code === "not_billing_owner") return { ok: false, reason: "not_billing_owner", message: body.error || "Your workspace owner manages billing." };
  return { ok: false, reason: "error", message: body?.error || fallback };
}

async function invokeBilling(fn: "creem-checkout" | "creem-portal", body?: Record<string, unknown>): Promise<CheckoutResult> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { ok: false, reason: "not_signed_in", message: "Please sign in first." };

  const { data, error } = await supabase.functions.invoke(fn, body ? { body } : undefined);
  if (error) {
    // Non-2xx: read the body for the code (payments_disabled → 403).
    let errBody: Body = {};
    try {
      errBody = await (error as { context?: Response }).context?.json();
    } catch {
      // no JSON body
    }
    return failure(errBody, error.message);
  }
  if (data?.changed) {
    return { ok: true, changed: true, plan: data.plan, effective: data.effective === "next_renewal" ? "next_renewal" : "now" };
  }
  const url = data?.checkout_url ?? data?.url;
  if (!url) return failure(data, "Something went wrong.");
  window.location.href = url;
  return { ok: true };
}

/**
 * Creem checkout for a plan. New subscribers are redirected to Creem; an
 * existing subscriber's plan is changed in place (`changed: true`).
 */
export const startCheckout = (plan?: PlanKey) => invokeBilling("creem-checkout", plan ? { plan } : undefined);

/** Creem customer portal: cancel, change card, invoices. */
export const openBillingPortal = (): Promise<RedirectResult> => invokeBilling("creem-portal");
