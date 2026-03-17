import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Loader2 } from "lucide-react";

/**
 * Hook that waits for Supabase to fully restore its session from storage.
 * Avoids the race condition where getSession() returns null before storage is read.
 */
function useAuthReady() {
  const [isReady, setIsReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsReady(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        // If we weren't ready yet, mark ready now
        setIsReady(true);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return { user, isReady };
}

const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
  </div>
);

/**
 * Wraps protected routes.
 * - Not authenticated → /login
 * - Authenticated but onboarding not complete → /onboarding
 * - Authenticated + onboarding complete → render children
 */
export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isReady } = useAuthReady();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (!isReady) return;

    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

    // Check onboarding status
    supabase
      .from("profiles")
      .select("onboarding_complete")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data: profile }) => {
        if (!profile || !profile.onboarding_complete) {
          navigate("/onboarding", { replace: true });
        } else {
          setAllowed(true);
        }
      });
  }, [isReady, user, navigate, location.pathname]);

  if (!isReady || !allowed) return <LoadingScreen />;
  return <>{children}</>;
}

/**
 * Auth-only guard (no onboarding check). For the onboarding page itself.
 * - Not authenticated → /login
 * - Authenticated → render children
 */
export function AuthOnlyGuard({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { user, isReady } = useAuthReady();

  useEffect(() => {
    if (isReady && !user) {
      navigate("/login", { replace: true });
    }
  }, [isReady, user, navigate]);

  if (!isReady || !user) return <LoadingScreen />;
  return <>{children}</>;
}
