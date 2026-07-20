import { useState } from "react";
import { Input } from "@/components/ui/input";
import { ArrowRight, Loader2, Package, Target, Pencil, Check } from "lucide-react";
import { motion } from "framer-motion";
import { OnboardingBadge, StaggerTitle, PrimaryCta, ONBOARDING_EASE } from "./ui";

type Props = {
  companyName: string;
  description: string;
  services: string[];
  painPoints: string[];
  onCompanyNameChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  onContinue: () => Promise<void> | void;
  submitting: boolean;
};

export function Step2Preview({
  companyName,
  description,
  services,
  painPoints,
  onCompanyNameChange,
  onDescriptionChange,
  onContinue,
  submitting,
}: Props) {
  const [editingHeader, setEditingHeader] = useState(false);

  return (
    <div className="w-full">
      <div className="mb-7 md:mb-8">
        <OnboardingBadge
          icon={
            <span className="w-4 h-4 rounded-full bg-[#22C55E] flex items-center justify-center">
              <Check className="w-2.5 h-2.5 text-white" />
            </span>
          }
        >
          Analysis complete
        </OnboardingBadge>
        <StaggerTitle
          text="Does this look"
          accent="right?"
          className="mt-5 font-headline font-semibold tracking-[-0.025em] leading-[1.08] text-[#0a0a0a] text-[1.9rem] md:text-4xl"
        />
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35, ease: ONBOARDING_EASE }}
          className="mt-3 text-[15px] text-neutral-500 leading-relaxed"
        >
          We'll use this to find people with real buying intent for you.
        </motion.p>
      </div>

      {/* Company header card — snow surface */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2, ease: ONBOARDING_EASE }}
        className="rounded-[20px] p-5 mb-3"
        style={{ background: "#F9F9FA" }}
      >
        {editingHeader ? (
          <div className="space-y-3">
            <Input
              value={companyName}
              onChange={(e) => onCompanyNameChange(e.target.value)}
              placeholder="Company name"
              className="h-10 rounded-lg text-sm font-semibold bg-white"
            />
            <textarea
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              placeholder="One-line description"
              rows={2}
              className="flex w-full rounded-lg border border-border bg-white px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <button
              type="button"
              onClick={() => setEditingHeader(false)}
              className="text-xs font-semibold text-[#4F46E5] hover:underline"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3.5 min-w-0">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold"
                style={{ background: "#EDEEFC", color: "#4F46E5" }}
              >
                {(companyName || "?").slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-semibold text-[#0a0a0a] truncate">
                  {companyName || "Your company"}
                </h2>
                <p className="text-sm text-neutral-500 mt-0.5 line-clamp-2 leading-relaxed">
                  {description || "Add a short description"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setEditingHeader(true)}
              className="p-2 rounded-lg text-neutral-400 hover:bg-white hover:text-[#0a0a0a] transition-colors shrink-0"
              aria-label="Edit company info"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </motion.div>

      {/* Bento blocks — dashboard MetricCard pastels, 24px radius, no borders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-7">
        {/* Services */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3, ease: ONBOARDING_EASE }}
          className="rounded-3xl p-6"
          style={{ background: "#EDEEFC" }}
        >
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center">
              <Package className="w-4 h-4 text-[#4F46E5]" />
            </div>
            <h3 className="text-sm font-semibold text-[#0a0a0a]">What you sell</h3>
          </div>
          <ul className="space-y-2.5">
            {services.length === 0 ? (
              <li className="text-xs text-neutral-500 italic">No services detected</li>
            ) : (
              services.map((s, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.45 + i * 0.06, ease: ONBOARDING_EASE }}
                  className="flex items-start gap-2.5 text-sm text-[#1A1A2E]"
                >
                  <span className="w-1.5 h-1.5 rounded-full mt-[7px] shrink-0 bg-[#4F46E5]" />
                  <span className="leading-snug">{s}</span>
                </motion.li>
              ))
            )}
          </ul>
        </motion.div>

        {/* Pain points */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.38, ease: ONBOARDING_EASE }}
          className="rounded-3xl p-6"
          style={{ background: "hsl(var(--goji-bg-hero-2))" }}
        >
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center">
              <Target className="w-4 h-4 text-goji-orange" />
            </div>
            <h3 className="text-sm font-semibold text-[#0a0a0a]">Buyer pain points</h3>
          </div>
          <ul className="space-y-2.5">
            {painPoints.length === 0 ? (
              <li className="text-xs text-neutral-500 italic">No pain points detected</li>
            ) : (
              painPoints.map((p, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.5 + i * 0.06, ease: ONBOARDING_EASE }}
                  className="flex items-start gap-2.5 text-sm text-[#1A1A2E]"
                >
                  <span className="w-1.5 h-1.5 rounded-full mt-[7px] shrink-0 bg-goji-orange" />
                  <span className="leading-snug">{p}</span>
                </motion.li>
              ))
            )}
          </ul>
        </motion.div>
      </div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.55, ease: ONBOARDING_EASE }}
      >
        <PrimaryCta onClick={onContinue} disabled={submitting || !companyName}>
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Setting things up…
            </>
          ) : (
            <>
              Get Buyers
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </PrimaryCta>
        <p className="text-center text-xs text-neutral-400 mt-3">
          You can edit everything later in settings
        </p>
      </motion.div>
    </div>
  );
}
