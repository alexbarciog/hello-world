// One-click unsubscribe. POST with a signed token, from the /u/<token> page or
// from mail clients using the List-Unsubscribe-Post header (RFC 8058). Marketing
// email stops; transactional email (receipts, trial ending) is unaffected.
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { readUnsubToken } from "../_shared/email-tokens.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  // Mail clients send the token in the URL and a form body; the page sends JSON.
  let token = new URL(req.url).searchParams.get("token");
  if (!token) token = (await req.json().catch(() => ({})))?.token ?? null;
  if (!token) return json({ error: "missing token" }, 400);

  const secret = Deno.env.get("EMAIL_TOKEN_SECRET") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const target = await readUnsubToken(token, secret);
  if (!target) return json({ error: "This unsubscribe link isn't valid." }, 400);

  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });
  const { error } = target.kind === "u"
    ? await db.from("profiles").update({ email_opt_out: true }).eq("user_id", target.value)
    : await db.from("tool_leads").update({ unsubscribed_at: new Date().toISOString() }).eq("email", target.value).is("unsubscribed_at", null);
  if (error) return json({ error: "Couldn't update your preferences. Please try again." }, 500);
  return json({ success: true });
});
