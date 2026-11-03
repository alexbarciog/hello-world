// Creem customer portal (change card, invoices, cancel) for the account's
// billing owner.
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { billingOwnerOf } from "../_shared/account-access.ts";
import { corsHeaders, creemConfig, creemPost, json } from "../_shared/creem.ts";

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
    if (!user) return json({ error: "Not signed in" }, 401);

    if ((await billingOwnerOf(db, user.id)) !== user.id) {
      return json({ error: "Your workspace owner manages billing.", code: "not_billing_owner" }, 403);
    }

    const cfg = creemConfig();
    const { data: sub } = await db
      .from("subscriptions")
      .select("creem_customer_id")
      .eq("user_id", user.id)
      .eq("mode", cfg.mode)
      .not("creem_customer_id", "is", null)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!sub?.creem_customer_id) return json({ error: "No billing account yet.", code: "no_customer" }, 404);

    const portal = await creemPost<{ customer_portal_link: string }>("/v1/customers/billing", {
      customer_id: sub.creem_customer_id,
    }, cfg);
    return json({ url: portal.customer_portal_link });
  } catch (error) {
    console.error("[creem-portal]", error);
    return json({ error: "Could not open billing. Please try again or email alex@intentsly.com." }, 500);
  }
});
