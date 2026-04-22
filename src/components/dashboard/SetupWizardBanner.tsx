import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Linkedin, Radio, Rocket, Check, Lock, X, ArrowRight, Pencil } from "lucide-react";

type StepKey = "linkedin" | "agent" | "campaign";

type Step = {
  key: StepKey;
  index: number;
  icon: typeof Linkedin;
  title: string;
  desc: string;
  cta: string;
  href: string;
};

const STEPS: Step[] = [
  {
    key: "linkedin",
    index: 1,
    icon: Linkedin,
    title: "Connect LinkedIn",
    desc: "Required to send invites",
    cta: "Connect LinkedIn",
    href: "/settings?tab=linkedin",
  },
  {
    key: "agent",
    index: 2,
    icon: Radio,
    title: "Create signal agent",
    desc: "AI finds buyers showing intent",
    cta: "Create agent",
    href: "/signals?create=1",
  },
  {
    key: "campaign",
    index: 3,
    icon: Rocket,
    title: "Launch campaign",
    desc: "Turn signals into outreach",
    cta: "Launch campaign",
    href: "/campaigns?autoStart=true",
  },
];

const DISMISS_KEY = "intentsly_setup_dismissed";

export function SetupWizardBanner() {
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState<boolean>(
    () => typeof window !== "undefined" && localStorage.getItem(DISMISS_KEY) === "true"
  );

  const { data, isLoading } = useQuery({
    queryKey: ["setup-wizard-status"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { linkedinConnected: false, agentCreated: false, campaignActive: false };

      const [profileRes, agentRes, campaignRes] = await Promise.all([
        supabase.from("profiles").select("unipile_account_id").eq("user_id", user.id).maybeSingle(),
        supabase.from("signal_agents").select("id", { count: "exact", head: true }),
        supabase.from("campaigns").select("id", { count: "exact", head: true }).eq("status", "active"),
      ]);

      return {
        linkedinConnected: Boolean(profileRes.data?.unipile_account_id),
        agentCreated: (agentRes.count ?? 0) > 0,
        campaignActive: (campaignRes.count ?? 0) > 0,
      };
    },
    staleTime: 15_000,
  });

  if (isLoading || !data) return null;

  const status: Record<StepKey, boolean> = {
    linkedin: data.linkedinConnected,
    agent: data.agentCreated,
    campaign: data.campaignActive,
  };

  const completed = STEPS.filter((s) => status[s.key]).length;
  const allDone = completed === STEPS.length;
  const progress = Math.round((completed / STEPS.length) * 100);

  if (allDone && dismissed) return null;

  if (allDone) {
    return (
      <div className="flex items-center justify-between rounded-2xl px-5 py-3 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/60">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center">
            <Check className="w-4 h-4 text-white" strokeWidth={3} />
          </div>
          <p className="text-sm font-semibold text-emerald-900">
            Setup complete — your AI SDR is live
          </p>
        </div>
        <button
          onClick={() => {
            localStorage.setItem(DISMISS_KEY, "true");
            setDismissed(true);
          }}
          className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-100 transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // Determine first locked step (sequential unlock)
  const firstUndoneIndex = STEPS.findIndex((s) => !status[s.key]);

  return (
    <div className="rounded-2xl bg-white border border-gray-200/60 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-4 pb-3 border-b border-gray-100">
        <div className="flex items-center justify-between mb-2.5">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Set up your AI SDR</h2>
            <p className="text-xs text-gray-500 mt-0.5">{completed} of {STEPS.length} done</p>
          </div>
          <span className="text-xs font-medium text-gray-500">{progress}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full transition-all duration-500 ease-out"
            style={{
              width: `${progress}%`,
              background: "linear-gradient(90deg, #0057bd 0%, #4647d3 100%)",
            }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-100">
        {STEPS.map((step, i) => {
          const done = status[step.key];
          const locked = !done && i > firstUndoneIndex;
          const isCurrent = i === firstUndoneIndex;
          const Icon = step.icon;

          if (done) {
            return (
              <div key={step.key} className="px-5 py-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 text-emerald-600" strokeWidth={3} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{step.title}</p>
                    <p className="text-[11px] text-emerald-600 font-medium">Done</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate(step.href)}
                  className="text-xs font-medium text-gray-400 hover:text-gray-600 flex items-center gap-1 shrink-0 transition-colors"
                >
                  <Pencil className="w-3 h-3" />
                  Edit
                </button>
              </div>
            );
          }

          return (
            <div
              key={step.key}
              className="px-5 py-4 flex flex-col gap-3"
              title={locked ? "Complete previous step first" : undefined}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold"
                  style={{
                    background: isCurrent
                      ? "linear-gradient(135deg, #0057bd 0%, #4647d3 100%)"
                      : "hsl(220 14% 95%)",
                    color: isCurrent ? "hsl(0 0% 100%)" : "hsl(220 9% 46%)",
                  }}
                >
                  {locked ? <Lock className="w-3.5 h-3.5" /> : step.index}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <Icon className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <p className="text-sm font-semibold text-gray-900 truncate">{step.title}</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 leading-snug">{step.desc}</p>
                </div>
              </div>
              <button
                onClick={() => !locked && navigate(step.href)}
                disabled={locked}
                className="w-full h-9 rounded-lg text-xs font-semibold transition-all duration-200 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                style={
                  locked
                    ? { background: "hsl(220 14% 95%)", color: "hsl(220 9% 60%)" }
                    : isCurrent
                    ? {
                        background: "linear-gradient(135deg, #0057bd 0%, #4647d3 100%)",
                        color: "hsl(0 0% 100%)",
                        boxShadow: "0 2px 8px rgba(0, 87, 189, 0.25)",
                      }
                    : {
                        background: "hsl(0 0% 100%)",
                        color: "hsl(220 14% 20%)",
                        border: "1px solid hsl(220 14% 90%)",
                      }
                }
              >
                {locked ? (
                  <>
                    <Lock className="w-3 h-3" />
                    Locked
                  </>
                ) : (
                  <>
                    {step.cta}
                    <ArrowRight className="w-3 h-3" />
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
