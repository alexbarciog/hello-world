// Pure helpers for the agent template gallery (/agents/templates): categories,
// colours, signal descriptions and the counts shown on cards. Signal and step
// counts are always computed from the config, never stored.
import {
  TEMPLATE_CATEGORIES,
  TEMPLATE_COLORS,
  type TemplateCategory,
  type TemplateColor,
  type TemplateStep,
} from "../../supabase/functions/_shared/agent-template-schema";
import type { AgentTemplate } from "./agentTemplates";

export { TEMPLATE_CATEGORIES, TEMPLATE_COLORS };
export type { TemplateCategory, TemplateColor };

export const CATEGORY_LABELS: Record<TemplateCategory, string> = {
  agencies: "Agencies",
  "software-it": "Software & IT",
  recruiting: "Recruiting",
  consulting: "Consulting",
  "creative-content": "Creative & content",
  "sales-lead-gen": "Sales & lead gen",
};

/** Calm default tint per category, used when a template has no colour of its own. */
export const CATEGORY_COLORS: Record<TemplateCategory, TemplateColor> = {
  agencies: "violet",
  "software-it": "blue",
  recruiting: "emerald",
  consulting: "amber",
  "creative-content": "rose",
  "sales-lead-gen": "teal",
};

/** Icon tile classes per colour. Written out in full so Tailwind keeps them. */
export const COLOR_TILE: Record<TemplateColor, string> = {
  blue: "bg-sky-50 text-sky-600 ring-sky-100",
  violet: "bg-violet-50 text-violet-600 ring-violet-100",
  emerald: "bg-emerald-50 text-emerald-600 ring-emerald-100",
  amber: "bg-amber-50 text-amber-600 ring-amber-100",
  rose: "bg-rose-50 text-rose-500 ring-rose-100",
  teal: "bg-teal-50 text-teal-600 ring-teal-100",
  slate: "bg-slate-100 text-slate-600 ring-slate-200",
};

type TemplateLike = Pick<AgentTemplate, "config"> & Partial<Pick<AgentTemplate, "category" | "color">>;

export function categoryOf(t: Pick<AgentTemplate, "category"> | Partial<Pick<AgentTemplate, "category">>): TemplateCategory | null {
  const c = t.category;
  return c && (TEMPLATE_CATEGORIES as readonly string[]).includes(c) ? (c as TemplateCategory) : null;
}

export function colorOf(t: Partial<Pick<AgentTemplate, "category" | "color">>): TemplateColor {
  if (t.color && (TEMPLATE_COLORS as readonly string[]).includes(t.color)) return t.color as TemplateColor;
  const cat = categoryOf(t);
  return cat ? CATEGORY_COLORS[cat] : "slate";
}

export interface SignalInfo {
  label: string;
  /** One line for the detail page: what this signal finds. */
  explain: string;
  /** False when the agent runner has no handler for it yet. */
  live: boolean;
  /** Needs LinkedIn URLs (profiles or company pages) the customer adds after applying. */
  needsUrls?: boolean;
}

export const SIGNAL_INFO: Record<string, SignalInfo> = {
  keyword_posts: { label: "Posts", explain: "People posting on LinkedIn about the keywords below, for example asking for a recommendation.", live: true },
  post_engagers: { label: "Your post engagers", explain: "People who like or comment on your own LinkedIn posts.", live: true },
  hashtag_engagement: { label: "Hashtags", explain: "People engaging with posts under the hashtags below.", live: true },
  profile_engagers: { label: "Profile engagers", explain: "People engaging with posts from LinkedIn profiles you choose.", live: true, needsUrls: true },
  competitor_followers: { label: "Competitor followers", explain: "People following competitor company pages you choose.", live: true, needsUrls: true },
  competitor_engagers: { label: "Competitor engagers", explain: "People engaging with posts from competitor company pages you choose.", live: true, needsUrls: true },
  job_changes: { label: "Job changes", explain: "People in your target roles who just started a new job.", live: false },
  profile_viewers: { label: "Profile visitors", explain: "People who viewed your LinkedIn profile.", live: false },
  company_followers: { label: "Company followers", explain: "New followers of your company page.", live: false },
};

/** Enabled signals the agent will actually run, in config order. */
export function liveSignals(t: TemplateLike): string[] {
  const enabled = t.config?.agent?.signals_config?.enabled ?? [];
  return enabled.filter((id) => SIGNAL_INFO[id]?.live);
}

export function sequenceSteps(t: TemplateLike): TemplateStep[] {
  return t.config?.campaign?.workflow_steps ?? [];
}

export const pluralize = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** Featured first, then the admin's sort order, then name. */
export function sortTemplates<T extends Pick<AgentTemplate, "name" | "sort_order"> & Partial<Pick<AgentTemplate, "featured">>>(list: T[]): T[] {
  return [...list].sort(
    (a, b) => Number(!!b.featured) - Number(!!a.featured) || a.sort_order - b.sort_order || a.name.localeCompare(b.name),
  );
}

/** Case-insensitive search over the text a customer sees, plus keywords and job titles. */
export function filterTemplates<T extends AgentTemplate>(list: T[], query: string, category: TemplateCategory | "all"): T[] {
  const q = query.trim().toLowerCase();
  return list.filter((t) => {
    if (category !== "all" && categoryOf(t) !== category) return false;
    if (!q) return true;
    const cat = categoryOf(t);
    const haystack = [
      t.name, t.business_type, t.tagline, t.description, cat ? CATEGORY_LABELS[cat] : "",
      ...(t.config?.agent?.icp_job_titles ?? []),
      ...(t.config?.agent?.signals_config?.keywords?.keyword_posts ?? []),
    ].join(" ").toLowerCase();
    return q.split(/\s+/).every((word) => haystack.includes(word));
  });
}

/** Other templates, same category first. */
export function similarTemplates<T extends AgentTemplate>(all: T[], current: T, limit = 3): T[] {
  const cat = categoryOf(current);
  const others = sortTemplates(all.filter((t) => t.id !== current.id));
  return [...others.filter((t) => cat && categoryOf(t) === cat), ...others.filter((t) => !cat || categoryOf(t) !== cat)].slice(0, limit);
}

/** Splits text into plain parts and {{variable}} parts for highlighting. */
export function splitPlaceholders(text: string): Array<{ text: string; variable: boolean }> {
  const out: Array<{ text: string; variable: boolean }> = [];
  let last = 0;
  for (const m of text.matchAll(/\{\{\s*[A-Za-z_]+\s*\}\}/g)) {
    if (m.index! > last) out.push({ text: text.slice(last, m.index), variable: false });
    out.push({ text: m[0], variable: true });
    last = m.index! + m[0].length;
  }
  if (last < text.length) out.push({ text: text.slice(last), variable: false });
  return out;
}

/** "Used by N teams" is only shown from 5 up. */
export const usedByLabel = (n: number | null | undefined) => (n && n >= 5 ? `Used by ${n} teams` : null);
