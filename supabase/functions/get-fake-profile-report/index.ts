// Fake LinkedIn Profile Checker: the full report, for its owner only.
// POST { id }, signed in (verify_jwt = true).
//
// Claims the check on first open: a check made before signing up has no
// user_id; the first signed-in user to open it within 24 hours becomes its
// owner. After that, or once someone else owns it, it's "not found".
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const CLAIM_WINDOW_MS = 86_400_000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const COLUMNS = "id, created_at, user_id, linkedin_url, status, risk_score, risk_level, low_confidence, signals, top_signal, summary, scrape_ok";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  try {
    const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
      auth: { persistSession: false },
    });
    const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
    const { data: auth } = await db.auth.getUser(token);
    const user = auth?.user;
    if (!user) return json({ error: "Please sign in to see the report." }, 401);

    const body = await req.json().catch(() => ({}));
    const id = String(body.id || "");
    if (!UUID.test(id)) return json({ error: "Report not found." }, 404);

    const { data: row } = await db.from("fake_profile_checks").select(COLUMNS).eq("id", id).maybeSingle();
    const NOT_FOUND = json({ error: "We couldn't find this report. Checks made before signing up can be opened for 24 hours.", code: "not_found" }, 404);
    if (!row) return NOT_FOUND;

    let report = row;
    if (!row.user_id) {
      if (Date.now() - new Date(row.created_at).getTime() > CLAIM_WINDOW_MS) return NOT_FOUND;
      const { data: claimed } = await db
        .from("fake_profile_checks")
        .update({ user_id: user.id })
        .eq("id", id)
        .is("user_id", null)
        .select(COLUMNS)
        .maybeSingle();
      if (!claimed) {
        // Someone else claimed it in between.
        const { data: again } = await db.from("fake_profile_checks").select(COLUMNS).eq("id", id).maybeSingle();
        if (!again || again.user_id !== user.id) return NOT_FOUND;
        report = again;
      } else report = claimed;
    } else if (row.user_id !== user.id) {
      return NOT_FOUND;
    }

    if (report.status !== "done") return json({ error: "This check didn't finish. Please run it again.", code: "not_done" }, 409);
    const { user_id: _owner, ...rest } = report;
    return json({ report: rest });
  } catch (e) {
    console.error("[get-fake-profile-report]", e);
    return json({ error: "Something went wrong. Please try again." }, 500);
  }
});
