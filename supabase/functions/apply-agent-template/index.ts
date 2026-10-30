// Applies an agent template to the signed-in user's account: a deep copy into
// their own signal agent and campaign, so later template edits never change it.
// POST { template_id, mode: "create" | "replace" }
//  - create:  new agent + campaign (reuses the empty campaign onboarding makes)
//  - replace: overwrites the configuration of their most recent agent and its
//             campaign ("Switch template"); stats, status and ids are kept.
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { validateTemplateConfig } from "../_shared/agent-template-schema.ts";

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
  const { agent: a, campaign: c } = v.value;

  const { data: profile } = await db.from("profiles").select("current_organization_id, unipile_account_id").eq("user_id", user.id).maybeSingle();
  const orgId = profile?.current_organization_id ?? null;

  const agentFields = {
    name: a.name,
    agent_type: "signals",
    keywords: a.icp_job_titles,
    icp_job_titles: a.icp_job_titles,
    icp_locations: a.icp_locations,
    icp_industries: a.icp_industries,
    icp_company_types: a.icp_company_types,
    icp_company_sizes: a.icp_company_sizes,
    icp_exclude_keywords: a.icp_exclude_keywords,
    icp_restricted_countries: a.icp_restricted_countries,
    icp_restricted_roles: a.icp_restricted_roles,
    ideal_lead_description: a.ideal_lead_description,
    precision_mode: a.precision_mode,
    signals_config: a.signals_config,
    manual_approval: a.manual_approval,
  };
  const campaignFields = {
    pain_points: c.pain_points,
    campaign_goal: c.campaign_goal,
    message_tone: c.message_tone,
    language: c.language,
    custom_training: c.custom_training,
    workflow_steps: c.workflow_steps,
    daily_connect_limit: c.daily_connect_limit,
    timezone: c.timezone,
    exclude_first_degree: c.exclude_first_degree,
    conversational_ai: c.conversational_ai,
    max_ai_replies: c.max_ai_replies,
    icp_job_titles: a.icp_job_titles,
    icp_industries: a.icp_industries,
    icp_locations: a.icp_locations,
    icp_company_sizes: a.icp_company_sizes,
    icp_company_types: a.icp_company_types,
  };

  let agentId: string;
  let campaignId: string | null = null;

  if (mode === "replace") {
    const { data: agent } = await db.from("signal_agents").select("id").eq("user_id", user.id)
      .order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (!agent) return json({ error: "You don't have an agent to replace yet. Choose the template from setup instead." }, 404);
    agentId = agent.id;
    const { error: agentErr } = await db.from("signal_agents").update(agentFields).eq("id", agentId);
    if (agentErr) return json({ error: agentErr.message }, 400);
    const { data: campaign } = await db.from("campaigns").select("id").eq("source_agent_id", agentId)
      .order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (campaign) {
      // Company name, website and value proposition stay the customer's own.
      const { error } = await db.from("campaigns").update(campaignFields).eq("id", campaign.id);
      if (error) return json({ error: error.message }, 400);
      campaignId = campaign.id;
    }
  } else {
    const { data: agent, error: agentErr } = await db.from("signal_agents").insert({
      ...agentFields,
      user_id: user.id,
      organization_id: orgId,
      leads_list_name: a.name,
      // Agents wait for LinkedIn; connect-linkedin switches them to active.
      status: profile?.unipile_account_id ? "active" : "pending_linkedin",
    }).select("id").single();
    if (agentErr) {
      if (agentErr.message?.includes("LIMIT_REACHED")) {
        return json({ error: "You already have the maximum of 2 signal agents. Use Switch template in Settings to replace one.", code: "limit_reached" }, 409);
      }
      return json({ error: agentErr.message }, 400);
    }
    agentId = agent.id;

    // Onboarding leaves one campaign row holding the business context
    // (company, website, services). Fill that one instead of adding another.
    const { data: context } = await db.from("campaigns")
      .select("id, company_name, website, description, value_proposition, industry, workflow_steps, source_agent_id")
      .eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
    const reusable = context && !context.source_agent_id &&
      (!Array.isArray(context.workflow_steps) || context.workflow_steps.length === 0);

    const businessFields = {
      company_name: context?.company_name || a.name,
      website: context?.website ?? null,
      description: context?.description ?? null,
      value_proposition: context?.value_proposition || context?.description || c.value_proposition || null,
      industry: context?.industry ?? null,
    };
    const row = {
      ...campaignFields,
      ...businessFields,
      source_type: "agent",
      source_agent_id: agentId,
      source_list_id: null,
      status: "paused",
    };
    if (reusable) {
      const { error } = await db.from("campaigns").update(row).eq("id", context!.id);
      if (error) {
        await db.from("signal_agents").delete().eq("id", agentId);
        return json({ error: error.message }, 400);
      }
      campaignId = context!.id;
    } else {
      const { data: campaign, error } = await db.from("campaigns")
        .insert({ ...row, user_id: user.id, organization_id: orgId }).select("id").single();
      if (error) {
        // Don't leave a half-applied template behind.
        await db.from("signal_agents").delete().eq("id", agentId);
        if (error.message?.includes("LIMIT_REACHED")) {
          return json({ error: "You already have the maximum number of campaigns. Use Switch template in Settings to replace one.", code: "limit_reached" }, 409);
        }
        return json({ error: error.message }, 400);
      }
      campaignId = campaign.id;
    }
  }

  await db.from("template_applications").insert({
    account_id: user.id,
    template_id: template.id,
    version: template.version,
    agent_id: agentId,
    campaign_id: campaignId,
  });

  return json({ agent_id: agentId, campaign_id: campaignId, mode });
});
