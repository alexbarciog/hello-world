import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Linkedin, Radio, Rocket, Check, Lock, X, ArrowRight, Pencil, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useSubscription } from "@/hooks/useSubscription";

const EASE = [0.22, 1, 0.36, 1] as const;

const BRAND_GRADIENT = "linear-gradient(135deg, #0057bd 0%, #4647d3 100%)";

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

const LINKEDIN_STEP: Step = {
  key: "linkedin",
  index: 1,
  icon: Linkedin,
  title: "Connect LinkedIn",
  desc: "Required to send invites",
  cta: "Connect LinkedIn",
  href: "/settings?tab=linkedin",
};

const UPGRADE_STEP: Step = {
  key: "linkedin",
  index: 1,
  icon: Sparkles,
  title: "Upgrade your plan",
  desc: "Unlock LinkedIn outreach & AI SDR",
  cta: "Upgrade plan",
  href: "/billing",
};

const REST_STEPS: Step[] = [
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
  const sub = useSubscription();
  const [dismissed, setDismissed] = useState<boolean>(
    () => typeof window !== "undefined" && localStorage.getItem(DISMISS_KEY) === "true"
  );

  const STEPS: Step[] = [sub.hasAccess ? LINKEDIN_STEP : UPGRADE_STEP, ...REST_STEPS];

  const { data, isLoading } = useQuery({
    queryKey: ["setup-wizard-status", sub.hasAccess],
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

  if (isLoading || !data || sub.loading) return null;

  const status: Record<StepKey, boolean> = {
    linkedin: sub.hasAccess ? data.linkedinConnected : false,
    agent: data.agentCreated,
    campaign: data.campaignActive,
  };

  const completed = STEPS.filter((s) => status[s.key]).length;
  const allDone = completed === STEPS.length;
  const progress = Math.round((completed / STEPS.length) * 100);

  if (allDone && dismissed) return null;

  if (allDone) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: EASE }}
        className="relative rounded-[22px] p-5 flex items-center justify-between gap-4 overflow-hidden"
        style={{
          background: "linear-gradient(135deg, hsl(150 60% 46% / 0.08) 0%, hsl(160 50% 52% / 0.08) 100%)",
          border: "1px solid hsl(150 60% 46% / 0.18)",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg, #16A34A 0%, #22C55E 100%)" }}
          >
            <Check className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-sm font-semibold text-neutral-900">Setup complete — your AI SDR is live</p>
            <p className="text-xs text-neutral-500 mt-0.5">All {STEPS.length} steps finished</p>
          </div>
        </div>
        <button
          onClick={() => {
            localStorage.setItem(DISMISS_KEY, "true");
            setDismissed(true);
          }}
          className="w-8 h-8 rounded-xl flex items-center justify-center text-neutral-500 hover:text-neutral-900 hover:bg-white/60 transition-colors shrink-0"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </motion.div>
    );
  }

  const firstUndoneIndex = STEPS.findIndex((s) => !status[s.key]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: EASE }}
      className="relative rounded-[22px] bg-gradient-to-b from-[#F2F4FE] to-[#FDFDFD] border border-white/55 shadow-[0_1px_2px_rgba(10,10,10,0.03)] overflow-hidden"
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-[15px] font-semibold text-neutral-900 tracking-[-0.01em]">Set up your AI SDR</h2>
            <p className="text-xs text-neutral-500 mt-0.5">{completed} of {STEPS.length} done</p>
          </div>
          <span className="text-xs font-semibold text-neutral-900 bg-white/70 px-2 py-1 rounded-lg">{progress}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/70 overflow-hidden ring-1 ring-black/[0.03]">
          <motion.div
            className="h-full origin-left"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1.1, ease: EASE, delay: 0.2 }}
            style={{ background: "linear-gradient(90deg, #0057bd 0%, #4647d3 100%)" }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="px-5 pb-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {STEPS.map((step, i) => {
            const done = status[step.key];
            const locked = !done && i > firstUndoneIndex;
            const isCurrent = i === firstUndoneIndex;
            const Icon = step.icon;

            return (
              <div
                key={step.key}
                className={`relative rounded-2xl p-4 transition-all duration-200 ${
                  done
                    ? "bg-white/60"
                    : isCurrent
                    ? "bg-white shadow-[0_2px_12px_rgba(0,87,189,0.08)] ring-1 ring-[#0057bd]/10"
                    : "bg-white/40"
                }`}
                title={locked ? "Complete previous step first" : undefined}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 text-xs font-semibold"
                    style={{
                      background: done
                        ? "linear-gradient(135deg, #16A34A 0%, #22C55E 100%)"
                        : isCurrent
                        ? BRAND_GRADIENT
                        : "hsl(220 14% 95%)",
                      color: done || isCurrent ? "hsl(0 0% 100%)" : "hsl(220 9% 46%)",
                    }}
                  >
                    {done ? (
                      <Check className="w-4 h-4" strokeWidth={2.5} />
                    ) : locked ? (
                      <Lock className="w-4 h-4" />
                    ) : (
                      step.index
                    )}
                  </div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <div className="flex items-center gap-1.5">
                      <Icon className={`w-3.5 h-3.5 shrink-0 ${done ? "text-emerald-600" : "text-neutral-400"}`} />
                      <p className={`text-sm font-semibold truncate ${done ? "text-emerald-700" : "text-neutral-900"}`}>
                        {step.title}
                      </p>
                    </div>
                    <p className="text-[11px] text-neutral-500 mt-0.5 leading-snug">{step.desc}</p>
                  </div>
                </div>

                {done ? (
                  <button
                    onClick={() => navigate(step.href)}
                    className="w-full h-9 rounded-xl text-xs font-medium text-neutral-500 hover:text-neutral-900 bg-white/70 hover:bg-white flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Pencil className="w-3 h-3" />
                    Edit
                  </button>
                ) : (
                  <button
                    onClick={() => !locked && navigate(step.href)}
                    disabled={locked}
                    className="w-full h-9 rounded-xl text-xs font-semibold transition-all duration-200 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                    style={
                      locked
                        ? { background: "hsl(220 14% 95%)", color: "hsl(220 9% 60%)" }
                        : isCurrent
                        ? {
                            background: BRAND_GRADIENT,
                            color: "hsl(0 0% 100%)",
                            boxShadow: "0 2px 10px rgba(0, 87, 189, 0.22)",
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
                )}
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
