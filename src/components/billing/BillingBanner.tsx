import { useState } from "react";
import { Clock, Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import type { SubscriptionState } from "@/hooks/useSubscription";
import { openBillingPortal, startCheckout } from "@/lib/billing";

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });

const LOCK_COPY: Record<string, string> = {
  past_due: "Your last payment didn't go through, so your account is read-only: signals and LinkedIn outreach are paused.",
  canceled: "Your subscription has ended, so your account is read-only: signals and LinkedIn outreach are paused.",
  no_subscription: "Start your 7-day free trial to turn on signals and LinkedIn outreach.",
};

/** Billing banner at the top of the app (trial ending, read-only). */
export function BillingBanner({ sub }: { sub: SubscriptionState }) {
  const [busy, setBusy] = useState(false);
  const banner = sub.banner;
  if (sub.loading || !banner) return null;

  const go = async (action: "portal" | "checkout") => {
    setBusy(true);
    const result = action === "portal" ? await openBillingPortal() : await startCheckout();
    if (!result.ok) {
      // No Stripe customer yet (never subscribed).
      if (action === "portal" && result.reason === "no_customer") {
        const retry = await startCheckout();
        if (!retry.ok) toast.error(retry.message);
      } else {
        toast.error(result.message);
      }
    }
    setBusy(false);
  };

  const ownerNote = !sub.isBillingOwner ? " Your workspace owner manages billing." : "";

  if (banner.kind === "trial_ending") {
    const ends = fmtDate(banner.endsAt);
    const text = banner.signalsLeft > 0
      ? `Your trial ends on ${ends} or after ${banner.signalsLeft} more signal${banner.signalsLeft === 1 ? "" : "s"}, whichever comes first. Then your card is charged $97/month.`
      : `Your trial has used all its signals and ends now. Your card will be charged $97/month.`;
    return (
      <Bar tone="info" icon={<Clock className="w-4 h-4 shrink-0 mt-0.5 text-sky-600" />} text={text + ownerNote}>
        {sub.isBillingOwner && <Action busy={busy} onClick={() => go("portal")} label="Manage billing" />}
      </Bar>
    );
  }

  const status = banner.status;
  const reactivate = status === "past_due" || status === "canceled" ? "portal" : "checkout";
  return (
    <Bar tone="lock" icon={<Lock className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />} text={LOCK_COPY[status] + ownerNote}>
      {sub.isBillingOwner && (
        <Action busy={busy} onClick={() => go(reactivate)} label={status === "no_subscription" ? "Start free trial" : "Reactivate"} />
      )}
    </Bar>
  );
}

const TONES = {
  info: { background: "hsl(204 100% 97%)", borderColor: "hsl(204 80% 88%)", color: "hsl(204 60% 25%)" },
  lock: { background: "hsl(350 100% 97%)", borderColor: "hsl(350 80% 88%)", color: "hsl(350 50% 28%)" },
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
