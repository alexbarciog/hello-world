import { Sparkles, PenLine } from "lucide-react";
import { motion } from "framer-motion";
import { OnboardingBadge, StaggerTitle, PrimaryCta, ONBOARDING_EASE } from "./ui";
import { TemplateCard } from "@/components/templates/TemplateCard";
import type { AgentTemplate } from "@/lib/agentTemplates";

/** "From scratch" in the template picker. */
export const FROM_SCRATCH = "scratch";

type Props = {
  templates: AgentTemplate[];
  value: string | null;
  onChange: (id: string) => void;
  onContinue: () => void;
};

/** Onboarding step 1: pick a ready-made agent for your business type. */
export function StepTemplate({ templates, value, onChange, onContinue }: Props) {
  return (
    <div className="w-full">
      <div className="mb-8">
        <OnboardingBadge icon={<Sparkles className="w-3 h-3 text-goji-orange" />}>Fastest setup</OnboardingBadge>
        <StaggerTitle
          text="What kind of business"
          accent="are you?"
          className="mt-5 font-headline font-semibold tracking-[-0.025em] leading-[1.08] text-[#0a0a0a] text-[1.9rem] md:text-4xl"
        />
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35, ease: ONBOARDING_EASE }}
          className="mt-3 text-[15px] text-neutral-500 leading-relaxed"
        >
          Pick the closest match and your signal agent and LinkedIn sequence come ready-made. You can change anything later.
        </motion.p>
      </div>

      <div className="space-y-3 max-h-[52vh] overflow-y-auto pr-1">
        {templates.map((t) => (
          <TemplateCard key={t.id} template={t} selected={value === t.id} onSelect={() => onChange(t.id)} />
        ))}
        <button
          type="button"
          onClick={() => onChange(FROM_SCRATCH)}
          className={`w-full text-left rounded-2xl border p-4 flex items-center gap-3 transition-colors ${
            value === FROM_SCRATCH ? "border-[#0a0a0a] ring-1 ring-[#0a0a0a] bg-[#fafafa]" : "border-[#E7E7EA] bg-white hover:border-neutral-300"
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-[#F4F4F5] flex items-center justify-center shrink-0">
            <PenLine className="w-5 h-5 text-[#0a0a0a]" />
          </div>
          <div>
            <p className="text-[15px] font-semibold text-[#0a0a0a]">Start from scratch</p>
            <p className="text-[13px] text-neutral-500">Set up your own agent and sequence step by step.</p>
          </div>
        </button>
      </div>

      <div className="mt-6">
        <PrimaryCta onClick={onContinue} disabled={!value}>Continue</PrimaryCta>
      </div>
    </div>
  );
}
