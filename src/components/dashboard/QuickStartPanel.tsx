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
    <div className="snow-card p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Quick Start</h3>
        <span className="text-xs text-gray-400 tabular-nums">
          {completedSteps}/{steps.length}
        </span>
      </div>

      {allDone ? (
        <div className="flex items-center justify-center py-6">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
              <Check className="w-5 h-5 text-emerald-500" />
            </div>
            <p className="text-sm font-medium text-gray-900">All set!</p>
            <p className="text-xs text-gray-400">Setup complete</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col">
          {steps.map((step, i) => (
            <button
              key={i}
              onClick={() => !step.done && navigate(step.href)}
              disabled={step.done}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-colors ${
                step.done ? "opacity-50" : "hover:bg-gray-50 cursor-pointer"
              }`}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${step.done ? "bg-emerald-100 text-emerald-600" : "bg-gray-100 text-gray-500"}`}>
                {step.done ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <span>{i + 1}</span>
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <span className={`text-sm font-medium ${step.done ? "line-through text-gray-400" : "text-gray-900"}`}>
                  {step.label}
                </span>
                <span className="text-xs text-gray-400 truncate">{step.desc}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
