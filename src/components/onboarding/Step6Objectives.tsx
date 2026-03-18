import { useState, useEffect, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CardShell } from "./CardShell";
import { OnboardingNav } from "./OnboardingNav";
import type { OnboardingData } from "./types";
import type { ICPData } from "./Step3ICP";

// ─── Types ────────────────────────────────────────────────────────────────────

export type CampaignGoal = "warm_prospects" | "sales_calls";
export type MessageTone = "professional" | "conversational" | "direct";

export type ObjectivesData = {
  painPoints: string;
  campaignGoal: CampaignGoal;
  messageTone: MessageTone;
};

export const INITIAL_OBJECTIVES: ObjectivesData = {
  painPoints: "",
  campaignGoal: "warm_prospects",
  messageTone: "professional",
};

// ─── Tone cards ───────────────────────────────────────────────────────────────

const TONES: { value: MessageTone; label: string; sub: string }[] = [
  { value: "professional", label: "Professional", sub: "Formal, polished" },
  { value: "conversational", label: "Conversational", sub: "Friendly, casual" },
  { value: "direct", label: "Direct", sub: "Bold, confident" },
];

const GOALS: { value: CampaignGoal; label: string; sub: string }[] = [
  {
    value: "warm_prospects",
    label: "Start conversations with warm prospects",
    sub: "Build relationships and nurture leads through personalized conversations",
  },
  {
    value: "sales_calls",
    label: "Book qualified sales calls/demos",
    sub: "Direct approach to schedule meetings and product demonstrations",
  },
];

// ─── Main Component ───────────────────────────────────────────────────────────

type Props = {
  data: OnboardingData;
  icp: ICPData;
  objectives: ObjectivesData;
  onObjectivesChange: (patch: Partial<ObjectivesData>) => void;
  onNext: () => void;
  onPrev: () => void;
};

export const Step6Objectives = ({
  data,
  icp,
  objectives,
  onObjectivesChange,
  onNext,
  onPrev,
}: Props) => {
  const [loadingPains, setLoadingPains] = useState(false);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    if (!data.description && !data.industry) return;
    if (objectives.painPoints) return;
    hasFetched.current = true;
    generatePainPoints();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function generatePainPoints() {
    setLoadingPains(true);
    try {
      const { data: fnData, error } = await supabase.functions.invoke("generate-pain-points", {
        body: {
          companyName: data.companyName,
          industry: data.industry,
          description: data.description,
          jobTitles: icp.jobTitles,
          targetIndustries: icp.targetIndustries,
        },
      });
      if (error) throw error;
      const result = fnData as { painPoints?: string[] };
      if (result.painPoints?.length) {
        onObjectivesChange({ painPoints: result.painPoints.map((p) => `- ${p}`).join("\n") });
      }
    } catch (err) {
      console.error("Pain points generation failed:", err);
    } finally {
      setLoadingPains(false);
    }
  }

  const canProceed = !!objectives.painPoints.trim() || !loadingPains;

  return (
    <div>
      {/* Header */}
      <div className="text-center mb-8">
        <h1
          className="text-2xl font-normal tracking-tight mb-1.5"
          style={{ color: "hsl(var(--foreground))" }}
        >
          Define Your Objectives
        </h1>
        <p className="text-sm leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>
          We'll craft your campaign around your goals and your audience's key pain points.
        </p>
      </div>

      <div className="space-y-5">
        {/* Pain Points */}
        <CardShell className="animate-fade-in-up">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium" style={{ color: "hsl(var(--foreground))" }}>
              Pain Points
            </Label>
            <div className="relative">
              <textarea
                value={objectives.painPoints}
                onChange={(e) => onObjectivesChange({ painPoints: e.target.value })}
                placeholder={
                  loadingPains
                    ? "Generating pain points with AI…"
                    : "- Describe your audience's key challenges\n- Add one per line"
                }
                disabled={loadingPains}
                rows={4}
                className="flex w-full rounded-xl border border-border bg-background px-4 py-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 resize-none transition-all duration-200"
              />
              {loadingPains && (
                <div className="absolute right-3 top-3">
                  <Loader2 className="w-4 h-4 animate-spin" style={{ color: "hsl(var(--goji-orange))" }} />
                </div>
              )}
            </div>
          </div>
        </CardShell>

        {/* Campaign Goal */}
        <div className="space-y-2 animate-fade-in-up" style={{ animationDelay: "0.05s" }}>
          <Label className="text-sm font-medium" style={{ color: "hsl(var(--foreground))" }}>
            Campaign Goal
          </Label>
          <div className="space-y-2.5">
            {GOALS.map((goal) => {
              const selected = objectives.campaignGoal === goal.value;
              return (
                <button
                  key={goal.value}
                  type="button"
                  onClick={() => onObjectivesChange({ campaignGoal: goal.value })}
                  className="w-full text-left rounded-3xl px-5 py-4 transition-all duration-200 border-2"
                  style={{
                    borderColor: selected ? "hsl(0 0% 0%)" : "hsl(0 0% 100%)",
                    background: selected ? "hsl(0 0% 96%)" : "hsl(0 0% 96%)",
                    opacity: selected ? 1 : 0.7,
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-150"
                      style={{ borderColor: selected ? "hsl(0 0% 0%)" : "hsl(var(--border))" }}
                    >
                      {selected && (
                        <div className="w-2 h-2 rounded-full" style={{ background: "hsl(0 0% 0%)" }} />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>
                        {goal.label}
                      </p>
                      <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>
                        {goal.sub}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Message Tone */}
        <div className="space-y-2 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
          <Label className="text-sm font-medium" style={{ color: "hsl(var(--foreground))" }}>
            Message Tone
          </Label>
          <div className="grid grid-cols-3 gap-2.5">
            {TONES.map((tone) => {
              const selected = objectives.messageTone === tone.value;
              return (
                <button
                  key={tone.value}
                  type="button"
                  onClick={() => onObjectivesChange({ messageTone: tone.value })}
                  className="text-left rounded-3xl px-4 py-3.5 transition-all duration-200 border-2"
                  style={{
                    borderColor: selected ? "hsl(0 0% 0%)" : "hsl(0 0% 100%)",
                    background: "hsl(0 0% 96%)",
                    opacity: selected ? 1 : 0.7,
                  }}
                >
                  <div className="flex items-center gap-2 mb-0.5">
                    <div
                      className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-150"
                      style={{ borderColor: selected ? "hsl(0 0% 0%)" : "hsl(var(--border))" }}
                    >
                      {selected && (
                        <div className="w-2 h-2 rounded-full" style={{ background: "hsl(0 0% 0%)" }} />
                      )}
                    </div>
                    <p className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>
                      {tone.label}
                    </p>
                  </div>
                  <p className="text-xs pl-6 leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>
                    {tone.sub}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <OnboardingNav onPrev={onPrev} onNext={onNext} nextDisabled={loadingPains} isLast />
    </div>
  );
};
