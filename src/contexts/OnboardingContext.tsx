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

// ─── Types ────────────────────────────────────────────────────────────────────

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export type OnboardingStep = 1 | 2 | 3 | 4 | 5 | 6;

type OnboardingContextValue = {
  currentStep: OnboardingStep;
  data: OnboardingData;
  icp: ICPData;
  precision: PrecisionMode;
  signals: IntentSignalsData;
  objectives: ObjectivesData;
  campaignId: string | null;
  saveStatus: SaveStatus;
  isLoadingDraft: boolean;

  setCurrentStep: (step: OnboardingStep) => void;
  patch: (p: Partial<OnboardingData>) => void;
  patchIcp: (p: Partial<ICPData>) => void;
  setPrecision: (m: PrecisionMode) => void;
  patchSignals: (p: Partial<IntentSignalsData>) => void;
  patchObjectives: (p: Partial<ObjectivesData>) => void;

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
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(1);
  const [data, setData] = useState<OnboardingData>(INITIAL_ONBOARDING_DATA);
  const [icp, setIcp] = useState<ICPData>(INITIAL_ICP);
  const [precision, setPrecision] = useState<PrecisionMode>("discovery");
  const [signals, setSignals] = useState<IntentSignalsData>(INITIAL_INTENT_SIGNALS);
  const [objectives, setObjectives] = useState<ObjectivesData>(INITIAL_OBJECTIVES);
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [isLoadingDraft, setIsLoadingDraft] = useState(true);

  // Refs to always have latest values in event handlers / timers
  const stateRef = useRef({ currentStep, data, icp, precision, signals, objectives, campaignId });
  useEffect(() => {
    stateRef.current = { currentStep, data, icp, precision, signals, objectives, campaignId };
  }, [currentStep, data, icp, precision, signals, objectives, campaignId]);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLoadingRef = useRef(true);

  // ── Core save fn (works with any state snapshot) ─────────────────────────

  const persistStep = useCallback(async (
    step: OnboardingStep,
    nextStep: OnboardingStep,
    d: OnboardingData,
    i: ICPData,
    pr: PrecisionMode,
    si: IntentSignalsData,
    ob: ObjectivesData,
    existingCampaignId: string | null,
    silent = false,
  ): Promise<string | null> => {
    if (!silent) setSaveStatus("saving");

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      if (!silent) setSaveStatus("error");
      return existingCampaignId;
    }

    const stepPayload: Record<string, unknown> = {};
    if (step === 1) {
      stepPayload.step_1_data = {
        website: d.website,
        companyName: d.companyName,
        description: d.description,
        industry: d.industry,
        language: d.language,
      };
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
      stepPayload.pain_points = ob.painPoints
        ? ob.painPoints.split("\n").map((s) => s.trim()).filter(Boolean)
        : [];
      stepPayload.campaign_goal = ob.campaignGoal;
      stepPayload.message_tone = ob.messageTone;
    }

    try {
      let resultId = existingCampaignId;

      if (existingCampaignId) {
        const { error } = await supabase
          .from("campaigns")
          .update({
            current_step: nextStep,
            status: "draft",
            ...stepPayload,
          } as any)
          .eq("id", existingCampaignId);
        if (error) throw error;
      } else {
        const { data: inserted, error } = await supabase
          .from("campaigns")
          .insert({
            user_id: session.user.id,
            current_step: nextStep,
            status: "draft",
            ...stepPayload,
          } as any)
          .select("id")
          .single();
        if (error) throw error;
        if (inserted) {
          resultId = inserted.id;
          setCampaignId(inserted.id);
        }
      }

      if (!silent) {
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2500);
      }
      return resultId;
    } catch (err) {
      console.error("Auto-save failed:", err);
      if (!silent) {
        setSaveStatus("error");
        setTimeout(() => setSaveStatus("idle"), 3000);
      }
      return existingCampaignId;
    }
  }, []);

  // ── Load draft on mount ───────────────────────────────────────────────────

  useEffect(() => {
    async function loadDraft() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.id) return;

        const { data: rows, error } = await supabase
          .from("campaigns")
          .select("*")
          .eq("user_id", session.user.id)
          .eq("status", "draft")
          .order("updated_at", { ascending: false })
          .limit(1);

        if (error || !rows || rows.length === 0) return;

        const row = rows[0];
        setCampaignId(row.id);
        const savedStep = (row.current_step as OnboardingStep) ?? 1;
        setCurrentStep(savedStep);

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
        isLoadingRef.current = false;
      }
    }

    loadDraft();
  }, []);

  // ── Debounced auto-save on any data change ────────────────────────────────

  useEffect(() => {
    if (isLoadingRef.current) return;

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(() => {
      const { currentStep: cs, data: d, icp: i, precision: pr, signals: si, objectives: ob, campaignId: cid } = stateRef.current;
      // Silent save: no UI indicator to avoid distracting the user mid-typing
      persistStep(cs, cs, d, i, pr, si, ob, cid, true);
    }, 1500);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, icp, precision, signals, objectives]);

  // ── Save on page unload (beforeunload) ────────────────────────────────────

  useEffect(() => {
    function handleBeforeUnload() {
      if (isLoadingRef.current) return;
      // Cancel any pending debounce
      if (debounceTimer.current) clearTimeout(debounceTimer.current);

      const { currentStep: cs, data: d, icp: i, precision: pr, signals: si, objectives: ob, campaignId: cid } = stateRef.current;

      // Use sendBeacon for reliable fire-and-forget on page close
      // We still call persistStep but the browser may or may not await it.
      // As a best-effort, we also attempt a synchronous-ish save.
      persistStep(cs, cs, d, i, pr, si, ob, cid, true);
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [persistStep]);

  // ── Public saveCurrentStep (called on Next/Back) ──────────────────────────

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
      // Cancel pending debounce since we're saving now
      if (debounceTimer.current) clearTimeout(debounceTimer.current);

      const d = overrideData?.data ?? data;
      const i = overrideData?.icp ?? icp;
      const pr = overrideData?.precision ?? precision;
      const si = overrideData?.signals ?? signals;
      const ob = overrideData?.objectives ?? objectives;

      const newId = await persistStep(step, nextStep, d, i, pr, si, ob, campaignId, false);
      if (newId && newId !== campaignId) setCampaignId(newId);
    },
    [campaignId, data, icp, precision, signals, objectives, persistStep]
  );

  // ── Mutators ──────────────────────────────────────────────────────────────

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
