import { motion } from "framer-motion";
import type { ReactNode } from "react";

export const ONBOARDING_EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Landing-style pill badge — white, hairline border, soft shadow.
 */
export function OnboardingBadge({ icon, children }: { icon?: ReactNode; children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: ONBOARDING_EASE }}
      className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3.5 py-1.5 shadow-sm text-xs font-semibold text-neutral-900"
    >
      {icon}
      {children}
    </motion.div>
  );
}

/**
 * Landing-style word-by-word stagger headline.
 */
export function StaggerTitle({
  text,
  accent,
  className,
}: {
  text: string;
  accent?: string;
  className?: string;
}) {
  const words = text.split(" ");
  const child = {
    hidden: { y: "110%", opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.6, ease: ONBOARDING_EASE } },
  };
  return (
    <motion.h1
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.045, delayChildren: 0.08 } },
      }}
      className={className}
    >
      {words.map((w, i) => (
        <span key={i} className="inline-block overflow-hidden pb-[0.08em] mr-[0.24em] align-bottom">
          <motion.span className="inline-block" variants={child}>
            {w}
          </motion.span>
        </span>
      ))}
      {accent && (
        <span className="inline-block overflow-hidden pb-[0.08em] align-bottom">
          <motion.span className="inline-block text-[#4F46E5]" variants={child}>
            {accent}
          </motion.span>
        </span>
      )}
    </motion.h1>
  );
}

/**
 * Landing-style primary CTA — near-black, spring hover lift.
 */
export function PrimaryCta({
  children,
  disabled,
  onClick,
  type = "button",
}: {
  children: ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
}) {
  return (
    <motion.button
      whileHover={disabled ? undefined : { scale: 1.02, y: -2 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 22 }}
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="w-full h-14 rounded-2xl text-[15px] font-semibold flex items-center justify-center gap-2 transition-colors disabled:cursor-not-allowed"
      style={{
        background: disabled ? "#F4F4F5" : "#0a0a0a",
        color: disabled ? "#9CA3AF" : "#FFFFFF",
        boxShadow: disabled ? "none" : "0 8px 24px rgba(10, 10, 10, 0.18)",
      }}
    >
      {children}
    </motion.button>
  );
}
