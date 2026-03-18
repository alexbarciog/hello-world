import { Search, Target, MapPin } from "lucide-react";
import { CardShell } from "./CardShell";
import { OnboardingNav } from "./OnboardingNav";

export type PrecisionMode = "discovery" | "high_precision";

type Props = {
  precision: PrecisionMode;
  onPrecisionChange: (mode: PrecisionMode) => void;
  onNext: () => void;
  onPrev: () => void;
};

const MODES: Record<
  PrecisionMode,
  {
    icon: React.ReactNode;
    label: string;
    sublabel: string;
    description: string;
    color: string;
  }
> = {
  discovery: {
    icon: <Search className="w-4 h-4" />,
    label: "Discovery Mode",
    sublabel: "Discovery Mode – More leads",
    description:
      "The AI will explore a broader range of leads, finding opportunities you wouldn't normally target. Great for discovering new markets.",
    color: "hsl(221 83% 53%)",
  },
  high_precision: {
    icon: <Target className="w-4 h-4" />,
    label: "High Precision",
    sublabel: "High Precision – Fewer, better leads",
    description:
      "The AI will only select leads that strongly match your ICP criteria. Best for focused, high-quality outreach.",
    color: "hsl(var(--goji-coral))",
  },
};

export const Step4Precision = ({
  precision,
  onPrecisionChange,
  onNext,
  onPrev,
}: Props) => {
  const isHighPrecision = precision === "high_precision";
  const active = MODES[precision];

  function handleToggle() {
    onPrecisionChange(isHighPrecision ? "discovery" : "high_precision");
  }

  return (
    <div>
      {/* Header */}
      <div className="text-center mb-10">
        <h1
          className="text-2xl font-normal tracking-tight mb-2"
          style={{ color: "hsl(var(--foreground))" }}
        >
          Choose Your AI Agent's Precision
        </h1>
        <p
          className="text-sm leading-relaxed max-w-sm mx-auto"
          style={{ color: "hsl(var(--muted-foreground))" }}
        >
          Decide how strict the AI should be when selecting leads based on your
          ICP criteria. This will affect the quality and quantity of leads.
        </p>
      </div>

      {/* Toggle row */}
      <div className="flex items-center justify-center gap-4 mb-6">
        <span
          className="flex items-center gap-1.5 text-sm font-medium transition-opacity duration-200"
          style={{
            color: isHighPrecision ? "hsl(var(--muted-foreground))" : MODES.discovery.color,
            opacity: isHighPrecision ? 0.5 : 1,
          }}
        >
          <Search className="w-3.5 h-3.5" />
          Discovery Mode
        </span>

        <button
          type="button"
          onClick={handleToggle}
          aria-label="Toggle precision mode"
          className="relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          style={{
            background: isHighPrecision ? "hsl(var(--goji-coral))" : MODES.discovery.color,
          }}
        >
          <span
            className="pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition-transform duration-300"
            style={{
              transform: isHighPrecision ? "translateX(20px)" : "translateX(-1px)",
            }}
          />
        </button>

        <span
          className="flex items-center gap-1.5 text-sm font-medium transition-opacity duration-200"
          style={{
            color: !isHighPrecision ? "hsl(var(--muted-foreground))" : MODES.high_precision.color,
            opacity: !isHighPrecision ? 0.5 : 1,
          }}
        >
          <Target className="w-3.5 h-3.5" />
          High Precision
        </span>
      </div>

      {/* Info box as CardShell */}
      <CardShell className="mb-10 animate-fade-in-up">
        <div className="flex items-start gap-3">
          <span
            className="mt-0.5 w-7 h-7 rounded-full flex items-center justify-center shrink-0"
            style={{ background: `${active.color}20`, color: active.color }}
          >
            {active.icon}
          </span>
          <div>
            <p className="text-sm font-semibold mb-1" style={{ color: active.color }}>
              {active.sublabel}
            </p>
            <p className="text-sm leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>
              {active.description}
            </p>
          </div>
        </div>
      </CardShell>

      {/* Footer note */}
      <div
        className="flex items-center justify-center gap-2 text-xs mb-2"
        style={{ color: "hsl(var(--muted-foreground))" }}
      >
        <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: "hsl(var(--goji-orange))" }} />
        You can always adjust this setting later in your agent's settings.
      </div>

      <OnboardingNav onPrev={onPrev} onNext={onNext} />
    </div>
  );
};
