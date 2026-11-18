// Starts a Creem checkout for a plan (body {plan: "starter" | "growth" | "pro"},
// default "pro"). No trial: the card is charged on day one. Product IDs come
// from public.billing_plans (creem_product_id_test / _live), never from code.
//
// Accounts that already have a subscription change plan instead of buying a
// second one: an upgrade is charged pro rata now and the webhook grants the
// difference in credits; a downgrade is applied by Creem without a charge and
// takes effect for credits and limits at the next renewal.
//
// In test mode only admins and CREEM_TEST_EMAILS can check out: real users get
// the "checkout is paused" message until Alex switches CREEM_MODE to live.
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { billingOwnerOf } from "../_shared/account-access.ts";
import {
  type BillingPlan,
  checkoutSuccessUrl,
  corsHeaders,
  creemConfig,
  creemPost,
  json,
  PLAN_KEYS,
  type PlanKey,
  planForProduct,
  productForPlan,
} from "../_shared/creem.ts";

// Statuses with a subscription still attached (paying, or a card to fix).
const HAS_SUBSCRIPTION = ["trialing", "active", "scheduled_cancel", "past_due", "unpaid", "paused"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
      auth: { persistSession: false },
    });
    const token = (req.headers.get("Authorization") || "").replace("Bearer ", "");
    const { data: userData } = await db.auth.getUser(token);
    const user = userData?.user;
    if (!user?.email) return json({ error: "Not signed in" }, 401);

    const body = await req.json().catch(() => ({}));
    const planKey: PlanKey = PLAN_KEYS.includes(body?.plan) ? body.plan : "pro";

    const cfg = creemConfig();
    if (cfg.mode === "test") {
      const testers = (Deno.env.get("CREEM_TEST_EMAILS") || "").toLowerCase().split(",").map((e) => e.trim()).filter(Boolean);
      const { data: isAdmin } = await db.rpc("has_role", { _user_id: user.id, _role: "admin" });
      if (!isAdmin && !testers.includes(user.email.toLowerCase())) {
        return json({ error: "Payments are currently unavailable.", code: "payments_disabled" }, 403);
      }
    }

    if ((await billingOwnerOf(db, user.id)) !== user.id) {
      return json({ error: "Your workspace owner manages billing.", code: "not_billing_owner" }, 403);
    }

    const { data: plansData, error: plansError } = await db
      .from("billing_plans")
      .select("key, name, price_cents, monthly_credits, creem_product_id_test, creem_product_id_live")
      .eq("active", true);
    if (plansError) throw new Error(`billing_plans: ${plansError.message}`);
    const plans = (plansData ?? []) as BillingPlan[];
    const plan = plans.find((p) => p.key === planKey);
    const productId = plan ? productForPlan(plan, cfg.mode) : null;
    if (!plan || !productId) {
      console.error(`[creem-checkout] no ${cfg.mode} Creem product set for plan ${planKey}`);
      return json({ error: "This plan isn't available yet. Please email alex@intentsly.com.", code: "plan_not_configured" }, 503);
    }

    const { data: existing } = await db
      .from("subscriptions")
      .select("creem_subscription_id, creem_customer_id, product_id, status")
      .eq("user_id", user.id)
      .eq("mode", cfg.mode)
      .in("status", HAS_SUBSCRIPTION)
      .not("creem_customer_id", "is", null)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing?.creem_subscription_id) {
      const current = planForProduct(plans, existing.product_id, cfg.mode);
      if (current?.key === plan.key) {
        const portal = await creemPost<{ customer_portal_link: string }>("/v1/customers/billing", {
          customer_id: existing.creem_customer_id,
        }, cfg);
        return json({ url: portal.customer_portal_link, portal_url: portal.customer_portal_link, already_subscribed: true });
      }
      const upgrade = !current || plan.price_cents > current.price_cents;
      await creemPost(`/v1/subscriptions/${existing.creem_subscription_id}/upgrade`, {
        product_id: productId,
        // Upgrade: pay the difference now. Downgrade: no charge; the lower price applies from the next renewal.
        update_behavior: upgrade ? "proration-charge-immediately" : "proration-none",
      }, cfg);
      console.log(`[creem-checkout] ${cfg.mode} ${user.id}: ${current?.key ?? "?"} -> ${plan.key} (${upgrade ? "upgrade" : "downgrade"})`);
      return json({ changed: true, plan: plan.key, effective: upgrade ? "now" : "next_renewal" });
    }

    const checkout = await creemPost<{ id: string; checkout_url: string }>("/v1/checkouts", {
      product_id: productId,
      request_id: crypto.randomUUID(),
      success_url: checkoutSuccessUrl(req.headers.get("origin")),
      customer: { email: user.email },
      metadata: { user_id: user.id, plan: plan.key },
    }, cfg);
    console.log(`[creem-checkout] ${cfg.mode} checkout ${checkout.id} for ${user.id} (${plan.key})`);
    return json({ checkout_url: checkout.checkout_url, url: checkout.checkout_url });
  } catch (error) {
    console.error("[creem-checkout]", error);
    return json({ error: "Could not start checkout. Please try again or email alex@intentsly.com." }, 500);
  }
});
