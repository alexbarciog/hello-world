import { User, Briefcase, Sparkles, ArrowRight, Check, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { OnboardingBadge, StaggerTitle, PrimaryCta, ONBOARDING_EASE } from "./ui";

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
      <div className="mb-8 md:mb-10">
        <OnboardingBadge icon={<Sparkles className="w-3 h-3 text-goji-orange" />}>
          Quick question
        </OnboardingBadge>
        <StaggerTitle
          text="How will you use"
          accent="Intentsly?"
          className="mt-5 font-headline font-semibold tracking-[-0.025em] leading-[1.08] text-[#0a0a0a] text-[1.9rem] md:text-4xl"
        />
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35, ease: ONBOARDING_EASE }}
          className="mt-3 text-[15px] text-neutral-500 leading-relaxed"
        >
          We'll tailor your setup based on your answer.
        </motion.p>
      </div>

      <div className="space-y-3">
        {OPTIONS.map((opt, i) => {
          const selected = value === opt.key;
          const Icon = opt.icon;
          return (
            <motion.button
              key={opt.key}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 + i * 0.08, ease: ONBOARDING_EASE }}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.99 }}
              type="button"
              onClick={() => onChange(opt.key)}
              className="w-full text-left rounded-[20px] p-5 flex items-start gap-4 transition-[border-color,background-color,box-shadow] duration-200"
              style={{
                background: selected ? "rgba(237, 238, 252, 0.45)" : "#FFFFFF",
                border: selected ? "1.5px solid #4F46E5" : "1.5px solid #E0E0E3",
                boxShadow: selected
                  ? "0 0 0 4px rgba(79, 70, 229, 0.08)"
                  : "0 1px 2px rgba(10, 10, 10, 0.03)",
              }}
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-200"
                style={{
                  background: selected ? "#4F46E5" : "#F9F9FA",
                  color: selected ? "#FFFFFF" : "#3A3A4A",
                }}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[15px] font-semibold text-[#0a0a0a]">{opt.title}</h3>
                <p className="text-sm text-neutral-500 mt-1 leading-relaxed">{opt.description}</p>
              </div>
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-all duration-200"
                style={{
                  background: selected ? "#4F46E5" : "transparent",
                  border: selected ? "none" : "1.5px solid #E0E0E3",
                  color: "#FFFFFF",
                }}
              >
                {selected && (
                  <motion.span
                    initial={{ scale: 0.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 24 }}
                  >
                    <Check className="w-3.5 h-3.5" />
                  </motion.span>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6, ease: ONBOARDING_EASE }}
        className="mt-8"
      >
        <PrimaryCta onClick={onContinue} disabled={!value || submitting}>
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving…
            </>
          ) : (
            <>
              Continue
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </PrimaryCta>
      </motion.div>
    </div>
  );
}
