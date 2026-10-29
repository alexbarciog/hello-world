import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Access, BillingBanner, SubscriptionStatus } from "../../supabase/functions/_shared/billing";

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
  /** Can use the product: trialing/active, or a legacy account passing the old checks. */
  hasAccess: boolean;
  /** past_due, canceled, expired legacy or never checked out: the app is read-only. */
  readOnly: boolean;
  status: SubscriptionStatus | null;
  access: Access | null;
  banner: BillingBanner;
  trialEndsAt: string | null;
  legacyEndsAt: string | null;
  signalsUsed: number;
  signalCap: number;
  founding: boolean;
  foundingSlotsLeft: number;
  isBillingOwner: boolean;
  paymentsEnabled: boolean;
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
  legacyEndsAt: null,
  signalsUsed: 0,
  signalCap: 0,
  founding: false,
  foundingSlotsLeft: 0,
  isBillingOwner: true,
  paymentsEnabled: false,
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
      // Legacy accounts keep the pre-trial rule: paid, or invite-only trial with a card.
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
        legacyEndsAt: data?.legacy_ends_at ?? null,
        signalsUsed: data?.signals_used ?? 0,
        signalCap: data?.signal_cap ?? 0,
        founding: data?.founding ?? false,
        foundingSlotsLeft: data?.founding_slots_left ?? 0,
        isBillingOwner: data?.is_billing_owner ?? true,
        paymentsEnabled: data?.payments_enabled ?? false,
      });
    } catch {
      setState(s => ({ ...s, loading: false }));
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { ...state, refresh };
}
