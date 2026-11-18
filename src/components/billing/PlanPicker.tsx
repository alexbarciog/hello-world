import { useEffect, useRef } from "react";
import { ArrowUpRight, Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { usePlans } from "@/hooks/usePlans";
import { usePlanCheckout } from "@/hooks/usePlanCheckout";
import { useSubscription } from "@/hooks/useSubscription";
import { trackBilling } from "@/lib/billingEvents";
import {
  MOST_POPULAR_PLAN, formatPrice, planGuideLines, planLimits,
  type BillingPlan, type PlanKey,
} from "@/lib/plans";
import { cn } from "@/lib/utils";

const DARK = "hsl(var(--aeline-dark))";

type Variant = "page" | "compact";

interface PlanPickerProps {
  /** page = /pricing cards; compact = in-app dialog / plan picker page. */
  variant?: Variant;
  /** Highlight this plan (e.g. carried through /register?plan=). */
  selected?: PlanKey | null;
  /** Called after an existing subscriber's plan changed in place. */
  onChanged?: () => void;
  /** Where the picker is shown, for analytics. */
  source?: string;
  className?: string;
}

/** Three plan cards. Reads prices, credits and limits from billing_plans. */
export function PlanPicker({ variant = "compact", selected = null, onChanged, source, className }: PlanPickerProps) {
  const plans = usePlans();
  const sub = useSubscription();
  const { choose, pending } = usePlanCheckout({ onChanged });
  const viewed = useRef(false);

  useEffect(() => {
    if (viewed.current) return;
    viewed.current = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) trackBilling("plan_picker_viewed", { source: source ?? variant });
    }).catch(() => {});
  }, [source, variant]);

  const current = sub.plan ? plans.find((p) => p.key === sub.plan!.key) ?? null : null;
  const signedInMember = !sub.loading && sub.access !== null && !sub.isBillingOwner;

  return (
    <div className={className}>
      {signedInMember && (
        <p className="mb-4 text-center text-sm text-muted-foreground">Billing is managed by your workspace owner.</p>
      )}
      <div className={cn("grid gap-5 md:grid-cols-3", variant === "page" ? "md:gap-6 items-stretch" : "md:gap-4")}>
        {plans.map((plan) => {
          const isCurrent = current?.key === plan.key;
          const isPending = sub.pendingPlan === plan.key;
          let label = `Get ${plan.name}`;
          if (isCurrent) label = "Your plan";
          else if (isPending) label = "Starts at renewal";
          else if (current) label = plan.price_cents > current.price_cents ? `Upgrade to ${plan.name}` : `Switch to ${plan.name}`;
          return (
            <PlanCard
              key={plan.key}
              plan={plan}
              variant={variant}
              popular={plan.key === MOST_POPULAR_PLAN}
              selected={selected === plan.key}
              current={isCurrent}
              label={label}
              busy={pending === plan.key}
              disabled={isCurrent || isPending || signedInMember || pending !== null}
              onChoose={() => choose(plan)}
            />
          );
        })}
      </div>
    </div>
  );
}

interface PlanCardProps {
  plan: BillingPlan;
  variant: Variant;
  popular: boolean;
  selected: boolean;
  current: boolean;
  label: string;
  busy: boolean;
  disabled: boolean;
  onChoose: () => void;
}

function PlanCard({ plan, variant, popular, selected, current, label, busy, disabled, onChoose }: PlanCardProps) {
  const page = variant === "page";
  return (
    <div
      className={cn(
        "relative flex flex-col bg-white border text-left",
        page ? "rounded-3xl p-6 md:p-7" : "rounded-2xl p-5",
        popular
          ? "border-transparent ring-2 ring-[#C8FF00] shadow-[0_24px_60px_-24px_rgba(15,23,42,0.28)]"
          : "border-[#E7E7EA] shadow-[0_12px_40px_-24px_rgba(15,23,42,0.22)]",
        selected && "ring-2 ring-[#1A8FE3]",
      )}
    >
      {(popular || current) && (
        <span
          className={cn(
            "absolute -top-3 left-6 inline-flex items-center rounded-full px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wider",
            current ? "bg-[#1A8FE3] text-white" : "bg-[#C8FF00]",
          )}
          style={current ? undefined : { color: DARK }}
        >
          {current ? "Your plan" : "Most popular"}
        </span>
      )}

      <div className="flex items-baseline justify-between gap-3">
        <h3 className={cn("font-semibold", page ? "text-lg" : "text-base")} style={{ color: DARK }}>{plan.name}</h3>
        <p className="shrink-0">
          <span className={cn("font-semibold", page ? "text-2xl" : "text-xl")} style={{ color: DARK }}>{formatPrice(plan.price_cents)}</span>
          <span className="text-sm text-muted-foreground">/month</span>
        </p>
      </div>

      <div className={cn("rounded-2xl bg-[#F2F8FE]", page ? "mt-5 px-5 py-4" : "mt-4 px-4 py-3")}>
        <p className="flex items-baseline gap-2">
          <span className={cn("font-semibold tracking-tight text-[#1A8FE3]", page ? "text-4xl md:text-5xl" : "text-3xl")}>
            {plan.monthly_credits.toLocaleString("en-US")}
          </span>
          <span className="text-sm font-medium" style={{ color: DARK }}>credits / month</span>
        </p>
      </div>

      <p className={cn("font-semibold uppercase tracking-wider text-muted-foreground", page ? "mt-5 text-[11px]" : "mt-4 text-[10.5px]")}>
        What your credits get you
      </p>
      <ul className={cn("mt-2 space-y-1.5", page ? "text-sm" : "text-[13px]")} style={{ color: DARK }}>
        {planGuideLines(plan.key).map((line) => (
          <li key={line} className="flex items-start gap-2">
            <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#1A8FE3]" aria-hidden="true" />
            {line}
          </li>
        ))}
      </ul>

      <p className={cn("font-semibold uppercase tracking-wider text-muted-foreground", page ? "mt-5 text-[11px]" : "mt-4 text-[10.5px]")}>
        Included
      </p>
      <ul className={cn("mt-2 space-y-1.5", page ? "text-sm mb-7" : "text-[13px] mb-5")} style={{ color: DARK }}>
        {planLimits(plan).map((line) => (
          <li key={line} className="flex items-start gap-2">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#1A8FE3]" />
            {line}
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={onChoose}
        disabled={disabled}
        className={cn(
          "mt-auto inline-flex w-full items-center justify-center gap-2 rounded-full font-semibold transition-all disabled:cursor-not-allowed",
          page ? "px-5 py-3.5 text-[15px]" : "px-4 py-2.5 text-sm",
          current || disabled && !busy
            ? "bg-neutral-100 text-neutral-500"
            : popular
              ? "bg-[#C8FF00] text-[#0a0a0a] hover:bg-[#d4ff33] shadow-[0_12px_28px_-12px_rgba(200,255,0,0.7)]"
              : "bg-[#0a0a0a] text-white hover:bg-neutral-800",
        )}
      >
        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
        {label}
        {!busy && !disabled && <ArrowUpRight className="h-4 w-4" />}
      </button>
    </div>
  );
}
