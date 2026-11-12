// Starts a Creem checkout for Intentsly Pro ($97/month, 7-day trial set on the
// product). Accounts that already have a live subscription get the customer
// portal instead, so nobody ends up with two.
// In test mode only admins and CREEM_TEST_EMAILS can check out: real users get
// the "checkout is paused" message until Alex switches CREEM_MODE to live.
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { billingOwnerOf } from "../_shared/account-access.ts";
import { checkoutSuccessUrl, corsHeaders, creemConfig, creemPost, json } from "../_shared/creem.ts";

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

    const { data: existing } = await db
      .from("subscriptions")
      .select("creem_customer_id, status")
      .eq("user_id", user.id)
      .eq("mode", cfg.mode)
      .in("status", HAS_SUBSCRIPTION)
      .not("creem_customer_id", "is", null)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (existing?.creem_customer_id) {
      const portal = await creemPost<{ customer_portal_link: string }>("/v1/customers/billing", {
        customer_id: existing.creem_customer_id,
      }, cfg);
      return json({ url: portal.customer_portal_link, portal_url: portal.customer_portal_link, already_subscribed: true });
    }

    const checkout = await creemPost<{ id: string; checkout_url: string }>("/v1/checkouts", {
      product_id: cfg.productId,
      request_id: crypto.randomUUID(),
      success_url: checkoutSuccessUrl(req.headers.get("origin")),
      customer: { email: user.email },
      metadata: { user_id: user.id },
    }, cfg);
    console.log(`[creem-checkout] ${cfg.mode} checkout ${checkout.id} for ${user.id}`);
    return json({ checkout_url: checkout.checkout_url, url: checkout.checkout_url });
  } catch (error) {
    console.error("[creem-checkout]", error);
    return json({ error: "Could not start checkout. Please try again or email alex@intentsly.com." }, 500);
  }
});
