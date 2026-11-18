import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { SubscriptionState } from "@/hooks/useSubscription";
import {
  creditsSpent, groupByDay, periodStart, periodTotals, reasonLabel, type LedgerRow,
} from "@/lib/creditUsage";
import { formatRenewal } from "@/lib/plans";

const DAYS_SHOWN = 60;

const fmtDay = (key: string) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
};

const signed = (n: number) => (n > 0 ? `+${n.toLocaleString("en-US")}` : n.toLocaleString("en-US"));

function useLedger() {
  return useQuery({
    queryKey: ["credit_ledger", DAYS_SHOWN],
    queryFn: async (): Promise<LedgerRow[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const since = new Date(Date.now() - DAYS_SHOWN * 24 * 60 * 60 * 1000).toISOString();
      // credit_ledger isn't in the generated types yet.
      const { data, error } = await (supabase as unknown as SupabaseClient)
        .from("credit_ledger")
        .select("id, created_at, delta, reason, ref_type, ref_id")
        .eq("user_id", user.id)
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(5000);
      if (error) throw error;
      return (data ?? []) as LedgerRow[];
    },
    retry: false,
  });
}

/** Settings → Billing → Usage: balance, this period's totals per action, and the ledger by day. */
export function CreditUsage({ sub }: { sub: SubscriptionState }) {
  const { data: rows, isLoading, isError } = useLedger();
  const renewal = sub.creditsPeriodEnd ?? sub.currentPeriodEnd;
  const since = useMemo(() => periodStart(sub.creditsPeriodEnd), [sub.creditsPeriodEnd]);
  const totals = useMemo(() => periodTotals(rows ?? [], since), [rows, since]);
  const spent = useMemo(() => creditsSpent(rows ?? [], since), [rows, since]);
  const days = useMemo(() => groupByDay(rows ?? []), [rows]);

  if (!sub.isBillingOwner) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
        Billing is managed by your workspace owner.
      </div>
    );
  }

  const total = sub.plan?.monthly_credits ?? null;

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Credits left" value={(sub.credits ?? 0).toLocaleString("en-US")} hint={total !== null ? `of ${total.toLocaleString("en-US")} this period` : undefined} />
        <Stat label="Used this period" value={spent.toLocaleString("en-US")} hint={`since ${formatRenewal(since.toISOString())}`} />
        <Stat label="Renews" value={renewal ? formatRenewal(renewal) : "—"} hint={renewal ? "credits reset to your plan amount" : "no active plan"} />
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">This period</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Since {formatRenewal(since.toISOString())}</p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
              <th scope="col" className="px-5 py-2.5 font-semibold">Action</th>
              <th scope="col" className="px-3 py-2.5 font-semibold text-right">Count</th>
              <th scope="col" className="px-5 py-2.5 font-semibold text-right">Credits</th>
            </tr>
          </thead>
          <tbody>
            {totals.map((t) => (
              <tr key={t.reason} className="border-t border-border/60">
                <td className="px-5 py-2.5 text-foreground">{reasonLabel(t.reason)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground">{t.count.toLocaleString("en-US")}</td>
                <td className={`px-5 py-2.5 text-right tabular-nums font-medium ${t.credits > 0 ? "text-emerald-600" : "text-foreground"}`}>
                  {t.credits === 0 ? "0" : signed(t.credits)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Activity</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Last {DAYS_SHOWN} days, by day</p>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : isError ? (
          <p className="px-5 py-8 text-center text-sm text-muted-foreground">Usage isn't available right now. Try again in a minute.</p>
        ) : days.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted-foreground">No credit activity yet.</p>
        ) : (
          <ul className="divide-y divide-border/60">
            {days.map((d) => (
              <li key={d.day} className="px-5 py-3.5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[13px] font-semibold text-foreground">{fmtDay(d.day)}</p>
                  <p className="text-xs tabular-nums text-muted-foreground">{signed(d.net)} credits</p>
                </div>
                <ul className="mt-1.5 space-y-1">
                  {d.lines.map((l) => (
                    <li key={l.reason} className="flex items-center justify-between gap-3 text-[13px]">
                      <span className="text-muted-foreground min-w-0 truncate">
                        {reasonLabel(l.reason)} <span className="text-muted-foreground/70">× {l.count}</span>
                      </span>
                      <span className={`tabular-nums shrink-0 ${l.credits > 0 ? "text-emerald-600" : "text-foreground"}`}>{signed(l.credits)}</span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card px-4 py-3.5">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">{value}</p>
      {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
    </div>
  );
}
