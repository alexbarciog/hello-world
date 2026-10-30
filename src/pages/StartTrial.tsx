import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { startCheckout } from "@/lib/billing";
import { supabase } from "@/integrations/supabase/client";

/**
 * Between signup and onboarding: opens Stripe Checkout for the 7-day trial.
 * If checkout is switched off or fails, the person continues to onboarding
 * (the in-app banner offers the trial again later).
 */
export default function StartTrial() {
  const navigate = useNavigate();
  const started = useRef(false);
  const [message, setMessage] = useState("Setting up your 7-day free trial…");

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    (async () => {
      const { data } = await supabase.functions.invoke("check-subscription");
      if (data?.access === "full") {
        navigate("/onboarding", { replace: true });
        return;
      }
      const result = await startCheckout();
      if (!result.ok) {
        if (result.reason !== "payments_disabled") toast.error(result.message);
        setMessage("Taking you to setup…");
        navigate("/onboarding", { replace: true });
      }
    })();
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-background text-foreground">
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
