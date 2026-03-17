import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { OnboardingData } from "./types";
import type { ICPData } from "./Step3ICP";
import type { PrecisionMode } from "./Step4Precision";
import type { IntentSignalsData } from "./Step5IntentSignals";
import type { ObjectivesData } from "./Step6Objectives";

// ─── Brain SVG ────────────────────────────────────────────────────────────────

const BrainIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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
        className="w-2 h-2 rounded-full"
        style={{
          background: "hsl(var(--goji-coral) / 0.5)",
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
        50% { transform: scale(1.1); }
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
  /** If provided, update this existing draft campaign instead of inserting a new one */
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
      let campaignId: string | null = existingCampaignId ?? null;

      try {
        const fullPayload = {
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
          pain_points: objectives.painPoints,
          campaign_goal: objectives.campaignGoal,
          message_tone: objectives.messageTone,
          status: "active",
          current_step: 6,
        };

        if (campaignId) {
          // Update the existing draft campaign to active
          const { error } = await supabase
            .from("campaigns")
            .update(fullPayload)
            .eq("id", campaignId);

          if (error) throw error;
        } else {
          // Fallback: insert a new campaign
          const { data: inserted, error } = await supabase
            .from("campaigns")
            .insert(fullPayload)
            .select("id")
            .single();

          if (error) throw error;
          if (inserted) campaignId = inserted.id;
        }
      } catch (err) {
        console.error("Failed to save campaign:", err);
      }

      // Mark onboarding complete in profile
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.id) {
          await supabase
            .from("profiles")
            .update({ onboarding_complete: true })
            .eq("user_id", session.user.id);
        }
      } catch (err) {
        console.warn("Failed to update profile onboarding status:", err);
      }

      // 2. Trigger lead scoring (fire-and-forget)
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

      // 3. Minimum display time
      await new Promise((res) => setTimeout(res, 4000));

      const dest = "/dashboard";
      window.location.href = dest;
    }

    saveAndRedirect();
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{
        background:
          "radial-gradient(ellipse 90% 70% at 50% 0%, hsl(5 85% 95%) 0%, hsl(20 90% 96%) 40%, hsl(0 0% 100%) 80%)",
      }}
    >
      {/* Card */}
      <div
        className="w-full max-w-[640px] rounded-2xl bg-card border border-border px-10 py-16 flex flex-col items-center text-center animate-fade-in"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        {/* Brain icon */}
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mb-8"
          style={{
            background: "linear-gradient(135deg, hsl(340 85% 68%), hsl(5 90% 62%))",
            boxShadow: "0 8px 32px hsl(5 90% 62% / 0.35)",
            animation: "brain-breathe 2.2s ease-in-out infinite",
          }}
        >
          <BrainIcon />
        </div>

        {/* Text */}
        <h1
          className="text-xl font-bold tracking-tight mb-3 max-w-xs"
          style={{ color: "hsl(var(--goji-dark))" }}
        >
          Your Campaign and Leads Agent are getting ready
        </h1>
        <p
          className="text-sm leading-relaxed mb-8 max-w-sm"
          style={{ color: "hsl(var(--goji-text-muted))" }}
        >
          AI is crafting personalized messages and sequences based on your
          agent's ICP and campaign goals…
        </p>

        {/* Loading dots */}
        <LoadingDots />
      </div>
    </div>
  );
};
