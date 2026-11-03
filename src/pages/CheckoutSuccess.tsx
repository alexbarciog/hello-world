import { useEffect, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CONTACT_EMAIL, PLAN_PRICE_USD } from "@/lib/billing";
import { ttqPurchase } from "@/lib/tiktok-pixel";

const PAYING = ["trialing", "active", "scheduled_cancel"];
const POLL_MS = 2000;
const GIVE_UP_MS = 30_000;

/**
 * /app?checkout=success, where Creem sends people after paying. The webhook can
 * arrive after the redirect, so this waits up to 30 s for the subscription row.
 * Any other /app visit goes to the dashboard.
 */
export default function CheckoutSuccess() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const fromCheckout = params.get("checkout") === "success";
  const [state, setState] = useState<"waiting" | "in" | "slow">("waiting");
  const [trialEnd, setTrialEnd] = useState<string | null>(null);

  useEffect(() => {
    if (!fromCheckout) return;
    let stopped = false;
    const started = Date.now();
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || stopped) return;
      // subscriptions isn't in the generated types yet.
      const { data } = await (supabase.from("subscriptions" as never) as unknown as ReturnType<typeof supabase.from>)
        .select("status, trial_end")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });
      const rows = (data ?? []) as Array<{ status: string; trial_end: string | null }>;
      const paying = rows.find((r) => PAYING.includes(r.status));
      if (stopped) return;
      if (paying) {
        setTrialEnd(paying.status === "trialing" ? paying.trial_end : null);
        setState("in");
        ttqPurchase("Intentsly", PLAN_PRICE_USD);
        return;
      }
      if (Date.now() - started >= GIVE_UP_MS) {
        setState("slow");
        return;
      }
      setTimeout(check, POLL_MS);
    };
    check();
    return () => { stopped = true; };
  }, [fromCheckout]);

  if (!fromCheckout) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-white p-8 text-center shadow-sm">
        {state === "waiting" && (
          <>
            <Loader2 className="mx-auto w-8 h-8 animate-spin text-muted-foreground" />
            <h1 className="mt-4 text-lg font-semibold text-foreground">Confirming your subscription…</h1>
            <p className="mt-1 text-sm text-muted-foreground">This usually takes a few seconds.</p>
          </>
        )}
        {state === "in" && (
          <>
            <CheckCircle className="mx-auto w-10 h-10 text-green-500" />
            <h1 className="mt-4 text-xl font-semibold text-foreground">You're in.</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {trialEnd
                ? `Your free trial runs until ${new Date(trialEnd).toLocaleDateString()}. Signals and LinkedIn outreach are on.`
                : "Signals and LinkedIn outreach are on."}
            </p>
            <button
              onClick={() => navigate("/dashboard", { replace: true })}
              className="mt-6 w-full rounded-xl bg-[#0a0a0a] px-4 py-3 text-sm font-semibold text-white"
            >
              Continue
            </button>
          </>
        )}
        {state === "slow" && (
          <>
            <Loader2 className="mx-auto w-8 h-8 text-muted-foreground" />
            <h1 className="mt-4 text-lg font-semibold text-foreground">Payment received, still confirming</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              It can take a minute. Continue, and your account unlocks as soon as it's confirmed. If it hasn't
              within 10 minutes, email {CONTACT_EMAIL}.
            </p>
            <button
              onClick={() => navigate("/dashboard", { replace: true })}
              className="mt-6 w-full rounded-xl bg-[#0a0a0a] px-4 py-3 text-sm font-semibold text-white"
            >
              Continue
            </button>
          </>
        )}
      </div>
    </div>
  );
}
