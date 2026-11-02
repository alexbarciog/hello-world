// Agent template config: a saved copy of everything a customer configures for
// a signal agent (CreateAgentWizard) and its outreach campaign (CreateCampaign
// + CampaignDetail settings and workflow). Pure TS, no imports: shared by the
// edge functions, the admin editor and the tests, so all validate the same way.

export const TEMPLATE_SCHEMA_VERSION = 1;

export const SIGNAL_IDS = [
  "post_engagers", "profile_engagers", "keyword_posts", "hashtag_engagement",
  "competitor_followers", "competitor_engagers", "job_changes",
  // Shown in the wizard; the backend has no handler for these yet.
  "profile_viewers", "company_followers",
] as const;

export const STEP_TYPES = ["invitation", "message", "email", "comment", "like", "visit_profile"] as const;

export interface TemplateStep {
  type: (typeof STEP_TYPES)[number];
  message?: string;
  subject?: string;
  delay_days?: number;
  delay_hours?: number;
  ai_icebreaker?: boolean;
  ai_sdr?: boolean;
  step_instructions?: string;
  ai_instructions?: string;
  post_filter?: "authored_only" | "all_signals";
  before_invitation?: boolean;
  connect_note?: string | null;
}

export interface AgentTemplateConfig {
  schema_version: number;
  agent: {
    name: string;
    icp_job_titles: string[];
    icp_locations: string[];
    icp_industries: string[];
    icp_company_types: string[];
    icp_company_sizes: string[];
    icp_exclude_keywords: string[];
    icp_restricted_countries: string[];
    icp_restricted_roles: string[];
    ideal_lead_description: string | null;
    precision_mode: "discovery" | "high_precision";
    signals_config: { enabled: string[]; keywords: Record<string, string[]> };
    manual_approval: boolean;
  };
  campaign: {
    value_proposition: string;
    pain_points: string[];
    campaign_goal: "conversations" | "demos";
    message_tone: "professional" | "conversational" | "direct";
    language: string;
    custom_training: string;
    workflow_steps: TemplateStep[];
    daily_connect_limit: number;
    timezone: string;
    exclude_first_degree: boolean;
    conversational_ai: boolean;
    max_ai_replies: number;
  };
}

export type ValidationResult =
  | { ok: true; value: AgentTemplateConfig }
  | { ok: false; errors: string[] };

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const strArr = (v: unknown, max = 200) =>
  Array.isArray(v) ? v.filter((x) => typeof x === "string").map((x) => (x as string).trim()).filter(Boolean).slice(0, max) : null;
const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : null);

/** Validates and normalises a template config. Unknown keys are dropped. */
export function validateTemplateConfig(input: unknown): ValidationResult {
  const errors: string[] = [];
  if (!isObj(input)) return { ok: false, errors: ["config must be an object"] };
  const a = isObj(input.agent) ? input.agent : null;
  const c = isObj(input.campaign) ? input.campaign : null;
  if (!a) errors.push("agent is required");
  if (!c) errors.push("campaign is required");
  if (!a || !c) return { ok: false, errors };

  const list = (key: string, src: Record<string, unknown>, required = false) => {
    const v = strArr(src[key]);
    if (v === null && src[key] !== undefined) errors.push(`${key} must be a list of text`);
    if (required && (!v || v.length === 0)) errors.push(`${key} needs at least one value`);
    return v ?? [];
  };

  const name = str(a.name, 80)?.trim() || "";
  if (!name) errors.push("agent.name is required");

  const precision = a.precision_mode ?? "discovery";
  if (precision !== "discovery" && precision !== "high_precision") errors.push("precision_mode must be discovery or high_precision");

  const sc = isObj(a.signals_config) ? a.signals_config : {};
  const enabled = (strArr(sc.enabled) ?? []).filter((id) => (SIGNAL_IDS as readonly string[]).includes(id));
  if (enabled.length === 0) errors.push("enable at least one signal");
  const keywords: Record<string, string[]> = {};
  if (isObj(sc.keywords)) {
    for (const [id, kw] of Object.entries(sc.keywords)) {
      if (!(SIGNAL_IDS as readonly string[]).includes(id)) continue;
      const v = strArr(kw, 100);
      if (v && v.length) keywords[id] = v;
    }
  }

  const goal = c.campaign_goal ?? "conversations";
  if (goal !== "conversations" && goal !== "demos") errors.push("campaign_goal must be conversations or demos");
  const tone = c.message_tone ?? "professional";
  if (!["professional", "conversational", "direct"].includes(tone as string)) errors.push("message_tone is not valid");

  const limit = Number(c.daily_connect_limit ?? 25);
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) errors.push("daily_connect_limit must be 1-100");
  const maxReplies = Number(c.max_ai_replies ?? 5);
  if (![3, 5, 7, 10].includes(maxReplies)) errors.push("max_ai_replies must be 3, 5, 7 or 10");

  const steps: TemplateStep[] = [];
  if (!Array.isArray(c.workflow_steps) || c.workflow_steps.length === 0) {
    errors.push("workflow needs at least one step");
  } else {
    c.workflow_steps.slice(0, 20).forEach((raw, i) => {
      if (!isObj(raw) || !(STEP_TYPES as readonly string[]).includes(raw.type as string)) {
        errors.push(`step ${i + 1}: unknown type`);
        return;
      }
      const step: TemplateStep = { type: raw.type as TemplateStep["type"] };
      for (const k of ["message", "subject", "step_instructions", "ai_instructions"] as const) {
        const v = str(raw[k], 3000);
        if (v !== null) step[k] = v;
      }
      for (const k of ["delay_days", "delay_hours"] as const) {
        if (raw[k] === undefined) continue;
        const n = Number(raw[k]);
        if (!Number.isFinite(n) || n < 0 || n > 24 * 60) errors.push(`step ${i + 1}: ${k} is not valid`);
        else step[k] = n;
      }
      for (const k of ["ai_icebreaker", "ai_sdr", "before_invitation"] as const) {
        if (raw[k] === true) step[k] = true;
      }
      if (raw.post_filter === "authored_only" || raw.post_filter === "all_signals") step.post_filter = raw.post_filter;
      if (typeof raw.connect_note === "string") step.connect_note = raw.connect_note.slice(0, 300);
      if (step.type === "message" && !step.message?.trim() && !step.ai_icebreaker && !step.step_instructions?.trim()) {
        errors.push(`step ${i + 1}: a message step needs text, instructions or the AI icebreaker`);
      }
      if (step.type === "email" && !step.ai_sdr && !(step.subject?.trim() && step.message?.trim())) {
        errors.push(`step ${i + 1}: an email step needs a subject and body (or AI)`);
      }
      steps.push(step);
    });
  }

  for (const p of unknownPlaceholders(steps)) errors.push(`unknown placeholder {{${p}}}`);

  // Read every list now so their errors are reported together with the rest.
  const lists = {
    icp_job_titles: list("icp_job_titles", a, true),
    icp_locations: list("icp_locations", a),
    icp_industries: list("icp_industries", a),
    icp_company_types: list("icp_company_types", a),
    icp_company_sizes: list("icp_company_sizes", a),
    icp_exclude_keywords: list("icp_exclude_keywords", a),
    icp_restricted_countries: list("icp_restricted_countries", a),
    icp_restricted_roles: list("icp_restricted_roles", a),
    pain_points: list("pain_points", c).slice(0, 10),
  };

  if (errors.length) return { ok: false, errors };
  return {
    ok: true,
    value: {
      schema_version: TEMPLATE_SCHEMA_VERSION,
      agent: {
        name,
        icp_job_titles: lists.icp_job_titles,
        icp_locations: lists.icp_locations,
        icp_industries: lists.icp_industries,
        icp_company_types: lists.icp_company_types,
        icp_company_sizes: lists.icp_company_sizes,
        icp_exclude_keywords: lists.icp_exclude_keywords,
        icp_restricted_countries: lists.icp_restricted_countries,
        icp_restricted_roles: lists.icp_restricted_roles,
        ideal_lead_description: str(a.ideal_lead_description, 2000)?.trim() || null,
        precision_mode: precision as "discovery" | "high_precision",
        signals_config: { enabled, keywords },
        manual_approval: a.manual_approval === true,
      },
      campaign: {
        value_proposition: str(c.value_proposition, 3000)?.trim() ?? "",
        pain_points: lists.pain_points,
        campaign_goal: goal as "conversations" | "demos",
        message_tone: tone as "professional" | "conversational" | "direct",
        language: str(c.language, 40)?.trim() || "English",
        custom_training: str(c.custom_training, 5000) ?? "",
        workflow_steps: steps,
        daily_connect_limit: limit,
        timezone: str(c.timezone, 64)?.trim() || "UTC",
        exclude_first_degree: c.exclude_first_degree !== false,
        conversational_ai: c.conversational_ai === true,
        max_ai_replies: maxReplies,
      },
    },
  };
}

// ── Placeholders ────────────────────────────────────────────────────────────
// Resolved at send time. Lead fields may be empty (the word is dropped, as
// before); account fields ({{my_company}}, {{demo_link}}) must have a value or
// the message is not sent.
export const LEAD_PLACEHOLDERS = ["first_name", "last_name", "company", "title", "signal"] as const;
export const ACCOUNT_PLACEHOLDERS = ["my_company", "demo_link"] as const;
const ALIASES: Record<string, string> = { firstname: "first_name", lastname: "last_name" };
const KNOWN = new Set<string>([...LEAD_PLACEHOLDERS, ...ACCOUNT_PLACEHOLDERS]);
const TOKEN = /\{\{\s*([A-Za-z_]+)\s*\}\}/g;

const canonical = (name: string) => {
  const lower = name.toLowerCase();
  return ALIASES[lower] ?? lower;
};

function unknownPlaceholders(steps: TemplateStep[]): string[] {
  const found = new Set<string>();
  for (const s of steps) {
    for (const text of [s.message, s.subject, s.connect_note]) {
      if (!text) continue;
      for (const m of text.matchAll(TOKEN)) if (!KNOWN.has(canonical(m[1]))) found.add(m[1]);
    }
  }
  return [...found];
}

export type PlaceholderValues = Partial<Record<(typeof LEAD_PLACEHOLDERS)[number] | (typeof ACCOUNT_PLACEHOLDERS)[number], string | null | undefined>>;

/**
 * Fills {{placeholders}}. Returns the text plus the placeholders that could
 * not be filled; callers must not send when `unresolved` is non-empty.
 */
export function resolvePlaceholders(text: string, values: PlaceholderValues): { text: string; unresolved: string[] } {
  const unresolved = new Set<string>();
  const out = text.replace(TOKEN, (whole, raw: string) => {
    const name = canonical(raw);
    if (!KNOWN.has(name)) {
      unresolved.add(raw);
      return whole;
    }
    const value = (values as Record<string, string | null | undefined>)[name]?.trim();
    if (value) return value;
    if ((ACCOUNT_PLACEHOLDERS as readonly string[]).includes(name)) {
      unresolved.add(name);
      return whole;
    }
    return "";
  });
  return { text: out.replace(/[ \t]{2,}/g, " "), unresolved: [...unresolved] };
}

export function unresolvedMessage(unresolved: string[]): string {
  const parts = unresolved.map((p) =>
    p === "demo_link" ? "{{demo_link}}: add your demo or calendar link in the campaign settings"
    : p === "my_company" ? "{{my_company}}: add your company name in Settings"
    : `{{${p}}}: not a known placeholder, edit the message`);
  return `Not sent: ${parts.join("; ")}.`;
}

// ── Save a customer's agent as a template ───────────────────────────────────
/**
 * Builds a template from a live agent and its campaign, keeping only
 * configuration: no ids, list names, runtime counters, company identity or
 * pasted-in names (account-specific values a different customer must set).
 */
// Raw DB rows: read loosely, then validateTemplateConfig() decides what's valid.
type Row = Record<string, unknown>;

export function configFromAgent(agent: Row, campaign: Row | null): unknown {
  const sc = isObj(agent.signals_config) ? agent.signals_config : {};
  // Profile/page URLs point at someone else's competitors and influencers.
  const keywords = isObj(sc.keywords) ? { ...sc.keywords } : {};
  for (const id of ["profile_engagers", "competitor_followers", "competitor_engagers"]) delete keywords[id];
  return {
    schema_version: TEMPLATE_SCHEMA_VERSION,
    agent: {
      name: agent.name,
      icp_job_titles: agent.icp_job_titles,
      icp_locations: agent.icp_locations,
      icp_industries: agent.icp_industries,
      icp_company_types: agent.icp_company_types,
      icp_company_sizes: agent.icp_company_sizes,
      icp_exclude_keywords: agent.icp_exclude_keywords,
      icp_restricted_countries: agent.icp_restricted_countries,
      icp_restricted_roles: agent.icp_restricted_roles,
      ideal_lead_description: agent.ideal_lead_description,
      precision_mode: agent.precision_mode,
      signals_config: { enabled: sc.enabled, keywords },
      manual_approval: agent.manual_approval,
    },
    campaign: {
      value_proposition: "",
      pain_points: campaign?.pain_points ?? [],
      campaign_goal: campaign?.campaign_goal ?? "conversations",
      message_tone: campaign?.message_tone ?? "professional",
      language: campaign?.language ?? "English",
      custom_training: "",
      workflow_steps: (Array.isArray(campaign?.workflow_steps) ? (campaign!.workflow_steps as Row[]) : [])
        .map((s) => ({ ...s, type: s?.type === "invite" ? "invitation" : s?.type })),
      daily_connect_limit: campaign?.daily_connect_limit ?? 25,
      timezone: campaign?.timezone ?? "UTC",
      exclude_first_degree: campaign?.exclude_first_degree ?? true,
      conversational_ai: campaign?.conversational_ai ?? false,
      max_ai_replies: campaign?.max_ai_replies ?? 5,
    },
  };
}
