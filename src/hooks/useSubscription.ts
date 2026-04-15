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
  loading: boolean;
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
    loading: true,
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
      setState({
        subscribed: data?.subscribed ?? false,
        hadSubscription: data?.had_subscription ?? false,
        subscriptionEnd: data?.subscription_end ?? null,
        productId: data?.product_id ?? null,
        credits: data?.credits ?? 0,
        hasCard: data?.has_card ?? false,
        freeTrialEnabled: data?.free_trial_enabled ?? false,
        loading: false,
      });
    } catch {
      setState(s => ({ ...s, loading: false }));
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { ...state, refresh };
}
