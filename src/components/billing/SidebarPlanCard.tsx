import { ArrowRight } from "lucide-react";
import type { SubscriptionState } from "@/hooks/useSubscription";
import { usePlans } from "@/hooks/usePlans";
import { formatRenewal, isPlanKey } from "@/lib/plans";

/**
 * Sidebar plan card: plan name, "N of M credits left" with a thin bar, the
 * renewal date, and Upgrade (Starter/Growth) or Pick a plan (no plan).
 */
export function SidebarPlanCard({
  sub, onUpgrade, onPickPlan, onManage,
}: {
  sub: SubscriptionState;
  onUpgrade: () => void;
  onPickPlan: () => void;
  onManage: () => void;
}) {
  const plans = usePlans();
  if (sub.loading) {
    return <div className="h-[132px] rounded-2xl bg-white border border-[#E7E7EA] animate-pulse" />;
  }

  const plan = sub.plan;
  // Before the credit backend deploys, paying accounts have no plan object yet.
  const legacyPaid = !plan && sub.subscribed;
  const total = plan?.monthly_credits ?? 0;
  const left = Math.max(0, sub.credits ?? 0);
  const pct = total > 0 ? Math.min(100, Math.round((left / total) * 100)) : 0;
  const renewal = sub.creditsPeriodEnd ?? sub.currentPeriodEnd;
  const canUpgrade = !!plan && (plan.key === "starter" || plan.key === "growth");
  const pendingName = sub.pendingPlan
    ? plans.find((p) => p.key === sub.pendingPlan)?.name ?? (isPlanKey(sub.pendingPlan) ? sub.pendingPlan : null)
    : null;

  let renewalLine: string | null = null;
  if (renewal && plan) {
    if (sub.cancelAtPeriodEnd) renewalLine = `Ends ${formatRenewal(renewal)}`;
    else if (pendingName) renewalLine = `Moves to ${pendingName} on ${formatRenewal(renewal)}`;
    else renewalLine = `Renews ${formatRenewal(renewal)}`;
  }

  return (
    <div className="rounded-2xl bg-white border border-[#E7E7EA] p-4 shadow-[0_8px_24px_-18px_rgba(15,23,42,0.25)]">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10.5px] font-semibold uppercase tracking-wider text-neutral-500">Plan</p>
        {sub.founding && (
          <span className="inline-flex items-center rounded-full bg-[#C8FF00] px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wide text-[#0a0a0a]">
            Founding
          </span>
        )}
      </div>
      <p className="mt-0.5 text-[15px] font-semibold text-[#0a0a0a] truncate">
        {plan ? plan.name : legacyPaid ? "Intentsly" : "No plan"}
      </p>

      {plan ? (
        <>
          <p className="mt-2.5 text-[12px] text-neutral-600">
            <span className="font-semibold text-[#0a0a0a] tabular-nums">{left.toLocaleString("en-US")}</span> of{" "}
            <span className="tabular-nums">{total.toLocaleString("en-US")}</span> credits left
          </p>
          <div
            className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-neutral-100"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={left}
            aria-label="Credits left"
          >
            <div className={`h-full rounded-full ${sub.outOfCredits ? "bg-rose-400" : "bg-[#1A8FE3]"}`} style={{ width: `${pct}%` }} />
          </div>
          {renewalLine && <p className="mt-2 text-[11.5px] text-neutral-500">{renewalLine}</p>}
        </>
      ) : legacyPaid ? (
        <p className="mt-2 text-[12px] text-neutral-600">
          <span className="font-semibold text-[#0a0a0a] tabular-nums">{left.toLocaleString("en-US")}</span> credits left
        </p>
      ) : (
        <p className="mt-1 text-[11.5px] leading-snug text-neutral-500">Pick a plan to turn on signals and LinkedIn outreach.</p>
      )}

      {canUpgrade && sub.isBillingOwner ? (
        <button
          onClick={onUpgrade}
          className="mt-3 w-full inline-flex items-center justify-between gap-2 rounded-xl bg-[#C8FF00] px-3.5 py-2 text-[12.5px] font-semibold text-[#0a0a0a] hover:bg-[#d4ff33] transition-colors"
        >
          Upgrade
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      ) : !plan && !legacyPaid && sub.isBillingOwner ? (
        <button
          onClick={onPickPlan}
          className="mt-3 w-full inline-flex items-center justify-between gap-2 rounded-xl bg-[#C8FF00] px-3.5 py-2 text-[12.5px] font-semibold text-[#0a0a0a] hover:bg-[#d4ff33] transition-colors"
        >
          Pick a plan
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      ) : (
        <button
          onClick={onManage}
          className="mt-3 w-full inline-flex items-center justify-between gap-2 rounded-xl bg-[#0a0a0a] px-3.5 py-2 text-[12.5px] font-semibold text-white hover:bg-neutral-800 transition-colors"
        >
          {sub.isBillingOwner ? "Manage plan" : "Billing"}
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
