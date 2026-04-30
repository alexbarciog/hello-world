import { User, Briefcase, Sparkles, ArrowRight, Check } from "lucide-react";

export type AccountType = "personal" | "agency";

type Props = {
  value: AccountType | null;
  onChange: (v: AccountType) => void;
  onContinue: () => void;
  submitting?: boolean;
};

const OPTIONS: {
  key: AccountType;
  icon: typeof User;
  title: string;
  description: string;
}[] = [
  {
    key: "personal",
    icon: User,
    title: "For my own business",
    description: "I want to find warm leads and buying signals for my own company",
  },
  {
    key: "agency",
    icon: Briefcase,
    title: "As a lead gen partner",
    description:
      "I run a sales or lead generation agency and want to use Intentsly as a tool for my clients",
  },
];

export function StepAccountType({ value, onChange, onContinue, submitting }: Props) {
  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium mb-4"
          style={{ background: "hsl(220 90% 56% / 0.08)", color: "hsl(220 90% 40%)" }}
        >
          <Sparkles className="w-3 h-3" />
          Quick question
        </div>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mb-2 text-foreground">
          How are you planning to use Intentsly?
        </h1>
        <p className="text-sm md:text-base text-muted-foreground">
          We'll tailor your setup based on your answer.
        </p>
      </div>

      <div className="space-y-3">
        {OPTIONS.map((opt) => {
          const selected = value === opt.key;
          const Icon = opt.icon;
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => onChange(opt.key)}
              className="w-full text-left rounded-2xl p-5 transition-all duration-200 flex items-start gap-4"
              style={{
                background: selected ? "hsl(220 90% 56% / 0.06)" : "hsl(0 0% 96%)",
                border: selected
                  ? "2px solid hsl(220 90% 56%)"
                  : "2px solid transparent",
              }}
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  background: selected ? "hsl(220 90% 56%)" : "hsl(0 0% 100%)",
                  color: selected ? "hsl(0 0% 100%)" : "hsl(220 14% 30%)",
                  boxShadow: selected ? "none" : "0 1px 3px hsl(220 14% 10% / 0.06)",
                }}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-foreground">{opt.title}</h3>
                  {selected && (
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ background: "hsl(220 90% 56%)", color: "hsl(0 0% 100%)" }}
                    >
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  {opt.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onContinue}
        disabled={!value || submitting}
        className="mt-8 w-full h-14 rounded-2xl text-base font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        style={{
          background:
            !value || submitting
              ? "hsl(220 14% 90%)"
              : "linear-gradient(135deg, #0057bd 0%, #4647d3 100%)",
          color:
            !value || submitting
              ? "hsl(var(--muted-foreground))"
              : "hsl(0 0% 100%)",
          boxShadow:
            !value || submitting ? "none" : "0 4px 14px rgba(0, 87, 189, 0.3)",
        }}
      >
        Continue
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
