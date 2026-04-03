import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Pricing from "@/components/Pricing";
import FAQ from "@/components/FAQ";
import PaymentSuccessDialog from "@/components/PaymentSuccessDialog";
import { ttqPurchase, ttqPlaceAnOrder, ttqAddPaymentInfo, ttqIdentify } from "@/lib/tiktok-pixel";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/hooks/useSubscription";

const STARTER_PRODUCT_ID = "prod_UGjR0WwP5rbgZX";

export default function BillingPlans() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showSuccess, setShowSuccess] = useState(false);
  const sub = useSubscription();

  useEffect(() => {
    if (searchParams.get("success") === "true") {
      setShowSuccess(true);

      // Identify user for TikTok matching
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user?.email) {
          ttqIdentify({ email: user.email, external_id: user.id });
        }
      });

      // Determine plan value from subscription product
      const planName = sub.productId === STARTER_PRODUCT_ID ? "Starter" : "Pro";
      const planValue = sub.productId === STARTER_PRODUCT_ID ? 59 : 99;

      ttqPlaceAnOrder(planName, planValue);
      ttqPurchase(planName, planValue);
      ttqAddPaymentInfo(planName, planValue);

      // Clean URL
      searchParams.delete("success");
      setSearchParams(searchParams, { replace: true });
    }
  }, [sub.loading]);

  return (
    <div className="min-h-full">
      <Pricing />
      <FAQ />
      <PaymentSuccessDialog open={showSuccess} onClose={() => setShowSuccess(false)} />
    </div>
  );
}
