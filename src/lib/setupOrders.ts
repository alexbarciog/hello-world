import { supabase } from "@/integrations/supabase/client";
import type { SetupIntake } from "../../supabase/functions/_shared/setup-orders";

export type { SetupIntake };

export interface SetupOrder {
  id: string;
  amount: number;
  status: "ordered" | "scheduled" | "delivered" | "cancelled";
  intake: SetupIntake | null;
  scheduled_at: string | null;
  delivered_at: string | null;
  created_at: string;
}
export interface AdminSetupOrder extends SetupOrder {
  account_id: string;
  email: string | null;
  notes_admin: string | null;
  stripe_payment_intent_id: string | null;
  template_id: string | null;
}

// Alex creates a dedicated cal.com event type and puts its link here, e.g.
// "https://cal.com/alex/setup-call". The existing cal.com webhook then files the
// booking under ops_meetings. Until it's set, the page says Alex will email a link.
export const SETUP_CALL_URL: string | null = null;

export async function setupOrders<T>(body: Record<string, unknown>): Promise<{ data?: T; error?: string; errors?: string[]; code?: string }> {
  const { data, error } = await supabase.functions.invoke("setup-orders", { body });
  if (error) {
    let detail: { error?: string; errors?: string[]; code?: string } = {};
    try {
      detail = await (error as { context?: Response }).context?.json();
    } catch {
      // no JSON body
    }
    return { error: detail?.error || error.message, errors: detail?.errors, code: detail?.code };
  }
  return { data: data as T };
}
