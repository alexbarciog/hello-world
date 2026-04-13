import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";

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

  return (
    <div className="bg-snow-bg-2 rounded-[20px] p-4 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-900">Quick Start</h2>
        <span className="text-xs text-gray-400">{completedSteps}/{steps.length}</span>
      </div>

      {allDone ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-2">
              <Check className="w-5 h-5 text-emerald-500" />
            </div>
            <p className="text-sm font-medium text-gray-900">All set!</p>
            <p className="text-xs text-gray-400 mt-0.5">Setup complete</p>
          </div>
        </div>
      ) : (
        <div className="space-y-0.5 flex-1">
          {steps.map((step, i) => (
            <button
              key={step.label}
              onClick={() => !step.done && navigate(step.href)}
              disabled={step.done}
              className={`w-full flex items-center gap-3 px-2 py-2 rounded-xl text-left transition-colors ${
                step.done
                  ? "opacity-50"
                  : "hover:bg-gray-50 cursor-pointer"
              }`}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                step.done
                  ? "bg-emerald-50 text-emerald-500"
                  : "bg-gray-100 text-gray-400"
              }`}>
                {step.done ? (
                  <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                ) : (
                  <span className="text-[11px] font-medium">{i + 1}</span>
                )}
              </div>
              <div className="min-w-0">
                <p className={`text-[13px] font-medium ${step.done ? "text-gray-400 line-through" : "text-gray-900"}`}>
                  {step.label}
                </p>
                <p className="text-[11px] text-gray-400 truncate">{step.desc}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
