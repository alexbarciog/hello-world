import { describe, it, expect } from "vitest";
import marketplaceSql from "../../supabase/migrations/20261117190000_agent_template_marketplace.sql?raw";
import wizardSource from "../components/CreateAgentWizard.tsx?raw";
import { validateTemplateConfig, type AgentTemplateConfig } from "../../supabase/functions/_shared/agent-template-schema";
import type { AgentTemplate } from "@/lib/agentTemplates";
import {
  SIGNAL_INFO, colorOf, filterTemplates, liveSignals, similarTemplates, sortTemplates, splitPlaceholders, usedByLabel,
} from "@/lib/templateMarketplace";

// Every $json$…$json$ block in the migration is one template config.
const configs: unknown[] = marketplaceSql.split("$json$").filter((_, i) => i % 2 === 1).map((j) => JSON.parse(j));

// Options the agent form offers, so a seeded value shows up selected there.
const wizardList = (name: string) => {
  const m = wizardSource.match(new RegExp(`const ${name} = \\[([\\s\\S]*?)\\];`));
  return [...(m?.[1] ?? "").matchAll(/"([^"]+)"/g)].map((x) => x[1]);
};
const INDUSTRIES = wizardList("INDUSTRIES");
const COMPANY_TYPES = wizardList("COMPANY_TYPES");
const COMPANY_SIZES = wizardList("COMPANY_SIZES");
const LOCATIONS = wizardList("LOCATIONS");

describe("seeded marketplace templates", () => {
  it("seeds at least 9 templates", () => {
    expect(configs.length).toBeGreaterThanOrEqual(9);
    expect(INDUSTRIES.length).toBeGreaterThan(20);
  });

  configs.forEach((raw, i) => {
    const name = (raw as AgentTemplateConfig).agent?.name ?? `config ${i + 1}`;
    describe(name, () => {
      const r = validateTemplateConfig(raw);

      it("passes validateTemplateConfig", () => {
        expect(r.ok ? [] : (r as { errors: string[] }).errors).toEqual([]);
      });

      if (!r.ok) return;
      const { agent, campaign } = r.value;

      it("uses only options from the agent form", () => {
        for (const v of agent.icp_industries) expect(INDUSTRIES).toContain(v);
        for (const v of agent.icp_company_types) expect(COMPANY_TYPES).toContain(v);
        for (const v of agent.icp_company_sizes) expect(COMPANY_SIZES).toContain(v);
        for (const v of agent.icp_locations) expect(LOCATIONS).toContain(v);
      });

      it("only enables signals the agent runner handles, with buyer keywords", () => {
        for (const id of agent.signals_config.enabled) expect(SIGNAL_INFO[id]?.live).toBe(true);
        expect(agent.signals_config.keywords.keyword_posts?.length ?? 0).toBeGreaterThanOrEqual(10);
        expect(agent.icp_job_titles.length).toBeGreaterThan(0);
      });

      it("stays within LinkedIn safety limits", () => {
        expect(campaign.daily_connect_limit).toBeLessThanOrEqual(15);
        expect(campaign.daily_connect_limit).toBeGreaterThanOrEqual(1);
      });

      it("has a short sequence whose fixed messages always resolve", () => {
        const steps = campaign.workflow_steps;
        expect(steps[0].type).toBe("invitation");
        expect(steps.length).toBeGreaterThanOrEqual(2);
        expect(steps.length).toBeLessThanOrEqual(4);
        for (const s of steps.filter((x) => x.type === "message" && !x.ai_icebreaker)) {
          expect(s.message?.trim()).toBeTruthy();
          // {{signal}} is the raw signal label and {{demo_link}} holds the
          // campaign until it's set: neither belongs in a ready-made message.
          const vars = [...(s.message ?? "").matchAll(/\{\{\s*([A-Za-z_]+)\s*\}\}/g)].map((m) => m[1]);
          for (const v of vars) expect(["first_name", "company"]).toContain(v);
        }
        for (const s of steps.filter((x) => x.ai_icebreaker)) expect(s.step_instructions?.trim()).toBeTruthy();
      });
    });
  });
});

const tpl = (over: Partial<AgentTemplate>): AgentTemplate => ({
  id: over.slug ?? "x", name: "T", slug: "t", business_type: "B", description: "", icon: "sparkles", tagline: null,
  category: null, featured: false, color: null, uses_count: 0, is_public: true, archived_at: null, sort_order: 0,
  schema_version: 1, version: 1, created_at: "", updated_at: "",
  config: JSON.parse(JSON.stringify(configs[0])) as AgentTemplateConfig,
  ...over,
});

describe("gallery helpers", () => {
  const a = tpl({ slug: "a", name: "Marketing agency", category: "agencies", sort_order: 30, featured: true });
  const b = tpl({ slug: "b", name: "Web design agency", category: "agencies", sort_order: 20 });
  const c = tpl({ slug: "c", name: "Cybersecurity consultancy", category: "consulting", sort_order: 10, tagline: "SOC 2 and pentests" });

  it("sorts featured first, then by sort order", () => {
    expect(sortTemplates([c, b, a]).map((t) => t.slug)).toEqual(["a", "c", "b"]);
  });

  it("filters by category and by search words", () => {
    expect(filterTemplates([a, b, c], "", "agencies").map((t) => t.slug)).toEqual(["a", "b"]);
    expect(filterTemplates([a, b, c], "soc 2", "all").map((t) => t.slug)).toEqual(["c"]);
    expect(filterTemplates([a, b, c], "nothing like this", "all")).toEqual([]);
  });

  it("puts same-category templates first in Similar templates", () => {
    expect(similarTemplates([a, b, c], b).map((t) => t.slug)).toEqual(["a", "c"]);
  });

  it("counts only signals that run", () => {
    const t = tpl({});
    t.config.agent.signals_config.enabled = ["keyword_posts", "job_changes", "profile_viewers"];
    expect(liveSignals(t)).toEqual(["keyword_posts"]);
  });

  it("falls back to the category colour", () => {
    expect(colorOf({ category: "consulting", color: null })).toBe("amber");
    expect(colorOf({ category: "consulting", color: "teal" })).toBe("teal");
    expect(colorOf({ category: "nope", color: "neon" })).toBe("slate");
  });

  it("splits {{variables}} for highlighting", () => {
    expect(splitPlaceholders("Hi {{first_name}}, ok")).toEqual([
      { text: "Hi ", variable: false },
      { text: "{{first_name}}", variable: true },
      { text: ", ok", variable: false },
    ]);
  });

  it("shows usage only from 5 teams", () => {
    expect(usedByLabel(4)).toBeNull();
    expect(usedByLabel(5)).toBe("Used by 5 teams");
  });
});
