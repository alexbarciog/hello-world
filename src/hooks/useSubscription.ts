import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

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
  /** True when user has an active trial (freeTrialEnabled + card on file) OR a paid subscription */
  hasAccess: boolean;
}

export function useSubscription() {
  const [state, setState] = useState<SubscriptionState>({
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
  });

  const refresh = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setState(s => ({ ...s, loading: false }));
        return;
      }
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) {
        setState(s => ({ ...s, loading: false }));
        return;
      }
      const subscribed = data?.subscribed ?? false;
      const hasCard = data?.has_card ?? false;
      const freeTrialEnabled = data?.free_trial_enabled ?? false;
      const hasAccess = subscribed || (freeTrialEnabled && hasCard);
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
        hasAccess,
      });
    } catch {
      setState(s => ({ ...s, loading: false }));
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { ...state, refresh };
}
