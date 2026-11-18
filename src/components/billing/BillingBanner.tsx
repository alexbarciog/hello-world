import { useState } from "react";
import { AlertTriangle, ArrowRight, Clock, Loader2, Lock, Zap } from "lucide-react";
import { toast } from "sonner";
import type { SubscriptionState } from "@/hooks/useSubscription";
import { openBillingPortal } from "@/lib/billing";
import { PICK_PLAN_COPY, formatRenewal } from "@/lib/plans";

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });

const LOCK_COPY: Record<string, string> = {
  canceled: "Your subscription has ended, so your account is read-only: signals and LinkedIn outreach are paused.",
  expired: "Your subscription has ended, so your account is read-only: signals and LinkedIn outreach are paused.",
  paused: "Your subscription is paused, so your account is read-only: signals and LinkedIn outreach are paused.",
  no_subscription: `${PICK_PLAN_COPY}.`,
};

/**
 * Billing banner at the top of the app (out of credits, payment failed,
 * read-only, no plan). `onPickPlan` opens the plan picker.
 */
export function BillingBanner({ sub, onPickPlan }: { sub: SubscriptionState; onPickPlan: () => void }) {
  const [busy, setBusy] = useState(false);
  const banner = sub.banner;
  if (sub.loading) return null;

  if (sub.outOfCredits && (!banner || banner.kind === "trial" || banner.kind === "ending")) {
    const until = sub.creditsPeriodEnd ?? sub.currentPeriodEnd;
    return (
      <Bar
        tone="warn"
        icon={<Zap className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />}
        text={`You're out of credits. Your agents are paused until ${until ? formatRenewal(until) : "your plan renews"}.`}
      >
        {sub.isBillingOwner ? (
          <button onClick={onPickPlan} className="shrink-0 inline-flex items-center gap-1 text-sm font-semibold underline underline-offset-2" style={{ color: TONES.warn.color }}>
            Upgrade to keep going <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <span className="shrink-0 text-xs" style={{ color: TONES.warn.color }}>Your workspace owner manages billing.</span>
        )}
      </Bar>
    );
  }

  if (!banner) return null;

  const go = async () => {
    setBusy(true);
    const result = await openBillingPortal();
    if (!result.ok) {
      // No Creem customer yet (never subscribed): pick a plan instead.
      if (result.reason === "no_customer") onPickPlan();
      else toast.error(result.message);
    }
    setBusy(false);
  };

  const ownerNote = !sub.isBillingOwner ? " Your workspace owner manages billing." : "";

  if (banner.kind === "trial" || banner.kind === "ending") {
    const text = banner.kind === "trial"
      ? `Your plan renews ${fmtDate(banner.endsAt)}.`
      : `Your subscription ends ${fmtDate(banner.endsAt)}. Signals and LinkedIn outreach stop then.`;
    return (
      <Bar tone="info" icon={<Clock className="w-4 h-4 shrink-0 mt-0.5 text-sky-600" />} text={text + ownerNote}>
        {sub.isBillingOwner && <Action busy={busy} onClick={go} label="Manage billing" />}
      </Bar>
    );
  }

  if (banner.kind === "payment_failed") {
    return (
      <Bar
        tone="lock"
        icon={<AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />}
        text={"Payment failed, update your card. Signals and LinkedIn outreach are paused until it goes through." + ownerNote}
      >
        {sub.isBillingOwner && <Action busy={busy} onClick={go} label="Update card" />}
      </Bar>
    );
  }

  const status = banner.status;
  return (
    <Bar tone="lock" icon={<Lock className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />} text={LOCK_COPY[status] + ownerNote}>
      {sub.isBillingOwner && (
        <Action
          busy={busy}
          onClick={status === "paused" ? go : onPickPlan}
          label={status === "paused" ? "Resume" : "Pick a plan"}
        />
      )}
    </Bar>
  );
}

const TONES = {
  info: { background: "hsl(204 100% 97%)", borderColor: "hsl(204 80% 88%)", color: "hsl(204 60% 25%)" },
  lock: { background: "hsl(350 100% 97%)", borderColor: "hsl(350 80% 88%)", color: "hsl(350 50% 28%)" },
  warn: { background: "hsl(48 100% 96%)", borderColor: "hsl(48 90% 85%)", color: "hsl(28 60% 25%)" },
};

function Bar({ tone, icon, text, children }: { tone: keyof typeof TONES; icon: React.ReactNode; text: string; children?: React.ReactNode }) {
  const t = TONES[tone];
  return (
    <div role="status" className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 py-3 border-b" style={{ background: t.background, borderColor: t.borderColor }}>
      <div className="flex items-start gap-2.5">
        {icon}
        <p className="text-sm font-medium" style={{ color: t.color }}>{text}</p>
      </div>
      {children}
    </div>
  );
}

function Action({ busy, onClick, label }: { busy: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
      style={{ background: "hsl(var(--goji-coral))" }}
    >
      {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
      {label}
    </button>
  );
}
