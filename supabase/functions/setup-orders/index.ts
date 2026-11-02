// Done-for-you setup ($500 one-time; included for founding customers).
// Customer actions: mine, start, save_intake.  Admin actions: list, set_status, set_notes, deliver.
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { disabledPaymentsResponse } from "../_shared/payments-policy.ts";
import { corsHeaders, json, siteOrigin, stripeClient } from "../_shared/stripe.ts";
import { canBuySetup, canMoveTo, validateIntake } from "../_shared/setup-orders.ts";
import { validateTemplateConfig } from "../_shared/agent-template-schema.ts";
import { applyTemplateToAccount } from "../_shared/apply-template.ts";
import { sendEmail } from "../_shared/email.ts";

// What a customer may see of their order: never notes_admin.
const CUSTOMER_COLUMNS = "id, amount, status, intake, scheduled_at, delivered_at, created_at";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });
  const token = (req.headers.get("Authorization") || "").replace("Bearer ", "");
  const { data: userData } = await db.auth.getUser(token);
  const user = userData?.user;
  if (!user?.email) return json({ error: "Not signed in" }, 401);

  const body = await req.json().catch(() => ({}));

  const latestOrder = async (columns: string) => {
    const { data } = await db.from("setup_orders").select(columns).eq("account_id", user.id)
      .neq("status", "cancelled").order("created_at", { ascending: false }).limit(1).maybeSingle();
    return data as unknown as Record<string, unknown> | null;
  };

  try {
    switch (body.action) {
      case "mine":
        return json({ order: await latestOrder(CUSTOMER_COLUMNS) });

      case "start": {
        const { data: profile } = await db.from("profiles")
          .select("subscription_status, founding, stripe_customer_id").eq("user_id", user.id).maybeSingle();
        if (!canBuySetup(profile?.subscription_status)) {
          return json({ error: "The done-for-you setup is available once your trial or subscription is running." }, 403);
        }
        const existing = await latestOrder(CUSTOMER_COLUMNS);
        if (existing && existing.status !== "delivered") return json({ order: existing });

        if (profile?.founding) {
          const { data, error } = await db.from("setup_orders")
            .insert({ account_id: user.id, amount: 0, status: "ordered" }).select(CUSTOMER_COLUMNS).single();
          return error ? json({ error: error.message }, 400) : json({ order: data });
        }

        const disabled = disabledPaymentsResponse(corsHeaders);
        if (disabled) return disabled;
        const price = Deno.env.get("STRIPE_PRICE_ID_SETUP");
        if (!price) throw new Error("STRIPE_PRICE_ID_SETUP is not set");
        const origin = siteOrigin(req);
        const session = await stripeClient().checkout.sessions.create({
          mode: "payment",
          ...(profile?.stripe_customer_id ? { customer: profile.stripe_customer_id } : { customer_email: user.email }),
          client_reference_id: user.id,
          line_items: [{ price, quantity: 1 }],
          metadata: { kind: "setup_order", user_id: user.id },
          success_url: `${origin}/settings/setup?paid=1`,
          cancel_url: `${origin}/settings/setup`,
        });
        return json({ url: session.url });
      }

      case "save_intake": {
        const v = validateIntake(body.intake);
        if (!v.ok) return json({ error: "Please complete the form", errors: v.errors }, 422);
        const order = await latestOrder("id, status");
        if (!order || order.status === "delivered") return json({ error: "No open order" }, 404);
        const { data, error } = await db.from("setup_orders").update({ intake: v.value }).eq("id", order.id).select(CUSTOMER_COLUMNS).single();
        return error ? json({ error: error.message }, 400) : json({ order: data });
      }
    }

    // Everything below is admin only.
    const { data: isAdmin } = await db.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) return json({ error: "Not found" }, 404);

    const { data: order } = body.order_id
      ? await db.from("setup_orders").select("*").eq("id", body.order_id).maybeSingle()
      : { data: null };

    switch (body.action) {
      case "list": {
        const { data: orders } = await db.from("setup_orders").select("*").order("created_at", { ascending: false }).limit(200);
        const { data: list } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 });
        const emails = new Map(list?.users.map((u) => [u.id, u.email]) ?? []);
        return json({ orders: (orders ?? []).map((o) => ({ ...o, email: emails.get(o.account_id) ?? null })) });
      }
      case "set_status": {
        if (!order) return json({ error: "Order not found" }, 404);
        if (body.status === "delivered") return json({ error: "Use Mark delivered, which applies the template." }, 400);
        if (!canMoveTo(order.status, body.status)) return json({ error: `Can't move from ${order.status} to ${body.status}` }, 400);
        const patch: Record<string, unknown> = { status: body.status };
        if (body.scheduled_at !== undefined) patch.scheduled_at = body.scheduled_at || null;
        const { data, error } = await db.from("setup_orders").update(patch).eq("id", order.id).select("*").single();
        return error ? json({ error: error.message }, 400) : json({ order: data });
      }
      case "set_notes": {
        if (!order) return json({ error: "Order not found" }, 404);
        const { data, error } = await db.from("setup_orders").update({ notes_admin: String(body.notes ?? "").slice(0, 5000) }).eq("id", order.id).select("*").single();
        return error ? json({ error: error.message }, 400) : json({ order: data });
      }
      case "deliver": {
        if (!order) return json({ error: "Order not found" }, 404);
        if (!canMoveTo(order.status, "delivered")) return json({ error: `Can't deliver an order that is ${order.status}` }, 400);
        const { data: template } = await db.from("agent_templates").select("*").eq("id", body.template_id).maybeSingle();
        if (!template) return json({ error: "Choose a template" }, 400);
        const v = validateTemplateConfig(template.config);
        if (!v.ok) return json({ error: "That template needs fixing", errors: v.errors }, 422);

        // Delivering the service is applying the custom template to their account.
        const { data: hasAgent } = await db.from("signal_agents").select("id").eq("user_id", order.account_id).limit(1).maybeSingle();
        const applied = await applyTemplateToAccount(db, template, v.value, order.account_id, hasAgent ? "replace" : "create");
        if (!applied.ok) return json({ error: applied.error, code: applied.code }, applied.status);

        const { data, error } = await db.from("setup_orders")
          .update({ status: "delivered", delivered_at: new Date().toISOString(), template_id: template.id })
          .eq("id", order.id).select("*").single();
        if (error) return json({ error: error.message }, 400);

        // Transactional: goes out even to people who opted out of marketing email.
        const { data: account } = await db.auth.admin.getUserById(order.account_id);
        const site = Deno.env.get("SITE_URL") || "https://intentsly.com";
        let emailed = false;
        if (account?.user?.email) {
          const result = await sendEmail({
            to: account.user.email,
            from: "Alex from Intentsly <alex@intentsly.com>",
            template: "setup_delivered",
            subject: "Your Intentsly agent is set up",
            text: `Hi${account.user.user_metadata?.first_name ? ` ${account.user.user_metadata.first_name}` : ""},\n\nYour custom agent is ready. I've applied it to your account, so your targeting, signals and LinkedIn sequence are all in place. Have a look and make sure your campaign is switched on:\n\n${site}/campaigns\n\nReply to this email if you'd like anything changed.\n\nAlex\nIntentsly`,
          });
          emailed = result.ok;
          if (!result.ok) console.error("[setup-orders] delivered email failed:", result.error);
        }
        return json({ order: data, emailed });
      }
      default:
        return json({ error: "unknown action" }, 400);
    }
  } catch (e) {
    console.error("[setup-orders]", e);
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
