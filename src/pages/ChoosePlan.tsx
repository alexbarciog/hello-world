import { useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PlanPicker } from "@/components/billing/PlanPicker";
import { PICK_PLAN_COPY, isPlanKey } from "@/lib/plans";
import intentslyIcon from "@/assets/intentsly-icon.png";

/**
 * Between signup and onboarding (/choose-plan, and the old /start-trial):
 * the plan picker, with ?plan= from /pricing → /register preselected.
 * Accounts that already pay go straight on to onboarding.
 */
export default function ChoosePlan() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const selected = params.get("plan");

  useEffect(() => {
    let cancelled = false;
    supabase.functions.invoke("check-subscription").then(({ data }) => {
      if (!cancelled && data?.access === "full") navigate("/onboarding", { replace: true });
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [navigate]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#F7F7F8] text-foreground">
      <header className="px-4 sm:px-8 py-5">
        <Link to="/" className="inline-flex items-center gap-2">
          <img src={intentslyIcon} alt="Intentsly" className="w-7 h-7 object-contain" />
          <span className="font-bold text-base tracking-tight">Intentsly</span>
        </Link>
      </header>
      <main className="mx-auto max-w-5xl px-4 sm:px-6 pb-16">
        <div className="mx-auto max-w-xl text-center mb-8 md:mb-10">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight" style={{ color: "hsl(var(--aeline-dark))" }}>
            Pick a plan
          </h1>
          <p className="mt-3 text-base text-muted-foreground leading-relaxed">{PICK_PLAN_COPY}.</p>
        </div>

        <PlanPicker variant="compact" selected={isPlanKey(selected) ? selected : null} source="choose_plan" onChanged={() => navigate("/onboarding")} />

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Credits reset at each renewal. Cancel anytime from Settings.{" "}
          <Link to="/pricing" className="underline underline-offset-2">How credits work</Link>
        </p>
        <div className="mt-8 text-center">
          <Link to="/onboarding" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Not yet, take me to setup <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>
    </div>
  );
}
