import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Pricing from "@/components/Pricing";
import { PricingFaq } from "@/components/billing/PricingFaq";
import PaymentSuccessDialog from "@/components/PaymentSuccessDialog";
import { ttqPurchase, ttqPlaceAnOrder, ttqAddPaymentInfo, ttqIdentify } from "@/lib/tiktok-pixel";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/hooks/useSubscription";
import { usePlans } from "@/hooks/usePlans";

/** In-app plan picker (/billing): the same plans as /pricing, plus the pricing questions. */
export default function BillingPlans() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showSuccess, setShowSuccess] = useState(false);
  const sub = useSubscription();
  const plans = usePlans();

  useEffect(() => {
    if (sub.loading || searchParams.get("success") !== "true") return;
    setShowSuccess(true);

    // Identify user for TikTok matching
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) {
        ttqIdentify({ email: user.email, external_id: user.id });
      }
    });

    const plan = plans.find((p) => p.key === sub.plan?.key);
    const planName = plan ? `Intentsly ${plan.name}` : "Intentsly";
    const planValue = plan ? plan.price_cents / 100 : undefined;
    ttqPlaceAnOrder(planName, planValue);
    ttqPurchase(planName, planValue);
    ttqAddPaymentInfo(planName, planValue);

    // Clean URL
    searchParams.delete("success");
    setSearchParams(searchParams, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sub.loading]);

  return (
    <div className="min-h-full">
      <Pricing selected={searchParams.get("plan")} source="billing_page" />
      <PricingFaq />
      <PaymentSuccessDialog open={showSuccess} onClose={() => setShowSuccess(false)} />
    </div>
  );
}
