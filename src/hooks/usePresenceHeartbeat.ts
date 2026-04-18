import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Pings `profiles.last_seen_at = now()` every 60s while the tab is visible
 * and the user is authenticated. Used to power admin "online now" indicators.
 */
export function usePresenceHeartbeat() {
  useEffect(() => {
    let intervalId: number | undefined;
    let cancelled = false;

    const ping = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || cancelled) return;
        if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
        await supabase
          .from("profiles")
          .update({ last_seen_at: new Date().toISOString() })
          .eq("user_id", user.id);
      } catch {
        // silent — presence is best-effort
      }
    };

    // Immediate ping, then every 60s
    ping();
    intervalId = window.setInterval(ping, 60_000);

    // Ping on tab focus
    const onVisibility = () => {
      if (document.visibilityState === "visible") ping();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      if (intervalId !== undefined) window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);
}
