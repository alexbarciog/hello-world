import { Globe, Loader2, AlertCircle, Sparkles, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { OnboardingBadge, StaggerTitle, PrimaryCta, ONBOARDING_EASE } from "./ui";

type Props = {
  website: string;
  onWebsiteChange: (v: string) => void;
  onAnalyze: () => Promise<void> | void;
  loading: boolean;
  loadingStep: number; // 0..2
  errorMsg?: string;
};

const LOADING_STEPS = [
  "Reading your site",
  "Identifying your services",
  "Generating buyer pain points",
];

export function Step1Scan({ website, onWebsiteChange, onAnalyze, loading, loadingStep, errorMsg }: Props) {
  return (
    <div className="w-full">
      <div className="mb-8 md:mb-10">
        <OnboardingBadge icon={<Sparkles className="w-3 h-3 text-goji-orange" />}>
          AI-powered setup
        </OnboardingBadge>
        <StaggerTitle
          text="Let's find your"
          accent="buyers"
          className="mt-5 font-headline font-semibold tracking-[-0.025em] leading-[1.08] text-[#0a0a0a] text-[1.9rem] md:text-4xl"
        />
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35, ease: ONBOARDING_EASE }}
          className="mt-3 text-[15px] text-neutral-500 leading-relaxed"
        >
          Drop your website. We'll handle the rest in 30 seconds.
        </motion.p>
      </div>

      <AnimatePresence mode="wait">
        {!loading ? (
          <motion.form
            key="form"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.45, delay: 0.15, ease: ONBOARDING_EASE }}
            onSubmit={(e) => {
              e.preventDefault();
              if (!loading && website.trim()) onAnalyze();
            }}
            className="space-y-3"
          >
            <div className="relative">
              <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
              <input
                type="url"
                value={website}
                onChange={(e) => onWebsiteChange(e.target.value)}
                placeholder="https://yourcompany.com"
                required
                autoFocus
                className="w-full h-14 pl-11 pr-4 rounded-2xl text-[15px] text-[#0a0a0a] placeholder:text-neutral-400 outline-none transition-all duration-200"
                style={{
                  background: "#F9F9FA",
                  border: "1.5px solid #EBEBED",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.border = "1.5px solid #4F46E5";
                  e.currentTarget.style.boxShadow = "0 0 0 4px rgba(79, 70, 229, 0.08)";
                  e.currentTarget.style.background = "#FFFFFF";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.border = "1.5px solid #EBEBED";
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.background = "#F9F9FA";
                }}
              />
            </div>

            <PrimaryCta type="submit" disabled={!website.trim()}>
              Analyze my website
              <Sparkles className="w-4 h-4" />
            </PrimaryCta>
          </motion.form>
        ) : (
          <motion.div
            key="analyzing"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.45, ease: ONBOARDING_EASE }}
            className="rounded-[20px] p-6"
            style={{ background: "#F9F9FA" }}
          >
            {/* Analyzing header with site chip */}
            <div className="flex items-center gap-3 mb-6">
              <div className="relative w-9 h-9 shrink-0">
                <div
                  className="absolute inset-0 rounded-full animate-spin"
                  style={{
                    background:
                      "conic-gradient(from 0deg, hsl(var(--goji-orange)), hsl(var(--goji-coral)), transparent 65%)",
                  }}
                />
                <div className="absolute inset-[3px] rounded-full bg-[#F9F9FA] flex items-center justify-center">
                  <Globe className="w-3.5 h-3.5 text-neutral-500" />
                </div>
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-[#0a0a0a]">Analyzing your business</div>
                <div className="text-xs text-neutral-500 truncate">{website}</div>
              </div>
            </div>

            {/* Timeline */}
            <div className="space-y-1">
              {LOADING_STEPS.map((label, i) => {
                const isDone = i < loadingStep;
                const isActive = i === loadingStep;
                return (
                  <div key={i} className="flex items-stretch gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors duration-300"
                        style={{
                          background: isDone ? "#22C55E" : isActive ? "#4F46E5" : "#EBEBED",
                          color: isDone || isActive ? "#FFFFFF" : "#9CA3AF",
                        }}
                      >
                        {isDone ? (
                          <Check className="w-3 h-3" />
                        ) : isActive ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <span className="text-[10px] font-semibold">{i + 1}</span>
                        )}
                      </div>
                      {i < LOADING_STEPS.length - 1 && (
                        <div
                          className="w-px flex-1 my-1 transition-colors duration-300"
                          style={{ background: isDone ? "#22C55E" : "#E0E0E3" }}
                        />
                      )}
                    </div>
                    <div className="pb-5 pt-0.5">
                      <motion.span
                        animate={isActive ? { opacity: [1, 0.5, 1] } : { opacity: 1 }}
                        transition={isActive ? { duration: 1.6, repeat: Infinity, ease: "easeInOut" } : undefined}
                        className="text-sm font-medium"
                        style={{ color: isDone || isActive ? "#0a0a0a" : "#9CA3AF" }}
                      >
                        {label}
                        {isActive && "…"}
                      </motion.span>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {errorMsg && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-5 flex items-start gap-3 rounded-2xl px-4 py-3 text-sm"
          style={{
            background: "hsl(0 84% 60% / 0.06)",
            border: "1px solid hsl(0 84% 60% / 0.18)",
            color: "hsl(0 72% 42%)",
          }}
        >
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{errorMsg}</span>
        </motion.div>
      )}
    </div>
  );
}
