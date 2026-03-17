import { Navigate, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const ONBOARDING_KEY = "goji_onboarding_complete";
const SESSION_KEY = "goji_session_id";

export const markOnboardingComplete = () =>
  localStorage.setItem(ONBOARDING_KEY, "true");

export const isOnboardingComplete = () =>
  localStorage.getItem(ONBOARDING_KEY) === "true";

export const clearOnboardingSession = () => {
  localStorage.removeItem(ONBOARDING_KEY);
  localStorage.removeItem(SESSION_KEY);
};

// ─── Guard for protected pages (/dashboard, /campaign-details, etc.) ──────────
const OnboardingGuard = ({ children }: { children: React.ReactNode }) => {
  if (!isOnboardingComplete()) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

export default OnboardingGuard;

// ─── Guard for the onboarding entry (/) ───────────────────────────────────────
// Redirects to /dashboard if the user already completed onboarding
export function OnboardingEntryGuard({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<"checking" | "allow" | "redirect">("checking");
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    async function check() {
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user?.id) {
        // Check profile for onboarding completion
        const { data: profile } = await supabase
          .from("profiles")
          .select("onboarding_complete")
          .eq("user_id", session.user.id)
          .maybeSingle();

        if (!cancelled && profile?.onboarding_complete) {
          markOnboardingComplete();
          setStatus("redirect");
          return;
        }
      }

      // Also check localStorage fast path
      if (isOnboardingComplete()) {
        if (!cancelled) setStatus("redirect");
        return;
      }

      // Slower path: check DB for active campaign with this session
      const sessionId = localStorage.getItem(SESSION_KEY);
      if (!sessionId) {
        if (!cancelled) setStatus("allow");
        return;
      }

      const { data, error } = await supabase
        .from("campaigns")
        .select("id")
        .eq("session_id", sessionId)
        .eq("status", "active")
        .limit(1);

      if (!cancelled) {
        if (!error && data && data.length > 0) {
          markOnboardingComplete();
          setStatus("redirect");
        } else {
          setStatus("allow");
        }
      }
    }

    check();

    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (status === "redirect") {
      navigate("/dashboard", { replace: true });
    }
  }, [status, navigate]);

  if (status === "checking" || status === "redirect") return null;
  return <>{children}</>;
}
