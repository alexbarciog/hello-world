// Applies an agent template to the signed-in user's account: a deep copy into
// their own signal agent and campaign, so later template edits never change it.
// POST { template_id, mode: "create" | "replace" }
//  - create:  new agent + campaign (reuses the empty campaign onboarding makes)
//  - replace: overwrites the configuration of their most recent agent and its
//             campaign ("Switch template"); stats, status and ids are kept.
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { validateTemplateConfig } from "../_shared/agent-template-schema.ts";
import { applyTemplateToAccount } from "../_shared/apply-template.ts";

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

  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });
  const token = (req.headers.get("Authorization") || "").replace("Bearer ", "");
  const { data: userData } = await db.auth.getUser(token);
  const user = userData?.user;
  if (!user) return json({ error: "Not signed in" }, 401);

  const body = await req.json().catch(() => ({}));
  const mode = body.mode === "replace" ? "replace" : "create";

  const { data: template } = await db.from("agent_templates").select("*").eq("id", body.template_id).maybeSingle();
  const { data: isAdmin } = await db.rpc("has_role", { _user_id: user.id, _role: "admin" });
  if (!template || ((!template.is_public || template.archived_at) && !isAdmin)) {
    return json({ error: "Template not found" }, 404);
  }
  const v = validateTemplateConfig(template.config);
  if (!v.ok) return json({ error: "This template needs fixing before it can be used", errors: v.errors }, 422);

  const result = await applyTemplateToAccount(db, template, v.value, user.id, mode);
  if (!result.ok) return json({ error: result.error, code: result.code }, result.status);
  return json({ agent_id: result.agentId, campaign_id: result.campaignId, mode });
});
