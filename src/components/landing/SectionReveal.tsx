import { motion } from "framer-motion";
import type { ReactNode } from "react";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Scroll-triggered reveal wrapper for landing sections.
 * Fades + slides content up as it enters the viewport.
 */
const SectionReveal = ({
  children,
  delay = 0,
  y = 32,
  amount = 0.15,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  amount?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount }}
    transition={{ duration: 0.8, delay, ease: EASE }}
  >
    {children}
  </motion.div>
);

export default SectionReveal;
