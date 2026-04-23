import { motion, useInView, useMotionValue, useTransform, animate, type Variants } from "framer-motion";
import { useEffect, useRef, type ReactNode, type CSSProperties } from "react";

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
  from?: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export const CountUp = ({
  to,
  from = 0,
  duration = 1.6,
  prefix = "",
  suffix = "",
  className,
}: CountUpProps) => {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const count = useMotionValue(from);
  const rounded = useTransform(count, (v) => `${prefix}${Math.round(v)}${suffix}`);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(count, to, { duration, ease: "easeOut" });
    return () => controls.stop();
  }, [inView, count, to, duration]);

  return <motion.span ref={ref} className={className}>{rounded}</motion.span>;
};

export const fadeStagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

export const fadeStaggerItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } },
};
