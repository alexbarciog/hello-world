import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
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

// ─── Goal cards ───────────────────────────────────────────────────────────────

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

  // ── AI pain points generation ──────────────────────────────────────────────

  useEffect(() => {
    if (hasFetched.current) return;
    if (!data.description && !data.industry) return;
    if (objectives.painPoints) return; // already set
    hasFetched.current = true;
    generatePainPoints();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function generatePainPoints() {
    setLoadingPains(true);
    try {
      const { data: fnData, error } = await supabase.functions.invoke(
        "generate-pain-points",
        {
          body: {
            companyName: data.companyName,
            industry: data.industry,
            description: data.description,
            jobTitles: icp.jobTitles,
            targetIndustries: icp.targetIndustries,
          },
        }
      );

      if (error) throw error;

      const result = fnData as { painPoints?: string[] };
      if (result.painPoints?.length) {
        onObjectivesChange({
          painPoints: result.painPoints.map((p) => `- ${p}`).join("\n"),
        });
      }
    } catch (err) {
      console.error("Pain points generation failed:", err);
    } finally {
      setLoadingPains(false);
    }
  }

  const canProceed = !!objectives.painPoints.trim() || !loadingPains;

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Header */}
      <div className="text-center mb-8">
        <h1
          className="text-2xl font-bold tracking-tight mb-1.5"
          style={{ color: "hsl(var(--goji-dark))" }}
        >
          Define Your Objectives
        </h1>
        <p
          className="text-sm leading-relaxed"
          style={{ color: "hsl(var(--goji-text-muted))" }}
        >
          We'll craft your campaign around your goals and your audience's key pain points.
        </p>
      </div>

      <div className="space-y-6">
        {/* Pain Points */}
        <div className="space-y-1.5">
          <Label
            className="text-sm font-medium"
            style={{ color: "hsl(var(--goji-dark))" }}
          >
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
                <Loader2
                  className="w-4 h-4 animate-spin"
                  style={{ color: "hsl(var(--goji-orange))" }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Campaign Goal */}
        <div className="space-y-2">
          <Label
            className="text-sm font-medium"
            style={{ color: "hsl(var(--goji-dark))" }}
          >
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
                  className="w-full text-left rounded-xl px-4 py-3.5 transition-all duration-150"
                  style={{
                    border: selected
                      ? "1.5px solid hsl(var(--goji-coral))"
                      : "1.5px solid hsl(var(--border))",
                    background: selected
                      ? "hsl(var(--goji-coral) / 0.03)"
                      : "hsl(var(--background))",
                  }}
                >
                  <div className="flex items-start gap-3">
                    {/* Radio dot */}
                    <div
                      className="mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-150"
                      style={{
                        borderColor: selected
                          ? "hsl(221 83% 53%)"
                          : "hsl(var(--border))",
                      }}
                    >
                      {selected && (
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ background: "hsl(221 83% 53%)" }}
                        />
                      )}
                    </div>
                    <div>
                      <p
                        className="text-sm font-semibold"
                        style={{ color: "hsl(var(--goji-dark))" }}
                      >
                        {goal.label}
                      </p>
                      <p
                        className="text-xs mt-0.5 leading-relaxed"
                        style={{ color: "hsl(var(--goji-text-muted))" }}
                      >
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
        <div className="space-y-2">
          <Label
            className="text-sm font-medium"
            style={{ color: "hsl(var(--goji-dark))" }}
          >
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
                  className="text-left rounded-xl px-4 py-3.5 transition-all duration-150"
                  style={{
                    border: selected
                      ? "1.5px solid hsl(var(--goji-coral))"
                      : "1.5px solid hsl(var(--border))",
                    background: selected
                      ? "hsl(var(--goji-coral) / 0.03)"
                      : "hsl(var(--background))",
                  }}
                >
                  <div className="flex items-center gap-2 mb-0.5">
                    <div
                      className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-150"
                      style={{
                        borderColor: selected
                          ? "hsl(221 83% 53%)"
                          : "hsl(var(--border))",
                      }}
                    >
                      {selected && (
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ background: "hsl(221 83% 53%)" }}
                        />
                      )}
                    </div>
                    <p
                      className="text-sm font-semibold"
                      style={{ color: "hsl(var(--goji-dark))" }}
                    >
                      {tone.label}
                    </p>
                  </div>
                  <p
                    className="text-xs pl-6 leading-relaxed"
                    style={{ color: "hsl(var(--goji-text-muted))" }}
                  >
                    {tone.sub}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between border-t border-border pt-5 mt-7">
        <button
          type="button"
          onClick={onPrev}
          className="flex items-center gap-1.5 text-sm font-medium transition-opacity hover:opacity-70"
          style={{ color: "hsl(var(--goji-text-muted))" }}
        >
          <ArrowLeft className="w-4 h-4" />
          Previous
        </button>

        <Button
          type="button"
          onClick={onNext}
          disabled={loadingPains}
          className="h-11 px-8 rounded-xl font-semibold text-sm transition-all duration-200 hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40"
          style={{
            background: "hsl(var(--goji-berry))",
            color: "hsl(0 0% 100%)",
            boxShadow: "0 4px 20px 0 hsl(var(--goji-coral) / 0.3)",
          }}
        >
          Next Step
          <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
};
