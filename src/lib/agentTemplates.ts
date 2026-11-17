import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { AgentTemplateConfig } from "../../supabase/functions/_shared/agent-template-schema";

export type { AgentTemplateConfig };

export interface AgentTemplate {
  id: string;
  name: string;
  slug: string;
  business_type: string;
  description: string;
  icon: string;
  /** Gallery card line: what the agent finds. Falls back to description. */
  tagline: string | null;
  category: string | null;
  featured: boolean | null;
  color: string | null;
  /** Distinct accounts that applied it (kept by the apply functions). */
  uses_count: number | null;
  is_public: boolean;
  archived_at: string | null;
  sort_order: number;
  schema_version: number;
  version: number;
  config: AgentTemplateConfig;
  created_at: string;
  updated_at: string;
}

// agent_templates isn't in the generated Supabase types yet.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const templatesTable = () => (supabase as any).from("agent_templates");

/** Public, live templates for onboarding and "Switch template". */
export function usePublicTemplates() {
  return useQuery({
    queryKey: ["agent-templates", "public"],
    queryFn: async (): Promise<AgentTemplate[]> => {
      const { data, error } = await templatesTable()
        .select("*")
        .eq("is_public", true)
        .is("archived_at", null)
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });
      if (error) return [];
      return data ?? [];
    },
    staleTime: 60_000,
  });
}

/** One template by slug: public ones for everyone, any for admins (RLS). */
export function useTemplateBySlug(slug: string | undefined) {
  return useQuery({
    queryKey: ["agent-templates", "slug", slug],
    enabled: !!slug,
    queryFn: async (): Promise<AgentTemplate | null> => {
      const { data, error } = await templatesTable().select("*").eq("slug", slug).maybeSingle();
      if (error) throw error;
      return data ?? null;
    },
    staleTime: 60_000,
  });
}

/** "Request a template" from the gallery's empty search. */
export async function requestTemplate(text: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Please sign in again.");
  // template_requests isn't in the generated Supabase types yet.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("template_requests").insert({ user_id: user.id, text: text.trim().slice(0, 1000) });
  if (error) throw new Error("Couldn't send your request. Please try again.");
}

/** Every template, archived included (RLS returns all of them to admins only). */
export function useAllTemplates(enabled: boolean) {
  return useQuery({
    queryKey: ["agent-templates", "all"],
    enabled,
    queryFn: async (): Promise<AgentTemplate[]> => {
      const { data, error } = await templatesTable().select("*").order("sort_order").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });
}

async function invokeFn<T>(fn: string, body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke(fn, { body });
  if (error) {
    let detail: { error?: string; errors?: string[] } = {};
    try {
      detail = await (error as { context?: Response }).context?.json();
    } catch {
      // no JSON body
    }
    const err = new Error(detail?.error || error.message) as Error & { errors?: string[] };
    err.errors = detail?.errors;
    throw err;
  }
  return data as T;
}

export const adminTemplates = (body: Record<string, unknown>) => invokeFn<{ template?: AgentTemplate; config?: unknown; errors?: string[]; had_campaign?: boolean; agents?: Array<{ id: string; name: string; user_id: string; created_at: string; results_count: number | null }> }>("agent-templates", body);

/** Deep-copies a template into the user's own agent and campaign. */
export const applyTemplate = (templateId: string, mode: "create" | "replace") =>
  invokeFn<{ agent_id: string; campaign_id: string | null; status?: string }>("apply-agent-template", { template_id: templateId, mode });

/** After a "create" apply: an agent that is already active gets its first run now, like one made in the form. */
export function startAppliedAgent(result: Awaited<ReturnType<typeof applyTemplate>>, onDone?: () => void) {
  if (result.status !== "active") return;
  supabase.functions.invoke("process-signal-agents", { body: { agent_id: result.agent_id } }).then(({ error }) => {
    if (error) console.error("Immediate agent processing failed:", error);
    else onDone?.();
  });
}
