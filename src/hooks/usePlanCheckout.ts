import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { startCheckout } from "@/lib/billing";
import { trackBilling } from "@/lib/billingEvents";
import type { BillingPlan, PlanKey } from "@/lib/plans";
import { ttqAddToCart, ttqInitiateCheckout } from "@/lib/tiktok-pixel";
import { notifySubscriptionChanged } from "@/hooks/useSubscription";

/**
 * Picks a plan: signed out → /register?plan=<key>; new subscriber → Creem
 * checkout; existing subscriber → plan change in place (toast + refetch).
 */
export function usePlanCheckout(opts: { onChanged?: () => void } = {}) {
  const navigate = useNavigate();
  const [pending, setPending] = useState<PlanKey | null>(null);

  const choose = async (plan: BillingPlan) => {
    setPending(plan.key);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate(`/register?plan=${plan.key}`);
        return;
      }
      trackBilling("checkout_started", { plan: plan.key });
      const price = plan.price_cents / 100;
      ttqAddToCart(`Intentsly ${plan.name}`, price);
      ttqInitiateCheckout(`Intentsly ${plan.name}`, price);

      const result = await startCheckout(plan.key);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      if (result.changed) {
        toast.success(
          result.effective === "next_renewal"
            ? `You'll move to ${plan.name} at your next renewal. Until then nothing changes.`
            : `You're on ${plan.name} now. The extra credits are already in your balance.`,
        );
        notifySubscriptionChanged();
        opts.onChanged?.();
      }
      // Otherwise the browser is on its way to Creem checkout.
    } finally {
      setPending(null);
    }
  };

  return { choose, pending };
}
