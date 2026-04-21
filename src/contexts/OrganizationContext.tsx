import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

export interface Organization {
  id: string;
  name: string;
  plan: string;
  owner_id: string;
  role?: string;
}

interface Member {
  id: string;
  role: string;
  user_id: string;
  joined_at: string;
}

interface PendingInvitation {
  id: string;
  email: string;
  status: string;
  created_at: string;
}

interface OrgContextValue {
  currentOrg: Organization | null;
  organizations: Organization[];
  members: Member[];
  pendingInvitations: PendingInvitation[];
  referralCode: string | null;
  referralBalance: number;
  loading: boolean;
  refresh: () => Promise<void>;
  switchOrg: (orgId: string) => Promise<void>;
}

const OrganizationContext = createContext<OrgContextValue | null>(null);

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referralBalance, setReferralBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  const refresh = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase.functions.invoke("get-organization-context");
      if (error) throw error;
      setCurrentOrg(data.currentOrg);
      setOrganizations(data.organizations || []);
      setMembers(data.members || []);
      setPendingInvitations(data.pendingInvitations || []);
      setReferralCode(data.referralCode);
      setReferralBalance(Number(data.referralBalance) || 0);
    } catch (e) {
      console.error("Failed to load org context", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const switchOrg = useCallback(async (orgId: string) => {
    const { error } = await supabase.functions.invoke("switch-organization", {
      body: { organizationId: orgId },
    });
    if (error) throw error;
    await refresh();
    // Invalidate every cached query so org-scoped data refetches
    await queryClient.invalidateQueries();
  }, [refresh, queryClient]);

  useEffect(() => {
    refresh();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") refresh();
    });
    return () => sub.subscription.unsubscribe();
  }, [refresh]);

  return (
    <OrganizationContext.Provider
      value={{
        currentOrg,
        organizations,
        members,
        pendingInvitations,
        referralCode,
        referralBalance,
        loading,
        refresh,
        switchOrg,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const ctx = useContext(OrganizationContext);
  if (!ctx) throw new Error("useOrganization must be used within OrganizationProvider");
  return ctx;
}
