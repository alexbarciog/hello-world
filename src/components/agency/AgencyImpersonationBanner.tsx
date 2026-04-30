import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft } from "lucide-react";

const KEY = "intentsly_agency_impersonation";

export type AgencyImpersonationState = {
  client_name: string;
  client_email: string;
  agency_access_token: string;
  agency_refresh_token: string;
};

export function readImpersonation(): AgencyImpersonationState | null {
  try {
    const raw = sessionStorage.getItem(KEY) || localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

export function writeImpersonation(s: AgencyImpersonationState) {
  localStorage.setItem(KEY, JSON.stringify(s));
}

export function clearImpersonation() {
  localStorage.removeItem(KEY);
  sessionStorage.removeItem(KEY);
}

export default function AgencyImpersonationBanner() {
  const [state, setState] = useState<AgencyImpersonationState | null>(readImpersonation());
  const [returning, setReturning] = useState(false);

  useEffect(() => {
    const onStorage = () => setState(readImpersonation());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  if (!state) return null;

  const handleReturn = async () => {
    setReturning(true);
    try {
      await supabase.auth.setSession({
        access_token: state.agency_access_token,
        refresh_token: state.agency_refresh_token,
      });
      clearImpersonation();
      window.location.href = "/dashboard/client-accounts";
    } catch {
      clearImpersonation();
      window.location.href = "/login";
    }
  };

  return (
    <div
      className="w-full text-white px-4 py-2.5 flex items-center justify-between gap-3 sticky top-0 z-[60] shadow-md"
      style={{ background: "linear-gradient(90deg, #7C3AED 0%, #DB2777 100%)" }}
    >
      <div className="flex items-center gap-2 text-sm font-medium min-w-0">
        <span className="inline-flex w-2 h-2 rounded-full bg-white animate-pulse shrink-0" />
        <span className="truncate">
          You are viewing <strong>{state.client_name}</strong>'s account — switch back to your account
        </span>
      </div>
      <button
        onClick={handleReturn}
        disabled={returning}
        className="shrink-0 inline-flex items-center gap-1.5 bg-white/15 hover:bg-white/25 transition-colors rounded-full px-3 py-1.5 text-xs font-semibold backdrop-blur-sm"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        {returning ? "Returning…" : "Return to my account"}
      </button>
    </div>
  );
}
