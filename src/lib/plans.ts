// Credit-based plans. Prices, credits and limits live in public.billing_plans
// and credit costs in public.credit_costs, so they can change without a
// deploy; the values below are only the fallback (and what the prerendered
// /pricing HTML shows before the live values load).

export type PlanKey = "starter" | "growth" | "pro";

export const PLAN_KEYS: PlanKey[] = ["starter", "growth", "pro"];

export const MOST_POPULAR_PLAN: PlanKey = "growth";

/** Paywall copy for accounts without a plan (never mention a trial). */
export const PICK_PLAN_COPY = "Pick a plan to let Intentsly find and message these people for you";

/** Renewal dates read "Dec 17". */
export const formatRenewal = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });

export interface BillingPlan {
  key: PlanKey;
  name: string;
  price_cents: number;
  monthly_credits: number;
  /** null = unlimited */
  max_signal_agents: number | null;
  /** null = unlimited */
  max_active_campaigns: number | null;
  linkedin_accounts: number;
  priority_support: boolean;
  sort_order: number;
  active: boolean;
}

export const FALLBACK_PLANS: BillingPlan[] = [
  { key: "starter", name: "Starter", price_cents: 2900, monthly_credits: 300, max_signal_agents: 1, max_active_campaigns: 1, linkedin_accounts: 1, priority_support: false, sort_order: 1, active: true },
  { key: "growth", name: "Growth", price_cents: 6800, monthly_credits: 900, max_signal_agents: 3, max_active_campaigns: 5, linkedin_accounts: 1, priority_support: false, sort_order: 2, active: true },
  { key: "pro", name: "Pro", price_cents: 9700, monthly_credits: 1600, max_signal_agents: null, max_active_campaigns: null, linkedin_accounts: 1, priority_support: true, sort_order: 3, active: true },
];

/** Rough guide to what a month of credits buys. Shown with "about", never as a promise. */
export const PLAN_CREDIT_GUIDE: Record<PlanKey, { leads: number; connections: number; aiMessages: number }> = {
  starter: { leads: 40, connections: 40, aiMessages: 25 },
  growth: { leads: 120, connections: 120, aiMessages: 75 },
  pro: { leads: 220, connections: 200, aiMessages: 130 },
};

export const isPlanKey = (v: unknown): v is PlanKey => typeof v === "string" && (PLAN_KEYS as string[]).includes(v);

const num = (v: unknown, fallback: number): number => {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  return Number.isFinite(n) ? n : fallback;
};
const numOrNull = (v: unknown): number | null => (v === null || v === undefined ? null : num(v, 0));

/** Active plans from billing_plans rows, sorted; falls back to FALLBACK_PLANS when nothing usable comes back. */
export function normalizePlans(rows: unknown): BillingPlan[] {
  if (!Array.isArray(rows)) return FALLBACK_PLANS;
  const plans = rows
    .filter((r): r is Record<string, unknown> => !!r && typeof r === "object" && isPlanKey((r as Record<string, unknown>).key))
    .filter((r) => r.active !== false)
    .map((r) => {
      const fb = FALLBACK_PLANS.find((p) => p.key === r.key)!;
      return {
        key: r.key as PlanKey,
        name: typeof r.name === "string" && r.name ? r.name : fb.name,
        price_cents: num(r.price_cents, fb.price_cents),
        monthly_credits: num(r.monthly_credits, fb.monthly_credits),
        max_signal_agents: numOrNull(r.max_signal_agents),
        max_active_campaigns: numOrNull(r.max_active_campaigns),
        linkedin_accounts: num(r.linkedin_accounts, fb.linkedin_accounts),
        priority_support: Boolean(r.priority_support),
        sort_order: num(r.sort_order, fb.sort_order),
        active: true,
      };
    })
    .sort((a, b) => a.sort_order - b.sort_order);
  return plans.length ? plans : FALLBACK_PLANS;
}

export const formatPrice = (cents: number) => {
  const dollars = cents / 100;
  return `$${Number.isInteger(dollars) ? dollars : dollars.toFixed(2)}`;
};

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** The plan's limits as short lines for a plan card. */
export function planLimits(plan: BillingPlan): string[] {
  return [
    plan.max_signal_agents === null ? "Unlimited signal agents" : plural(plan.max_signal_agents, "signal agent", "signal agents"),
    plural(plan.linkedin_accounts, "LinkedIn account", "LinkedIn accounts"),
    plan.max_active_campaigns === null ? "Unlimited campaigns" : plural(plan.max_active_campaigns, "active campaign", "active campaigns"),
    "AI replies in Unibox",
    plan.priority_support ? "Priority email support" : "Email support",
  ];
}

/** "What your credits get you" lines (rough guides). */
export function planGuideLines(key: PlanKey): string[] {
  const g = PLAN_CREDIT_GUIDE[key];
  return [
    `About ${g.leads} leads`,
    `About ${g.connections} connection requests`,
    `About ${g.aiMessages} AI-written messages`,
  ];
}

// ─── Credit costs ────────────────────────────────────────────────────────────

export type CreditAction = "lead_1" | "lead_2" | "lead_3" | "connection" | "ai_message" | "template_message";

export const CREDIT_ACTIONS: CreditAction[] = ["lead_1", "lead_2", "lead_3", "connection", "ai_message", "template_message"];

export const FALLBACK_CREDIT_COSTS: Record<CreditAction, number> = {
  lead_1: 1,
  lead_2: 3,
  lead_3: 5,
  connection: 1,
  ai_message: 5,
  template_message: 2,
};

export const CREDIT_ACTION_LABELS: Record<CreditAction, string> = {
  lead_1: "Lead found, 1 fire",
  lead_2: "Lead found, 2 fires",
  lead_3: "Lead found, 3 fires",
  connection: "LinkedIn connection request sent",
  ai_message: "LinkedIn message written by AI",
  template_message: "LinkedIn message from a template (no AI)",
};

export const FREE_ACTIONS = [
  "Leads below 1 fire",
  "Duplicate leads",
  "Replies the person sends you",
  "AI replies inside an existing conversation",
  "Profile views and likes",
];

export function normalizeCreditCosts(rows: unknown): Record<CreditAction, number> {
  const costs = { ...FALLBACK_CREDIT_COSTS };
  if (!Array.isArray(rows)) return costs;
  for (const r of rows) {
    if (!r || typeof r !== "object") continue;
    const { action, credits } = r as { action?: unknown; credits?: unknown };
    if (typeof action === "string" && (CREDIT_ACTIONS as string[]).includes(action)) {
      costs[action as CreditAction] = num(credits, costs[action as CreditAction]);
    }
  }
  return costs;
}
