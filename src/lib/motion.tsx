import { motion, type Variants } from "framer-motion";
import { Fragment, type ReactNode, type CSSProperties } from "react";

const EASE = [0.22, 1, 0.36, 1] as const;

interface RevealProps {
  children: ReactNode;
  delay?: number;
  y?: number;
  duration?: number;
  className?: string;
  amount?: number;
  as?: "div" | "span" | "li" | "section" | "article";
  style?: CSSProperties;
}

export const Reveal = ({
  children,
  delay = 0,
  y = 16,
  duration = 0.6,
  className,
  amount = 0.3,
  as = "div",
  style,
}: RevealProps) => {
  const Comp: any = (motion as any)[as];
  return (
    <Comp
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount }}
      transition={{ duration, delay, ease: EASE }}
      className={className}
      style={style}
    >
      {children}
    </Comp>
  );
};

interface FloatProps {
  children: ReactNode;
  className?: string;
  duration?: number;
  y?: number;
  delay?: number;
}

export const Float = ({ children, className, duration = 5, y = 6, delay = 0 }: FloatProps) => (
  <motion.div
    className={className}
    animate={{ y: [0, -y, 0] }}
    transition={{ duration, ease: "easeInOut", repeat: Infinity, delay }}
  >
    {children}
  </motion.div>
);

interface CountUpProps {
  to: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

// Shows the value as-is. It used to count up from 0 once scrolled into view,
// so a quick glance, a slow device or a background tab saw "0" (and a price
// caught mid-animation read "$94" instead of "$97").
export const CountUp = ({ to, prefix = "", suffix = "", className }: CountUpProps) => (
  <span className={className}>{`${prefix}${to}${suffix}`}</span>
);

export const fadeStagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

export const fadeStaggerItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } },
};

const wordVariants: Variants = {
  hidden: { y: "110%", opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.7, ease: EASE } },
};

interface WordRevealProps {
  text: string;
  /** Words to colour, matched exactly after splitting on spaces. */
  highlight?: string[];
  highlightClassName?: string;
}

/**
 * Word-by-word headline reveal. Goes inside a stagger parent such as motion.h1.
 * The space between words is a real text node, not a margin: crawlers and the
 * copied text need it, otherwise the headline reads as one long word.
 */
export const WordReveal = ({ text, highlight = [], highlightClassName = "text-[#3B82F6]" }: WordRevealProps) => {
  const words = text.split(" ");
  return (
    <>
      {words.map((word, i) => (
        <Fragment key={i}>
          <span className="inline-block overflow-hidden pb-[0.05em]">
            <motion.span
              className={highlight.includes(word) ? `inline-block ${highlightClassName}` : "inline-block"}
              variants={wordVariants}
            >
              {word}
            </motion.span>
          </span>
          {i < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </>
  );
};
