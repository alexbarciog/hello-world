import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Access, BillingBanner, SubscriptionStatus } from "../../supabase/functions/_shared/billing";

export interface CurrentPlan {
  key: string;
  name: string;
  monthly_credits: number;
}

/** Fired after a plan change so every useSubscription() instance refetches. */
const CHANGED_EVENT = "intentsly:subscription-changed";

export function notifySubscriptionChanged() {
  try {
    window.dispatchEvent(new Event(CHANGED_EVENT));
  } catch {
    // not in a browser
  }
}

function parsePlan(raw: unknown): CurrentPlan | null {
  if (!raw || typeof raw !== "object") return null;
  const p = raw as Record<string, unknown>;
  if (typeof p.key !== "string") return null;
  return {
    key: p.key,
    name: typeof p.name === "string" && p.name ? p.name : p.key.charAt(0).toUpperCase() + p.key.slice(1),
    monthly_credits: typeof p.monthly_credits === "number" ? p.monthly_credits : 0,
  };
}

export interface SubscriptionState {
  subscribed: boolean;
  hadSubscription: boolean;
  subscriptionEnd: string | null;
  productId: string | null;
  credits: number;
  hasCard: boolean;
  freeTrialEnabled: boolean;
  freeTrialLimit: number;
  loading: boolean;
  /** Can use the product: paying (is_paying), or (Creem in test mode) passing the old checks. */
  hasAccess: boolean;
  /** Payment failed, canceled, expired or (live) never checked out: the app is read-only. */
  readOnly: boolean;
  status: SubscriptionStatus | null;
  access: Access | null;
  banner: BillingBanner;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  founding: boolean;
  foundingSlotsLeft: number;
  isBillingOwner: boolean;
  paymentsEnabled: boolean;
  /** Current credit plan, or null (no plan, or the backend doesn't report it yet). */
  plan: CurrentPlan | null;
  /** Plan key of a downgrade scheduled for the next renewal. */
  pendingPlan: string | null;
  /** When credits reset to the plan amount (the renewal date). */
  creditsPeriodEnd: string | null;
  outOfCredits: boolean;
}

const INITIAL: SubscriptionState = {
  subscribed: false,
  hadSubscription: false,
  subscriptionEnd: null,
  productId: null,
  credits: 0,
  hasCard: false,
  freeTrialEnabled: false,
  freeTrialLimit: 1,
  loading: true,
  hasAccess: false,
  readOnly: false,
  status: null,
  access: null,
  banner: null,
  trialEndsAt: null,
  currentPeriodEnd: null,
  cancelAtPeriodEnd: false,
  founding: false,
  foundingSlotsLeft: 0,
  isBillingOwner: true,
  paymentsEnabled: false,
  plan: null,
  pendingPlan: null,
  creditsPeriodEnd: null,
  outOfCredits: false,
};

export function useSubscription() {
  const [state, setState] = useState<SubscriptionState>(INITIAL);

  const refresh = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setState(s => ({ ...s, loading: false }));
        return;
      }
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error || data?.error) {
        setState(s => ({ ...s, loading: false }));
        return;
      }
      const subscribed = data?.subscribed ?? false;
      const hasCard = data?.has_card ?? false;
      const freeTrialEnabled = data?.free_trial_enabled ?? false;
      const access: Access | null = data?.access ?? null;
      // While Creem is in test mode, the pre-Creem rule still applies: paid, or the invite-only free_trial_enabled flag with a card.
      const legacyAccess = subscribed || (freeTrialEnabled && hasCard);
      setState({
        subscribed,
        hadSubscription: data?.had_subscription ?? false,
        subscriptionEnd: data?.subscription_end ?? null,
        productId: data?.product_id ?? null,
        credits: data?.credits ?? 0,
        hasCard,
        freeTrialEnabled,
        freeTrialLimit: data?.free_trial_limit ?? 1,
        loading: false,
        hasAccess: access === "full" || (access === "legacy" && legacyAccess),
        readOnly: access === "none",
        status: data?.subscription_status ?? null,
        access,
        banner: data?.banner ?? null,
        trialEndsAt: data?.trial_ends_at ?? null,
        currentPeriodEnd: data?.current_period_end ?? null,
        cancelAtPeriodEnd: data?.cancel_at_period_end ?? false,
        founding: data?.founding ?? false,
        foundingSlotsLeft: data?.founding_slots_left ?? 0,
        isBillingOwner: data?.is_billing_owner ?? true,
        paymentsEnabled: data?.payments_enabled ?? false,
        plan: parsePlan(data?.plan),
        pendingPlan: typeof data?.pending_plan === "string" ? data.pending_plan : null,
        creditsPeriodEnd: data?.credits_period_end ?? null,
        outOfCredits: data?.out_of_credits === true,
      });
    } catch {
      setState(s => ({ ...s, loading: false }));
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    window.addEventListener(CHANGED_EVENT, refresh);
    return () => window.removeEventListener(CHANGED_EVENT, refresh);
  }, [refresh]);

  return { ...state, refresh };
}
