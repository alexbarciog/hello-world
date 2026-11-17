import { describe, expect, it } from "vitest";
import { creditsSpent, groupByDay, periodStart, periodTotals, type LedgerRow } from "@/lib/creditUsage";
import {
  FALLBACK_CREDIT_COSTS, FALLBACK_PLANS, isPlanKey, normalizeCreditCosts, normalizePlans, planGuideLines, planLimits,
} from "@/lib/plans";

const row = (id: number, created_at: string, delta: number, reason: string): LedgerRow => ({ id, created_at, delta, reason });

// Midday local times so the day grouping doesn't depend on the test machine's timezone.
const at = (y: number, m: number, d: number, h = 12) => new Date(y, m - 1, d, h).toISOString();

describe("plans", () => {
  it("falls back to the current plans when billing_plans returns nothing usable", () => {
    expect(normalizePlans(null)).toBe(FALLBACK_PLANS);
    expect(normalizePlans([])).toBe(FALLBACK_PLANS);
    expect(normalizePlans([{ key: "enterprise" }])).toBe(FALLBACK_PLANS);
  });

  it("reads live values, drops inactive plans and sorts by sort_order", () => {
    const plans = normalizePlans([
      { key: "pro", name: "Pro", price_cents: 9900, monthly_credits: 2000, max_signal_agents: null, max_active_campaigns: null, linkedin_accounts: 1, priority_support: true, sort_order: 3, active: true },
      { key: "starter", name: "Starter", price_cents: 2900, monthly_credits: 300, max_signal_agents: 1, max_active_campaigns: 1, linkedin_accounts: 1, priority_support: false, sort_order: 1, active: true },
      { key: "growth", name: "Growth", price_cents: 6800, monthly_credits: 900, max_signal_agents: 3, max_active_campaigns: 5, linkedin_accounts: 1, priority_support: false, sort_order: 2, active: false },
    ]);
    expect(plans.map((p) => p.key)).toEqual(["starter", "pro"]);
    expect(plans[1]).toMatchObject({ price_cents: 9900, monthly_credits: 2000, max_signal_agents: null });
  });

  it("describes limits, with null meaning unlimited", () => {
    const [starter, , pro] = FALLBACK_PLANS;
    expect(planLimits(starter)).toEqual(["1 signal agent", "1 LinkedIn account", "1 active campaign", "AI replies in Unibox", "Email support"]);
    expect(planLimits(pro)).toEqual(["Unlimited signal agents", "1 LinkedIn account", "Unlimited campaigns", "AI replies in Unibox", "Priority email support"]);
  });

  it("phrases the credit guide as rough numbers", () => {
    expect(planGuideLines("growth")).toEqual(["About 120 leads", "About 120 connection requests", "About 75 AI-written messages"]);
  });

  it("merges credit_costs rows over the fallback", () => {
    expect(normalizeCreditCosts(null)).toEqual(FALLBACK_CREDIT_COSTS);
    expect(normalizeCreditCosts([{ action: "ai_message", credits: 4 }, { action: "unknown", credits: 9 }])).toEqual({ ...FALLBACK_CREDIT_COSTS, ai_message: 4 });
  });

  it("validates plan keys", () => {
    expect(isPlanKey("growth")).toBe(true);
    expect(isPlanKey("plus")).toBe(false);
    expect(isPlanKey(null)).toBe(false);
  });
});

describe("credit usage", () => {
  const rows: LedgerRow[] = [
    row(1, at(2026, 10, 17), 900, "plan_grant"),
    row(2, at(2026, 11, 16), -1, "lead_1"),
    row(3, at(2026, 11, 17, 9), -3, "lead_2"),
    row(4, at(2026, 11, 17, 10), -1, "lead_1"),
    row(5, at(2026, 11, 17, 11), -5, "ai_message"),
    row(6, at(2026, 11, 17, 12), 5, "refund"),
    row(7, at(2026, 11, 17, 13), -1, "connection"),
  ];

  it("starts the period one month before the renewal date, else on the 1st", () => {
    expect(periodStart("2026-12-17T10:00:00.000Z").toISOString()).toBe("2026-11-17T10:00:00.000Z");
    expect(periodStart(null, new Date(2026, 10, 20))).toEqual(new Date(2026, 10, 1));
  });

  it("totals every action in the period, zeros included", () => {
    const totals = periodTotals(rows, new Date(2026, 10, 17));
    expect(totals).toEqual([
      { reason: "lead_1", count: 1, credits: -1 },
      { reason: "lead_2", count: 1, credits: -3 },
      { reason: "lead_3", count: 0, credits: 0 },
      { reason: "connection", count: 1, credits: -1 },
      { reason: "ai_message", count: 1, credits: -5 },
      { reason: "template_message", count: 0, credits: 0 },
      { reason: "refund", count: 1, credits: 5 },
    ]);
    expect(creditsSpent(rows, new Date(2026, 10, 17))).toBe(5);
  });

  it("groups by day (newest first) and by reason", () => {
    const days = groupByDay(rows);
    expect(days.map((d) => d.day)).toEqual(["2026-11-17", "2026-11-16", "2026-10-17"]);
    expect(days[0].lines.map((l) => [l.reason, l.count, l.credits])).toEqual([
      ["lead_1", 1, -1],
      ["lead_2", 1, -3],
      ["connection", 1, -1],
      ["ai_message", 1, -5],
      ["refund", 1, 5],
    ]);
    expect(days[0].net).toBe(-5);
    expect(days[2].lines).toEqual([{ reason: "plan_grant", count: 1, credits: 900 }]);
  });
});
