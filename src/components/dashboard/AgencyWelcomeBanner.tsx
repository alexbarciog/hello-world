import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Briefcase, X, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "intentsly:agency_welcome_dismissed";

export function AgencyWelcomeBanner() {
  const location = useLocation();
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const [accountType, setAccountType] = useState<string | null>(null);

  // Detect ?welcome=agency or persistent agency account_type
  useEffect(() => {
    let cancelled = false;
    async function check() {
      const params = new URLSearchParams(location.search);
      const fromUrl = params.get("welcome") === "agency";
      const dismissed = localStorage.getItem(STORAGE_KEY) === "1";

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("account_type")
        .eq("user_id", user.id)
        .maybeSingle();

      if (cancelled) return;
      const at = (data as any)?.account_type ?? null;
      setAccountType(at);

      if (at === "agency" && (fromUrl || !dismissed)) {
        setShow(true);
      }

      // Strip the ?welcome=agency param from URL once we've seen it
      if (fromUrl) {
        params.delete("welcome");
        const next = params.toString();
        navigate(`${location.pathname}${next ? `?${next}` : ""}`, { replace: true });
      }
    }
    check();
    return () => {
      cancelled = true;
    };
  }, [location.pathname, location.search, navigate]);

  if (!show || accountType !== "agency") return null;

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setShow(false);
  }

  return (
    <div
      className="relative rounded-[20px] p-5 md:p-6 flex items-start gap-4 overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, hsl(220 90% 56% / 0.08) 0%, hsl(264 80% 60% / 0.08) 100%)",
        border: "1px solid hsl(220 90% 56% / 0.18)",
      }}
    >
      <div
        className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
        style={{
          background: "linear-gradient(135deg, #0057bd 0%, #4647d3 100%)",
          color: "hsl(0 0% 100%)",
        }}
      >
        <Briefcase className="w-5 h-5" />
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="text-sm md:text-base font-semibold text-foreground mb-1">
          You're set up as an agency partner
        </h3>
        <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
          Add your first client account to get started — and earn $29/month for every
          client you refer.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => navigate("/settings?tab=workspace")}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white"
            style={{
              background: "linear-gradient(135deg, #0057bd 0%, #4647d3 100%)",
            }}
          >
            Add a client
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <a
            href="/partners"
            className="inline-flex items-center px-3 py-2 rounded-xl text-xs font-semibold text-foreground bg-white/60"
          >
            View partner program
          </a>
        </div>
      </div>

      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
