import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Check, X, ArrowRight, TrendingUp } from "lucide-react";

const traditional = [
  "Large generic lead lists",
  "Low timing accuracy",
  "Generic messaging",
  "Heavy manual research",
  "More noise than signal",
];

const intentsly = [
  "Intent-based targeting",
  "Better timing",
  "More relevant outreach",
  "Faster prioritization",
  "Focus on buyers showing movement",
];

const EASE = [0.22, 1, 0.36, 1] as const;

const WhyIntentsly = () => {
  return (
    <section id="why" className="py-20 md:py-32 px-6 bg-background">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="max-w-2xl mb-8"
        >
          <span className="section-label mb-6 block">Why Intentsly</span>
          <h2 className="text-4xl md:text-5xl font-medium tracking-tight leading-[1.1] mb-4" style={{ color: "hsl(var(--aeline-dark))" }}>
            Better than building another cold list
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed">
            Traditional prospecting gives you names. Intentsly helps you find timing.
          </p>
        </motion.div>

        {/* Headline stat */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5, delay: 0.1, ease: EASE }}
          className="inline-flex items-center gap-2 mb-8 px-3.5 py-1.5 rounded-full bg-[#C8FF00]/30 border border-[#C8FF00]/60"
        >
          <TrendingUp className="w-3.5 h-3.5" style={{ color: "hsl(var(--aeline-dark))" }} />
          <span className="text-xs font-semibold" style={{ color: "hsl(var(--aeline-dark))" }}>
            Teams switching report ~3× higher reply rates
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="rounded-3xl bg-[#f5f5f5] p-8 md:p-12"
        >
          <div className="grid md:grid-cols-2 gap-10 md:gap-16">
            {/* Traditional */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-5">
                Traditional prospecting
              </p>
              <ul className="space-y-4">
                {traditional.map((t, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    whileInView={{ opacity: 0.7, x: 0 }}
                    viewport={{ once: true, amount: 0.4 }}
                    transition={{ duration: 0.4, delay: 0.1 + i * 0.06, ease: EASE }}
                    className="flex items-start gap-3"
                  >
                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                      <X className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                    <span className="text-base text-muted-foreground leading-relaxed line-through decoration-muted-foreground/30">{t}</span>
                  </motion.li>
                ))}
              </ul>
            </div>

            {/* Intentsly */}
            <div className="md:border-l md:border-border/60 md:pl-12">
              <p className="text-xs font-semibold uppercase tracking-widest mb-5" style={{ color: "hsl(var(--aeline-dark))" }}>
                With Intentsly
              </p>
              <ul className="space-y-4">
                {intentsly.map((t, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: 8 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.4 }}
                    transition={{ duration: 0.4, delay: 0.15 + i * 0.06, ease: EASE }}
                    className="flex items-start gap-3"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      whileInView={{ scale: [0, 1.2, 1] }}
                      viewport={{ once: true, amount: 0.4 }}
                      transition={{ duration: 0.5, delay: 0.25 + i * 0.06, ease: EASE }}
                      className="w-6 h-6 rounded-full bg-[#C8FF00] flex items-center justify-center shrink-0 mt-0.5"
                    >
                      <Check className="w-3.5 h-3.5" style={{ color: "hsl(var(--aeline-dark))" }} strokeWidth={3} />
                    </motion.div>
                    <span className="text-base font-medium leading-relaxed" style={{ color: "hsl(var(--aeline-dark))" }}>
                      {t}
                    </span>
                  </motion.li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-10 pt-8 border-t border-border/60 flex flex-col items-center gap-5">
            <p className="text-base md:text-lg font-medium text-center" style={{ color: "hsl(var(--aeline-dark))" }}>
              If your team sells to B2B buyers, timing matters.
            </p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 bg-[hsl(var(--aeline-dark))] text-white px-6 py-3 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity shadow-[0_8px_24px_-8px_rgba(15,23,42,0.4)]"
            >
              Switch to intent-based prospecting
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default WhyIntentsly;
