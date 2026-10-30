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

export const adminTemplates = (body: Record<string, unknown>) => invokeFn<{ template?: AgentTemplate; config?: unknown; errors?: string[]; agents?: Array<{ id: string; name: string; user_id: string; created_at: string; results_count: number | null }> }>("agent-templates", body);

/** Deep-copies a template into the user's own agent and campaign. */
export const applyTemplate = (templateId: string, mode: "create" | "replace") =>
  invokeFn<{ agent_id: string; campaign_id: string | null }>("apply-agent-template", { template_id: templateId, mode });
