import { Check } from "lucide-react";
import { useCreditCosts } from "@/hooks/usePlans";
import { CREDIT_ACTIONS, CREDIT_ACTION_LABELS, FREE_ACTIONS } from "@/lib/plans";

const DARK = "hsl(var(--aeline-dark))";

/** "How credits work": cost per action from credit_costs, plus what's free. */
export function CreditCostTable() {
  const costs = useCreditCosts();
  return (
    <section id="how-credits-work" aria-labelledby="how-credits-work-title" className="scroll-mt-24">
      <h2 id="how-credits-work-title" className="text-2xl md:text-3xl font-medium tracking-tight text-center" style={{ color: DARK }}>
        How credits work
      </h2>
      <p className="mt-3 text-center text-sm md:text-base text-muted-foreground leading-relaxed max-w-xl mx-auto">
        You only pay for leads you can see and messages that go out. Failed sends are refunded.
      </p>

      <div className="mt-8 grid gap-5 md:grid-cols-[1.4fr_1fr]">
        <div className="rounded-3xl bg-white border border-[#E7E7EA] shadow-[0_12px_40px_-24px_rgba(15,23,42,0.22)] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <th scope="col" className="px-5 py-3 font-semibold">Action</th>
                <th scope="col" className="px-5 py-3 font-semibold text-right">Credits</th>
              </tr>
            </thead>
            <tbody>
              {CREDIT_ACTIONS.map((action) => (
                <tr key={action} className="border-t border-[#EFEFF1]">
                  <td className="px-5 py-3" style={{ color: DARK }}>{CREDIT_ACTION_LABELS[action]}</td>
                  <td className="px-5 py-3 text-right font-semibold tabular-nums text-[#1A8FE3]">{costs[action]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-3xl bg-white border border-[#E7E7EA] shadow-[0_12px_40px_-24px_rgba(15,23,42,0.22)] p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Always free</p>
          <ul className="mt-3 space-y-2 text-sm" style={{ color: DARK }}>
            {FREE_ACTIONS.map((line) => (
              <li key={line} className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#1A8FE3]" />
                {line}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-muted-foreground leading-relaxed">
            Credits reset to your plan amount at each renewal and don't roll over.
          </p>
        </div>
      </div>
    </section>
  );
}
