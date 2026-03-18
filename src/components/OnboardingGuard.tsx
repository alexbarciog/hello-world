import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const markOnboardingComplete = () =>
  localStorage.setItem("goji_onboarding_complete", "true");

export const isOnboardingComplete = () =>
  localStorage.getItem("goji_onboarding_complete") === "true";

export const clearOnboardingSession = () => {
  localStorage.removeItem("goji_onboarding_complete");
};

// ─── Guard for the onboarding entry (/onboarding) ────────────────────────────
// Redirects to /dashboard if the user already completed onboarding.
// Add ?preview=true to the URL to bypass the redirect (useful for testing).
export function OnboardingEntryGuard({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<"checking" | "allow" | "redirect">("checking");
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    // ?preview=true bypasses the guard so you can always view the onboarding flow
    const isPreview = new URLSearchParams(window.location.search).get("preview") === "true";
    if (isPreview) {
      setStatus("allow");
      return;
    }

    async function check() {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user?.id) {
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

      if (!cancelled) setStatus("allow");
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

export default OnboardingEntryGuard;
