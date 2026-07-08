import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Globe, Sparkles, CalendarCheck } from "lucide-react";

const EASE = [0.22, 1, 0.36, 1] as const;

const steps = [
  {
    icon: Globe,
    title: "Enter your website",
    body:
      "Intentsly reads your website and instantly understands what you sell, who you target, and how to pitch you.",
    kicker: "No manual set up needed.",
    gradient: "linear-gradient(180deg, #C8FF00 0%, #1A8FE3 100%)",
  },
  {
    icon: Sparkles,
    title: "Your agent finds the buyers",
    body:
      "It detects buying signals, scores your best prospects, and starts contacting them across email and socials, automatically.",
    kicker: "Outbound that used to require a full team now runs with AI.",
    gradient: "linear-gradient(180deg, #C8FF00 0%, #7ED957 60%, #1A8FE3 100%)",
  },
  {
    icon: CalendarCheck,
    title: "Demos land in your calendar",
    body:
      "You wake up to qualified leads already interested. Replies are already drafted. And your pipeline keeps growing in the background every single day.",
    kicker: "This is what sales was always supposed to feel like.",
    gradient: "linear-gradient(180deg, #C8FF00 0%, #E85D3A 60%, #E84393 100%)",
  },
];

const WhyIntentsly = () => {
  return (
    <section id="why" className="relative overflow-hidden bg-[#050505] text-white py-16 md:py-36 px-5 md:px-6">
      {/* Top vignette glow */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px]"
        style={{
          background:
            "radial-gradient(60% 100% at 50% 0%, rgba(200,255,0,0.18) 0%, rgba(200,255,0,0.05) 40%, transparent 75%)",
        }}
        aria-hidden
      />

      <div className="relative max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-16 lg:gap-24 items-start">
        {/* Left: heading + CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: EASE }}
          className="lg:sticky lg:top-28"
        >
          <div className="inline-flex items-center gap-2 text-[12px] md:text-[13px] font-semibold tracking-[0.14em] text-[#C8FF00] mb-5 md:mb-8">
            <span className="text-base">✻</span>
            GET STARTED IN MINUTES
          </div>
          <h2
            className="font-medium tracking-[-0.03em] leading-[1.08] md:leading-[1.02] mb-4 md:mb-6"
            style={{ fontSize: "clamp(1.9rem, 5vw, 4rem)" }}
          >
            Three steps to a pipeline that runs itself
          </h2>
          <p className="text-[15px] md:text-lg text-white/60 leading-relaxed mb-7 md:mb-10 max-w-md">
            No CSV uploads. No prompt engineering. Point Intentsly at your website
            and watch qualified meetings fill your calendar.
          </p>
          <Link
            to="/register"
            className="group inline-flex items-center gap-2 bg-[#C8FF00] text-[#050505] px-6 py-3 md:py-3.5 rounded-full text-sm font-bold hover:bg-[#d4ff33] transition-all shadow-[0_16px_36px_-12px_rgba(200,255,0,0.5)]"
          >
            Request Demo
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </motion.div>

        {/* Right: 3 steps */}
        <div className="space-y-10 md:space-y-20">
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, delay: i * 0.1, ease: EASE }}
                whileHover={{ x: 4, transition: { type: "spring", stiffness: 300, damping: 20 } }}
                className="relative pl-6 md:pl-8 group"
              >
                {/* Vertical gradient bar — draws in on scroll */}
                <motion.div
                  initial={{ scaleY: 0 }}
                  whileInView={{ scaleY: 1 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.9, delay: i * 0.1 + 0.2, ease: EASE }}
                  className="absolute left-0 top-0 bottom-0 w-[3px] rounded-full origin-top"
                  style={{ background: s.gradient }}
                  aria-hidden
                />
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 4 + i, repeat: Infinity, ease: "easeInOut", delay: i * 0.4 }}
                  className="mb-5 md:mb-14"
                >
                  <Icon className="w-5 h-5 md:w-6 md:h-6 text-white/90 group-hover:text-[#C8FF00] transition-colors" strokeWidth={1.5} />
                </motion.div>
                <div className="flex items-baseline gap-3 mb-3 md:mb-4">
                  <span className="text-[12px] md:text-[13px] font-semibold text-white/40 tabular-nums">
                    0{i + 1}
                  </span>
                  <h3 className="text-xl md:text-[28px] font-medium tracking-[-0.02em] text-white leading-tight">
                    {s.title}
                  </h3>
                </div>
                <p className="text-[14px] md:text-base text-white/60 leading-relaxed mb-3 max-w-lg">
                  {s.body}
                </p>
                <p className="text-[14px] md:text-base text-white/85 leading-relaxed max-w-lg">
                  {s.kicker}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default WhyIntentsly;
