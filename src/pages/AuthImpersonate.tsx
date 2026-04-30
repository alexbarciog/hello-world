import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

/**
 * Landing page for admin impersonation. Reads access_token / refresh_token
 * from the URL hash, calls supabase.auth.setSession() explicitly, then
 * redirects to /dashboard. This is more reliable than relying on
 * supabase-js's automatic URL hash detection (which expects a magiclink
 * verify flow and can race with AuthGuard).
 */
export default function AuthImpersonate() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const hash = window.location.hash.startsWith("#")
          ? window.location.hash.slice(1)
          : window.location.hash;
        const params = new URLSearchParams(hash);
        const access_token = params.get("access_token");
        const refresh_token = params.get("refresh_token");

        if (!access_token || !refresh_token) {
          throw new Error("Missing session tokens in URL");
        }

        // Clear any existing session first so we don't merge identities
        await supabase.auth.signOut().catch(() => {});

        const { error: setErr } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        });
        if (setErr) throw setErr;

        // Strip the hash and go to dashboard with a full reload so every
        // provider/guard re-reads the new session cleanly.
        window.location.replace("/dashboard");
      } catch (err: any) {
        setError(err.message || "Failed to start session");
      }
    })();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      {error ? (
        <div className="text-center space-y-2">
          <p className="text-sm text-destructive">{error}</p>
          <a href="/login" className="text-sm underline">Go to login</a>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Signing you in…</span>
        </div>
      )}
    </div>
  );
}
