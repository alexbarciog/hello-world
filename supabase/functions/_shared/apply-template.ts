// Applies a validated agent template to an account: a deep copy into their own
// signal agent and campaign. Used by apply-agent-template (customers) and
// setup-orders (admin delivering a done-for-you setup).
import type { AgentTemplateConfig } from "./agent-template-schema.ts";

export type ApplyResult =
  | { ok: true; agentId: string; campaignId: string | null }
  | { ok: false; error: string; status: number; code?: string };

// deno-lint-ignore no-explicit-any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = any;

export async function applyTemplateToAccount(
  db: Db,
  template: { id: string; version: number },
  config: AgentTemplateConfig,
  userId: string,
  mode: "create" | "replace",
): Promise<ApplyResult> {
  const { agent: a, campaign: c } = config;
  const { data: profile } = await db.from("profiles").select("current_organization_id, unipile_account_id").eq("user_id", userId).maybeSingle();
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
    const { data: agent } = await db.from("signal_agents").select("id").eq("user_id", userId)
      .order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (!agent) return { ok: false, error: "You don't have an agent to replace yet. Choose the template from setup instead.", status: 404 };
    agentId = agent.id;
    const { error: agentErr } = await db.from("signal_agents").update(agentFields).eq("id", agentId);
    if (agentErr) return { ok: false, error: agentErr.message, status: 400 };
    const { data: campaign } = await db.from("campaigns").select("id").eq("source_agent_id", agentId)
      .order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (campaign) {
      // Company name, website and value proposition stay the customer's own.
      const { error } = await db.from("campaigns").update(campaignFields).eq("id", campaign.id);
      if (error) return { ok: false, error: error.message, status: 400 };
      campaignId = campaign.id;
    }
  } else {
    const { data: agent, error: agentErr } = await db.from("signal_agents").insert({
      ...agentFields,
      user_id: userId,
      organization_id: orgId,
      leads_list_name: a.name,
      // Agents wait for LinkedIn; connect-linkedin switches them to active.
      status: profile?.unipile_account_id ? "active" : "pending_linkedin",
    }).select("id").single();
    if (agentErr) {
      if (agentErr.message?.includes("LIMIT_REACHED")) {
        return { ok: false, error: "You already have the maximum of 2 signal agents. Use Switch template in Settings to replace one.", status: 409, code: "limit_reached" };
      }
      return { ok: false, error: agentErr.message, status: 400 };
    }
    agentId = agent.id;

    // Onboarding leaves one campaign row holding the business context
    // (company, website, services). Fill that one instead of adding another.
    const { data: context } = await db.from("campaigns")
      .select("id, company_name, website, description, value_proposition, industry, workflow_steps, source_agent_id")
      .eq("user_id", userId).order("created_at", { ascending: false }).limit(1).maybeSingle();
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
        return { ok: false, error: error.message, status: 400 };
      }
      campaignId = context!.id;
    } else {
      const { data: campaign, error } = await db.from("campaigns")
        .insert({ ...row, user_id: userId, organization_id: orgId }).select("id").single();
      if (error) {
        // Don't leave a half-applied template behind.
        await db.from("signal_agents").delete().eq("id", agentId);
        if (error.message?.includes("LIMIT_REACHED")) {
          return { ok: false, error: "You already have the maximum number of campaigns. Use Switch template in Settings to replace one.", status: 409, code: "limit_reached" };
        }
        return { ok: false, error: error.message, status: 400 };
      }
      campaignId = campaign.id;
    }
  }

  await db.from("template_applications").insert({
    account_id: userId,
    template_id: template.id,
    version: template.version,
    agent_id: agentId,
    campaign_id: campaignId,
  });

  return { ok: true, agentId, campaignId };
}
