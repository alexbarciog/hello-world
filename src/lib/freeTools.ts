import { supabase } from "@/integrations/supabase/client";
import type { GraderResult, HookResult, SignalsResult } from "../../supabase/functions/_shared/free-tools";

export type { GraderResult, HookResult, SignalsResult };
export interface SignalStats { count: number | null; roles: string[] }

interface CallResult<T> { data?: T; error?: string }

async function call<T>(body: Record<string, unknown>): Promise<CallResult<T>> {
  const { data, error } = await supabase.functions.invoke("free-tool", { body });
  if (error) {
    let detail: { error?: string } = {};
    try {
      detail = await (error as { context?: Response }).context?.json();
    } catch {
      // no JSON body
    }
    return { error: detail?.error || "Something went wrong. Please try again." };
  }
  return { data: data as T };
}

export const analyzeHook = (text: string) => call<{ result: HookResult }>({ action: "hook", text });
export const gradeMessage = (text: string) => call<{ result: GraderResult }>({ action: "grade", text });
export const findSignals = (service: string, opts: { terms?: string[]; statsOnly?: boolean } = {}) =>
  call<{ result: SignalsResult | null; stats: SignalStats }>({ action: "signals", service, terms: opts.terms, stats_only: opts.statsOnly });

export async function saveToolLead(lead: {
  email: string;
  tool: string;
  input_summary?: string;
  result_summary?: string;
  /** The text the tool ran on; the server looks up its own result for the report. */
  input_text?: string;
  consent_marketing: boolean;
}): Promise<{ ok: boolean; error?: string }> {
  const r = await call<{ success: boolean }>({ action: "save_lead", ...lead });
  return r.error ? { ok: false, error: r.error } : { ok: true };
}
