import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Pricing from "@/components/Pricing";
import FAQ from "@/components/FAQ";
import PaymentSuccessDialog from "@/components/PaymentSuccessDialog";

export default function BillingPlans() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (searchParams.get("success") === "true") {
      setShowSuccess(true);
      // Clean URL
      searchParams.delete("success");
      setSearchParams(searchParams, { replace: true });
    }
  }, []);

  return (
    <div className="min-h-full">
      <Pricing />
      <FAQ />
      <PaymentSuccessDialog open={showSuccess} onClose={() => setShowSuccess(false)} />
    </div>
  );
}
