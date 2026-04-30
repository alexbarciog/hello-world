import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useAccountType() {
  return useQuery({
    queryKey: ["account-type"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null as null | "personal" | "agency";
      const { data } = await supabase
        .from("profiles")
        .select("account_type")
        .eq("user_id", user.id)
        .maybeSingle();
      return (data?.account_type ?? "personal") as "personal" | "agency";
    },
    staleTime: 60_000,
  });
}
