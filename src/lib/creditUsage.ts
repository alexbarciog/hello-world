// Turns public.credit_ledger rows into the Settings → Billing → Usage view.
// Pure functions, unit-tested in src/test/credit-usage.test.ts.

export type LedgerReason =
  | "plan_grant" | "lead_1" | "lead_2" | "lead_3" | "connection"
  | "ai_message" | "template_message" | "refund" | "admin_adjust";

export interface LedgerRow {
  id: number;
  created_at: string;
  /** Negative = spend. */
  delta: number;
  reason: string;
  ref_type?: string | null;
  ref_id?: string | null;
}

/** Display order. */
export const LEDGER_REASONS: LedgerReason[] = [
  "lead_1", "lead_2", "lead_3", "connection", "ai_message", "template_message", "refund", "plan_grant", "admin_adjust",
];

/** The per-action totals shown for the period (always listed, zero or not). */
export const PERIOD_ACTIONS: LedgerReason[] = ["lead_1", "lead_2", "lead_3", "connection", "ai_message", "template_message", "refund"];

export const REASON_LABELS: Record<LedgerReason, string> = {
  lead_1: "Leads, 1 fire",
  lead_2: "Leads, 2 fires",
  lead_3: "Leads, 3 fires",
  connection: "Connection requests",
  ai_message: "AI-written messages",
  template_message: "Template messages",
  refund: "Refunds",
  plan_grant: "Plan credits",
  admin_adjust: "Adjustments",
};

export const reasonLabel = (reason: string) => REASON_LABELS[reason as LedgerReason] ?? reason;

const order = (reason: string) => {
  const i = LEDGER_REASONS.indexOf(reason as LedgerReason);
  return i === -1 ? LEDGER_REASONS.length : i;
};

export interface UsageLine {
  reason: string;
  count: number;
  /** Signed sum of deltas (spends are negative). */
  credits: number;
}

/** Start of the current credit period: one month before the renewal date, else the 1st of this month. */
export function periodStart(periodEnd: string | null | undefined, now: Date = new Date()): Date {
  if (periodEnd) {
    const end = new Date(periodEnd);
    if (!Number.isNaN(end.getTime())) {
      const start = new Date(end);
      start.setMonth(start.getMonth() - 1);
      return start;
    }
  }
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function sumBy(rows: LedgerRow[]): Map<string, UsageLine> {
  const map = new Map<string, UsageLine>();
  for (const r of rows) {
    const line = map.get(r.reason) ?? { reason: r.reason, count: 0, credits: 0 };
    line.count += 1;
    line.credits += Number(r.delta) || 0;
    map.set(r.reason, line);
  }
  return map;
}

/** Totals per action since `since` (every PERIOD_ACTIONS entry, zeros included). */
export function periodTotals(rows: LedgerRow[], since: Date): UsageLine[] {
  const inPeriod = rows.filter((r) => new Date(r.created_at).getTime() >= since.getTime());
  const map = sumBy(inPeriod);
  return PERIOD_ACTIONS.map((reason) => map.get(reason) ?? { reason, count: 0, credits: 0 });
}

/** Credits spent since `since` (positive number, refunds subtracted). */
export function creditsSpent(rows: LedgerRow[], since: Date): number {
  return rows
    .filter((r) => new Date(r.created_at).getTime() >= since.getTime() && r.reason !== "plan_grant" && r.reason !== "admin_adjust")
    .reduce((acc, r) => acc - (Number(r.delta) || 0), 0);
}

/** Local calendar day, YYYY-MM-DD. */
export function dayKey(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export interface UsageDay {
  day: string;
  lines: UsageLine[];
  /** Net credit change that day. */
  net: number;
}

/** Ledger grouped by day (newest first), then by reason. */
export function groupByDay(rows: LedgerRow[]): UsageDay[] {
  const byDay = new Map<string, LedgerRow[]>();
  for (const r of rows) {
    const key = dayKey(r.created_at);
    const list = byDay.get(key) ?? [];
    list.push(r);
    byDay.set(key, list);
  }
  return [...byDay.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([day, list]) => {
      const lines = [...sumBy(list).values()].sort((a, b) => order(a.reason) - order(b.reason));
      return { day, lines, net: lines.reduce((acc, l) => acc + l.credits, 0) };
    });
}
