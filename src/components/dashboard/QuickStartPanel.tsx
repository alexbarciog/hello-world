import { useNavigate } from "react-router-dom";
import { Check, Zap, Sparkles, ArrowRight } from "lucide-react";

interface QuickStartStep {
  label: string;
  desc: string;
  done: boolean;
  href: string;
}

interface QuickStartPanelProps {
  steps: QuickStartStep[];
}

export function QuickStartPanel({ steps }: QuickStartPanelProps) {
  const navigate = useNavigate();
  const completedSteps = steps.filter((s) => s.done).length;
  const allDone = completedSteps === steps.length;

  if (allDone) {
    return (
      <div className="glass-card rounded-[2rem] p-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
          <Check className="w-5 h-5" strokeWidth={3} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-md-on-surface">Setup complete</h3>
          <p className="text-xs text-md-on-surface-variant">All onboarding steps finished</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-[2rem] p-6 md:p-8 flex flex-col">
      <div className="mb-8">
        <h2 className="text-xl font-bold text-md-on-surface tracking-tight">Quick Start Guide</h2>
        <p className="text-xs text-md-on-surface-variant font-medium mt-1 uppercase tracking-widest">
          {completedSteps}/{steps.length} completed
        </p>
      </div>
      <div className="space-y-6 flex-grow">
        {steps.map((step) => (
          <div
            key={step.label}
            onClick={() => !step.done && navigate(step.href)}
            className={`flex items-center gap-4 group ${step.done ? "" : "cursor-pointer"}`}
          >
            <div className="flex-shrink-0">
              {step.done ? (
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 transition-all group-hover:scale-110">
                  <Check className="w-4 h-4" strokeWidth={3} />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-md-surface-container flex items-center justify-center text-md-on-surface-variant border-2 border-md-primary/20 transition-all group-hover:shadow-[0_0_15px_hsla(var(--md-primary)/0.2)]">
                  <Zap className="w-4 h-4" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <h4 className={`text-sm font-bold ${step.done ? "text-md-on-surface line-through opacity-50" : "text-md-on-surface"}`}>
                {step.label}
              </h4>
              <p className={`text-xs ${step.done ? "text-md-on-surface-variant" : "text-md-tertiary font-bold"}`}>
                {step.desc}
              </p>
            </div>
            {!step.done && <ArrowRight className="w-4 h-4 text-md-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity" />}
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-md-primary/5 rounded-2xl border border-md-primary/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-md-primary/15 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-md-primary" />
          </div>
          <p className="text-xs font-medium text-md-primary leading-tight">
            Pro tip: Connect LinkedIn first to unlock AI-powered lead discovery.
          </p>
        </div>
      </div>
    </div>
  );
}
