import { supabase } from "@/integrations/supabase/client";

export type BillingEvent = "plan_picker_viewed" | "checkout_started" | "upgrade_clicked";

function anonId(): string | null {
  try {
    return localStorage.getItem("ia_anon_id");
  } catch {
    return null;
  }
}

/** Fire-and-forget billing analytics via public.log_app_event. Never throws. */
export function trackBilling(event: BillingEvent, props: Record<string, unknown> = {}): void {
  try {
    const rpc = supabase.rpc as unknown as (fn: string, args: Record<string, unknown>) => PromiseLike<unknown>;
    Promise.resolve(rpc.call(supabase, "log_app_event", { p_event: event, p_props: props, p_anon_id: anonId() })).catch(() => {});
  } catch {
    // analytics must never break the UI
  }
}
