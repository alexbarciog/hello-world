// ops-metrics: one JSON snapshot of the business for Claude's weekly plan & budget review.
// Revenue comes from public.subscriptions (Creem, live store only, kept in sync by
// creem-webhook); product usage from the database. Read-only. Auth: header
// x-ops-secret = public.ops_config.ops_secret.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
// One plan: Intentsly Pro, $97/month (founding customers keep it for life).
const PLAN_MONTHLY_USD = 97;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const { data: cfg } = await admin.from("ops_config").select("value").eq("key", "ops_secret").maybeSingle();
  if (!cfg?.value || req.headers.get("x-ops-secret") !== cfg.value) return json({ error: "Unauthorized" }, 401);

  // deno-lint-ignore no-explicit-any
  const result: any = { generated_at: new Date().toISOString() };
  const since30 = new Date(Date.now() - 30 * 864e5).toISOString();
  const since7 = new Date(Date.now() - 7 * 864e5).toISOString();

  try {
    const { data: subs, error } = await admin
      .from("subscriptions")
      .select("status, founding, created_at, canceled_at, updated_at")
      .eq("mode", "live");
    if (error) throw new Error(error.message);
    const rows = subs ?? [];
    const now = Date.now();
    const is = (s: string) => rows.filter((r) => r.status === s);
    // scheduled_cancel has paid for this period, so it still counts until it ends.
    const active = rows.filter((r) => r.status === "active" || r.status === "scheduled_cancel");
    const ended = rows.filter((r) => r.status === "canceled" || r.status === "expired" || r.status === "scheduled_cancel");
    const { data: paid } = await admin
      .from("billing_events")
      .select("payload")
      .eq("event_type", "subscription.paid")
      .gte("received_at", since30);
    const cash = (paid ?? [])
      .filter((e) => e.payload?.object?.mode === "prod")
      .reduce((a, e) => a + (Number(e.payload?.object?.last_transaction?.amount_paid) || 0), 0);
    result.revenue = {
      source: "creem",
      currency: "usd",
      mrr: active.length * PLAN_MONTHLY_USD,
      active_subscriptions: active.length,
      trials: is("trialing").length,
      scheduled_cancel: is("scheduled_cancel").length,
      past_due: is("past_due").length + is("unpaid").length,
      founding_customers: rows.filter((r) => r.founding).length,
      new_subscriptions_30d: rows.filter((r) => new Date(r.created_at).getTime() >= now - 30 * 864e5).length,
      canceled_subscriptions_30d: ended.filter((r) => new Date(r.canceled_at ?? r.updated_at).getTime() >= now - 30 * 864e5).length,
      cash_collected_30d: Math.round(cash) / 100,
    };
  } catch (e) {
    result.revenue_error = e instanceof Error ? e.message : String(e);
  }

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
