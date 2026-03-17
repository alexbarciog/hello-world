import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  INITIAL_ONBOARDING_DATA,
  type OnboardingData,
} from "@/components/onboarding/types";
import { INITIAL_ICP, type ICPData } from "@/components/onboarding/Step3ICP";
import {
  INITIAL_INTENT_SIGNALS,
  type IntentSignalsData,
} from "@/components/onboarding/Step5IntentSignals";
import {
  INITIAL_OBJECTIVES,
  type ObjectivesData,
} from "@/components/onboarding/Step6Objectives";
import type { PrecisionMode } from "@/components/onboarding/Step4Precision";

// ─── Session ID ───────────────────────────────────────────────────────────────

const SESSION_KEY = "goji_session_id";

function getOrCreateSessionId(): string {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export type OnboardingStep = 1 | 2 | 3 | 4 | 5 | 6;

type OnboardingContextValue = {
  // State
  currentStep: OnboardingStep;
  data: OnboardingData;
  icp: ICPData;
  precision: PrecisionMode;
  signals: IntentSignalsData;
  objectives: ObjectivesData;
  campaignId: string | null;
  saveStatus: SaveStatus;
  isLoadingDraft: boolean;

  // Mutators
  setCurrentStep: (step: OnboardingStep) => void;
  patch: (p: Partial<OnboardingData>) => void;
  patchIcp: (p: Partial<ICPData>) => void;
  setPrecision: (m: PrecisionMode) => void;
  patchSignals: (p: Partial<IntentSignalsData>) => void;
  patchObjectives: (p: Partial<ObjectivesData>) => void;

  // Persistence
  saveCurrentStep: (
    step: OnboardingStep,
    nextStep: OnboardingStep,
    overrideData?: {
      data?: OnboardingData;
      icp?: ICPData;
      precision?: PrecisionMode;
      signals?: IntentSignalsData;
      objectives?: ObjectivesData;
    }
  ) => Promise<void>;
};

// ─── Context ──────────────────────────────────────────────────────────────────

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error("useOnboarding must be used within OnboardingProvider");
  return ctx;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const sessionId = useRef(getOrCreateSessionId());

  const [currentStep, setCurrentStep] = useState<OnboardingStep>(1);
  const [data, setData] = useState<OnboardingData>(INITIAL_ONBOARDING_DATA);
  const [icp, setIcp] = useState<ICPData>(INITIAL_ICP);
  const [precision, setPrecision] = useState<PrecisionMode>("discovery");
  const [signals, setSignals] = useState<IntentSignalsData>(INITIAL_INTENT_SIGNALS);
  const [objectives, setObjectives] = useState<ObjectivesData>(INITIAL_OBJECTIVES);
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [isLoadingDraft, setIsLoadingDraft] = useState(true);

  // ── Load draft on mount ───────────────────────────────────────────────────

  useEffect(() => {
    async function loadDraft() {
      try {
        const { data: rows, error } = await supabase
          .from("campaigns")
          .select("*")
          .eq("session_id", sessionId.current)
          .eq("status", "draft")
          .order("updated_at", { ascending: false })
          .limit(1);

        if (error || !rows || rows.length === 0) return;

        const row = rows[0];
        setCampaignId(row.id);
        setCurrentStep((row.current_step as OnboardingStep) ?? 1);

        // Hydrate step data
        if (row.step_1_data) {
          const s1 = row.step_1_data as Partial<OnboardingData>;
          setData((prev) => ({ ...prev, ...s1 }));
        }
        if (row.step_2_data) {
          const s2 = row.step_2_data as Partial<OnboardingData>;
          setData((prev) => ({ ...prev, ...s2 }));
        }
        if (row.step_3_data) {
          setIcp(row.step_3_data as ICPData);
        }
        if (row.step_4_data) {
          const s4 = row.step_4_data as { precision: PrecisionMode };
          setPrecision(s4.precision ?? "discovery");
        }
        if (row.step_5_data) {
          setSignals(row.step_5_data as IntentSignalsData);
        }
        if (row.step_6_data) {
          setObjectives(row.step_6_data as ObjectivesData);
        }
      } catch (err) {
        console.warn("Failed to load draft:", err);
      } finally {
        setIsLoadingDraft(false);
      }
    }

    loadDraft();
  }, []);

  // ── Mutators ─────────────────────────────────────────────────────────────

  const patch = useCallback(
    (p: Partial<OnboardingData>) => setData((prev) => ({ ...prev, ...p })),
    []
  );
  const patchIcp = useCallback(
    (p: Partial<ICPData>) => setIcp((prev) => ({ ...prev, ...p })),
    []
  );
  const patchSignals = useCallback(
    (p: Partial<IntentSignalsData>) => setSignals((prev) => ({ ...prev, ...p })),
    []
  );
  const patchObjectives = useCallback(
    (p: Partial<ObjectivesData>) => setObjectives((prev) => ({ ...prev, ...p })),
    []
  );

  // ── Persistence ───────────────────────────────────────────────────────────

  const saveCurrentStep = useCallback(
    async (
      step: OnboardingStep,
      nextStep: OnboardingStep,
      overrideData?: {
        data?: OnboardingData;
        icp?: ICPData;
        precision?: PrecisionMode;
        signals?: IntentSignalsData;
        objectives?: ObjectivesData;
      }
    ) => {
      setSaveStatus("saving");

      const d = overrideData?.data ?? data;
      const i = overrideData?.icp ?? icp;
      const pr = overrideData?.precision ?? precision;
      const si = overrideData?.signals ?? signals;
      const ob = overrideData?.objectives ?? objectives;

      // Build step-specific payload
      const stepPayload: Record<string, unknown> = {};
      if (step === 1) {
        stepPayload.step_1_data = {
          website: d.website,
          companyName: d.companyName,
          description: d.description,
          industry: d.industry,
          language: d.language,
        };
        // Mirror into flat columns too (for StepComplete compatibility)
        stepPayload.website = d.website;
        stepPayload.company_name = d.companyName;
        stepPayload.description = d.description;
        stepPayload.industry = d.industry;
        stepPayload.language = d.language;
      } else if (step === 2) {
        stepPayload.step_2_data = {
          country: d.country,
          linkedinConnectionType: d.linkedinConnectionType,
        };
        stepPayload.country = d.country;
        stepPayload.linkedin_connection_type = d.linkedinConnectionType || null;
      } else if (step === 3) {
        stepPayload.step_3_data = i;
        stepPayload.icp_job_titles = i.jobTitles;
        stepPayload.icp_locations = i.targetLocations;
        stepPayload.icp_industries = i.targetIndustries;
        stepPayload.icp_company_types = i.companyTypes;
        stepPayload.icp_company_sizes = i.companySizes;
        stepPayload.icp_exclude_keywords = i.excludeKeywords;
      } else if (step === 4) {
        stepPayload.step_4_data = { precision: pr };
        stepPayload.precision_mode = pr;
      } else if (step === 5) {
        stepPayload.step_5_data = si;
        stepPayload.engagement_keywords = si.engagementKeywords;
        stepPayload.trigger_top_active = si.triggerTopActive;
        stepPayload.trigger_job_changes = si.triggerJobChanges;
        stepPayload.trigger_funded_companies = si.triggerFundedCompanies;
        stepPayload.influencer_profiles = si.influencerProfiles;
        stepPayload.competitor_pages = si.competitorPages;
      } else if (step === 6) {
        stepPayload.step_6_data = ob;
        stepPayload.pain_points = ob.painPoints;
        stepPayload.campaign_goal = ob.campaignGoal;
        stepPayload.message_tone = ob.messageTone;
      }

      try {
        if (campaignId) {
          // UPDATE existing draft
          const { error } = await supabase
            .from("campaigns")
            .update({
              current_step: nextStep,
              status: "draft",
              ...stepPayload,
            })
            .eq("id", campaignId);

          if (error) throw error;
        } else {
          // INSERT new draft
          const { data: inserted, error } = await supabase
            .from("campaigns")
            .insert({
              session_id: sessionId.current,
              current_step: nextStep,
              status: "draft",
              ...stepPayload,
            })
            .select("id")
            .single();

          if (error) throw error;
          if (inserted) setCampaignId(inserted.id);
        }

        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2500);
      } catch (err) {
        console.error("Auto-save failed:", err);
        setSaveStatus("error");
        setTimeout(() => setSaveStatus("idle"), 3000);
      }
    },
    [campaignId, data, icp, precision, signals, objectives]
  );

  return (
    <OnboardingContext.Provider
      value={{
        currentStep,
        data,
        icp,
        precision,
        signals,
        objectives,
        campaignId,
        saveStatus,
        isLoadingDraft,
        setCurrentStep,
        patch,
        patchIcp,
        setPrecision,
        patchSignals,
        patchObjectives,
        saveCurrentStep,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}
