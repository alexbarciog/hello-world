import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import intentslyIcon from "@/assets/intentsly-icon.png";
import type { OnboardingData } from "./types";
import type { ICPData } from "./Step3ICP";
import type { PrecisionMode } from "./Step4Precision";
import type { IntentSignalsData } from "./Step5IntentSignals";
import type { ObjectivesData } from "./Step6Objectives";

// ─── Brain SVG ────────────────────────────────────────────────────────────────

const BrainIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z" />
    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z" />
  </svg>
);

// ─── Animated dots ────────────────────────────────────────────────────────────

const LoadingDots = () => (
  <div className="flex items-center justify-center gap-1.5">
    {[0, 1, 2].map((i) => (
      <span
        key={i}
        className="w-2 h-2 rounded-full bg-foreground/30"
        style={{
          animation: `dot-bounce 1.4s ease-in-out ${i * 0.22}s infinite`,
        }}
      />
    ))}
    <style>{`
      @keyframes dot-bounce {
        0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
        40% { transform: translateY(-6px); opacity: 1; }
      }
      @keyframes brain-breathe {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.08); }
      }
    `}</style>
  </div>
);

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = {
  data: OnboardingData;
  icp: ICPData;
  precision: PrecisionMode;
  signals: IntentSignalsData;
  objectives: ObjectivesData;
  existingCampaignId?: string | null;
};

// ─── Component ────────────────────────────────────────────────────────────────

export const StepComplete = ({
  data,
  icp,
  precision,
  signals,
  objectives,
  existingCampaignId,
}: Props) => {
  const hasSaved = useRef(false);

  useEffect(() => {
    if (hasSaved.current) return;
    hasSaved.current = true;

    async function saveAndRedirect() {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      // Check if LinkedIn is already connected
      let linkedinConnected = false;
      if (userId) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("unipile_account_id")
          .eq("user_id", userId)
          .single();
        linkedinConnected = !!profile?.unipile_account_id;
      }

      // Always start as paused — user needs a subscription to activate
      const initialStatus = "paused";

      let campaignId: string | null = existingCampaignId ?? null;

      try {
        const fullPayload = {
          user_id: userId,
          website: data.website,
          company_name: data.companyName,
          description: data.description,
          industry: data.industry,
          language: data.language,
          country: data.country,
          linkedin_connection_type: data.linkedinConnectionType || null,
          icp_job_titles: icp.jobTitles,
          icp_locations: icp.targetLocations,
          icp_industries: icp.targetIndustries,
          icp_company_types: icp.companyTypes,
          icp_company_sizes: icp.companySizes,
          icp_exclude_keywords: icp.excludeKeywords,
          precision_mode: precision,
          engagement_keywords: signals.engagementKeywords,
          trigger_top_active: signals.triggerTopActive,
          trigger_job_changes: signals.triggerJobChanges,
          trigger_funded_companies: signals.triggerFundedCompanies,
          influencer_profiles: signals.influencerProfiles,
          competitor_pages: signals.competitorPages,
          pain_points: objectives.painPoints ? objectives.painPoints.split("\n").map(s => s.trim()).filter(Boolean) : [],
          campaign_goal: objectives.campaignGoal,
          message_tone: objectives.messageTone,
          status: initialStatus,
          current_step: 6,
        };

        if (campaignId) {
          const { error } = await supabase
            .from("campaigns")
            .update(fullPayload as any)
            .eq("id", campaignId);
          if (error) throw error;
        } else {
          const { data: inserted, error } = await supabase
            .from("campaigns")
            .insert(fullPayload as any)
            .select("id")
            .single();
          if (error) throw error;
          if (inserted) campaignId = inserted.id;
        }
      } catch (err) {
        console.error("Failed to save campaign:", err);
      }

      // Create AI Signal Agent from the same onboarding data
      try {
        if (userId) {
          const agentPayload = {
            user_id: userId,
            name: `${data.companyName || "My"} Lead Agent`,
            agent_type: "signals",
            status: initialStatus,
            keywords: signals.engagementKeywords || [],
            icp_job_titles: icp.jobTitles,
            icp_locations: icp.targetLocations,
            icp_industries: icp.targetIndustries,
            icp_company_types: icp.companyTypes,
            icp_company_sizes: icp.companySizes,
            icp_exclude_keywords: icp.excludeKeywords,
            precision_mode: precision,
            leads_list_name: `${data.companyName || "Campaign"} Leads`,
            signals_config: {
              triggerTopActive: signals.triggerTopActive,
              triggerJobChanges: signals.triggerJobChanges,
              triggerFundedCompanies: signals.triggerFundedCompanies,
              influencerProfiles: signals.influencerProfiles,
              competitorPages: signals.competitorPages,
            },
          };

          await supabase.from("signal_agents").insert(agentPayload as any);
        }
      } catch (err) {
        console.error("Failed to create signal agent:", err);
      }

      // Mark onboarding complete in profile
      try {
        if (userId) {
          await supabase
            .from("profiles")
            .update({ onboarding_complete: true })
            .eq("user_id", userId);
        }
      } catch (err) {
        console.warn("Failed to update profile onboarding status:", err);
      }

      // Generate discovery keywords for the campaign (one-time, fire-and-forget)
      if (campaignId) {
        try {
          const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
          const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
          const { data: sess } = await supabase.auth.getSession();
          fetch(`${SUPABASE_URL}/functions/v1/generate-discovery-keywords`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${sess?.session?.access_token || ANON_KEY}`,
            },
            body: JSON.stringify({ campaign_id: campaignId }),
          }).catch((err) => console.warn("generate-keywords fire-and-forget error:", err));
        } catch (err) {
          console.warn("generate-keywords trigger error:", err);
        }
      }

      // Trigger lead scoring (fire-and-forget)
      if (campaignId) {
        try {
          const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
          const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
          fetch(`${SUPABASE_URL}/functions/v1/score-leads`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${ANON_KEY}`,
            },
            body: JSON.stringify({ campaign_id: campaignId }),
          }).catch((err) => console.warn("score-leads fire-and-forget error:", err));
        } catch (err) {
          console.warn("score-leads trigger error:", err);
        }
      }

      // Trigger lead discovery (fire-and-forget) — only if campaign is active
      if (campaignId && initialStatus === "active") {
        try {
          const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
          const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
          const { data: sess } = await supabase.auth.getSession();
          fetch(`${SUPABASE_URL}/functions/v1/discover-leads`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${sess?.session?.access_token || ANON_KEY}`,
            },
            body: JSON.stringify({}),
          }).catch((err) => console.warn("discover-leads fire-and-forget error:", err));
        } catch (err) {
          console.warn("discover-leads trigger error:", err);
        }
      }

      await new Promise((res) => setTimeout(res, 5000));
      window.location.href = "/dashboard";
    }

    saveAndRedirect();
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: "hsl(195 14% 95%)" }}
    >
      {/* Logo */}
      <a href="/" className="flex items-center gap-2 mb-10">
        <img src={intentslyIcon} alt="Intentsly" className="h-8 object-contain" />
        <span className="text-xl font-bold tracking-tight text-foreground">Intentsly</span>
      </a>

      {/* Card */}
      <div
        className="w-full max-w-[600px] rounded-3xl bg-card border-2 border-background px-10 py-16 flex flex-col items-center text-center animate-fade-in"
        style={{ boxShadow: "0 8px 40px hsl(220 14% 10% / 0.08)" }}
      >
        {/* Brain icon */}
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mb-8 text-foreground"
          style={{
            background: "hsl(0 0% 96%)",
            border: "2px solid hsl(0 0% 100%)",
            animation: "brain-breathe 2.2s ease-in-out infinite",
          }}
        >
          <BrainIcon />
        </div>

        <h1
          className="text-xl font-normal tracking-tight mb-3 max-w-xs"
          style={{ color: "hsl(var(--foreground))" }}
        >
          Your Campaign and Leads Agent are getting ready
        </h1>
        <p
          className="text-sm leading-relaxed mb-8 max-w-sm"
          style={{ color: "hsl(var(--muted-foreground))" }}
        >
          AI is crafting personalized messages and sequences based on your
          agent's ICP and campaign goals…
        </p>

        <LoadingDots />
      </div>
    </div>
  );
};
