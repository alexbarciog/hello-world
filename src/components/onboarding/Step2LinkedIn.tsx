import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, CheckCircle2, Shield } from "lucide-react";
import type { OnboardingData } from "./types";

const COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Argentina", "Armenia", "Australia",
  "Austria", "Azerbaijan", "Bangladesh", "Belgium", "Bolivia", "Bosnia and Herzegovina",
  "Brazil", "Bulgaria", "Canada", "Chile", "China", "Colombia", "Croatia",
  "Czech Republic", "Denmark", "Ecuador", "Egypt", "Estonia", "Ethiopia",
  "Finland", "France", "Georgia", "Germany", "Ghana", "Greece", "Hungary",
  "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy",
  "Japan", "Jordan", "Kazakhstan", "Kenya", "Latvia", "Lithuania", "Luxembourg",
  "Malaysia", "Mexico", "Moldova", "Morocco", "Netherlands", "New Zealand",
  "Nigeria", "Norway", "Pakistan", "Peru", "Philippines", "Poland", "Portugal",
  "Romania", "Russia", "Saudi Arabia", "Serbia", "Singapore", "Slovakia",
  "Slovenia", "South Africa", "South Korea", "Spain", "Sweden", "Switzerland",
  "Taiwan", "Thailand", "Turkey", "Ukraine", "United Arab Emirates",
  "United Kingdom", "United States", "Uruguay", "Venezuela", "Vietnam",
];

const LinkedInIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

type Props = {
  data: OnboardingData;
  onChange: (patch: Partial<OnboardingData>) => void;
  onNext: () => void;
  onPrev: () => void;
};

export const Step2LinkedIn = ({ data, onChange, onNext, onPrev }: Props) => {
  const canProceed = true; // country is optional — user can proceed without selecting

  function handleConnect() {
    onChange({ linkedinConnectionType: "direct" });
  }

  return (
    <div className="animate-fade-in">
      {/* LinkedIn logo mark */}
      <div className="flex flex-col items-center mb-8">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
          style={{
            background: "hsl(221 83% 53%)",
            boxShadow: "0 8px 24px hsl(221 83% 53% / 0.25)",
          }}
        >
          <LinkedInIcon className="w-7 h-7 text-white" />
        </div>
        <h1
          className="text-2xl font-bold tracking-tight mb-2 text-center"
          style={{ color: "hsl(var(--goji-dark))" }}
        >
          Connect Your LinkedIn
        </h1>
        <p
          className="text-sm leading-relaxed text-center max-w-sm"
          style={{ color: "hsl(var(--goji-text-muted))" }}
        >
          Securely connect your account to automate outreach on your behalf. You can disconnect at
          any time.
        </p>
      </div>

      {/* Country selector */}
      <div className="mb-5">
        <Select value={data.country} onValueChange={(v) => onChange({ country: v })}>
          <SelectTrigger className="rounded-xl h-11 text-sm border-border w-full">
            <SelectValue placeholder="Select your country" />
          </SelectTrigger>
          <SelectContent className="max-h-64">
            {COUNTRIES.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs mt-1.5 pl-0.5" style={{ color: "hsl(var(--goji-text-muted))" }}>
          Helps us locate the optimal proxy server for your region
        </p>
      </div>

      {/* CTA */}
      <Button
        type="button"
        onClick={handleConnect}
        className="w-full h-12 rounded-xl font-semibold text-sm gap-2 transition-all duration-200 hover:opacity-90 active:scale-[0.98] mb-5"
        style={{
          background: "hsl(221 83% 53%)",
          color: "hsl(0 0% 100%)",
          boxShadow: "0 4px 20px hsl(221 83% 53% / 0.3)",
        }}
      >
        <LinkedInIcon className="w-4 h-4" />
        Connect LinkedIn
      </Button>

      {/* Trust indicators */}
      <div
        className="flex flex-col gap-2.5 rounded-xl px-4 py-3.5 mb-8"
        style={{ background: "hsl(var(--muted) / 0.5)" }}
      >
        <div className="flex items-center gap-2.5">
          <Shield className="w-3.5 h-3.5 shrink-0" style={{ color: "hsl(142 71% 45%)" }} />
          <span className="text-xs" style={{ color: "hsl(var(--goji-text-muted))" }}>
            Your credentials are never stored on our servers
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: "hsl(142 71% 45%)" }} />
          <span className="text-xs" style={{ color: "hsl(var(--goji-text-muted))" }}>
            We only act on your behalf — invitations &amp; messages
          </span>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between border-t border-border pt-5">
        <button
          type="button"
          onClick={onPrev}
          className="flex items-center gap-1.5 text-sm font-medium transition-opacity duration-200 hover:opacity-70"
          style={{ color: "hsl(var(--goji-text-muted))" }}
        >
          <ArrowLeft className="w-4 h-4" />
          Previous
        </button>

        <Button
          type="button"
          onClick={onNext}
          disabled={!canProceed}
          className="h-11 px-8 rounded-xl font-semibold text-sm transition-all duration-200 hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40"
          style={{
            background: "hsl(var(--goji-berry))",
            color: "hsl(0 0% 100%)",
            boxShadow: canProceed ? "0 4px 20px 0 hsl(var(--goji-coral) / 0.3)" : "none",
          }}
        >
          Next Step
          <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
};
