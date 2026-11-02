// Admin only: next Tuesday's digest for any account, built from live data with
// the same code the scheduler uses. Sends nothing.
// POST { action: "accounts" } or { action: "preview", account_id }
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { weeklyDigest } from "../_shared/email-templates/index.ts";
import { accountTimezone, buildDigestPayload } from "../_shared/digest-data.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });
  const token = (req.headers.get("Authorization") || "").replace("Bearer ", "");
  const { data: userData } = await db.auth.getUser(token);
  const user = userData?.user;
  if (!user) return json({ error: "Not signed in" }, 401);
  const { data: isAdmin } = await db.rpc("has_role", { _user_id: user.id, _role: "admin" });
  if (!isAdmin) return json({ error: "Not found" }, 404);

  const body = await req.json().catch(() => ({}));
  const statuses = ["trialing", "active"];

  if (body.action === "accounts") {
    const { data: rows } = await db.from("profiles").select("user_id, subscription_status, email_opt_out").in("subscription_status", statuses);
    const { data: list } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const emails = new Map(list?.users.map((u) => [u.id, u.email]) ?? []);
    return json({ accounts: (rows ?? []).map((r) => ({ id: r.user_id, email: emails.get(r.user_id) ?? r.user_id, status: r.subscription_status, opted_out: r.email_opt_out })) });
  }

  if (body.action === "preview") {
    const { data: target } = await db.auth.admin.getUserById(body.account_id);
    if (!target?.user) return json({ error: "Account not found" }, 404);
    const payload = await buildDigestPayload(db, target.user.id, target.user.user_metadata?.first_name ?? null);
    const site = Deno.env.get("SITE_URL") || "https://intentsly.com";
    const email = weeklyDigest(payload, {
      siteUrl: site,
      unsubscribeUrl: `${site}/u/preview`,
      postalAddress: Deno.env.get("EMAIL_POSTAL_ADDRESS") || undefined,
      weekIndex: Math.floor(Date.now() / (7 * 86_400_000)),
    });
    return json({
      to: target.user.email,
      timezone: await accountTimezone(db, target.user.id),
      payload,
      email,
      programme_enabled: Deno.env.get("EMAIL_DIGEST_ENABLED") === "true",
    });
  }
  return json({ error: "unknown action" }, 400);
});
