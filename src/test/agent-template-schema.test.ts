import { describe, it, expect } from "vitest";
import seedSql from "../../supabase/migrations/20261029160000_agent_templates.sql?raw";
import {
  configFromAgent,
  resolvePlaceholders,
  unresolvedMessage,
  validateTemplateConfig,
} from "../../supabase/functions/_shared/agent-template-schema";

const valid = () => ({
  agent: {
    name: "Web design agency",
    icp_job_titles: ["Founder", "Head of Marketing"],
    precision_mode: "discovery",
    signals_config: { enabled: ["keyword_posts", "job_changes"], keywords: { keyword_posts: ["new website"] } },
  },
  campaign: {
    workflow_steps: [
      { type: "invitation", delay_days: 0 },
      { type: "message", message: "Hi {{first_name}}, saw {{signal}}. I run {{my_company}}: {{demo_link}}", delay_days: 1 },
    ],
  },
});

describe("validateTemplateConfig", () => {
  it("accepts a minimal config and fills defaults", () => {
    const r = validateTemplateConfig(valid());
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.schema_version).toBe(1);
    expect(r.value.campaign).toMatchObject({ daily_connect_limit: 25, timezone: "UTC", exclude_first_degree: true, max_ai_replies: 5, language: "English" });
    expect(r.value.agent.icp_locations).toEqual([]);
  });

  it("drops unknown signals and keys", () => {
    const cfg = valid();
    (cfg.agent.signals_config.enabled as string[]).push("made_up");
    (cfg.agent as Record<string, unknown>).user_id = "someone";
    const r = validateTemplateConfig(cfg);
    expect(r.ok && r.value.agent.signals_config.enabled).toEqual(["keyword_posts", "job_changes"]);
    expect(r.ok && "user_id" in r.value.agent).toBe(false);
  });

  it("rejects what the customer form would reject", () => {
    const r = validateTemplateConfig({
      agent: { name: " ", icp_job_titles: [], signals_config: { enabled: [] } },
      campaign: { workflow_steps: [{ type: "message" }, { type: "teleport" }], daily_connect_limit: 500, max_ai_replies: 4 },
    });
    expect(r.ok).toBe(false);
    expect((r as { errors: string[] }).errors).toEqual(expect.arrayContaining([
      "agent.name is required",
      "icp_job_titles needs at least one value",
      "enable at least one signal",
      "daily_connect_limit must be 1-100",
      "max_ai_replies must be 3, 5, 7 or 10",
      "step 1: a message step needs text, instructions or the AI icebreaker",
      "step 2: unknown type",
    ]));
  });

  it("rejects unknown placeholders", () => {
    const cfg = valid();
    cfg.campaign.workflow_steps[1].message = "Hi {{nickname}}";
    const r = validateTemplateConfig(cfg);
    expect(r.ok).toBe(false);
    expect((r as { errors: string[] }).errors).toContain("unknown placeholder {{nickname}}");
  });
});

describe("resolvePlaceholders", () => {
  it("fills lead and account values", () => {
    const r = resolvePlaceholders("Hi {{first_name}} at {{ Company }}, I'm with {{my_company}}: {{demo_link}}", {
      first_name: "Dana", company: "Acme", my_company: "Pixel Studio", demo_link: "https://cal.com/x",
    });
    expect(r).toEqual({ text: "Hi Dana at Acme, I'm with Pixel Studio: https://cal.com/x", unresolved: [] });
  });

  it("drops empty lead fields but blocks missing account fields", () => {
    const r = resolvePlaceholders("Hi {{first_name}}, book here: {{demo_link}}", { first_name: "" });
    expect(r.text).toBe("Hi , book here: {{demo_link}}");
    expect(r.unresolved).toEqual(["demo_link"]);
    expect(unresolvedMessage(r.unresolved)).toContain("demo or calendar link");
  });

  it("maps the old {{FirstName}} chips and flags unknown tokens", () => {
    expect(resolvePlaceholders("Hi {{FirstName}} {{LastName}}", { first_name: "Dana", last_name: "Lee" }).text).toBe("Hi Dana Lee");
    expect(resolvePlaceholders("Hi {{Nickname}}", {}).unresolved).toEqual(["Nickname"]);
  });
});

describe("configFromAgent", () => {
  it("keeps configuration and strips account-specific values", () => {
    const cfg = configFromAgent(
      {
        id: "a1", user_id: "u1", organization_id: "o1", name: "My agent", leads_list_name: "Acme leads", results_count: 812,
        icp_job_titles: ["CTO"], precision_mode: "high_precision", manual_approval: true,
        signals_config: { enabled: ["keyword_posts", "competitor_followers"], keywords: { keyword_posts: ["crm"], competitor_followers: ["https://linkedin.com/company/rival"] } },
      },
      { company_name: "Acme", value_proposition: "We sell Acme things", website: "acme.com", workflow_steps: [{ type: "invite" }, { type: "message", message: "Hi {{first_name}}" }], daily_connect_limit: 20 },
    ) as Record<string, Record<string, unknown>>;
    const text = JSON.stringify(cfg);
    for (const leaked of ["u1", "o1", "Acme", "acme.com", "Acme leads", "812", "rival"]) expect(text).not.toContain(leaked);
    expect(cfg.campaign.workflow_steps).toEqual([{ type: "invitation" }, { type: "message", message: "Hi {{first_name}}" }]);
    expect(validateTemplateConfig(cfg).ok).toBe(true);
  });
});

describe("seeded example template", () => {
  it("passes validation and uses only wizard options", () => {
    const config = JSON.parse(seedSql.split("$json$")[1]);
    const r = validateTemplateConfig(config);
    expect(r.ok).toBe(true);
    expect(config.agent.icp_company_sizes.every((s: string) => ["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"].includes(s))).toBe(true);
  });
});
