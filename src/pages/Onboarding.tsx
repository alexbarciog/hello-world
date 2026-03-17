import { useState, useRef } from "react";
import gojiIcon from "@/assets/gojiberry-icon.png";
import { OnboardingProgressBar } from "@/components/onboarding/OnboardingProgressBar";
import { Step1Website } from "@/components/onboarding/Step1Website";
import { Step2LinkedIn } from "@/components/onboarding/Step2LinkedIn";
import { Step3ICP } from "@/components/onboarding/Step3ICP";
import { Step4Precision } from "@/components/onboarding/Step4Precision";
import { Step5IntentSignals } from "@/components/onboarding/Step5IntentSignals";
import { Step6Objectives } from "@/components/onboarding/Step6Objectives";
import { StepComplete } from "@/components/onboarding/StepComplete";
import { markOnboardingComplete, OnboardingEntryGuard } from "@/components/OnboardingGuard";
import { OnboardingProvider, useOnboarding } from "@/contexts/OnboardingContext";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import type { OnboardingStep } from "@/contexts/OnboardingContext";

// ─── Draft Saved Indicator ───────────────────────────────────────────────────

function DraftIndicator() {
  const { saveStatus } = useOnboarding();

  if (saveStatus === "idle") return null;

  const config = {
    saving: {
      icon: <Loader2 className="w-3 h-3 animate-spin" />,
      text: "Saving…",
      color: "hsl(var(--goji-text-muted))",
    },
    saved: {
      icon: <CheckCircle2 className="w-3 h-3" />,
      text: "Draft saved",
      color: "hsl(142 71% 45%)",
    },
    error: {
      icon: <AlertCircle className="w-3 h-3" />,
      text: "Save failed",
      color: "hsl(0 72% 51%)",
    },
  }[saveStatus];

  if (!config) return null;

  return (
    <div
      className="flex items-center gap-1.5 text-xs font-medium transition-all duration-300 animate-fade-in"
      style={{ color: config.color }}
    >
      {config.icon}
      {config.text}
    </div>
  );
}

// ─── Inner Page ──────────────────────────────────────────────────────────────

function OnboardingInner() {
  const {
    currentStep,
    setCurrentStep,
    data,
    icp,
    precision,
    signals,
    objectives,
    patch,
    patchIcp,
    setPrecision,
    patchSignals,
    patchObjectives,
    saveCurrentStep,
    isLoadingDraft,
    campaignId,
  } = useOnboarding();

  const [showComplete, setShowComplete] = useState(false);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [transitioning, setTransitioning] = useState(false);
  const pendingStep = useRef<OnboardingStep>(1);

  function transition(to: OnboardingStep, dir: "forward" | "backward") {
    if (transitioning) return;
    pendingStep.current = to;
    setDirection(dir);
    setTransitioning(true);
    setTimeout(() => {
      setCurrentStep(to);
      setTransitioning(false);
    }, 320);
  }

  async function handleNext() {
    if (currentStep === 6) {
      await saveCurrentStep(6, 6);
      markOnboardingComplete();
      setShowComplete(true);
      return;
    }

    const next = (currentStep + 1) as OnboardingStep;
    await saveCurrentStep(currentStep, next);
    transition(next, "forward");
  }

  async function handlePrev() {
    if (currentStep === 1) return;
    const prev = (currentStep - 1) as OnboardingStep;
    await saveCurrentStep(currentStep, prev);
    transition(prev, "backward");
  }

  const exitTranslate = direction === "forward" ? "-100%" : "100%";
  const isWide = currentStep === 3 || currentStep === 5;

  if (isLoadingDraft) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          background:
            "radial-gradient(ellipse 90% 70% at 50% 0%, hsl(5 85% 95%) 0%, hsl(20 90% 96%) 40%, hsl(0 0% 100%) 80%)",
        }}
      >
        <div className="flex flex-col items-center gap-3">
          <Loader2
            className="w-8 h-8 animate-spin"
            style={{ color: "hsl(var(--goji-coral))" }}
          />
          <p className="text-sm" style={{ color: "hsl(var(--goji-text-muted))" }}>
            Loading your progress…
          </p>
        </div>
      </div>
    );
  }

  if (showComplete) {
    return (
      <StepComplete
        data={data}
        icp={icp}
        precision={precision}
        signals={signals}
        objectives={objectives}
        existingCampaignId={campaignId}
      />
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{
        background:
          "radial-gradient(ellipse 90% 70% at 50% 0%, hsl(5 85% 95%) 0%, hsl(20 90% 96%) 40%, hsl(0 0% 100%) 80%)",
      }}
    >
      {/* Logo */}
      <a href="/" className="flex items-center gap-2.5 mb-10">
        <img src={gojiIcon} alt="Gojiberry" className="w-8 h-8 object-contain" />
        <span
          className="font-bold text-xl tracking-tight"
          style={{ color: "hsl(var(--goji-dark))" }}
        >
          gojiberry
        </span>
      </a>

      {/* Card */}
      <div
        className="w-full rounded-2xl bg-card border border-border overflow-hidden transition-all duration-500"
        style={{
          maxWidth: isWide ? "780px" : "600px",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <div className="p-8 md:p-10">
          {/* Progress + Draft indicator row */}
          <div className="flex items-center justify-between mb-1">
            <div className="flex-1">
              <OnboardingProgressBar step={currentStep} />
            </div>
            <div className="ml-4 min-w-[90px] flex justify-end">
              <DraftIndicator />
            </div>
          </div>

          {currentStep === 1 && (
            <div className="mb-8 mt-2">
              <h1
                className="text-2xl font-bold tracking-tight mb-2"
                style={{ color: "hsl(var(--goji-dark))" }}
              >
                Create your first AI campaign
              </h1>
              <p
                className="text-sm leading-relaxed"
                style={{ color: "hsl(var(--goji-text-muted))" }}
              >
                We'll use your website and AI to generate it automatically
              </p>
            </div>
          )}

          <div className="relative overflow-hidden">
            <div
              className="transition-all duration-300 ease-in-out"
              style={{
                transform: transitioning ? `translateX(${exitTranslate})` : "translateX(0%)",
                opacity: transitioning ? 0 : 1,
              }}
            >
              {currentStep === 1 && (
                <Step1Website data={data} onChange={patch} onNext={handleNext} />
              )}
              {currentStep === 2 && (
                <Step2LinkedIn data={data} onChange={patch} onNext={handleNext} onPrev={handlePrev} />
              )}
              {currentStep === 3 && (
                <Step3ICP
                  data={data}
                  icp={icp}
                  onICPChange={patchIcp}
                  onNext={handleNext}
                  onPrev={handlePrev}
                />
              )}
              {currentStep === 4 && (
                <Step4Precision
                  precision={precision}
                  onPrecisionChange={setPrecision}
                  onNext={handleNext}
                  onPrev={handlePrev}
                />
              )}
              {currentStep === 5 && (
                <Step5IntentSignals
                  data={data}
                  icp={icp}
                  signals={signals}
                  onSignalsChange={patchSignals}
                  onNext={handleNext}
                  onPrev={handlePrev}
                />
              )}
              {currentStep === 6 && (
                <Step6Objectives
                  data={data}
                  icp={icp}
                  objectives={objectives}
                  onObjectivesChange={patchObjectives}
                  onNext={handleNext}
                  onPrev={handlePrev}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page Export (wraps with provider + entry guard) ──────────────────────────

export default function OnboardingPage() {
  return (
    <OnboardingEntryGuard>
      <OnboardingProvider>
        <OnboardingInner />
      </OnboardingProvider>
    </OnboardingEntryGuard>
  );
}
