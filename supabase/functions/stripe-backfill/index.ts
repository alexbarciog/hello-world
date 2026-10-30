// One-off (re-runnable): link existing Stripe customers to profiles and copy
// their live subscriptions, so the 4 paying customers become active. Run it
// BEFORE switching payments on, or they'd be locked as never-subscribed. Admins only. POST {"dry_run": true} to preview.
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { profileFieldsFromSubscription, type StripeSubscriptionLike } from "../_shared/billing.ts";
import { corsHeaders, json, stripeClient } from "../_shared/stripe.ts";

const LIVE_STATUSES = new Set(["active", "trialing", "past_due", "unpaid"]);
const RANK: Record<string, number> = { active: 0, trialing: 1, past_due: 2, unpaid: 3, paused: 4, incomplete: 5, canceled: 6, incomplete_expired: 7 };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });

  const token = (req.headers.get("Authorization") || "").replace("Bearer ", "");
  const { data: userData } = await db.auth.getUser(token);
  const caller = userData?.user;
  if (!caller) return json({ error: "Not signed in" }, 401);
  const { data: isAdmin } = await db.rpc("has_role", { _user_id: caller.id, _role: "admin" });
  if (!isAdmin) return json({ error: "Admins only" }, 403);

  const dryRun = (await req.json().catch(() => ({})))?.dry_run !== false;
  const stripe = stripeClient();

  // email → user id for every account
  const emailToUser = new Map<string, string>();
  for (let page = 1; ; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) return json({ error: error.message }, 500);
    for (const u of data.users) if (u.email) emailToUser.set(u.email.toLowerCase(), u.id);
    if (data.users.length < 1000) break;
  }

  // The Stripe account also bills other businesses: only Intentsly products count.
  const products = new Set(
    (Deno.env.get("INTENTSLY_PRODUCT_IDS") || "prod_UBCE3Xunx980Z6,prod_UGjR0WwP5rbgZX").split(",").map((s) => s.trim()).filter(Boolean),
  );
  const launchPrice = Deno.env.get("STRIPE_PRICE_ID_MONTHLY");
  if (launchPrice) {
    const price = await stripe.prices.retrieve(launchPrice);
    products.add(typeof price.product === "string" ? price.product : price.product.id);
  }

  // Best subscription per customer: live statuses first, then newest.
  const best = new Map<string, StripeSubscriptionLike & { created: number }>();
  for await (const sub of stripe.subscriptions.list({ status: "all", limit: 100 })) {
    const product = sub.items.data[0]?.price?.product;
    if (!products.has(typeof product === "string" ? product : product?.id ?? "")) continue;
    // Founder decision: non-paying accounts are treated as if they never had a plan,
    // so old cancelled subscriptions aren't imported.
    if (!LIVE_STATUSES.has(sub.status)) continue;
    const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
    const current = best.get(customerId);
    const better = !current ||
      (RANK[sub.status] ?? 9) < (RANK[current.status] ?? 9) ||
      ((RANK[sub.status] ?? 9) === (RANK[current.status] ?? 9) && sub.created > current.created);
    if (better) best.set(customerId, sub as unknown as StripeSubscriptionLike & { created: number });
  }

  const changes: Array<Record<string, unknown>> = [];
  for (const [customerId, sub] of best) {
    const customer = await stripe.customers.retrieve(customerId);
    if ((customer as { deleted?: boolean }).deleted) continue;
    const email = (customer as { email?: string | null }).email?.toLowerCase();
    const userId = (email && emailToUser.get(email)) || null;
    if (!userId) {
      changes.push({ customerId, email, status: sub.status, result: "no matching account (other business or deleted user)" });
      continue;
    }
    const fields = profileFieldsFromSubscription(sub);
    changes.push({ userId, email, customerId, status: sub.status, set: fields.subscription_status ?? "(unchanged)" });
    if (!dryRun) {
      const { error } = await db.from("profiles").update(fields).eq("user_id", userId);
      if (error) changes[changes.length - 1].error = error.message;
    }
  }

  return json({ dry_run: dryRun, products: [...products], customers: best.size, changes });
});
