// ops-metrics: one JSON snapshot of the business for Claude's weekly plan & budget review.
// Revenue comes from Stripe (STRIPE_SECRET_KEY, already set for checkout); product usage from
// the database. Read-only. Auth: header x-ops-secret = public.ops_config.ops_secret.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const STRIPE = Deno.env.get("STRIPE_SECRET_KEY") || "";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

// deno-lint-ignore no-explicit-any
async function stripeList(path: string, params: Record<string, string>): Promise<any[]> {
  const out: unknown[] = [];
  let starting_after = "";
  for (let page = 0; page < 20; page++) {
    const qs = new URLSearchParams({ limit: "100", ...params, ...(starting_after ? { starting_after } : {}) });
    const r = await fetch(`https://api.stripe.com/v1/${path}?${qs}`, { headers: { Authorization: `Bearer ${STRIPE}` } });
    const d = await r.json();
    if (!r.ok) throw new Error(`Stripe ${path} ${r.status}: ${JSON.stringify(d).slice(0, 200)}`);
    out.push(...d.data);
    if (!d.has_more || !d.data.length) break;
    starting_after = d.data[d.data.length - 1].id;
  }
  // deno-lint-ignore no-explicit-any
  return out as any[];
}

// deno-lint-ignore no-explicit-any
function monthlyAmount(item: any): number {
  const price = item.price || item.plan;
  const unit = (price?.unit_amount ?? price?.amount ?? 0) * (item.quantity ?? 1);
  const interval = price?.recurring?.interval ?? price?.interval ?? "month";
  const count = price?.recurring?.interval_count ?? price?.interval_count ?? 1;
  const perMonth = interval === "year" ? unit / (12 * count)
    : interval === "week" ? (unit * 52) / (12 * count)
    : interval === "day" ? (unit * 365) / (12 * count)
    : unit / count;
  return perMonth / 100;
}

Deno.serve(async (req) => {
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const { data: cfg } = await admin.from("ops_config").select("value").eq("key", "ops_secret").maybeSingle();
  if (!cfg?.value || req.headers.get("x-ops-secret") !== cfg.value) return json({ error: "Unauthorized" }, 401);

  const now = Math.floor(Date.now() / 1000);
  const d30 = now - 30 * 86400;
  // deno-lint-ignore no-explicit-any
  const result: any = { generated_at: new Date().toISOString() };

  try {
    if (!STRIPE) throw new Error("STRIPE_SECRET_KEY not set");
    const active = await stripeList("subscriptions", { status: "active" });
    const trialing = await stripeList("subscriptions", { status: "trialing" });
    const canceled30 = (await stripeList("subscriptions", { status: "canceled", "created[gte]": String(now - 400 * 86400) }))
      .filter((s) => (s.canceled_at ?? 0) >= d30);
    const charges30 = (await stripeList("charges", { "created[gte]": String(d30) })).filter((c) => c.paid && !c.refunded);
    const currencies = new Set<string>();
    let mrr = 0;
    for (const s of active) {
      currencies.add(s.currency);
      for (const it of s.items?.data ?? []) mrr += monthlyAmount(it);
    }
    result.revenue = {
      currency: [...currencies].join(",") || "usd",
      mrr: Math.round(mrr * 100) / 100,
      active_subscriptions: active.length,
      trialing_subscriptions: trialing.length,
      new_subscriptions_30d: active.filter((s) => s.created >= d30).length + trialing.filter((s) => s.created >= d30).length,
      canceled_subscriptions_30d: canceled30.length,
      cash_collected_30d: Math.round(charges30.reduce((a, c) => a + (c.amount - (c.amount_refunded ?? 0)), 0)) / 100,
    };
  } catch (e) {
    result.revenue_error = e instanceof Error ? e.message : String(e);
  }

  const since30 = new Date(Date.now() - 30 * 864e5).toISOString();
  const since7 = new Date(Date.now() - 7 * 864e5).toISOString();
  const count = async (table: string, col: string, since: string) =>
    (await admin.from(table).select("*", { count: "exact", head: true }).gte(col, since)).count ?? null;
  result.product = {
    profiles_total: (await admin.from("profiles").select("*", { count: "exact", head: true })).count,
    signups_7d: await count("profiles", "created_at", since7),
    signups_30d: await count("profiles", "created_at", since30),
    signal_agent_runs_7d: await count("signal_agent_runs", "started_at", since7),
    meetings_30d: await count("meetings", "created_at", since30),
    blog_pages_live: (await admin.from("blog_posts").select("*", { count: "exact", head: true })).count,
  };
  const { data: posts } = await admin.from("linkedin_posts").select("status")
    .eq("user_id", (await admin.from("ops_config").select("value").eq("key", "owner_user_id").maybeSingle()).data?.value ?? "");
  result.founder_linkedin = (posts ?? []).reduce((a: Record<string, number>, p: { status: string }) => {
    a[p.status] = (a[p.status] ?? 0) + 1; return a;
  }, {});
  const { data: sup } = await admin.from("support_messages").select("status").eq("direction", "in").gte("created_at", since30);
  result.support_30d = (sup ?? []).reduce((a: Record<string, number>, p: { status: string }) => {
    a[p.status] = (a[p.status] ?? 0) + 1; return a;
  }, {});
  return json(result);
});
