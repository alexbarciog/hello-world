type Props = { step: 1 | 2 | 3 | 4 | 5 | 6 };

const steps = ["Campaign", "LinkedIn", "ICP", "Precision", "Signals", "Goals"];

export const OnboardingProgressBar = ({ step }: Props) => (
  <div className="flex items-center gap-1 mb-8">
    {steps.map((label, i) => {
      const num = (i + 1) as 1 | 2 | 3 | 4 | 5 | 6;
      const done = num < step;
      const active = num === step;
      return (
        <div key={label} className="flex items-center gap-1 flex-1 last:flex-none">
          <div className="flex items-center gap-1.5 shrink-0">
            <div
              className="flex items-center justify-center shrink-0 transition-all duration-300"
              style={{
                width: active ? 36 : 24,
                height: active ? 36 : 24,
                borderRadius: "50%",
                background: done || active ? "hsl(0 0% 0%)" : "hsl(var(--border))",
                color: done || active ? "hsl(0 0% 100%)" : "hsl(var(--muted-foreground))",
                fontSize: active ? 18 : 11,
                fontWeight: active ? 400 : 600,
                letterSpacing: active ? "-1px" : "0",
              }}
            >
              {done ? (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                num
              )}
            </div>
            <span
              className="text-[10px] font-medium transition-colors duration-300 hidden md:inline"
              style={{
                color: active ? "hsl(0 0% 0%)" : done ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
                fontWeight: active ? 500 : 400,
              }}
            >
              {label}
            </span>
          </div>

          {i < steps.length - 1 && (
            <div
              className="flex-1 h-px mx-1 transition-all duration-500"
              style={{
                background: done ? "hsl(0 0% 0%)" : "hsl(var(--border))",
              }}
            />
          )}
        </div>
      );
    })}
  </div>
);
