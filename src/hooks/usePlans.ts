import { useQuery } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { FALLBACK_CREDIT_COSTS, FALLBACK_PLANS, normalizeCreditCosts, normalizePlans } from "@/lib/plans";

// billing_plans and credit_costs aren't in the generated types yet.
const db = () => supabase as unknown as SupabaseClient;

/** Plans from public.billing_plans, with the current values as initial data (so prerendered HTML is complete). */
export function usePlans() {
  const { data } = useQuery({
    queryKey: ["billing_plans"],
    queryFn: async () => {
      const { data, error } = await db()
        .from("billing_plans")
        .select("key, name, price_cents, monthly_credits, max_signal_agents, max_active_campaigns, linkedin_accounts, priority_support, sort_order, active")
        .eq("active", true)
        .order("sort_order");
      if (error) return FALLBACK_PLANS;
      return normalizePlans(data);
    },
    initialData: FALLBACK_PLANS,
    initialDataUpdatedAt: 0,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
  return data;
}

/** Credit cost per action from public.credit_costs, falling back to the current values. */
export function useCreditCosts() {
  const { data } = useQuery({
    queryKey: ["credit_costs"],
    queryFn: async () => {
      const { data, error } = await db().from("credit_costs").select("action, credits");
      if (error) return FALLBACK_CREDIT_COSTS;
      return normalizeCreditCosts(data);
    },
    initialData: FALLBACK_CREDIT_COSTS,
    initialDataUpdatedAt: 0,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
  return data;
}
