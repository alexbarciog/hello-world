import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Globe, Loader2, AlertCircle, Sparkles } from "lucide-react";

type Props = {
  website: string;
  onWebsiteChange: (v: string) => void;
  onAnalyze: () => Promise<void> | void;
  loading: boolean;
  loadingStep: number; // 0..2
  errorMsg?: string;
};

const LOADING_STEPS = [
  "Reading your site…",
  "Identifying your services…",
  "Generating buyer pain points…",
];

export function Step1Scan({ website, onWebsiteChange, onAnalyze, loading, loadingStep, errorMsg }: Props) {
  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium mb-4"
          style={{ background: "hsl(220 90% 56% / 0.08)", color: "hsl(220 90% 40%)" }}
        >
          <Sparkles className="w-3 h-3" />
          AI-powered setup
        </div>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mb-2 text-foreground">
          Let's find your buyers
        </h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Drop your website. We'll handle the rest in 30 seconds.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!loading && website.trim()) onAnalyze();
        }}
        className="space-y-4"
      >
        <div className="relative">
          <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            type="url"
            value={website}
            onChange={(e) => onWebsiteChange(e.target.value)}
            placeholder="https://yourcompany.com"
            disabled={loading}
            required
            autoFocus
            className="pl-11 h-14 rounded-2xl text-base border-border bg-background"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !website.trim()}
          className="w-full h-14 rounded-2xl text-base font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          style={{
            background: loading
              ? "hsl(220 14% 90%)"
              : "linear-gradient(135deg, #0057bd 0%, #4647d3 100%)",
            color: loading ? "hsl(var(--muted-foreground))" : "hsl(0 0% 100%)",
            boxShadow: loading ? "none" : "0 4px 14px rgba(0, 87, 189, 0.3)",
          }}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyzing…
            </>
          ) : (
            <>
              Analyze my website
              <Sparkles className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {loading && (
        <div className="mt-8 space-y-3 animate-fade-in">
          {LOADING_STEPS.map((label, i) => {
            const isDone = i < loadingStep;
            const isActive = i === loadingStep;
            const isPending = i > loadingStep;
            return (
              <div
                key={i}
                className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300"
                style={{
                  background: isActive ? "hsl(220 90% 56% / 0.06)" : "transparent",
                  opacity: isPending ? 0.4 : 1,
                }}
              >
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                  style={{
                    background: isDone
                      ? "hsl(142 71% 45%)"
                      : isActive
                      ? "hsl(220 90% 56%)"
                      : "hsl(220 14% 90%)",
                    color: "hsl(0 0% 100%)",
                  }}
                >
                  {isDone ? (
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                      <path d="M2.5 6.5L5 9L9.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : isActive ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <span className="text-[10px] font-semibold">{i + 1}</span>
                  )}
                </div>
                <span className="text-sm font-medium text-foreground">{label}</span>
              </div>
            );
          })}
        </div>
      )}

      {errorMsg && !loading && (
        <div
          className="mt-6 flex items-start gap-3 rounded-xl px-4 py-3 text-sm animate-fade-in"
          style={{
            background: "hsl(0 84% 60% / 0.07)",
            border: "1px solid hsl(0 84% 60% / 0.2)",
            color: "hsl(0 72% 42%)",
          }}
        >
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
}
